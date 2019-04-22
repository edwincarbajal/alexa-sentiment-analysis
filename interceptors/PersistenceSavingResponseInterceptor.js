module.exports = {
  process(handlerInput) {
    return new Promise((resolve, reject) => {
      handlerInput.attributesManager.savePersistentAttributes()
        .then(() => {
          resolve();
        })
        .catch((error) => {
          reject(error);
        });
    });
  }
};
