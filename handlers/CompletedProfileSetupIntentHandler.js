const {
  getRequestType,
  getIntentName,
  getSlotValue,
  getDialogState
} = require('ask-sdk-core');

module.exports = {
  canHandle(handlerInput) {
    return getRequestType(handlerInput.requestEnvelope) === 'IntentRequest' &&
      getIntentName(handlerInput.requestEnvelope) === 'ProfileSetupIntent' &&
      getDialogState(handlerInput.requestEnvelope) === 'COMPLETED';
  },
  async handle(handlerInput) {
    const occupationSlotValue = getSlotValue(handlerInput.requestEnvelope, 'occupation');
    const schoolSlotValue = getSlotValue(handlerInput.requestEnvelope, 'school');
    const persistentAttributes = await handlerInput.attributesManager.getPersistentAttributes();

    persistentAttributes.hasCompletedProfile = occupationSlotValue || occupationSlotValue === 'student' && schoolSlotValue ? true : false
    persistentAttributes.occupation = occupationSlotValue
    persistentAttributes.school = occupationSlotValue === 'student' ? schoolSlotValue : false

    handlerInput.attributesManager.setPersistentAttributes(persistentAttributes);

    return handlerInput.responseBuilder
      .speak('Great. How can I help today? You can ask me to record your day and provide an analysis.')
      .reprompt('You can ask me to analyze your day.')
      .getResponse();
  }
};
