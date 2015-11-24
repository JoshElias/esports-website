module.exports = function(Deck) {
  var utils = require("../../lib/utils");


  Deck.observe("before save", function(ctx, next) {
     utils.validateYoutubeId(ctx, next);
     utils.generateSlug(ctx);
  });

  Deck.afterRemote("**", function(ctx, modelInstance, next) {
      removePrivateFields(ctx, modelInstance, next);
  });

  var foreignKeys = ["authorId"];
  Deck.observe("persist", function(ctx, next) {
    utils.convertObjectIds(foreignKeys, ctx);
    next();
  });



    // Filter out sensitive user information depending on ACL
    var privateFields = ["allowComments", "description", "playerClass",
        "chapters", "oldCards", "oldComments", "oldMulligans"];

    function removePrivateFields(ctx, modelInstance, finalCb) {
        var Role = Deck.app.models.Role;
        var RoleMapping = Deck.app.models.RoleMapping;

        // sets the private fields to false
        function removeFields() {
            if (ctx.result) {
                var answer;
                if (Array.isArray(modelInstance)) {
                    answer = ctx.result;
                    ctx.result.forEach(function (result) {
                        if(!isPremium(result))
                            return;

                        privateFields.forEach(function(privateField) {
                            if(answer[privateField]) {
                                answer[privateField] = undefined;
                            }
                        });
                    });
                } else if(!isPremium(ctx.result)) {
                    answer = ctx.result;
                    privateFields.forEach(function (privateField) {
                        if (answer[privateField]) {
                            answer[privateField] = undefined;
                        }
                    });
                }
                ctx.result = answer;
            }
            finalCb();
        }

        function isPremium(deck) {
            if(!deck || !deck.premium || !deck.premium.isPremium || !deck.premium.expiryDate)
                return false;

            var now = new Date();
            return now < deck.premium.expiryDate;
        }

        if(!ctx || !ctx.req || !ctx.req.accessToken)
            return removeFields();

        Role.isInRoles(ctx.req.accessToken.userId, ["$owner", "$admin", "$premium", "$contentProvider"], function(err, isInRoles) {
            if(err) return finalCb();
            if(!isInRoles) return removeFields();
            else return finalCb();
        });
    };


  Deck.validatesUniquenessOf('slug', {message: 'Slug already exists'});
};
