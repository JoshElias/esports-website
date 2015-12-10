module.exports = function(ForumCategory) {
    var utils = require("../../lib/utils");


    var relationsToDestroy = ["forumThreads"];
    ForumCategory.observe('before delete', utils.destroyRelations(relationsToDestroy));


    var childrenNames = ["forumThreads"];
    ForumCategory.observe("after save", utils.saveChildren(childrenNames));
};
