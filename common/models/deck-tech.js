module.exports = function(DeckTech) {
  var utils = require("../../lib/utils");

  var foreignKeys = ["deckId", "deckTierId"];
  DeckTech.observe("persist", function(ctx, next) {

    utils.convertObjectIds(foreignKeys, ctx);
    next();
  });

  DeckTech.observe('before delete', function(ctx, next) {
    var relationsToDestroy = ["cardTech"];
    utils.destroyRelations(ctx, relationsToDestroy, next);
  });
};
