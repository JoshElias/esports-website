module.exports = function(Guide) {
    var utils = require("../../lib/utils");


    var foreignKeys = ["authorId"];
    Guide.observe("persist", function(ctx, next) {

      utils.convertObjectIds(foreignKeys, ctx.data);
      next();
    });

    Guide.observe("before save", function(ctx, next) {
        utils.validateYoutubeId(ctx.instance, next);
    });
};
