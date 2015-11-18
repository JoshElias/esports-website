module.exports = function(Deck) {
  var utils = require("../../lib/utils");


  Deck.observe("before save", function(ctx, next) {
     utils.validateYoutubeId(ctx, next);
     utils.generateSlug(ctx);
  });

  var foreignKeys = ["authorId"];
  Deck.observe("persist", function(ctx, next) {
    utils.convertObjectIds(foreignKeys, ctx);
    next();
  });

  Deck.validatesUniquenessOf('slug', {message: 'Slug already exists'});
};
