module.exports = function(Snapshot) {
/*
  Snapshot.observe("after save", function(ctx, next) {
    saveChildren(ctx, next);
  });

  function saveChildren(ctx, next) {

  }
*/
  Snapshot.observe('before delete', function(ctx, next) {
    var relationsToDestroy = ["deckMatchups", "comments", "deckTiers", "authors"];
    utils.destroyRelations(ctx, relationsToDestroy, next);
  });

/*
  var sampleSnapshot = {
    "deckTiers": [
      {
        "description": "booty",
        "weeklyNotes": "booty",
        "name": "booty",
        "tier": 0,
        "deckId": "booooooty",
        "deckTech": [
          {

          }
        ]
      }
    ]
  }
  */
};
