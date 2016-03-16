var requestCrawler = require("./request-crawler");
var app = require("../../../../server/server");


var SLUG_GENERATE_FEATURE_KEY = "$slug";


function handleSlug(ctx, finalCb) {

    var filterOptions = {
        featureKey: SLUG_GENERATE_FEATURE_KEY
    };
    filterOptions.primitiveHandler = primitiveHandler;

    return requestCrawler.crawl(ctx, filterOptions, finalCb);
}


function primitiveHandler(state, finalCb) {

    // Get any slug options from the client
    var slugOptions = {};
    if(state.ctx.req && state.ctx.req.body && typeof state.ctx.req.body.slugOptions === "object") {
        slugOptions = state.ctx.req.body.slugOptions;
    }

    console.log("requestData", state.requestData);
    console.log("slug value", state.data);
    return finalCb();

    // Try to get the slug
}







module.exports = {
    handleSlug: handleSlug
};