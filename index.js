const AWS = require('aws-sdk');
const Alexa = require('ask-sdk-core');
const {
  getRequestType,
  getIntentName,
  getSlotValue
} = require('ask-sdk-core');
const Adapter = require('ask-sdk-dynamodb-persistence-adapter');

const handlers = require('./handlers');
const interceptors = require('./interceptors');
const progressiveResponseHelper = require('./helpers/CallDirectiveService')

const LaunchRequestHandler = {
  canHandle(handlerInput) {
    return getRequestType(handlerInput.requestEnvelope) === 'LaunchRequest';
  },
  async handle(handlerInput) {
    const {
      serviceClientFactory,
      attributesManager,
      requestEnvelope
    } = handlerInput;
    const upsServiceClient = serviceClientFactory.getUpsServiceClient();
    const persistentAttributes = await attributesManager.getPersistentAttributes();

    const consentToken = requestEnvelope.context.System.user.permissions &&
      requestEnvelope.context.System.user.permissions.consentToken;

    if (!consentToken) {
      return handlerInput.responseBuilder
        .speak('Please enable Name permissions in the Amazon Alexa app.')
        .withAskForPermissionsConsentCard(['alexa::profile:given_name:read'])
        .getResponse();
    }

    try {
      const profileGivenName = await upsServiceClient.getProfileGivenName();

      if (persistentAttributes.hasCompletedProfile)
        return handlerInput.responseBuilder
          .speak(`Hey ${profileGivenName}, welcome back. You can ask me to record your day.`)
          .reprompt('Ask me to record you day.')
          .getResponse()
      else {
        return handlerInput.responseBuilder
          .speak(`Hi ${profileGivenName}. Glad to meet you. Welcome to Mood Tracker. A place where you can inspect your daily frame of mind. Before embarking together into your student life journey, I would like to know a little bit about you. What is your current occupation? For example, you can say "student" or "Software Engineer".`)
          .reprompt('I didn\'t catch that. What is your occupation?')
          .getResponse()
      }
    } catch (error) {
      return handlerInput.responseBuilder
        .speak('Welcome to Mood Tracker. Please enable profile permissions in the Amazon Alexa companion app for a personalized experienced.')
        .withAskForPermissionsConsentCard(['alexa::profile:given_name:read'])
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
    const persistentAttributes = await handlerInput.attributesManager.getPersistentAttributes();
    const entryValue = getSlotValue(handlerInput.requestEnvelope, 'entry');

    try {
      await progressiveResponseHelper.callDirectiveService(handlerInput);
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
      const result = await sentiment;
      const sentimentValueFormatted = result.Sentiment.toLowerCase();
      const sentimentValueFirstLetter = sentimentValueFormatted.charAt(0).toUpperCase();
      const formattedSentimentValue = sentimentValueFirstLetter + sentimentValueFormatted.slice(1);
      const roundedSentimentScore = Number.parseFloat(result.SentimentScore[formattedSentimentValue]).toFixed(2);

      persistentAttributes.entries = [{
        data: {
          input: entryValue,
          sentiment: formattedSentimentValue,
          sentimentScore: result.SentimentScore
        },
        created_at: new Date().toISOString()
      },
        ...persistentAttributes.entries]

      return handlerInput.responseBuilder
        .speak(`Okay, I saved your entry with a sentiment of ${formattedSentimentValue} and a score of ${roundedSentimentScore}. Come back again.`)
        .getResponse();
    } catch (err) {
      return handlerInput.responseBuilder
        .speak('Uh-oh. There was an error processing the request. Please try again later.')
        .getResponse();
    }
  }
}

exports.handler = Alexa.SkillBuilders.custom()
  .withSkillId(process.env.SKILL_ID)
  .addRequestHandlers(
    handlers.CancelAndStopIntentHandler,
    LaunchRequestHandler,
    handlers.StartedInProgressProfileSetupIntentHandler,
    handlers.StudentOccupationGivenProfileSetupIntentHandler,
    handlers.HelpIntentHandler,
    RecordDayIntentHandler,
    handlers.SessionEndedRequestHandler,
    handlers.CompletedProfileSetupIntentHandler)
  .addErrorHandlers(handlers.ErrorHandler)
  .addRequestInterceptors(interceptors.LaunchRequestInterceptor)
  .addResponseInterceptors(interceptors.PersistenceSavingResponseInterceptor)
  .withApiClient(new Alexa.DefaultApiClient())
  .withPersistenceAdapter(new Adapter.DynamoDbPersistenceAdapter({
    tableName: process.env.TABLE_NAME,
    createTable: true
  }))
  .lambda();
