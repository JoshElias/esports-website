module.exports = function(OverwatchHero) {
  var async = require("async");
  var utils = require("../../lib/utils");

    OverwatchHero.observe("before save", function(ctx, next) {

          assignOrderNum(ctx, next);
    });

    function assignOrderNum(ctx, finalCb) {
      if(!ctx.isNewInstance) finalCb();
        var data = ctx.data || ctx.instance;

      // Assign the orderNum to the current count of heroes
      OverwatchHero.count(function(err, count) {
          if(err) return finalCb(err);

          data.orderNum = count;
          finalCb();
      });
    }

    OverwatchHero.validatesFormatOf('youtubeId', {with: utils.youtubeRegex, message: 'Must provide a valid youtubeId'});
};
