module.exports = function(Snapshot) {
  var loopback = require("loopback");
  var async = require("async");
  var utils = require("../../lib/utils");


  Snapshot.observe("after save", function(ctx, next) {
    var childrenNames = ["deckTiers"];
    utils.saveChildren(ctx, childrenNames, next);
  });


  Snapshot.observe('before delete', function(ctx, next) {
    var relationsToDestroy = ["deckMatchups", "comments", "deckTiers", "authors"];
    utils.destroyRelations(ctx, relationsToDestroy, next);
  });
};
