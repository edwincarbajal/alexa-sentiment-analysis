const {
  getRequestType,
  getIntentName,
  getDialogState
} = require('ask-sdk-core');

module.exports = {
  canHandle(handlerInput){
    return getRequestType(handlerInput.requestEnvelope) === 'IntentRequest' &&
      getIntentName(handlerInput.requestEnvelope) === 'ProfileSetupIntent' &&
      getDialogState(handlerInput.requestEnvelope) !== 'COMPLETED';
  },
  handle(handlerInput) {
    const currentIntent = getIntentName(handlerInput.requestEnvelope);
    return handlerInput.responseBuilder
      .addDelegateDirective()
      .getResponse();
  }
};
