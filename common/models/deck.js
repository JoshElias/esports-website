module.exports = function(Deck) {
  var utils = require("../../lib/utils");

  Deck.observe("before save", function(ctx, next) {
    var data = ctx.instance || ctx.data;
    utils.validateYoutubeId(data, next);
  });

  var foreignKeys = ["authorId"];
  Deck.observe("persist", function(ctx, next) {
    var data = ctx.instance || ctx.data;
    utils.convertObjectIds(foreignKeys, data);
    next();
  });
};
