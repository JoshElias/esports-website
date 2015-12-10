module.exports = function(Guide) {
    var utils = require("../../lib/utils");
    var loopback = require("loopback");


    var foreignKeys = ["authorId"];
    Guide.observe("persist", utils.convertObjectIds(foreignKeys));


    Guide.observe("before save", utils.validateYoutubeId);


    Guide.observe("loaded", function(ctx, next) {
        utils.removePremiumFields(ctx, premiumFields, isPremium, next);
    });


    // Filter out sensitive user information depending on ACL
    var premiumFields = ["allowComments", "description", "chapters",
        "oldCards", "oldComments", "oldMulligans", "content"];

    function isPremium(guide) {
        if(!guide || !guide.premium || !guide.premium.isPremium || !guide.premium.expiryDate)
            return false;

        var now = new Date();
        return now < guide.premium.expiryDate;
    }


    var relationsToDestroy = ["comments", "maps", "guideHeroes", "guideTalents"];
    Guide.observe('before delete', function(ctx, next) {
        utils.destroyRelations(ctx, relationsToDestroy, next);
    });
};
