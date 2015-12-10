module.exports = function(GuideHero) {

    var childrenNames = ["guideTalents"];
    GuideHero.observe("after save", utils.saveChildren(childrenNames));


    var relationsToDestroy = ["guideTalents"];
    GuideHero.observe('before delete', utils.destroyRelations(relationsToDestroy));
}