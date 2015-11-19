module.exports = function(Deck) {
  var utils = require("../../lib/utils");


  Deck.observe("before save", function(ctx, next) {
     utils.validateYoutubeId(ctx, next);
     utils.generateSlug(ctx);
  });

  Deck.observe("loaded", function(ctx, next) {
      //removePremiumFields(ctx, next);
      next();
  });

  var foreignKeys = ["authorId"];
  Deck.observe("persist", function(ctx, next) {
    utils.convertObjectIds(foreignKeys, ctx);
    next();
  });



  function removePremiumFields(ctx, cb) {
      var User = Deck.app.models.user;s
      User.getCurrent(function(err, user) {
          console.log("got current user:", user);
          cb(err);
      });
  };

  Deck.validatesUniquenessOf('slug', {message: 'Slug already exists'});
};
