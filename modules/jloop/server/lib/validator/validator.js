var async = require("async");
var loopback = require("loopback");
var util = require("util");
var _ = require('underscore');
var validators = require("./validators");
var requestCrawler = require("../request-crawler");


var VALIDATE_FEATURE_KEY = "$validate";


function validate(ctx, finalCb) {

    var crawlOptions = {
        featureKey: VALIDATE_FEATURE_KEY,
        stateVars: {
            report: {
                passed: true,
                elements: {},
                errors: {}
            }
        }
    };
    crawlOptions.newStateHandler = newStateHandler;
    crawlOptions.primitiveHandler = primitiveHandler;
    crawlOptions.postHandler = postHandler;

    return requestCrawler.crawl(ctx, crawlOptions, finalCb);
}

function newStateHandler(oldState, newState) {

    // Create new report
    newState.report = {
        passed: true
    };

    // Build report appropriate for data type
    if (typeof newState.data === "object") {
        newState.report.errors = {};
        newState.report.elements = {};
    } else {
        newState.report.errors = [];
    }

    // Point reference to this new state if it's part of a container
    if (typeof oldState.data === "object") {
        oldState.report.elements[newState.key] = newState.report;
    }
}

function primitiveHandler(state, finalCb) {
    var validators = state.modelProperties[VALIDATE_FEATURE_KEY];
    console.log("validators", validators);
    if(!Array.isArray(validators)) {
        return finalCb();
    }

    runValidators(validators, state, finalCb);
}

function postHandler(state, finalCb) {
    var validationErr;
    if(!state.report.passed) {
        validationErr = new Error('Invalid model');
        validationErr.statusCode = 422;
        validationErr.code = 'Invalid model';
        validationErr.report = state.report;
    }
    return finalCb(validationErr);
}


function runValidators(validatorNames, state, finalCb) {

    function runValidator(validatorName, validatorCb) {

        var validator = validators[validatorName];
        if(typeof validator !== "function") {
            return finalCb();
        }

        validator(state, function(err, validationErr) {
            if(err) return validatorCb(err);
            else if(validationErr)
                return updateReport(state.key, state, validationErr, validatorCb);
            else finalCb();
        });
    }

    async.each(validatorNames, runValidator, finalCb);
}


function updateReport(key, state, validationErr, finalCb) {

    // Update the current validation state with error
    state.report.passed = false;

    if(typeof state.data === "object") {
        if(typeof state.report.errors[key] === "undefined") {
            state.report.errors[key] = [];
        }
        state.report.errors[key].push(validationErr)
    } else {
        state.report.errors.push(validationErr);
    }

    if(typeof state.parent === "undefined") {
        return finalCb();
    }

    return updateReport(key, state.parent, validationErr, finalCb);
}



module.exports = {
    validate: validate
};