var async = require("async");
var predicates = require("./predicates");
var requestCrawler = require("../request-crawler");


var FILTER_FEATURE_KEY = "$fieldFilter";


function filterFields(ctx, modelInstance, finalCb) {

    var filterOptions = {
        featureKey: FILTER_FEATURE_KEY
    };
    filterOptions.objectHandler = filterHandler;
    filterOptions.arrayHandler = filterHandler;
    filterOptions.primitiveHandler = filterHandler;

    return requestCrawler.crawl(ctx, filterOptions, finalCb);
}


function filterHandler(state, finalCb) {

    var filters = state.modelProperties[FILTER_FEATURE_KEY];
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
    filterFields: filterFields
};