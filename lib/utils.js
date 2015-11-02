var ObjectID = require("mongodb").ObjectID;
var _ = require("underscore");

function createPromiseCallback() {
    var cb;

    if (!global.Promise) {
        cb = function() {};
        cb.promise = {};
        Object.defineProperty(cb.promise, 'then', { get: throwPromiseNotDefined });
        Object.defineProperty(cb.promise, 'catch', { get: throwPromiseNotDefined });
        return cb;
    }

    var promise = new global.Promise(function(resolve, reject) {
        cb = function(err, data) {
            if (err) return reject(err);
            return resolve(data);
        };
    });
    cb.promise = promise;
    return cb;
}

function throwPromiseNotDefined() {
    throw new Error(
        'Your Node runtime does support ES6 Promises. ' +
        'Set "global.Promise" to your preferred implementation of promises.');
}

function validateYoutubeId(data, finalCallback) {
    if(_.isEmpty(!data.youtubeId)) 
        return finalCallback();

    var err = new Error('Invalid youtubeId');
    err.statusCode = 400;
    err.code = 'INVALID_YOUTUBE_ID';

    var youtubeRegex = /^[a-zA-Z0-9_-]{11}$/;
    return (youtubeRegex.test(data.youtubeId))
        ? finalCallback() : finalCallback(err);
}

function convertObjectIds(keys, obj) {
  _.each(keys, function(foreignKey) {
    _.each(obj, function(modelValue, modelKey){
      if(foreignKey === modelKey && typeof modelValue === "string") {
        obj[foreignKey] = new ObjectID(modelValue);
      }
    })
  });
}

module.exports = {
    createPromiseCallback : createPromiseCallback,
    validateYoutubeId: validateYoutubeId,
    convertObjectIds : convertObjectIds
}
