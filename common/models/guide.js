module.exports = function(Guide) {
    var utils = require("../../lib/utils");


    Guide.observe("before save", utils.validateYoutubeId);


    var fieldFilter = {
        fieldNames: ["allowComments", "description", "chapters",
            "oldCards", "oldComments", "oldMulligans", "content"],
        acceptedRoles: ["$owner", "$admin", "$premium", "$contentProvider"]
    }
    Guide.observe("loaded", utils.filterFields(fieldFilter));


    var docFilter =  {
        acceptedRoles: ["$owner", "$admin"],
        filter: {
            isPublic : true
        }
    }
    Guide.observe("access", utils.filterDocs(docFilter))
};
