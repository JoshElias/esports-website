var async = require("async");
var util = require("util");
var loopback = require("loopback");


function crawlResult(Model, mixinOptions, ctx, modelInstance, finalCb) {

    // Keep a reference to each possible state of the model's config, client data and the reportObj
    var parentState = {
        ctx: ctx,
        rootKey: "",
        propertyName: "",
        model: Model,
        modelSettings: Model.definition.settings,
        modelProperties: Model.definition.rawProperties,
        modelName: Model.definition.name,
        currentInstance: ctx.currentInstance,
        models: Model.app.models
    };

    // Attach ctx specific vars to state obj
    if(mixinOptions && typeof mixinOptions.stateVars === "object") {
        for(var key in mixinOptions.stateVars) {
            parentState[key] = mixinOptions.stateVars[key];
        }
    }

    // Process array of results
    if(modelInstance && Array.isArray(modelInstance)) {
        return async.each(ctx.result, function(instance, eachCb) {
            parentState.requestData = parentState.data = instance["__data"];
            return crawlContainer("object", parentState, mixinOptions, eachCb);
        }, doneCrawling);

    // Process Single Results
    } else if(modelInstance) {
        parentState.requestData = parentState.data = ctx.result["__data"];
    } else if(ctx.data) {
        parentState.requestData = parentState.data = ctx.data;
    } else if(ctx.instance) {
        parentState.requestData = parentState.data = ctx.instance["__data"];
    }
    return crawlContainer("object", parentState, mixinOptions, doneCrawling);


    function doneCrawling(err, state) {
        if(err) return finalCb(err);
        else if(!mixinOptions.postHandler) return finalCb();
        else return mixinOptions.postHandler(state, mixinOptions, finalCb);
    }
}


function buildNextState(value, key, oldState, mixinOptions) {

    // Populate the next level of the validation state
    var newState                =   {};
    newState.parent             =   oldState;
    newState.ctx                =   oldState.ctx;
    newState.key                =   key;
    newState.model              =   oldState.model;
    newState.modelSettings      =   oldState.modelSettings;
    newState.modelProperties    =   oldState.modelProperties[key];
    newState.modelName          =   oldState.modelName;
    newState.requestData        =   oldState.requestData;
    newState.models             =   oldState.models;

    // Build new data points for instance and data
    newState.parentData = oldState.data;
    newState.data = (newState.parentData) ? oldState.data[key] : undefined;
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
    if(!mixinOptions.newStateHandler) {
        return newState;
    }

    mixinOptions.newStateHandler(oldState, newState, mixinOptions);
    return newState;
}


function crawlContainer(type, state, mixinOptions, finalCb) {
    async.series([

        // Check if we should call the object hook
        function(seriesCb) {
            var handlerName = type+"Handler";
            if(state.modelProperties[mixinOptions.mixinName] && mixinOptions[handlerName]) {
                return mixinOptions.objectHandler(state, mixinOptions, seriesCb);
            }
            return seriesCb();
        },

        // Crawl the container
        function(seriesCb) {

            return async.forEachOf(state.modelProperties, function(value, key, eachCb) {

                // Update the validation state with this level of object
                var newState = buildNextState(value, key, state, mixinOptions);

                // Return if no data to validate
                if(newState.data === null || newState.data === undefined) {
                    return eachCb();
                }

                // Determine type of value
                var type = newState.modelProperties["type"];
                if(Array.isArray(newState.modelProperties) || Array.isArray(type)) {

                    return crawlContainer("array", newState, mixinOptions, eachCb);

                } else if(typeof newState.modelProperties === "object") {

                    // Is there a type defined?
                    if(typeof type === "string" && (type === "string" || type === "number" || type === "boolean")) {
                        return crawlPrimitive(newState, mixinOptions, eachCb);
                    } else if(typeof type === "function") {
                        return crawlPrimitive(newState, mixinOptions, eachCb);
                    }
                    else {
                        return crawlContainer("object", newState, mixinOptions, eachCb);
                    }
                }

                // Invalid input. Continue
                return eachCb();

            }, seriesCb);
        }

    ], function(err) {
        return finalCb(err, state);
    });
}


function crawlPrimitive(state, mixinOptions, finalCb) {

    // Check if the tag for the current function exists
    if(!state.modelProperties[mixinOptions.mixinName]) {
        return finalCb();
    }

    // Check if we have a value
    if(typeof state.data === "undefined") {
        return finalCb();
    }

    // Check for a primitive handler
    if(!mixinOptions.primitiveHandler) {
        return finalCb();
    }

    return mixinOptions.primitiveHandler(state, mixinOptions, finalCb);
}


module.exports = {
    crawl : crawlResult
};
