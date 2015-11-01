module.exports = function(Vod) {
    var utils = require("../../lib/utils");


    Vod.observe("before save", function(ctx, next) {
        utils.validateYoutubeId(ctx.data, next);
    });
};