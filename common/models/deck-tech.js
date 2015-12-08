module.exports = function(DeckTech) {
  var utils = require("../../lib/utils");


    DeckTech.observe("after save", function(ctx, next) {
        var childrenNames = ["cardTech"];
        utils.saveChildren(ctx, childrenNames, next);
    });


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
