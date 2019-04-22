const AWS = require('aws-sdk')
const Alexa = require('ask-sdk-core')
const {
  getRequestType,
  getIntentName,
  getSlotValue
} = require('ask-sdk-core')
const Adapter = require('ask-sdk-dynamodb-persistence-adapter');
const PersistenceSavingResponseInterceptor = require('./interceptors/PersistenceSavingResponseInterceptor')
const handlers = require('./handlers')
const axios = require('axios')

const LaunchRequestInterceptor = {
  process(handlerInput) {
    return new Promise(function(resolve, reject) {
      const {
        userId
      } = handlerInput.requestEnvelope.session.user;

      handlerInput.attributesManager.getPersistentAttributes()
        .then(attributes => {
          attributes.isNewUser = !attributes.hasCompletedProfile
          resolve(handlerInput.attributesManager.setSessionAttributes(attributes))
        })
        .then(error => {
          reject(error)
        })
    });
  }
}

const LaunchRequestHandler = {
  canHandle(handlerInput) {
    return getRequestType(handlerInput.requestEnvelope) === 'LaunchRequest';
  },
  async handle(handlerInput) {
    const {
      attributesManager
    } = handlerInput
    const sessionAttributes = attributesManager.getSessionAttributes()
    const {
      isNewUser
    } = attributesManager.getSessionAttributes()
    const {
      apiEndpoint,
      apiAccessToken
    } = handlerInput.requestEnvelope.context.System

    const headers = {
      Authorization: `Bearer ${apiAccessToken}`,
      "content-type": "application/json"
    }
    try {
      await axios.all([
          axios.get(apiEndpoint + process.env.GET_FULL_NAME, {
            headers: headers
          }),
          axios.get(apiEndpoint + process.env.GET_EMAIL_ADDRESS, {
            headers: headers
          }),
          axios.get(apiEndpoint + process.env.GET_PHONE_NUMBER, {
            headers: headers
          })
        ])
        .then(axios.spread(function(full_name, email, phone_number) {
          sessionAttributes.name = full_name.data.split(' ')[0]
          sessionAttributes.full_name = full_name.data
          sessionAttributes.email = email.data
          sessionAttributes.phone_number = phone_number.data
        }))

      return handlerInput.responseBuilder
        .speak(`Hi ${sessionAttributes.name}. Glad to meet you. Welcome to Daily Sentiment. A place where you can inspect your daily frame of mind. Let's continue setting up your profile. What is your occupation? For example, you can say "student" or "Software Engineer".`)
        .reprompt('I didn\'t catch that. What is your occupation?')
        .getResponse()
    } catch (error) {
      return handlerInput.responseBuilder
        .speak('Welcome to Daily Sentiment. Please enable profile permissions in the Amazon Alexa companion app for a personalized experienced.')
        .withAskForPermissionsConsentCard([
          "alexa::profile:name:read",
          "alexa::profile:email:read",
          "alexa::profile:mobile_number:read"
        ])
        .getResponse()
    }
  }
}

const RecordDayIntentHandler = {
  canHandle(handlerInput) {
    return getRequestType(handlerInput.requestEnvelope) === 'IntentRequest' &&
      getIntentName(handlerInput.requestEnvelope) === 'RecordDayIntent';
  },
  async handle(handlerInput) {
    const entryValue = getSlotValue(handlerInput.requestEnvelope, 'entry');

    try {
      await callDirectiveService(handlerInput);
    } catch (err) {
      console.log("error : " + err);
    }
    try {
      const comprehend = new AWS.Comprehend()
      const params = {
        LanguageCode: 'en',
        /* required */
        Text: entryValue /* required */
      };
      let sentiment = new Promise((resolve, reject) => {
        comprehend.detectSentiment(params, function(err, data) {
          if (err) {
            reject(console.log(err, err.stack))
          } else {
            resolve(data)
          }
        });
      })
      let result = await sentiment;

      return handlerInput.responseBuilder
        .speak(`The sentiment of your day is ${result.Sentiment}.`)
        .getResponse();
    } catch (err) {
      console.log(`Error processing events request: ${err}`);
      return handlerInput.responseBuilder
        .speak('error')
        .getResponse();
    }
  }
}

function callDirectiveService(handlerInput) {
  const requestEnvelope = handlerInput.requestEnvelope;
  const directiveServiceClient = handlerInput.serviceClientFactory.getDirectiveServiceClient();

  const requestId = requestEnvelope.request.requestId;
  const endpoint = requestEnvelope.context.System.apiEndpoint;
  const token = requestEnvelope.context.System.apiAccessToken;

  const directive = {
    header: {
      requestId,
    },
    directive: {
      type: "VoicePlayer.Speak",
      speech: "Please wait a moment as I analyze your day."
    },
  };
  return directiveServiceClient.enqueue(directive, endpoint, token);
}

exports.handler = Alexa.SkillBuilders.custom()
  .withSkillId(process.env.SKILL_ID)
  .addRequestHandlers(
    handlers.CancelAndStopIntentHandler,
    LaunchRequestHandler,
    handlers.HelpIntentHandler,
    RecordDayIntentHandler,
    handlers.SessionEndedRequestHandler)
  .addErrorHandlers(handlers.ErrorHandler)
  .addRequestInterceptors(LaunchRequestInterceptor)
  .addResponseInterceptors(PersistenceSavingResponseInterceptor)
  .withApiClient(new Alexa.DefaultApiClient())
  .withPersistenceAdapter(new Adapter.DynamoDbPersistenceAdapter({
    tableName: process.env.TABLE_NAME,
    createTable: true
  }))
  .lambda();
