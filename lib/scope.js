
var MAX_LIMIT = 100;


function addMaxScope(ctx, finalCb) {
    if(typeof ctx.query !== "object") {
        ctx.query = {};
    }

    if(typeof ctx.query.limit !== "number") {
        ctx.query.limit = MAX_LIMIT;
    }

    ctx.query.limit = Math.min(ctx.query.limit, MAX_LIMIT);

    finalCb();
}

module.exports = {
    addMaxScope: addMaxScope
}