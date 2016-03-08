var async = require("async");
var loopback = require("loopback");
var util = require("util");
var _ = require('underscore');
var app = require("../../../../server/server");


function crawl(ctx, options, finalCb) {

    // Get the model properties
    var definition;
    if(ctx.Model) {
        definition = ctx.Model.definition;
    } else {
        var modelName = ctx.methodString.split(".")[0];
        var model = app.models[modelName];
        definition = model.definition;
    }

    // Keep a reference to each possible state of the model's config, client data and the reportObj
    var parentState = {
        ctx: ctx,
        rootKey: "",
        propertyName: "",
        modelConfig: definition.rawProperties,
        modelName: definition.name,
        currentInstance: ctx.currentInstance,
        models: app.models
    };

    if(ctx.data) {
        parentState.requestData = ctx.data;
    } else if(ctx.instance) {
        parentState.requestData = ctx.instance["__data"];
    } else if(ctx.result) {
        parentState.requestData = ctx.result;
    }

    parentState.data = parentState.requestData;

    // Attach ctx specific vars to state obj
    if(options && typeof options.stateVars === "object") {
        for(var key in options.stateVars) {
            parentState[key] = options.stateVars[key];
        }
    }

    return crawlObject(parentState, options, function(err, state) {
        if(err) return finalCb(err);

        if(!options.postHandler) {
            return finalCb();
        }

        return options.postHandler(state, finalCb);
    });
}


function buildNextState(value, key, oldState, options) {
//console.log("building next state");
    //console.log("value", value);
    // Populate the next level of the validation state
    var newState = {};
    newState.parent = oldState;
    newState.ctx = oldState.ctx;
    newState.key = key;
    newState.modelConfig = oldState.modelConfig[key];
    newState.modelName = oldState.modelName;
    newState.requestData = oldState.requestData;
    newState.models = oldState.models;

//console.log("modelConfig", newState.modelConfig);
    // Build new data points for instance and data
    newState.parentData = oldState.data;
    newState.data = (newState.parentData) ? newState.parentData[key] : undefined;
    newState.currentInstance = (!oldState.currentInstance) ? undefined : oldState.currentInstance[key];


    // Build new root key
    var rootKeyPrefix = (oldState.rootKey.length < 1) ? "" : oldState.rootKey + ".";
    newState.rootKey = rootKeyPrefix + key;

    // Save the property name we're crawling
    if(oldState.propertyName.length < 1) {
        newState.propertyName = key;
    } else {
        newState.propertyName = oldState.propertyName;
    }

    // Handler options for new state
    if(!options.newStateHandler) {
        return newState;
    }

    options.newStateHandler(oldState, newState);
    return newState;
}


function crawlObject(state, options, objectCb) {

    return async.forEachOf(state.modelConfig, function(value, key, eachCb) {

        // Update the validation state with this level of object
        var newState = buildNextState(value, key, state, options);

        console.log("key", newState.key);
        console.log("modelConfig", newState.modelConfig);
        console.log("data", newState.data);

        // Return if no data to validate
        if(newState.data === null || newState.data === undefined) {
            console.log("rip")
            return eachCb();
        }



        // Determine type of value
        if(Array.isArray(newState.modelConfig)) {

            return crawlArray(newState, options, eachCb);

        } else if(typeof newState.modelConfig === "object") {

            // Is there a type defined?
            var type = newState.modelConfig["type"];
            //console.log("type type", typeof type);
            if(typeof type === "object" || type === "object") {
                return crawlObject(newState, options, eachCb);
            } else if(type === "string" || type === "number") {
                return crawlPrimitive(newState, options, eachCb);
            }
        } else if(typeof value === "string") {

            return crawlPrimitive(newState, options, eachCb);
        }

        // Invalid input
        return eachCb();

    }, function(err) {
        return objectCb(err, state);
    });
}

function crawlArray(state, options, finalCb) {
console.log("ARRAY")
    // Iterate over the models config that we're currently on
    async.forEachOf(state.modelConfig, function(value, key, eachCb) {

        // Update the validation state with this level of object
        var nextValidationState = buildNextState(value, key, state, options);

        var properties = nextValidationState.modelConfig["properties"];
        if(typeof value !== "object" || typeof properties !== "object" ) {
            return eachCb();
        }

        return crawlObject(nextValidationState, options, eachCb);

    }, finalCb);
}

function crawlPrimitive(state, options, finalCb) {
console.log("PRIMITIVE")
    // Check if the tag for the current function exists
    if(!state.modelConfig[options.featureKey]) {
        return finalCb();
    }

    // Check if we have a value
    if(typeof state.data === "undefined") {
        return finalCb();
    }

    // Check for a primitive handler
    if(!options.primitiveHandler) {
        return finalCb();
    }

    return options.primitiveHandler(state, finalCb);
}


module.exports = {
    crawl : crawl
};
