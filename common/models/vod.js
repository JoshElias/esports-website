module.exports = function(Vod) {
    var utils = require("../../lib/utils");

    Vod.observe("before save", utils.validateYoutubeId);
};
