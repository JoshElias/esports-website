module.exports = function(OverwatchAbility) {
  var utils = require("../../lib/utils");

  var foreignKeys = ["heroId"];
  OverwatchAbility.observe("persist", function(ctx, next) {

    utils.convertObjectIds(foreignKeys, ctx.data);
    next();
  });
};
