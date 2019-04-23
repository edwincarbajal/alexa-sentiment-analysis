const {
  getRequestType,
  getIntentName,
  getDialogState,
  getSlotValue
} = require('ask-sdk-core');

module.exports = {
  canHandle(handlerInput){
    return getRequestType(handlerInput.requestEnvelope) === 'IntentRequest' &&
      getIntentName(handlerInput.requestEnvelope) === 'IncompleteProfileIntent' &&
      getDialogState(handlerInput.requestEnvelope) === 'STARTED';
  },
  handle(handlerInput){
    const currentIntent = getIntentName(handlerInput.requestEnvelope);
    const slotValue = getSlotValue(handlerInput.requestEnvelope, 'occupation');

    if (slotValue === 'student') {
      return handlerInput.responseBuilder
        .speak('Which school do you attend?')
        .addConfirmSlotDirective('school', currentIntent)
        .getResponse();
    } else {
      return handlerInput.responseBuilder
        .addDelegateDirective(currentIntent)
        .getResponse();
    }
  }
};
