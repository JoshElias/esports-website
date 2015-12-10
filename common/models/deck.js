module.exports = function(Deck) {
    var utils = require("../../lib/utils");
    var async = require('async');


    var childrenNames = ["cards", "matchups", "mulligans"];
    Deck.observe("after save", utils.saveChildren(childrenNames));

    
    var funcs = [utils.validateYoutubeId, utils.generateSlug];
    Deck.observe("before save", function(ctx, next) {
        async.each(funcs, function(func, funcCB) {
            func(ctx, funcCB);
        }, next);
    });


    var foreignKeys = ["authorId"];
    Deck.observe("persist", utils.convertObjectIds(foreignKeys));


    var filters =  [
        {
            acceptedRoles: ["$owner", "$admin"],
            predicate: function isPrivate(deck) {
                if(!deck || typeof deck.isPublic === "undefined")
                    return false;
                return !deck.isPublic;
            }
        },
        {
            fieldNames: ["allowComments", "description", "playerClass"],
            acceptedRoles: ["chapters", "oldCards", "oldComments", "oldMulligans"]
        },
    ];
    Deck.observe("loaded", utils.filterFields(filters));


    var relationsToDestroy = ["comments", "cards", "matchups", "mulligans"];
    Deck.observe('before delete', utils.destroyRelations(relationsToDestroy));


    Deck.validatesUniquenessOf('slug', {message: 'Slug already exists'});
};
