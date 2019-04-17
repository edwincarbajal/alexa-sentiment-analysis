const Alexa = require('ask-sdk-core')
const { getRequestType, getIntentName, getSlotValue } = require('ask-sdk-core')
const AWS = require('aws-sdk')

const LaunchRequestHandler = {
  canHandle(handlerInput) {
    return getRequestType(handlerInput.requestEnvelope) === 'LaunchRequest';
  },
  handle(handlerInput) {
    const speechText = 'Welcome to Tone Analysis, you can tell me about your day. What would you like to do?';

    return handlerInput.responseBuilder
      .speak(speechText)
      .reprompt('You can ask me to record your day')
      .getResponse()
  }
}

const RecordDayIntentHandler = {
  canHandle(handlerInput) {
    return getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
      && getIntentName(handlerInput.requestEnvelope) === 'RecordDayIntent';
  },
  async handle(handlerInput) {
    const entryValue = getSlotValue(handlerInput.requestEnvelope, 'entry');

    try {
      await callDirectiveService(handlerInput);
    } catch(err) {
       console.log("error : " + err);
    }
    try {
      const comprehend = new AWS.Comprehend()
      const params = {
        LanguageCode: 'en', /* required */
        Text: entryValue /* required */
      };
      let sentiment = new Promise((resolve, reject) => {
        comprehend.detectSentiment(params, function(err, data) {
          if (err) {
            console.log(err, err.stack) // an error occurred
          } else {
            resolve(data.Sentiment)
          }
        });
      })
      let result = await sentiment;

      return handlerInput.responseBuilder
        .speak(`The sentiment of your day is ${result}.`)
        .getResponse();
    } catch (err) {
      console.log(`Error processing events request: ${err}`);
      return handlerInput.responseBuilder
        .speak('error')
        .getResponse();
    }
  }
}

const HelpIntentHandler = {
  canHandle(handlerInput) {
    return getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
      && getIntentName(handlerInput.requestEnvelope) === 'AMAZON.HelpIntent';
  },
  handle(handlerInput) {
    const speechText = 'You can ask me to record your day!';

    return handlerInput.responseBuilder
      .speak(speechText)
      .reprompt(speechText)
      .getResponse();
  }
}

const CancelAndStopIntentHandler = {
  canHandle(handlerInput) {
    return getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
      && (getIntentName(handlerInput.requestEnvelope) === 'AMAZON.CancelIntent'
        || getIntentName(handlerInput.requestEnvelope) === 'AMAZON.StopIntent');
  },
  handle(handlerInput) {
    const speechText = 'Goodbye!';

    return handlerInput.responseBuilder
      .speak(speechText)
      .getResponse();
  }
}

const SessionEndedRequestHandler = {
  canHandle(handlerInput) {
    return getRequestType(handlerInput.requestEnvelope) === 'SessionEndedRequest';
  },
  handle(handlerInput) {
    //any cleanup logic goes here
    return handlerInput.responseBuilder.getResponse();
  }
};

const ErrorHandler = {
  canHandle() {
    return true;
  },
  handle(handlerInput, error) {
    console.log(`Error handled: ${error.message}`);

    return handlerInput.responseBuilder
      .speak('Sorry, I can\'t understand the command. Please say again.')
      .reprompt('Sorry, I can\'t understand the command. Please say again.')
      .getResponse();
  },
};

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
    directive:{
        type:"VoicePlayer.Speak",
        speech:"Please wait a moment as I analyze your day."
    },
  };
  return directiveServiceClient.enqueue(directive, endpoint, token);
}

exports.handler = Alexa.SkillBuilders.custom()
  .withSkillId(process.env.SKILL_ID)
  .addRequestHandlers(
    LaunchRequestHandler,
    RecordDayIntentHandler,
    HelpIntentHandler,
    CancelAndStopIntentHandler,
    SessionEndedRequestHandler)
  .addErrorHandlers(ErrorHandler)
  .withApiClient(new Alexa.DefaultApiClient())
  .lambda();
