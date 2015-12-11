module.exports = function(Snapshot) {
    var utils = require("../../lib/utils");


    var childrenNames = ["deckMatchups", "comments", "deckTiers", "authors"];
    //Snapshot.observe("after save", utils.saveChildren(childrenNames));


    var relationsToDestroy = ["deckMatchups", "comments", "deckTiers", "authors"];
    //Snapshot.observe('before delete', utils.destroyRelations(relationsToDestroy));
};
