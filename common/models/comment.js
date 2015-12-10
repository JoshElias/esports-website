module.exports = function(Comment) {
  var utils = require("../../lib/utils");

  var foreignKeys = ["authorId", "articleId", "guideId", "deckId", "snapshotId", "forumPostId", "parentCommentId"];
  Comment.observe("persist", function(ctx, next) {
    utils.convertObjectIds(foreignKeys, ctx);
    next();
  });
};
