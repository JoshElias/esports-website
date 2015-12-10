module.exports = function(Activity) {
  var utils = require("../../lib/utils");

  var foreignKeys = ["authorId", "articleId",  "deckId", "snapshotId", "forumPostId"];
  Activity.observe("persist", utils.convertObjectIds(foreignKeys));
};
