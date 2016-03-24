var loopback = require("loopback");
var async = require("async");
var _ = require("underscore");
var docFilter =  require("./doc-filter");
var fieldFilter =  require("./field-filter");
var reqCache = require("../../lib/req-cache");


module.exports = function(Model, mixinOptions) {

    // Ensure the request object on every type of hook
    Model.beforeRemote('**', function(ctx, modelInstance, next) {
        reqCache.setRequest(ctx);
        next();
    });


    // Make sure that we include the necessary predicate fields to the query
    Model.observe("access", function(ctx, next) {
        ctx.req = reqCache.getRequest();
        async.series([
            docFilter.addPredicateFields(mixinOptions, ctx)
        ], next);
    });


    // Do not filter count query
    Model.afterRemote("count", function (ctx, modelInstance, next) {
        ctx.method.skipFilter = true;
        return next();
    });


    // Run the filter middleware on after every remote request
    Model.afterRemote("**", function (ctx, modelInstance, next) {
        async.series([
            docFilter.filter(Model, mixinOptions, ctx, modelInstance),
            fieldFilter.filter(Model, mixinOptions, ctx, modelInstance),
            docFilter.cleanPredicateFields(ctx, modelInstance)
        ], next);
    });
};
