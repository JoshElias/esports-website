var loopback = require("loopback");
var async = require("async");
var _ = require("underscore");
var predicates = require("./predicates");
var app = require("../../../../../server/server");


var FILTER_FEATURE_KEY = "$docFilter";


function filterDocs(ctx, modelInstance, finalCb) {


    // Attach the active model
    var modelName = ctx.methodString.split(".")[0];
    ctx.Model = app.models[modelName];

    // Attach active ctx if able
    var loopbackContext = loopback.getCurrentContext();
    if(loopbackContext && typeof loopbackContext.active === "object") {
        var active = {};
        _.extendOwn(active, loopbackContext.active);
        ctx.active = active;
    }

    // Check for the feature key in the model's settings
    var filterOptions = ctx.Model.definition.settings[FILTER_FEATURE_KEY];
    if (typeof filterOptions !== "object") {
        return finalCb();
    }

    // Check if we have any data to filter
    if (!ctx.result) {
        return finalCb();
    }

    // Handle arrays of results
    if (Array.isArray(modelInstance)) {
        return filterResults(ctx, filterOptions, finalCb);
        // Handle a single result
    } else {
        return filterResult(ctx, filterOptions, finalCb);
    }
}

function filterResults(ctx, filterOptions, finalCb) {
    var answer = [];

    async.eachSeries(ctx.result, function(result, resultCb) {

        // Handle predicate
        var predicate = predicates[filterOptions.predicate];
        if (typeof predicate === "function" && !predicate(result)) {
            answer.push(result);
            return resultCb();
        }

        // Check for userId
        var userId;
        if(!ctx.active || !ctx.active.accessToken || !ctx.active.accessToken.userId) {
            console.log("RIP");
            return done(undefined, ctx, answer, finalCb);
        }
        userId = ctx.active.accessToken.userId;
        console.log("found user id WOOO HOOOO", userId);
        console.log("result id", result.id);
        console.log("modelClass", ctx.Model.definition.name);;
        var User = app.models.user;
        return User.isInRoles(userId,
            ["$owner"],
            {modelClass: ctx.Model.definition.name, modelId: result.id},
            function (err, isInRoles) {
                if(err) return resultCb(err);
                if(!isInRoles.none) {
                    answer.push(result);
                }
                return resultCb();
            }
        );
    }, function(err) {
        return done(err, ctx, answer, finalCb);
    });
}

function filterResult(ctx, filterOptions, finalCb) {
    console.log("RESULT", ctx.result);
    var answer = {};

    // Handle predicate
    var predicate = predicates[filterOptions.predicate];
    if (typeof predicate === "function" && !predicate(ctx.result)) {
        answer = ctx.result;
        return done(undefined, ctx, answer, finalCb);
    }

    // Check for userId
    var userId;
    if(!ctx.active || !ctx.active.accessToken || !ctx.active.accessToken.userId) {
        return done(undefined, ctx, answer, finalCb);
    }
    userId = ctx.active.accessToken.userId;
    console.log("found user id WOOO HOOOO", userId);
    console.log("result id", ctx.result.id);
    console.log("modelClass", ctx.Model.definition.name);;

    var User = app.models.user;
    return User.isInRoles(userId,
        ["$owner"],
        {modelClass: ctx.Model.definition.name, modelId: ctx.result.id},
        function (err, isInRoles) {
            if(err) return finalCb(err);
            else if(isInRoles.none) {
                var noModelErr = new Error('unable to find model');
                noModelErr.statusCode = 404;
                noModelErr.code = 'MODEL_NOT_FOUND';
                return done(noModelErr)
            }

            answer = ctx.result;

            return done(undefined, ctx, answer, finalCb);
        }
    );

}

function done(err, ctx, answer, finalCb) {
    if(err) return finalCb(err);

    ctx.result = answer;
    return finalCb();
}



module.exports = {
    filterDocs: filterDocs
};