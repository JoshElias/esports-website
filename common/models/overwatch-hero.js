module.exports = function(OverwatchHero) {
  var async = require("async");
  var utils = require("../../lib/utils");

    OverwatchHero.observe("before save", function(ctx, next) {
      async.series([
        function(seriesCallback) {
          utils.validateYoutubeId(ctx.instance, seriesCallback)
        },
        function(seriesCallback) {
          assignOrderNum(ctx, seriesCallback);
        }
      ], next);
    });

    function assignOrderNum(ctx, finalCallback) {
      if(!ctx.isNewInstance) finalCallback();

      // Assign the orderNum to the current count of heroes
      OverwatchHero.count(function(err, count) {
          if(err) return finalCallback(err);

          ctx.instance.orderNum = count;
          finalCallback();
      });
    }
};
