module.exports = function(DeckMatchup) {
  var utils = require("../../lib/utils");

  var foreignKeys = ["forDeckId", "againstDeckId", "snapshotId"];
  DeckMatchup.observe("persist", function(ctx, next) {

    utils.convertObjectIds(foreignKeys, ctx);
    next();
  });
};
