module.exports = function(DeckTier) {
  var utils = require("../../lib/utils");

  var foreignKeys = ["deckId", "snapshotId"];
  DeckTier.observe("persist", function(ctx, next) {

    utils.convertObjectIds(foreignKeys, ctx.data);
    next();
  });
};
