var async = require("async");
var loopback = require("loopback");
var util = require("util");
var customValidators = require("./customValidators");



function validate(ctx, finalCb) {

    var loopbackContext = loopback.getCurrentContext();
    if (!loopbackContext || !loopbackContext.active) {
        return finalCb();
    }
    var req = loopbackContext.active.http.req;
    var res = loopbackContext.active.http.res;


    // Keep a reference to each possible state of the model's config, client data and the reportObj
    console.log("properties:", ctx.Model.definition);
    var firstValidationState = {
        modelConfig : ctx.Model.definition.rawProperties,
        clientData: ctx.data || ctx.instance,
        report: {
            errors: {},
            passed: true
        }
    }

    console.log("firstValidationState:", firstValidationState);

    function buildValidationState(value, key, previousState) {
        console.log("building nextValidationState");
        //console.log("nextValidationState");
        //console.log("value:", value);
        console.log("key:", key);
        console.log("clientData:", previousState.clientData[key]);
        //console.log("previousState:", previousState);
        var nextValidationState = {};
        nextValidationState.key = key;
        nextValidationState.modelConfig = value;
        nextValidationState.clientData = previousState.clientData[key];
        nextValidationState.report = {
            errors: {},
            passed: true
        };
        previousState.report[key] = nextValidationState.report;
        //console.log("nextValidationState:", nextValidationState);
        return nextValidationState;
    }


    validateObject(firstValidationState, finalCb);



    function validateObject(validationState, objectCb) {
        console.log("validating object");

        // Iterate over the model's config that we're currently on
        async.forEachOf(validationState.modelConfig, function(value, key, eachCb) {
            console.log("iterating over object keys")
            console.log("config key:", key)
            // Update the validation state with this level of object
            var nextValidationState = buildValidationState(value, key, validationState);

            // Return if no data to validate
            if(_.isEmpty(nextValidationState.clientData)) {
                return eachCb();
            }
            console.log("client data:", nextValidationState.clientData);
            console.log("modelConfig:", nextValidationState.modelConfig);
            // Determine type of value
            if(typeof nextValidationState.modelConfig === "object") {

                // Is there a type defined?
                var type = nextValidationState.modelConfig["type"];
                console.log("type...type?:", typeof type)
                console.log("field type:", type);
                try {
                    console.log("uuuuuh?", JSON.stringify(type));
                } catch(err) {
                    console.log("ERRRRRRRRRRRRRRRRRRR:", err);
                }
                if(typeof type === "string") {
                    return validatePrimitive(nextValidationState, eachCb)
                }

            } else if(Array.isArray(value)) {
                return validateArray(nextValidationState, eachCb);
            } else if(typeof value === "string") {
                return validatePrimitive(nextValidationState, eachCb);
            }

            // Invalid input
            return eachCb();

        }, objectCb);
    }

    function validateArray(validationState, arrayCb) {
        console.log("validating array");
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
        console.log("validating array");
        var validators = validationState.modelConfig["validators"];
        if(!Array.isArray(validators)) {
            return primitiveCb();
        }

        runValidators(validators, validationState, primitiveCb);
    }


    function runValidators(validatorNames, validationState, validatorsCb) {
        console.log("runnning Validators");
        function runValidator(validatorName, validatorCb) {
            console.log("running Validator");
            var validator = customValidators[validatorName];
            if(typeof validator !== "function") {
                return validatorCb();
            }

            validator(ctx, validationState, function(err, validationErr) {
                if(err) return validatorsCb(err);

                // Update the validation state with the report
                if(validationErr) {
                    validationState.report.errors[validationState.key] = validationErr;
                    if(validationState.report.passed) {
                        validationState.report.passed = false;
                    }
                }
                return validatorsCb();
            });
        }

        async.each(validatorNames, runValidator, runValidator);
    }
}

module.exports = {
    validate: validate
}

