module.exports = function(ForumThread) {
  var utils = require("../../lib/utils");

  var foreignKeys = ["forumCategoryId"];
  ForumThread.observe("persist", function(ctx, next) {
    utils.convertObjectIds(foreignKeys, ctx);
    next();
  });

  ForumThread.observe('before delete', function(ctx, next) {

    var relationsToDestroy = ["forumPosts"];
    utils.destroyRelations(ctx, relationsToDestroy, next);
  });

  ForumThread.validatesUniquenessOf('slug.url', {message: 'Slug.url already exists'});
};
