module.exports = function(ForumCategory) {
  var utils = require("../../lib/utils");

  ForumCategory.observe('before delete', function(ctx, next) {

    var relationsToDestroy = ["forumThreads"];
    utils.destroyRelations(ctx, relationsToDestroy, next);
  });
};
