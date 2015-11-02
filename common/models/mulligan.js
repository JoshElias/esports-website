module.exports = function(Mulligan) {
  var utils = require("../../lib/utils");

  var foreignKeys = ["deckId"];
  Mulligan.observe("persist", function(ctx, next) {

    utils.convertObjectIds(foreignKeys, ctx);
    next();
  });
};
