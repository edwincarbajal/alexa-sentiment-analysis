module.exports = {
  callDirectiveService: function(handlerInput) {
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
}
