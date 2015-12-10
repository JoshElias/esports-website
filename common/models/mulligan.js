module.exports = function(Mulligan) {
    var utils = require("../../lib/utils");


    var childrenNames = ["cardsWithCoin", "cardsWithoutCoin"];
    Mulligan.observe("after save", utils.saveChildren(childrenNames));


    var foreignKeys = ["deckId"];
    Mulligan.observe("persist", utils.convertObjectIds(foreignKeys));


    var relationsToDestroy = ["cardsWithCoin", "cardsWithoutCoin"];
    Mulligan.observe('before delete', utils.destroyRelations(relationsToDestroy));
};
