module.exports = function(OverwatchHero) {
    var utils = require(".././utils");


    OverwatchHero.observe("persist", assignOrderNum);

    function assignOrderNum(ctx, finalCb) {
        if(!ctx.isNewInstance) return finalCb();

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
