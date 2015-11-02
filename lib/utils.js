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

var youtubeRegex = /^[a-zA-Z0-9_-]{11}$/;

function convertObjectIds(keys, ctx) {
    var data = ctx.data || ctx.instance;
  _.each(keys, function(foreignKey) {
    _.each(data, function(modelValue, modelKey){
      if(foreignKey === modelKey && typeof modelValue === "string") {
        data[foreignKey] = new ObjectID(modelValue);
      }
    })
  });
}

module.exports = {
    createPromiseCallback : createPromiseCallback,
    youtubeRegex: youtubeRegex,
    convertObjectIds : convertObjectIds
}
