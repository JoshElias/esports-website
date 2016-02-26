var async = require("async");
var loopback = require("loopback");
var util = require("util");
var _ = require('underscore');


function crawl(ctx, options, finalCb) {

    // Check if this model has the current feature enabled
    if(!ctx.Model.definition.customOptions || !ctx.Model.definition.customOptions[options.optionsKey]) {
        return finalCb();
    }

    // Check if the ctx has an active request
    var loopbackContext = loopback.getCurrentContext();
    if (!loopbackContext || !loopbackContext.active || !loopbackContext.active.http) {
        return finalCb();
    }

    // Keep a reference to each possible state of the model's config, client data and the reportObj
    var parentState = {
        ctx: ctx,
        rootKey: "",
        modelConfig: ctx.Model.definition.rawProperties,
        modelName: ctx.Model.definition.name,
        data: ctx.data,
        instance: ctx.instance,
        currentInstance: ctx.currentInstance
    };

    // Attach ctx specific vars to state obj
    if(options && typeof options.stateVars === "object") {
        for(var key in options.stateVars) {
            parentState[key] = options.stateVars[key];
        }
    }

    return crawlObject(parentState, options, function(err, state) {
        if(err) return finalCb(err);

        return options.postHandler(state, finalCb);
    });
}


function buildNextState(value, key, oldState, options) {

    // Populate the next level of the validation state
    var newState = {};
    newState.parent = oldState;
    newState.ctx = oldState.ctx;
    newState.key = key;
    newState.modelConfig = value;
    newState.modelName = oldState.modelName;

    // Build new data points for instance and data
    newState.data = (typeof oldState.data === "undefined")
        ? undefined : oldState.data[key];
    newState.instance = (typeof oldState.instance === "undefined")
        ? undefined : oldState.instance[key];
    newState.currentInstance = (oldState.currentInstance === null || typeof oldState.currentInstance === "undefined")
        ? undefined : oldState.currentInstance[key];

    // Build new root key
    var rootKeyPrefix = (oldState.rootKey.length < 1) ? "" : oldState.rootKey + ".";
    newState.rootKey = rootKeyPrefix + key;

    // Handler options for new state
    return options.newStateHandler(newState)
}


function crawlObject(state, options, objectCb) {
    async.forEachOf(state.modelConfig, function(value, key, eachCb) {

        // Update the validation state with this level of object
        var newState = buildNextState(value, key, state, options);

        // Return if no data to validate
        var clientData = newState.ctx.data || newState.ctx.instance;
        if(_.isEmpty(clientData)) {
            return eachCb();
        }

        // Determine type of value
        if(Array.isArray(newState.modelConfig)) {
            return crawlArray(newState, eachCb);
        } else if(typeof newState.modelConfig === "object") {

            // Is there a type defined?
            var type = newState.modelConfig["type"];

            if(typeof type === "string") {
                return crawlPrimitive(newState, eachCb)
            } else {
                return crawlObject(newState, eachCb);
            }
        } else if(typeof value === "string") {
            return crawlPrimitive(newState, eachCb);
        }

        // Invalid input
        return eachCb();

    }, function(err) {
        return objectCb(err, state);
    });
}

function crawlArray(state, finalCb) {

    // Iterate over the models config that we're currently on
    async.forEachOf(state.modelConfig, function(value, key, eachCb) {

        // Update the validation state with this level of object
        var nextValidationState = buildNextState(value, key, state);

        var properties = nextValidationState.modelConfig["properties"];
        if(typeof value !== "object" || typeof properties !== "object" ) {
            return eachCb();
        }

        return crawlObject(nextValidationState, eachCb);

    }, finalCb);
}

function crawlPrimitive(state, finalCb) {

    return options.primitiveHandler(state, finalCb);
}


module.exports = {
    crawl : crawl
};
