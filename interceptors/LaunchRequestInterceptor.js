module.exports = {
  process(handlerInput) {
    return new Promise(function(resolve, reject) {
      handlerInput.attributesManager.getPersistentAttributes()
        .then(attributes => {
          attributes.isNewUser = attributes.hasCompletedProfile ? false : true
          resolve(handlerInput.attributesManager.setSessionAttributes(attributes))
        })
        .then(error => {
          reject(error)
        })
    });
  }
}
