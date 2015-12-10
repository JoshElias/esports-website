module.exports = function(OverwatchAbility) {
    var utils = require("../../lib/utils");


    var foreignKeys = ["heroId"];
    OverwatchAbility.observe("persist", utils.convertObjectIds(foreignKeys));
};
