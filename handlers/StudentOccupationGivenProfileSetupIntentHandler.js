const {
  getRequestType,
  getIntentName,
  getSlotValue,
  getDialogState
} = require('ask-sdk-core');

module.exports = {
  canHandle(handlerInput) {
    return getRequestType(handlerInput.requestEnvelope) === "IntentRequest"
      && getIntentName(handlerInput.requestEnvelope) === "ProfileSetupIntent"
      && getSlotValue(handlerInput.requestEnvelope, 'occupation')
      && getSlotValue(handlerInput.requestEnvelope, 'occupation') === 'student'
      && !getSlotValue(handlerInput.requestEnvelope, 'school')
  },
  handle(handlerInput) {
    const currentIntent = getIntentName(handlerInput.requestEnvelope);
    return handlerInput.responseBuilder
      .speak('Which school do you currently attend?')
      .reprompt('You can say the name of your school or the abbreviation.')
      .addElicitSlotDirective('school')
      .getResponse();
  }
};
