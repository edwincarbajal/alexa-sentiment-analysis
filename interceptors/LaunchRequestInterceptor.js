module.exports = {
  process(handlerInput) {
    return new Promise(function(resolve, reject) {
      handlerInput.attributesManager.getPersistentAttributes()
        .then(attributes => {
          attributes.entries ? null : attributes.entries = []
          resolve(handlerInput.attributesManager.setSessionAttributes(attributes))
        })
        .then(error => {
          reject(error)
        })
    });
  }
}
