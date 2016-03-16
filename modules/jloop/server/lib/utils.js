var _ = require("underscore");
var loopback = require("loopback");
var async = require("async");

var server = require("../../../../server/server");


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
        'Set "global.Promise" t``1  o your preferred implementation of promises.');
}

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function convertMillisecondsToDigitalClock(ms) {
    hours = Math.floor(ms / 3600000), // 1 Hour = 36000 Milliseconds
        minutes = Math.floor((ms % 3600000) / 60000), // 1 Minutes = 60000 Milliseconds
        seconds = Math.floor(((ms % 360000) % 60000) / 1000) // 1 Second = 1000 Milliseconds
    return {
        hours : hours,
        minutes : minutes,
        seconds : seconds,
        clock : hours + ":" + minutes + ":" + seconds
    };
}


function slugify(string) {
    return (string) ? string.toLowerCase().replace(/-+/g, '').replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') : '';
}

function modelNameFromForeignKey(keyName) {
    if(typeof keyName !== "string" || keyName.length < 2) {
        return;
    }

    var modelName = keyName.slice(0, keyName.length-3);

    if(modelName === "author" || modelName === "owner") {
        modelName = "user";
    }

    return modelName;
}

function getFirstForeignKey(data) {
    if(typeof data !== "object") {
        return;
    }

    for(var key in data) {
        if(!data[key])
            continue;

        var suffix = key.slice(key.length-3, key.length-1);
        if(suffix === "Id") {
            return key;
        }
    }
}


module.exports = {
    createPromiseCallback : createPromiseCallback,
    getRandomInt : getRandomInt,
    convertMillisecondsToDigitalClock : convertMillisecondsToDigitalClock,
    slugify: slugify,
    modelNameFromForeignKey: modelNameFromForeignKey,
    getFirstForeignKey: getFirstForeignKey
};
