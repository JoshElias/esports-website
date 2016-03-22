var loopback = require("loopback");
var async = require("async");
var _ = require("underscore");
var docFilter =  require("./doc-filter");
var fieldFilter =  require("./field-filter");


module.exports = function(Model) {

    // Ensure the request object on every type of hook
    Model.beforeRemote('**', function(ctx, modelInstance, next) {

        // Set loopback Context
        loopback.getCurrentContext().set('req', ctx.req);
        next();
    });

    function attachLoopbackContext(ctx) {
        var loopbackContext = loopback.getCurrentContext();
        if (loopbackContext && !ctx.req) {
            ctx.req = loopback.getCurrentContext().get("req");
        }
    }


    // Run the filter middleware on after every remote request
    var filterFuncs = [docFilter(Model), fieldFilter];
    Model.afterRemote("**", function (ctx, modelInstance, next) {
        attachLoopbackContext(ctx);
        async.eachSeries(filterFuncs, function(filterFunc, filterCb) {
            filterFunc(ctx, modelInstance, filterCb);
        }, next);
    });
};
