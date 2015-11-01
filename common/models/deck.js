module.exports = function(Deck) {
    var utils = require("../../lib/utils");


    Deck.observe("before save", function(ctx, next) {
        utils.validateYoutubeId(ctx.data, next);
    });
};
