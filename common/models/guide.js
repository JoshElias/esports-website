module.exports = function(Guide) {
    var ObjectId = require("mongodb").ObjectID;
    var _ = require("underscore");
    var utils = require("../../lib/utils");


    var foreignKeys = ["authorId"];
    Guide.observe("persist", function(ctx, next) {

      utils.convertObjectIds(foreignKeys, ctx);
      talentTiersSuck(ctx);
      next();
    });


    Guide.observe("before save", function(ctx, next) {
        utils.validateYoutubeId(ctx, next);
    });


    Guide.afterRemote("**", function(ctx, modelInstance, next) {
        removePrivateFields(ctx, modelInstance, next);
    });

    function talentTiersSuck(ctx) {
        var data = ctx.instance || ctx.data;

        if(data.talentTiers) {
            _.each(data.talentTiers, function(tierValue, tierKey) {
                _.each(tierValue, function(value, key) {
                    if(typeof value !== "object")
                        data.talentTiers[tierKey][key] = new ObjectId(value);
                })
            });
        }
    }



    // Filter out sensitive user information depending on ACL
    var privateFields = ["allowComments", "description", "playerClass",
        "chapters", "oldCards", "oldComments", "oldMulligans"];

    function removePrivateFields(ctx, modelInstance, finalCb) {
        var Role = Guide.app.models.Role;
        var RoleMapping = Guide.app.models.RoleMapping;

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
                            if(typeof answer[privateField] !== "undefined") {
                                answer[privateField] = undefined;
                            }
                        });
                    });
                } else if(isPremium(ctx.result)) {
                    answer = ctx.result;
                    privateFields.forEach(function (privateField) {
                        if (typeof answer[privateField] !== "undefined") {
                            answer[privateField] = undefined;
                        }
                    });
                }
                ctx.result = answer;
            }
            finalCb();
        }

        function isPremium(guide) {
            if(!guide || !guide.premium || !guide.premium.isPremium || !guide.premium.expiryDate)
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
};
