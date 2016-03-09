var async = require("async");
var loopback = require("loopback");
var util = require("util");
var app = require("../../../../server/server");


function crawl(ctx, options, finalCb) {
    console.log(1)
    // Get the model properties
    var definition;
    if(ctx.Model) {
        console.log("ctx fields", Object.keys(ctx.Model));
        definition = ctx.Model.definition;
    } else {
        var modelName = ctx.methodString.split(".")[0];
        var model = app.models[modelName];
        definition = model.definition;
    }
    console.log(2)
    console.log("definition.setting", definition.settings);
    // Check for the feature key before we continue
    if(!definition.settings[options.featureKey]) {
        return finalCb();
    }
    console.log(3)
    // Keep a reference to each possible state of the model's config, client data and the reportObj
    var parentState = {
        ctx: ctx,
        rootKey: "",
        propertyName: "",
        modelSettings: definition.settings,
        modelProperties: definition.rawProperties,
        modelName: definition.name,
        currentInstance: ctx.currentInstance,
        models: app.models
    };
    console.log(4)
    // Append the active context if possible
    var loopbackContext = loopback.getCurrentContext();
    if (loopbackContext
        || typeof loopbackContext.active === "object"
        || loopbackContext.active) {
        parentState.active = loopbackContext.active;
    }
    console.log(5)
    // Get the data depending on the type of request made by the user
    if(ctx.data) {
        parentState.requestData = parentState.data = ctx.data;
    } else if(ctx.instance) {
        parentState.requestData = parentState.data = ctx.instance["__data"];
    } else if(ctx.result) {
        parentState.requestData = parentState.data = ctx.result;
    }
    console.log(6)
    // Attach ctx specific vars to state obj
    if(options && typeof options.stateVars === "object") {
        for(var key in options.stateVars) {
            parentState[key] = options.stateVars[key];
        }
    }
console.log(7)
    // If the client data came together in an array
    if(Array.isArray(parentState.requestData)) {
        return async.each(parentState.requestData, function(data, eachCb) {
            parentState.requestData = parentState.data = data;
            return crawlContainer("object", parentState, options, eachCb);
        }, doneCrawling);

    // Or a single object
    } else {
        return crawlContainer("object", parentState, options, doneCrawling);
    }

    function doneCrawling(err, state) {
        //console.log("done crawling report", state.report);
        if(err) return finalCb(err);
        else if(!options.postHandler) return finalCb();
        else return options.postHandler(state, finalCb);
    }
}


function buildNextState(value, key, oldState, options) {
console.log("building next state");
    // Populate the next level of the validation state
    var newState                =   {};
    newState.parent             =   oldState;
    newState.ctx                =   oldState.ctx;
    newState.key                =   key;
    newState.modelSettings      =   oldState.modelSettings;
    newState.modelProperties    =   oldState.modelProperties[key];
    newState.modelName          =   oldState.modelName;
    newState.requestData        =   oldState.requestData;
    newState.models             =   oldState.models;
    newState.active             =   oldState.active;

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
    if(!options.newStateHandler) {
        return newState;
    }

    options.newStateHandler(oldState, newState);
    return newState;
}


function crawlContainer(type, state, options, finalCb) {
    console.log("crawling container")
    async.series([

        // Check if we should call the object hook
        function(seriesCb) {
            var handlerName = type+"Handler";
            if(state.modelProperties[options.featureKey] && options[handlerName]) {
                return options.objectHandler(state, seriesCb);
            }
            return seriesCb();
        },

        // Crawl the container
        function(seriesCb) {

            return async.forEachOf(state.modelProperties, function(value, key, eachCb) {

                // Update the validation state with this level of object
                var newState = buildNextState(value, key, state, options);

                // Return if no data to validate
                if(newState.data === null || newState.data === undefined) {
                    return eachCb();
                }

                // Determine type of value
                var type = newState.modelProperties["type"];
                if(Array.isArray(newState.modelProperties) || Array.isArray(type)) {

                    return crawlContainer("array", newState, options, eachCb);

                } else if(typeof newState.modelProperties === "object") {

                    // Is there a type defined?
                    if(typeof type === "string" && (type === "string" || type === "number" || type === "boolean")) {
                        return crawlPrimitive(newState, options, eachCb);
                    } else if(typeof type === "function") {
                        return crawlPrimitive(newState, options, eachCb);
                    }
                    else {
                        return crawlContainer("object", newState, options, eachCb);
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


function crawlPrimitive(state, options, finalCb) {
console.log("crawling primitive");
    // Check if the tag for the current function exists
    if(!state.modelProperties[options.featureKey]) {
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
