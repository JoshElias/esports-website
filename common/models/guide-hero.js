module.exports = function(GuideHero) {
    var utils = require("../../lib/utils");


    var childrenNames = ["guideTalents"];
    GuideHero.observe("after save", utils.saveChildren(childrenNames));


    var relationsToDestroy = ["guideTalents"];
    GuideHero.observe('before delete', utils.destroyRelations(relationsToDestroy));
}