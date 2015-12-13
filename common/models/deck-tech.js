module.exports = function(DeckTech) {
    var utils = require("../../lib/utils");


    var foreignKeys = ["deckId", "deckTierId"];
    DeckTech.observe("persist", utils.convertObjectIds(foreignKeys));
};
