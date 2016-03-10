var async = require("async");
var loopback = require("loopback");
var _ = require("underscore");
var validator = require("../lib/validator/validator");
var docFilter = require("../lib/filter/doc-filter");
var fieldFilter = require("../lib/filter/field-filter");
var scope = require("../lib/scope");
var relation = require("../lib/relation");


module.exports = function(server) {

    var cleanModels = {};
    for(var key in server.models) {
        var lowerKey = key.toLowerCase();
        if(!cleanModels[lowerKey])
            cleanModels[lowerKey] = server.models[key];
    }


    for(var key in cleanModels) {
        var model = cleanModels[key];


        // Filtering
        var filterFuncs = [docFilter.filterDocs, fieldFilter.filterFields];
        model.afterRemote("**", function (ctx, modelInstance, next) {

            attachLoopbackContext(ctx);
            async.eachSeries(filterFuncs, function(filterFunc, filterCb) {
                filterFunc(ctx, modelInstance, filterCb);
            }, next);
        });


        // Validation
        model.observe("before save", validator.validate);


        // Scope
        model.beforeRemote("find", scope.addMaxScope(server.models));


        // Relations
        model.observe('before delete', relation.destroyChildren);
    }

    function attachLoopbackContext(ctx) {
        var loopbackContext = loopback.getCurrentContext();
        if(loopbackContext && typeof loopbackContext.active === "object") {
            var active = {};
            _.extendOwn(active, loopbackContext.active);
            ctx.active = active;
        }
    }
};
