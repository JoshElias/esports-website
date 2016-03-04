var utils = require("../../modules/jloop").utils;

module.exports = function(Deck) {

    var funcs = [/*utils.validateYoutubeId,*/ utils.generateSlug('name')];
    Deck.observe("before save", function(ctx, next) {
        async.each(funcs, function(func, funcCB) {
            func(ctx, funcCB);
        }, next);
    });
};
