module.exports = function(DeckCard) {
  var utils = require("../../lib/utils");

  var foreignKeys = ["cardId", "deckId"];
  DeckCard.observe("persist", function(ctx, next) {

    utils.convertObjectIds(foreignKeys, ctx.data);
    next();
  });
};
