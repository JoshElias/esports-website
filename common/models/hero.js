module.exports = function(Hero) {
    var utils = require("../../lib/utils");


    var childrenNames = ["abilities"];
    Hero.observe("after save", utils.saveChildren(childrenNames));


    var relationsToDestroy = ["talents", "abilities"];
    Hero.observe('before delete', utils.destroyRelations(relationsToDestroy));
}
