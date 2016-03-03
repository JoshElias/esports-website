var async = require("async");
var predicates = require("./predicates");
var requestCrawler = require("../request-crawler");

function filter(ctx, finalCb) {

    var filterOptions = {
        optionKey: "$filter",
        stateVars: {
            propertyContainer: undefined,
            propertyValue: undefined,
            propertyDataPoint: undefined
        }
    };
    filterOptions.primitiveHandler = primitiveHandler;
    filterOptions.newStateHandler = newStateHandler;

    return requestCrawler.crawl(ctx, filterOptions, finalCb);
}

function newStateHandler(oldState, newState) {

    // Check if we need to set the initial value of the property container
    if(newState.instance && typeof oldState.propertyContainer === "undefined") {
        newState.propertyContainer = oldState.ctx.instance;
    } else if(newState.data && typeof oldState.propertyContainer === "undefined") {
        newState.propertyContainer = oldState.ctx.data;

    // If we already had a container, make it so the last value is the new container
    } else if(oldState.propertyContainer !== "undefined") {
        newState.propertyContainer = oldState.propertyDataPoint;
    }


    // Check if we have the property value
    if(newState.instance && typeof oldState.propertyValue === "undefined") {
        oldState.propertyValue = newState.propertyContainer.getAttribute(oldState.propertyName);
    } else if(newState.data && typeof oldState.propertyValue === "undefined") {
        oldState.propertyValue = newState.propertyContainer[oldState.propertyName];
    }
    newState.propertyValue = oldState.propertyValue;


    // Set the new data point
    if(typeof oldState.propertyDataPoint === "undefined") {
        oldState.propertyDataPoint = newState.propertyValue;
    }
    newState.propertyDataPoint = oldState.propertyDataPoint[newState.key];
}

function primitiveHandler(state, finalCb) {

    return filterField(state, finalCb);
}



function filterField(state, finalCb) {
    console.log("filtering fields");

    var filters = state.modelConfig.$filter;
    if(Array.isArray(filters)) {
        async.eachSeries(filters, applyFilter(state), finalCb);
    } else {
        applyFilter(filters, finalCb);
    }

    function applyFilter(state) {
        return function (filter, filterCb) {
            var predicate = predicates[filter.predicate];
            var acceptedRoles = filter.acceptedRoles;


            if (!predicate(state.ctx.data || state.ctx.instance)) {
                return filterCb();
            }

            if (!state.ctx.req || !state.ctx.req.accessToken) {
                return removeField(state, filterCb);
            }

            var userId = state.ctx.req.accessToken.userId.toString();

            // Get instance id if possible
            var instanceId;
            if (state.ctx.data && state.ctx.data.id) {
                instanceId = state.ctx.data.id;
            } else if (state.ctx.instance && state.ctx.instance.id) {
                instanceId = state.instance.data.id;
            }

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
    }

    function removeField(state, removeCb) {
        console.log("remove field");

        if (typeof state.data !== "undefined") {
            deleteField(state.propertyContainer, state.value);
        } else if(typeof state.instance !== "undefined") {
            unsetField(state);
        }

        return removeCb();
    }

    function deleteField(container, value) {
        console.log("deleting field");

        // Determine type of container and remove the value
        if(Array.isArray(container)) {
            var index = container.indexOf(value);
            if (index > -1) {
                container.splice(index, 1);
            }
        } else if(typeof container === "object") {
            if(typeof container[state.key] !== "undefined") {
                delete container[state.key];
            }
        }
    }

    function unsetField(state) {
        console.log("unsetting field");

        // Apply remove the field from
        deleteField(state.propertyContainer, state.value);

        // Save the property
        state.ctx.instance.setAttribute(state.propertyName, state.propertyValue);
    }
}


module.exports = {
    filter: filter
};