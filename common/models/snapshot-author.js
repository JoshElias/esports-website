module.exports = function(SnapshotAuthor) {
    var utils = require("../../lib/utils");


    var foreignKeys = ["snapshotId", "authorId"];
    SnapshotAuthor.observe("persist", utils.convertObjectIds(foreignKeys));
};
