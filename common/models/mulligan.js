module.exports = function(Mulligan) {
  var utils = require("../../lib/utils");

  var foreignKeys = ["deckId"];
  Mulligan.observe("persist", function(ctx, next) {

    utils.convertObjectIds(foreignKeys, ctx);
    next();
  });


    Mulligan.observe("after save", function(ctx, next) {
        var childrenNames = ["cardsWithCoin", "cardsWithoutCoin"];
        utils.saveChildren(ctx, childrenNames, next);
    });


  Mulligan.observe('before delete', function(ctx, next) {
    var relationsToDestroy = ["cardsWithCoin", "cardsWithoutCoin"];
    utils.destroyRelations(ctx, relationsToDestroy, next);
  });
};
