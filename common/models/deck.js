module.exports = function(Deck) {
  var utils = require("../../lib/utils");


  Deck.observe("before save", utils.validateYoutubeId, function(ctx, next) {
      //utils.validateYoutubeId(ctx, next);
      utils.generateSlug(ctx);
      //protectPrivateFields(ctx, next);
  });

  Deck.afterRemote("**", removePrivateDocs, removePrivateFields);

  var foreignKeys = ["authorId"];
  Deck.observe("persist", function(ctx, next) {
    utils.convertObjectIds(foreignKeys, ctx);
    next();
  });


    function removePrivateDocs(ctx, modelInstance, finalCb) {
        var User = Deck.app.models.user;

        // sets the private fields to false
        function removeFields() {
            if (ctx.result) {
                var answer;
                if (Array.isArray(modelInstance)) {
                    answer = []
                    ctx.result.forEach(function (result) {
                        if(!isPrivate(result)) {
                            answer.push(result);
                        }
                    });
                } else if(!isPrivate(ctx.result)) {
                    answer = ctx.result
                }
                ctx.result = answer;
            }
            return finalCb();
        }

        if(!ctx || !ctx.req || !ctx.req.accessToken)
            return removeFields();

        User.isInRoles(ctx.req.accessToken.userId.toString(), ["$owner", "$admin"], function(err, isInRoles) {
            if(err) return finalCb();
            if(isInRoles.none) return removeFields();
            else return finalCb();
        });
    };



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
                    answer = []
                    ctx.result.forEach(function (result) {
                        if(!isPremium(result)) {
                            answer.push(result);
                            return;
                        }

                        var replacement = {};
                        for(var key in result) {
                            if(privateFields.indexOf(key) === -1) {
                                replacement[key] = result[key];
                            }
                        }
                        answer.push(replacement);
                    });
                } else if(isPremium(ctx.result)) {
                    answer = {};
                    for(var key in ctx.result) {
                        if(privateFields.indexOf(key) === -1) {
                            answer[key] = ctx.result[key];
                        }
                    }
                }
                ctx.result = answer;
            }
            finalCb();
        }

        if(!ctx || !ctx.req || !ctx.req.accessToken)
            return removeFields();

        User.isInRoles(ctx.req.accessToken.userId.toString(), ["$owner", "$admin", "$premium", "$contentProvider"], function(err, isInRoles) {
            if(err) return finalCb();
            if(isInRoles.none) return removeFields();
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



  Deck.validatesUniquenessOf('slug', {message: 'Slug already exists'});
};
