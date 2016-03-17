var _ = require("underscore");
var loopback = require("loopback");
var async = require("async");
var app = require("../../../../server/server");


var ID_SUFFIX = "Id";


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

function isForeignKey(key) {
    if(typeof key !== "string" || key.length < 3)
        return false;

    var suffix = key.slice(key.length-2, key.length);
    if(suffix !== ID_SUFFIX) {
        return false;
    }

    return true;
}

function getForeignKeys(properties) {
    var foreignKeys = [];
    for(var key in properties) {
        if(isForeignKey(key)) {
            foreignKeys.push(key);
        }
    }
    return foreignKeys;
}

function modelNameFromForeignKey(key) {
    if(!isForeignKey(key)) {
        throw new Error("No model for key:", key);
    }

    var modelName = key.slice(0, key.length-2);

    // Amend known exceptions
    if(modelName === "author" || modelName === "owner") {
        modelName = "user";
    }

    if(!app.models[modelName]) {
        throw new Error("No model for key:", key);
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
    getRandomInt : getRandomInt,
    convertMillisecondsToDigitalClock : convertMillisecondsToDigitalClock,
    getForeignKeys: getForeignKeys,
    modelNameFromForeignKey: modelNameFromForeignKey,
    getFirstForeignKey: getFirstForeignKey
};
