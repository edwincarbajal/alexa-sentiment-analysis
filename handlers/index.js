// Custom handlers
const StartedInProgressProfileSetupIntentHandler = require('./StartedInProgressProfileSetupIntentHandler');
const StudentOccupationGivenProfileSetupIntentHandler = require('./StudentOccupationGivenProfileSetupIntentHandler');
const CompletedProfileSetupIntentHandler = require('./CompletedProfileSetupIntentHandler');

// Built-in handlers
const HelpIntentHandler = require('./HelpIntentHandler');
const CancelAndStopIntentHandler = require('./CancelAndStopIntentHandler');
const SessionEndedRequestHandler = require('./SessionEndedRequestHandler');
const ErrorHandler = require('./ErrorHandler');

module.exports = {
  StartedInProgressProfileSetupIntentHandler,
  StudentOccupationGivenProfileSetupIntentHandler,
  CompletedProfileSetupIntentHandler,
  HelpIntentHandler,
  CancelAndStopIntentHandler,
  ErrorHandler,
  SessionEndedRequestHandler
}
