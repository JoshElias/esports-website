module.exports = function(Mulligan) {
    var utils = require("../../lib/utils");


    var foreignKeys = ["deckId"];
    Mulligan.observe("persist", utils.convertObjectIds(foreignKeys));
};
