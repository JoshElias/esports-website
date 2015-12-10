module.exports = function(Guide) {
    var utils = require("../../lib/utils");


    var foreignKeys = ["authorId"];
    Guide.observe("persist", utils.convertObjectIds(foreignKeys));


    Guide.observe("before save", utils.validateYoutubeId);


    var filter = {
        fieldNames: ["allowComments", "description", "chapters",
            "oldCards", "oldComments", "oldMulligans", "content"],
        acceptedRoles: ["$owner", "$admin", "$premium", "$contentProvider"]
    };
    Guide.observe("loaded", utils.filterFields(filter));


    var childrenNames = ["guideHeroes"];
    Guide.observe("after save", utils.saveChildren(childrenNames));


    var relationsToDestroy = ["comments", "maps", "guideHeroes", "guideTalents"];
    Guide.observe('before delete', utils.destroyRelations(relationsToDestroy));
};
