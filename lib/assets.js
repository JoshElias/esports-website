var assets = require("./../assets.json"),
    output = {};

// Look for configuration options
if(typeof assets === "undefined") {
  module.exports = output;
  return;
}

// make keys safe for dustjs
if(typeof assets === "object") {
    for(var key in assets) {
        var safeKey = key.split('.').join('_');
        output[safeKey] = assets[key];
    }
}

module.exports = Object.freeze(output);