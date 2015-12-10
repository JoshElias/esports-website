module.exports = function(ForumPost) {
    var utils = require("../../lib/utils");


    var childrenNames = ["forumThread"];
    ForumPost.observe("after save", utils.saveChildren(childrenNames));


    var foreignKeys = ["forumThreadId", "authorId"];
    ForumPost.observe("persist", utils.convertObjectIds(foreignKeys));


    var relationsToDestroy = ["comments"];
    ForumPost.observe('before delete',  utils.destroyRelations(relationsToDestroy));
};
