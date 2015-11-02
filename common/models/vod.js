module.exports = function(Vod) {
    var utils = require("../../lib/utils");
/*
    Vod.observe("before save", function(ctx, next) {
        utils.validateYoutubeId(ctx, next);
    });
    */

    Vod.validatesFormatOf('youtubeId', {with: utils.youtubeRegex, message: 'Must provide a valid youtubeId'});
};
