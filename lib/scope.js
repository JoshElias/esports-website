
var MAX_LIMIT = 100;


function addMaxScope(ctx, unused, finalCb) {

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
        filter.limit = MAX_LIMIT;
    }

    // Keep the limit from exceeding
    filter.limit = Math.min(filter.limit, MAX_LIMIT);

    // Re-stringify the query
    ctx.args.filter = JSON.stringify(filter);

    finalCb();
}

module.exports = {
    addMaxScope: addMaxScope
}