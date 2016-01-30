module.exports = function(Guide) {
    var utils = require("../../lib/utils");
    var async = require('async');

    var funcs = [/*utils.validateYoutubeId,*/ utils.generateSlug('name')];
    Guide.observe("before save", function(ctx, next) {
        async.each(funcs, function(func, funcCB) {
            func(ctx, funcCB);
        }, next);
    });

//    Guide.observe("before save", utils.generateSlug("name"));


    var fieldFilter = {
        fieldNames: ["allowComments", "description", "chapters",
            "oldCards", "oldComments", "oldMulligans", "content"],
        acceptedRoles: ["$owner", "$admin", "$premium", "$contentProvider"]
    };
    Guide.observe("loaded", utils.filterFields(fieldFilter));


    /*
    var docFilter =  {
        acceptedRoles: ["$owner", "$admin"],
        filter: {
            isPublic : true
        }
    };
    */
//    Guide.observe("access", utils.filterDocs(docFilter))
};
