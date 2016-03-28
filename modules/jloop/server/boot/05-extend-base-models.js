var async = require("async");
var loopback = require("loopback");
var _ = require("underscore");
var validator = require("../lib/validator/validator");
var docFilter = require("../lib/filter/doc-filter");
var fieldFilter = require("../lib/filter/field-filter");
var scope = require("../lib/scope");
var relation = require("../lib/relation/relation");
var slug = require("../lib/slug/slug");



module.exports = function(server) {

    var cleanModels = {};
    for(var key in server.models) {
        var lowerKey = key.toLowerCase();
        if(!cleanModels[lowerKey])
            cleanModels[lowerKey] = server.models[key];
    }


    for(var key in cleanModels) {
        var model = cleanModels[key];

        model.beforeRemote('**', function(ctx, modelInstance, next) {

            // Set loopback Context
            loopback.getCurrentContext().set('req', ctx.req);
            next();
        });


        // Validation
        model.observe("before save", function(ctx, next) {
            attachLoopbackContext(ctx);
            return validator.validate(ctx, next);
        });


        // Slug
        model.observe("after save", function(ctx, next) {
            attachLoopbackContext(ctx);
            return slug.handleSlug(ctx, next);
        });


        // Scope
        model.beforeRemote("find", function(ctx, unused, next) {
            attachLoopbackContext(ctx);
            scope.addMaxScope(server.models)(ctx, unused, next);
        });


        // Relations
        model.observe('before delete', function(ctx, next) {
            attachLoopbackContext(ctx);
            relation.destroyChildren(ctx, next);
        });


        // Filtering
        var afterRemoteFuncs = [docFilter.filterDocs, fieldFilter.filterFields];
        model.afterRemote("**", function (ctx, modelInstance, next) {
            attachLoopbackContext(ctx);
            async.eachSeries(afterRemoteFuncs, function(afterRemoteFunc, remoteCb) {
                afterRemoteFunc(ctx, modelInstance, remoteCb);
            }, next);
        });
    }

    function attachLoopbackContext(ctx) {
        var loopbackContext = loopback.getCurrentContext();
        if (loopbackContext && !ctx.req) {
            ctx.req = loopback.getCurrentContext().get("req");
        }
    }
};
