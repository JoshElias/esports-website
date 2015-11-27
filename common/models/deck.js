module.exports = function(Deck) {
  var utils = require("../../lib/utils");


  Deck.observe("before save", function(ctx, next) {
      utils.validateYoutubeId(ctx, next);
      utils.generateSlug(ctx);
      //protectPrivateFields(ctx, next);
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
        var User = Deck.app.models.user;
        
        // sets the private fields to false
        function removeFields() {
            if (ctx.result) {
                var answer;
                if (Array.isArray(modelInstance)) {
                    answer = ctx.result;
                    ctx.result.forEach(function (result, index) {
                        if(isPrivate(result)) {
                            answer[index] = undefined;
                            return;
                        }

                        if(!isPremium(result)) {
                            return;
                        }

                        privateFields.forEach(function(privateField) {
                            if(typeof answer[privateField] !== "undefined") {
                                answer[privateField] = undefined;
                            }
                        });
                    });
                } else if(isPrivate(ctx.result)) {
                    answer = undefined;
                } else if(isPremium(ctx.result)) {
                    answer = ctx.result;
                    privateFields.forEach(function (privateField) {
                        if (typeof answer[privateField] !== "undefined") {
                            answer[privateField] = undefined;
                        }
                    });
                } else {
                    answer = ctx.result;
                }

                ctx.result = answer;
            }
            finalCb();
        }

        if(!ctx || !ctx.req || !ctx.req.accessToken)
            return removeFields();

        User.isInRoles(["$owner", "$admin", "$premium", "$contentProvider"], function(err, isInRoles) {
            if(err) return finalCb();
            if(!isInRoles.all) return removeFields();
            else return finalCb();
        });
    };

    function isPremium(deck) {
        if(!deck || !deck.premium || !deck.premium.isPremium || !deck.premium.expiryDate)
            return false;

        var now = new Date();
        return now < deck.premium.expiryDate;
    }

    function isPrivate(deck) {
        if(!deck || typeof deck.isPublic === "undefined")
            return false;

        return !deck.isPublic;
    }


    // Provent these fields from being altered from certain people
    var protectedFields = ["premium"];

    function protectPrivateFields(ctx, finalCb) {
        var Role = Deck.app.models.Role;
        var RoleMapping = Deck.app.models.RoleMapping;

        // sets the private fields to false
        function removeFields() {
            var data = ctx.data || ctx.instance;
            var answer = data;
            console.log("removing fields for deck context:", ctx);
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

        Role.isInRoles(ctx.req.accessToken.userId, ["$owner", "$admin", "$contentProvider"], function(err, isInRoles) {
            if(err) return finalCb();
            if(!isInRoles) return removeFields();
            else return finalCb();
        });
    };



  Deck.validatesUniquenessOf('slug', {message: 'Slug already exists'});
};
