module.exports = function(Snapshot) {
  var loopback = require("loopback");
  var async = require("async");

  Snapshot.observe("after save", function(ctx, next) {
    var childrenNames = ["deckTiers"];
    saveChildren(ctx, childrenNames, next);
  });

  function saveChildren(ctx, childrenNames, next) {
    console.log("ctx keys:", Object.keys(ctx));
    console.log("data:", ctx.data);
    console.log("currentInstance:", ctx.currentInstance);
    console.log("hookState", ctx.hookState);
    if(!ctx.isNewInstance) {
      return next();
    }

    var loopbackContext = loopback.getCurrentContext();
    var req = loopbackContext.active.http.req;
    var body = req.body;

    ctx.Model.findById(ctx.instance.id.toString(), function(err, instance) {
      if(err) return next(err);
      else if(!instance) {
        console.log("no instance in a new instance? wtf...");
        return next();
      }

      console.log("instance:", instance);

      async.each(childrenNames, function(childName, childNameCb) {
        var childModel = instance[childName];
        if(!childModel) {
          console.log("PUSSIED OUT:", childName);
          return childNameCb();
        }
        console.log("bodu:", body[childName]);
        async.each(body[childName], function(child, childCb) {
          console.log("child:", child);
          childModel.create(child, function(err, childInstance) {
            if(!err) console.log("created child:", childInstance);
            childCb(err);
          });
        }, childNameCb)
      }, function(err) {
        next(err);
      });
    });
  }

  Snapshot.observe('before delete', function(ctx, next) {
    var relationsToDestroy = ["deckMatchups", "comments", "deckTiers", "authors"];
    utils.destroyRelations(ctx, relationsToDestroy, next);
  });

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
            "title": "booty",
            "orderNum": 31,
            "deckId": "booooooty",
            "cardTech": [
              {
                "orderNum": 0,
                "both": false,
                "toss": false,
                "cardId": "booooty"
              }
            ]
          }
        ]
      }
    ]
  }
};
