module.exports = function(SnapshotAuthor) {
  var utils = require("../../lib/utils");

  var foreignKeys = ["snapshotId", "userId"];
  SnapshotAuthor.observe("persist", function(ctx, next) {

    utils.convertObjectIds(foreignKeys, ctx.data);
    next();
  });
};
