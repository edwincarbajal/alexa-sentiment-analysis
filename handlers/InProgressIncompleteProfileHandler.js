const {
  getRequestType,
  getIntentName,
  getDialogState
} = require('ask-sdk-core');

module.exports = {
  canHandle(handlerInput){
    return getRequestType(handlerInput.requestEnvelope) === 'IntentRequest' &&
      getIntentName(handlerInput.requestEnvelope) === 'IncompleteProfileIntent' &&
      getDialogState(handlerInput.requestEnvelope) === 'IN_PROGRESS';
  },
  handle(handlerInput){
    const currentIntent = getIntentName(handlerInput.requestEnvelope);

    return handlerInput.responseBuilder
      .addDelegateDirective(currentIntent)
      .getResponse();
  }
};
