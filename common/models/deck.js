module.exports = function(Deck) {
  var utils = require("../../lib/utils");


  Deck.observe("before save", utils.validateYoutubeId, utils.generateSlug);


  var foreignKeys = ["authorId"];
  Deck.observe("persist", utils.convertObjectIds(foreignKeys));


  var filters =  [
      {
          acceptedRoles: ["$owner", "$admin"],
          predicate: function isPrivate(deck) {
              if(!deck || typeof deck.isPublic === "undefined")
                  return false;
              return !deck.isPublic;
          }
      },
      {
        fieldNames: ["allowComments", "description", "playerClass"],
        acceptedRoles: ["chapters", "oldCards", "oldComments", "oldMulligans"]
      }
  ];
  Deck.observe("loaded", utils.filterFields(filters));





    // Provent these fields from being altered from certain people
    var protectedFields = ["premium"];

    function protectPrivateFields(ctx, finalCb) {
        var Role = Deck.app.models.Role;
        var RoleMapping = Deck.app.models.RoleMapping;
        var User = Deck.app.models.user;

        // sets the private fields to false
        function removeFields() {
            var data = ctx.data || ctx.instance;
            var answer = data;

            protectedFields.forEach(function (privateField) {
                if (typeof answer[privateField] !== "undefined") {
                    answer[privateField] = undefined;
                }
            });
            data = answer;
            return finalCb();
        }

        if(!ctx || !ctx.req || !ctx.req.accessToken)
            return removeFields();

        User.isInRoles(ctx.req.accessToken.userId.toString(), ["$owner", "$admin", "$contentProvider"], function(err, isInRoles) {
            if(err) return finalCb();
            if(isInRoles.none) return removeFields();
            else return finalCb();
        });
    };


  var relationsToDestroy = ["comments", "cards", "matchups", "mulligans"];
  Deck.observe('before delete', function(ctx, next) {


    utils.destroyRelations(ctx, relationsToDestroy, next);
  });



  Deck.validatesUniquenessOf('slug', {message: 'Slug already exists'});
};
