module.exports = function(Activity) {
  var utils = require("../../lib/utils");

  var foreignKeys = ["authorId", "articleId",  "deckId", "snapshotId", "forumPostId"];
  Activity.observe("persist", function(ctx, next) {

    utils.convertObjectIds(foreignKeys, ctx.data);
    next();
  });
};
