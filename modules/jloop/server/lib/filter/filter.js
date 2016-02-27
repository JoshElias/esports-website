var async = require("async");
var predicates = require("./predicates");
var requestCrawler = require("../request-crawler");

function filter(ctx, finalCb) {

    var filterOptions = {
        optionKey: "$filter"
    };
    filterOptions.primitiveHandler = primitiveHandler;

    return requestCrawler.crawl(ctx, filterOptions, finalCb);
}

function primitiveHandler(state, finalCb) {

    return filterField(state, finalCb);
}


function filterField(state, finalCb) {

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


            if (!predicate(state.ctx.instance || state.ctx.data)) {
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


        if (state.data) {
            delete state.ctx.data[state.propertyName];
        } else if(state.instance) {
            state.ctx.instance.unsetAttribute(state.propertyName);
        }

        return removeCb();
    }

    function deleteField(data, value) {

        // Determine type of container and remove the value
        if(Array.isArray(data)) {
            var index = data.indexOf(value);
            if (index > -1) {
                data.splice(index, 1);
            }
        } else if(typeof data === "object") {
            if(data[key]) {
                delete data[key];
            }
        }
    }

    function unsetField(instance) {

        // Unset the root parent

    }
}