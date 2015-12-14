module.exports = function(Guide) {
    var utils = require("../../lib/utils");


    Guide.observe("before save", utils.validateYoutubeId);


    var filter = {
        fieldNames: ["allowComments", "description", "chapters",
            "oldCards", "oldComments", "oldMulligans", "content"],
        acceptedRoles: ["$owner", "$admin", "$premium", "$contentProvider"]
    };
    Guide.observe("loaded", utils.filterFields(filter));
};
