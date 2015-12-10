module.exports = function(DeckTech) {
    var utils = require("../../lib/utils");


    var childrenNames = ["cardTech"];
    DeckTech.observe("after save", utils.saveChildren(childrenNames));


    var foreignKeys = ["deckId", "deckTierId"];
    DeckTech.observe("persist", utils.convertObjectIds(foreignKeys));


    var relationsToDestroy = ["cardTech"];
    DeckTech.observe('before delete', utils.destroyRelations(relationsToDestroy));
};
