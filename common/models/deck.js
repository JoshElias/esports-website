module.exports = function(Deck) {
  var utils = require("../../lib/utils");

  var foreignKeys = ["authorId"];
  Deck.observe("persist", function(ctx, next) {

    utils.convertObjectIds(foreignKeys, ctx);
    utils.validateYoutubeId(ctx, next);
  });
};
