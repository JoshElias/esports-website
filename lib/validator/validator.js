var async = require("async");
var validators = require("./validators");

function validate(ctx, finalCb) {

    var loopbackContext = loopback.getCurrentContext();
    if (!loopbackContext || !loopbackContext.active) {
        return finalCb();
    }
    var req = loopbackContext.active.http.req;
    var res = loopbackContext.active.http.res;


    // Keep a reference to each possible state of the model's config, client data and the reportObj
    var firstValidationState = {
        modelConfig : ctx.Model.definition.properties,
        clientData: ctx.data || ctx.instance,
        report: {
            errors: {},
            passed: true
        }
    }

    function nextValidationState(value, key, previousState) {
        console.log("nextValidationState");
        console.log("value:", value);
        console.log("key:", key);
        console.log("previousState:", previousState);
        var nextValidationState = {};
        nextValidationState.key = key;
        nextValidationState.modelConfig = value;
        nextValidationState.clientData = previousState.clientData[key];
        nextValidationState.report = {
            errors: {},
            passed: true
        };
        previousState.report[key] = nextValidationState.report;
        return nextValidationState;
    }


    validateObject(firstValidationState, finalCb);



    function validateObject(validationState, objectCb) {

        async.forEachOf(validationState.modelConfig, function(value, key, eachCb) {
            var nextValidationState = nextValidationState(value, key, validationState)

            // Return if no data to validate
            if(_.isEmpty(nextValidationState.clientData)) {
                return eachCb();
            }

            // Determine type of value
            if(typeof nextValidationState.modelConfig === "object") {

                // Is there a type defined?
                var type = nextValidationState.modelConfig["type"];
                if(typeof type === "string") {
                    return validatePrimitive(type, nextValidationState, objectCb)
                }

            } else if(Array.isArray(value)) {
                validateArray(nextValidationState, objectCb);
            } else if(typeof value === "string") {
                validatePrimitive(value, nextValidationState, objectCb);
            }

            return eachCb();

        }, objectCb);
    }

    function validateArray(validationState, arrayCb) {
        for(var index in value) {
            var arrayValue = value[index];
            var arrayProperties = arrayValue["properties"];
            if(typeof arrayValue === "object" && typeof arrayProperties === "object" ) {
                validateObject(value, key, arrayCb);
            }
        }
    }

    function validateBoolean(validationState, booleanCb) {
        var validators = validationState.modelConfig["validators"];
        if(!Array.isArray(validators)) {
            return booleanCb();
        }

        runValidators(validators, validationState, booleanCb);
    }

    function validateNumber(validationState, numberCb) {

    }

    function validateString(validationState, stringCb) {

    }


    function validatePrimitive(type, validationState, typeCb) {
        if(type === "boolean") {
            validateBoolean(value, key, typeCb);
        } else if(type === "number") {
            validateNumber(value, key, typeCb);
        } else if(type === "string") {
            validateString(value, key, typeCb);
        } else {
            typeCb();
        }
    }

    function runValidators(validators, validationState, validatorsCb) {

        function runValidator() {

        }

        ///runVali
    }
}

