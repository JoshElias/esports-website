module.exports = function(Mulligan) {
    var utils = require("../../lib/utils");


    var childrenNames = ["mulligansWithCoin", "mulligansWithoutCoin"];
    Mulligan.observe("after save", utils.saveChildren(childrenNames));


    var foreignKeys = ["deckId"];
    Mulligan.observe("persist", utils.convertObjectIds(foreignKeys));


    var relationsToDestroy = ["mulligansWithCoin", "mulligansWithoutCoin"];
    Mulligan.observe('before delete', utils.destroyRelations(relationsToDestroy));
};
