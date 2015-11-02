module.exports = function(ForumPost) {
    var utils = require("../../lib/utils");

    var foreignKeys = ["forumThreadId", "authorId"];
    ForumPost.observe("persist", function(ctx, next) {

        utils.convertObjectIds(foreignKeys, ctx.data);
        next();
    });
};
