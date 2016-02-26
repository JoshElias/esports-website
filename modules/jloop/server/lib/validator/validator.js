var async = require("async");
var loopback = require("loopback");
var util = require("util");
var _ = require('underscore');
var customValidators = require("./customValidators");
var modelCrawler = require("./model-config-crawler");


function validate(ctx, finalCb) {

    var crawlOptions = {
        optionKey: "$validate",
        tag: "$validate",
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

    return modelCrawler.crawl(ctx, crawlOptions, finalCb);
}

function newStateHandler(oldState, newState) {

    // Build report appropriate for data type
    var newClientData = newState.ctx.data || newState.ctx.instance;
    if (typeof newClientData === "object") {
        newState.report.errors = {};
        newState.report.elements = {};
    } else {
        newState.report.errors = [];
    }

    // Create new report
    newState.report = {
        passed: true
    };

    // Point reference to this new state if it's part of a container
    var oldClientData = oldState.ctx.data || oldState.ctx.instance;
    if (typeof oldClientData === "object") {
        oldState.report.elements[key] = newState.report;
    }

    return newState;
}

function primitiveHandler(state, finalCb) {
    var validators = state.modelConfig["validators"];
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

        var validator = customValidators[validatorName];
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

    var clientData = state.ctx.data || state.ctx.instance;
    if(typeof clientData === "object") {
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