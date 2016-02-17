
var MAX_LIMIT = 100;


function addMaxScope( ctx, unused, finalCb) {
    if(typeof ctx.req.query !== "object") {
        ctx.req.query = {};
    }

    if(typeof ctx.req.query.limit !== "number") {
        ctx.req.query.limit = MAX_LIMIT;
    }

    ctx.req.query.limit = Math.min(ctx.req.query.limit, MAX_LIMIT);

    finalCb();
}

module.exports = {
    addMaxScope: addMaxScope
}