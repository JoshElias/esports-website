module.exports = function(Deck) {
    var utils = require(".././utils");
    var async = require('async');

    var funcs = [/*utils.validateYoutubeId,*/ utils.generateSlug('name')];
    Deck.observe("before save", function(ctx, next) {
        async.each(funcs, function(func, funcCB) {
            func(ctx, funcCB);
        }, next);
    });


    var fieldFilter =  {
        fieldNames: ["chapters", "oldCards", "oldComments", "oldMulligans"],
        acceptedRoles: ["$owner", "$admin", "$premium", "$contentProvider"]
    }
    Deck.observe("loaded", utils.filterFields(fieldFilter));

/*
    var docFilter =  {
        acceptedRoles: ["$owner", "$admin"],
        filter: {
            isPublic : true
        }
    }
    Deck.observe("access", utils.filterDocs(docFilter));
*/

    //Deck.validatesUniquenessOf('slug', {message: 'Slug already exists'});
};
