var async = require("async");
var predicates = require("./predicates");
var resultCrawler = require("../../lib/result-crawler");
var packageJSON = require("./package");



function filterFields(Model, mixinOptions, ctx, modelInstance) {
    return function(finalCb) {

        // Get the parent model
        var modelName = ctx.methodString.split(".")[0];

        // See if we're fulfilling a relation request and get the associated model
        var methodArr = ctx.methodString.split("__");
        if (methodArr.length > 1) {
            var relationName = methodArr[methodArr.length - 1];
            modelName = Model.app.models[modelName].settings.relations[relationName].model;
        }
        Model = Model.app.models[modelName];

        // Check for the mixin key in the model's settings
        mixinOptions = Model.definition.settings.mixins[packageJSON.mixinName];
        if (typeof mixinOptions !== "object" || !mixinOptions.fieldFilters) {
            return finalCb();
        }

        mixinOptions.mixinName = packageJSON.mixinName;
        mixinOptions.objectHandler = filterHandler;
        mixinOptions.arrayHandler = filterHandler;
        mixinOptions.primitiveHandler = filterHandler;

        return resultCrawler.crawl(Model, mixinOptions, ctx, modelInstance, finalCb);
    }
};


function filterHandler(state, mixinOptions, finalCb) {

    var filters = state.modelProperties[mixinOptions.mixinName];
    if(Array.isArray(filters)) {
        return async.each(filters, applyFilter, finalCb);
    } else {
        return applyFilter(filters, finalCb);
    }

    function applyFilter(filter, filterCb) {

        // Handle predicate
        var predicate = predicates[filter.predicate];
        if (typeof predicate === "function" && !predicate(state.requestData)) {
            return filterCb();
        }

        // Do we have an active accessToken
        if (!state.ctx.req || !state.ctx.req.accessToken) {
            return removeField(state, filterCb);
        }

        // Check for user roles
        var userId          =   state.ctx.req.accessToken.userId.toString();
        var acceptedRoles   =   filter.acceptedRoles || [];
        var instanceId      =   state.requestData.id;
        var User            =   state.models.user;

        return User.isInRoles(userId,
            acceptedRoles,
            state.ctx.req,
            {modelClass: state.modelName, modelId: instanceId},
            function (err, isInRoles) {
                if (err) return filterCb();
                if (isInRoles.none) return removeField(state, filterCb);
                else return filterCb();
            }
        );

    }

    function removeField(state, removeCb) {

        if(Array.isArray(state.parentData)) {
            if (key > -1) {
                state.parentData.splice(state.key, 1);
            }
        } else if(typeof state.parentData === "object") {
            if(typeof state.parentData[state.key] !== "undefined") {
                state.parentData[state.key] = undefined;
            }
        }

        return removeCb();
    }
}


module.exports = {
    filter: filterFields
};