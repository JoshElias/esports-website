module.exports = function(Guide) {
    var ObjectId = require("mongodb").ObjectID;
    var _ = require("underscore");
    var utils = require("../../lib/utils");


    var foreignKeys = ["authorId"];
    Guide.observe("persist", function(ctx, next) {

      utils.convertObjectIds(foreignKeys, ctx);
      next();
    });


    Guide.observe("before save", function(ctx, next) {
        utils.validateYoutubeId(ctx, next);
    });

    Guide.observe("after save", function(ctx, next) {
//        var childrenNames = ["guideHeroes", "guideTalents"];
//        utils.saveChildren(ctx, childrenNames, next);
      return next();
    });


    Guide.afterRemote("**", function(ctx, modelInstance, next) {
//        removePrivateFields(ctx, modelInstance, next);
      return next();
    });


    // Filter out sensitive user information depending on ACL
    var privateFields = ["allowComments", "description", "playerClass",
        "chapters", "oldCards", "oldComments", "oldMulligans"];

    function removePrivateFields(ctx, modelInstance, finalCb) {
        var Role = Guide.app.models.Role;
        var RoleMapping = Guide.app.models.RoleMapping;
        var User = Guide.app.models.user;
      
        console.log("BEFORE", ctx.result);

        // sets the private fields to false
        function removeFields() {
            if (ctx.result) {
                var answer;
                if (Array.isArray(modelInstance)) {
                    answer = [];
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
              
                if (typeof answer !== "undefined") {
                  ctx.result = answer;
                }
              
                console.log("AFTER", ctx.result);
            }
            finalCb();
        }

        function isPremium(guide) {
            if(!guide || !guide.premium || !guide.premium.isPremium || !guide.premium.expiryDate)
                return false;

            var now = new Date();
            return now < guide.premium.expiryDate;
        }

        if(!ctx || !ctx.req || !ctx.req.accessToken)
            return removeFields();

        User.isInRoles(ctx.req.accessToken.userId.toString(), ["$owner", "$admin", "$premium", "$contentProvider"], function(err, isInRoles) {
            if(err) return finalCb();
            if(isInRoles.none) return removeFields();
            else return finalCb();
        });
    };


  Guide.observe('before delete', function(ctx, next) {
    var relationsToDestroy = ["comments", "maps", "guideHeroes", "guideTalents"];
    utils.destroyRelations(ctx, relationsToDestroy, next);
  });
};
