var DEFAULT_MAX_LIMIT = 100;
var ADMIN_MAX_LIMIT = 1000;


function addMaxScope(models) {
    return function(ctx, unused, finalCb) {

        // If the user is not logged in, apply default limit
        if(!ctx.req || !ctx.req.accessToken) {
            applyLimit(ctx, DEFAULT_MAX_LIMIT);
            return finalCb();
        }

        // Check if this user is an admin
        var User = models.user;

        User.isInRoles(ctx.req.accessToken.userId.toString(), ["$admin"], ctx.req, function (err, isInRoles) {
            if (err) return finalCb(err);
            else if (isInRoles.none) applyLimit(ctx, DEFAULT_MAX_LIMIT);
            else applyLimit(ctx, ADMIN_MAX_LIMIT);
            return finalCb();
        });
    }
}

function applyLimit(ctx, limit) {

    // Ensure we have a filter object at all
    if(typeof ctx.args !== "object") {
        ctx.args = {};
    }

    // The structure could either be a stringified "where":{} or "filter":{}
    // Parse the "filter/where" and store as an obj so that we can edit it
    // Normalize the filter so that we always have "where" within the "filter"
    var filter = {};
    if(typeof ctx.args.filter === "string") {
        filter = JSON.parse(ctx.args.filter);
    } else if(typeof ctx.args.where === "string") {

        // Extract the where obj
        var whereObj = JSON.parse(ctx.args.where);
        delete ctx.args.where;

        // Reconstruct within filter
        filter.where = whereObj
    }

    // If the number doesn't exist or is less than 1, set it to MAX_LIMIT
    if(typeof filter.limit !== "number" || filter.limit < 1) {
        filter.limit = limit;
    }

    // Keep the limit from exceeding
    filter.limit = Math.min(filter.limit, limit);

    // Re-stringify the query
    ctx.args.filter = JSON.stringify(filter);
}


module.exports = {
    addMaxScope: addMaxScope
}