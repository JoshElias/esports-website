var async = require("async");
var loopback = require("loopback");
var util = require("util");
var customValidators = require("./customValidators");


function validate(ctx, finalCb) {

  var loopbackContext = loopback.getCurrentContext();
  if (!loopbackContext || !loopbackContext.active) {
    return finalCb();
  }

  // Keep a reference to each possible state of the model's config, client data and the reportObj
  var parentValidationState = {
    ctx: ctx,
    rootKey: "",
    modelConfig: ctx.Model.definition.rawProperties,
    clientData: ctx.data || ctx.instance,
    report: {
      passed: true,
      elements: {},
      errors: {}
    }
  };

  validateObject(parentValidationState, function(err, validationState) {
    if(err) return finalCb(err);

    var validationErr;
    if(!validationState.report.passed) {
      validationErr = new Error('Invalid model');
      validationErr.statusCode = 422;
      validationErr.code = 'Invalid model';
      validationErr.report = validationState.report;
    }

    return finalCb(validationErr);
  });
}

function buildValidationState(value, key, previousState) {

  // Populate the next level of the validation state
  var nextValidationState = {};
  nextValidationState.parent = previousState;
  nextValidationState.ctx = previousState.ctx;
  nextValidationState.key = key;
  nextValidationState.modelConfig = value;
  nextValidationState.clientData = previousState.clientData[key];
  nextValidationState.report = {
    passed: true
  };

  // Build new root key
  var rootKeyPrefix = (previousState.rootKey.length < 1) ? "" : previousState.rootKey+".";
  nextValidationState.rootKey = rootKeyPrefix+key;

  // Build report appropriate for data type
  if(typeof nextValidationState.clientData === "object") {
    nextValidationState.report.errors = {};
    nextValidationState.report.elements = {};
  } else {
    nextValidationState.report.errors = [];
  }

  // Point reference to this new state if it's part of a container
  if(typeof previousState.clientData === "object") {
    previousState.report.elements[key] = nextValidationState.report;
  }

  return nextValidationState;
}

function validateObject(validationState, objectCb) {

    // Iterate over the model's config that we're currently on
    var properties = (typeof validationState.modelConfig.properties === "object") ?
      validationState.modelConfig.properties : validationState.modelConfig;

    async.forEachOf(properties, function(value, key, eachCb) {

        // Update the validation state with this level of object
        var nextValidationState = buildValidationState(value, key, validationState);

        // Return if no data to validate
        if(_.isEmpty(nextValidationState.clientData)) {
            return eachCb();
        }

        // Determine type of value
      if(Array.isArray(nextValidationState.modelConfig)) {
          return validateArray(nextValidationState, eachCb);
      } else if(typeof nextValidationState.modelConfig === "object") {

        // Is there a type defined?
        var type = nextValidationState.modelConfig["type"];
        if(typeof type === "string") {
            return validatePrimitive(nextValidationState, eachCb)
        } else {
            return validateObject(nextValidationState, eachCb);
        }
      } else if(typeof value === "string") {
        return validatePrimitive(nextValidationState, eachCb);
      }

      // Invalid input
      return eachCb();

    }, function(err) {
        return objectCb(err, validationState);
    });
}

function validateArray(validationState, arrayCb) {

    // Iterate over the models config that we're currently on
    async.forEachOf(validationState.modelConfig, function(value, key, eachCb) {

        // Update the validation state with this level of object
        var nextValidationState = buildValidationState(value, key, validationState);

        var properties = nextValidationState.modelConfig["properties"];
        if(typeof value !== "object" || typeof properties !== "object" ) {
            return eachCb();
        }

        return validateObject(nextValidationState, eachCb);

    }, arrayCb);
}

function validatePrimitive(validationState, primitiveCb) {

    var validators = validationState.modelConfig["validators"];
    if(!Array.isArray(validators)) {
        return primitiveCb();
    }

    runValidators(validators, validationState, primitiveCb);
}


function runValidators(validatorNames, validationState, validatorsCb) {

    function runValidator(validatorName, validatorCb) {

        var validator = customValidators[validatorName];
        if(typeof validator !== "function") {
            return validatorCb();
        }

        validator(validationState, function(err, validationErr) {
            if(err) return validatorCb(err);
            else if(validationErr)
              return updateReport(validationState.key, validationState, validationErr, validatorCb);
            else validatorCb();
        });
    }

    async.each(validatorNames, runValidator, validatorsCb);
}


function updateReport(key, validationState, validationErr, reportCb) {

  // Update the current validation state with error
  validationState.report.passed = false;

  if(typeof validationState.clientData === "object") {
    if(typeof validationState.report.errors[key] === "undefined") {
      validationState.report.errors[key] = [];
    }
    validationState.report.errors[key].push(validationErr)
  } else {
    validationState.report.errors.push(validationErr);
  }

  if(typeof validationState.parent === "undefined") {
    return reportCb();
  }

  return updateReport(key, validationState.parent, validationErr, reportCb);
}


module.exports = {
    validate: validate
};

