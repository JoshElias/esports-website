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
};
