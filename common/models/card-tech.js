module.exports = function(CardTech) {
  var utils = require("../../lib/utils");

  var foreignKeys = ["cardId", "deckTechId"];
  CardTech.observe("persist", utils.convertObjectIds(foreignKeys));
};
