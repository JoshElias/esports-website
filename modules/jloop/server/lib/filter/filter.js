var async = require("async");
var predicates = require("./predicates");
var loopback = require("loopback");
var requestCrawler = require("../request-crawler");

var FILTER_FEATURE_KEY = "$filter";


function filter(ctx, finalCb) {

    console.log("AIDS", loopback.getCurrentContext());

    var filterOptions = {
        featureKey: FILTER_FEATURE_KEY
    };
    filterOptions.primitiveHandler = primitiveHandler;

    return requestCrawler.crawl(ctx, filterOptions, finalCb);
}


function primitiveHandler(state, finalCb) {

    return filterField(state, finalCb);
}



function filterField(state, finalCb) {

    var filters = state.modelConfig[FILTER_FEATURE_KEY];
    if(Array.isArray(filters)) {
        return async.eachSeries(filters, applyFilter, finalCb);
    } else {
        return applyFilter(filters, finalCb);
    }

    function applyFilter(filter, filterCb) {

        // Handle predicate
        var predicate = predicates[filter.predicate];
        if(!predicate) {
            return removeField(state, filterCb);
        }
        if (predicate(state.requestData)) {
            return filterCb();
        }

        // Do we have an active accessToken
        var loopbackContext = loopback.getCurrentContext();
        console.log("loopback context", loopbackContext);
        if (!loopbackContext || typeof loopbackContext.active !== "object" || Object.keys(loopbackContext.active).length < 1) {
            console.log("rip")
            return removeField(state, filterCb);
        }

        if (!loopbackContext.active.http.req || !loopbackContext.active.http.req.accessToken) {
            console.log("rip 2", loopbackContext.active.http.req.accessToken);
            return removeField(state, filterCb);
        }

        // Get userId
        var userId = loopbackContext.active.http.req.accessToken.userId.toString();
console.log("found userId");
        // Get accepted roles
        var acceptedRoles = filter.acceptedRoles || [];

        // Get instance id if possible
        var instanceId = state.requestData.id;

        console.log("looking for roles with Id", userId);

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
                delete state.parentData[state.key];
            }
        }

        return removeCb();
    }
}


module.exports = {
    filter: filter
};