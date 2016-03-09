var async = require("async");
var predicates = require("./predicates");
var requestCrawler = require("../request-crawler");


var FILTER_FEATURE_KEY = "$filter";



function filter(ctx, modelInstance, finalCb) {

    var filterOptions = {
        featureKey: FILTER_FEATURE_KEY
    };
    filterOptions.objectHandler = filterField;
    filterOptions.arrayHandler = filterField;
    filterOptions.primitiveHandler = filterField;

    return requestCrawler.crawl(ctx, filterOptions, finalCb);
}


function filterField(state, finalCb) {

    var filters = state.modelProperties[FILTER_FEATURE_KEY];
    if(Array.isArray(filters)) {
        return async.eachSeries(filters, applyFilter, finalCb);
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
        if (!state.active || !state.active.accessToken) {
            return removeField(state, filterCb);
        }

        // Check for user roles
        var userId          =   state.active.accessToken.userId.toString();
        var acceptedRoles   =   filter.acceptedRoles || [];
        var instanceId      =   state.requestData.id;
        var User            =   state.models.user;

        return User.isInRoles(userId,
            acceptedRoles,
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
    filter: filter
};