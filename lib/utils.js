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
function validateYoutubeId(ctx, finalCallback) {
    var data = ctx.data || ctx.instance;
    if(_.isEmpty(!data.youtubeId))
        return finalCallback();

    var err = new Error('Invalid youtubeId');
    err.statusCode = 400;
    err.code = 'INVALID_YOUTUBE_ID';

    return (youtubeRegex.test(data.youtubeId))
        ? finalCallback() : finalCallback(err);
}


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


function slugify(string) {
    return (string) ? string.toLowerCase().replace(/-+/g, '').replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') : '';
};

function generateSlug(ctx) {
    var data = ctx.data || ctx.instance;
    if(data.name) {
        data.slug = slugify(data.name);
    }
};

module.exports = {
    createPromiseCallback : createPromiseCallback,
    validateYoutubeId: validateYoutubeId,
    youtubeRegex : youtubeRegex,
    convertObjectIds : convertObjectIds,
    generateSlug : generateSlug,
    slugify : slugify
}
