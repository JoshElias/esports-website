module.exports = function(SnapshotAuthor) {
  var utils = require("../../lib/utils");

  var foreignKeys = ["snapshotId", "authorId"];
  SnapshotAuthor.observe("persist", function(ctx, next) {

    utils.convertObjectIds(foreignKeys, ctx.data);
    next();
  });
};
