module.exports = function(ForumPost) {
  var async = require("async");
    var utils = require("../../lib/utils");
  var loopback = require("loopback");


    var foreignKeys = ["forumThreadId", "authorId"];
    ForumPost.observe("persist", function(ctx, next) {

        utils.convertObjectIds(foreignKeys, ctx);
        next();
    });



    ForumPost.observe('before delete', function(ctx, next) {

      var relationsToDestroy = ["comments"];
      utils.destroyRelations(ctx, relationsToDestroy, next);
    });
};
