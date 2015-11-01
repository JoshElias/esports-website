module.exports = function(Guide) {
    var utils = require("../../lib/utils");


    Guide.observe("before save", function(ctx, next) {
        utils.validateYoutubeId(ctx.data, next);
    });
};