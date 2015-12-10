module.exports = function(DeckTier) {
    var utils = require("../../lib/utils");


    var childrenNames = ["deckTech"];
    DeckTier.observe("after save", utils.saveChildren(childrenNames));


    var foreignKeys = ["deckId", "snapshotId"];
    DeckTier.observe("persist", utils.convertObjectIds(foreignKeys));


    var relationsToDestroy = ["deckTech"];
    DeckTier.observe('before delete', utils.destroyRelations(relationsToDestroy));
};
