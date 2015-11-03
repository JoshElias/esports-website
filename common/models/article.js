module.exports = function(Article) {
  var utils = require("../../lib/utils");

  var foreignKeys = ["authorId"];
  Article.observe("persist", function(ctx, next) {

    utils.convertObjectIds(foreignKeys, ctx);
    next();
  });

  Article.validatesUniquenessOf('slug.url', {message: 'Slug url already exists'});
};
