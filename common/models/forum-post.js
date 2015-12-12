module.exports = function(ForumPost) {
    var utils = require("../../lib/utils");


    var foreignKeys = ["forumThreadId", "authorId"];
    ForumPost.observe("persist", utils.convertObjectIds(foreignKeys));
};
