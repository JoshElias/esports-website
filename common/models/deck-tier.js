module.exports = function(DeckTier) {
  var utils = require("../../lib/utils");


    DeckTier.observe("after save", function(ctx, next) {
        var childrenNames = ["deckTech"];
        utils.saveChildren(ctx, childrenNames, next);
    });

  var foreignKeys = ["deckId", "snapshotId"];
  DeckTier.observe("persist", function(ctx, next) {

    utils.convertObjectIds(foreignKeys, ctx);
    next();
  });

  DeckTier.observe('before delete', function(ctx, next) {
    var relationsToDestroy = ["deckTech"];
    utils.destroyRelations(ctx, relationsToDestroy, next);
  });
};
