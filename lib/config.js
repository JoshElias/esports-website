var config = require("./../config.json");
var appOptions = {};

// Look for configuration options
if(typeof config === "undefined") {
  module.exports = appOptions;
  return;
}

// Add general options
if(typeof config.general === "object") {
  for(var key in config.general) {
    appOptions[key] = config.general[key];
  }
}

// Add deployment options
var deploymentOptions;
if(typeof global.process.env.NODE_ENV === "string" 
  && typeof config[global.process.env.NODE_ENV] === "object") {
  deploymentOptions = config[global.process.env.NODE_ENV];
} else if(global.process.env.NODE_ENV !== "string") {
  deploymentOptions = config["development"];
}
for(var key in deploymentOptions) {
    appOptions[key] = deploymentOptions[key];
}


// Freeze the options to make them read only
module.exports = Object.freeze(appOptions);
