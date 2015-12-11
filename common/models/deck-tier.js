module.exports = function(DeckTier) {
    var utils = require("../../lib/utils");


    var foreignKeys = ["deckId", "snapshotId"];
    DeckTier.observe("persist", utils.convertObjectIds(foreignKeys));
};
