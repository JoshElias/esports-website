var loopback = require("loopback");
var async = require("async");
var _ = require("underscore");
var predicates = require("./predicates");


var FILTER_FEATURE_KEY = "DocFilter";



module.exports = function filterDocs(Model) {
    return function(ctx, modelInstance, finalCb) {
console.log("FML RIIIGHT?")
        // Get the parent model
        var modelName = ctx.methodString.split(".")[0];

        // See if we're fulfilling a relation request and get the associated model
        var methodArr = ctx.methodString.split("__");
        if (methodArr.length > 1) {
            var relationName = methodArr[methodArr.length - 1];
            modelName = app.models[modelName].settings.relations[relationName].model;
        }

        // Attach the active model
        ctx.Model = Model.app.models[modelName];

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
};

function filterResults(ctx, filterOptions, finalCb) {
    var answer = [];

    async.each(ctx.result, function(result, resultCb) {

        // Handle predicate
        var predicate = predicates[filterOptions.predicate];
        if (typeof predicate === "function" && !predicate(result)) {
            answer.push(result);
            return resultCb();
        }

        // Check for userId
        var userId;
        if(!ctx.req || !ctx.req.accessToken || !ctx.req.accessToken.userId) {
            return resultCb();
        }
        userId = ctx.req.accessToken.userId;

        var User = app.models.user;
        return User.isInRoles(userId,
            filterOptions.acceptedRoles,
            ctx.req,
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
    var answer = {};

    // Handle predicate
    var predicate = predicates[filterOptions.predicate];
    if (typeof predicate === "function" && !predicate(ctx.result)) {
        answer = ctx.result;
        return done(undefined, ctx, answer, finalCb);
    }

    // Check for userId
    var userId;
    if(!ctx.req || !ctx.req.accessToken || !ctx.req.accessToken.userId) {
        return done(undefined, ctx, answer, finalCb);
    }
    userId = ctx.req.accessToken.userId;

    var User = app.models.user;
    return User.isInRoles(userId,
        filterOptions.acceptedRoles,
        ctx.req,
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