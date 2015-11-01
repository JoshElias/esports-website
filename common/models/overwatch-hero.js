module.exports = function(OverwatchHero) {


    OverwatchHero.observe("before save", function(ctx, next) {

        assignOrderNum(ctx.data, next);
    });

    function assignOrderNum(data, finalCallback) {
        if(!data.id) finalCallback();

        // If the hero already exists, it already has an orderNum
        OverwatchHero.exists(ctx.data.id, function(err, exists) {
            if(err) return finalCallback(err);
            else if(exists) return finalCallback();

            // Assign the orderNum to the current count of heroes
            OverwatchHero.count(function(err, count) {
                if(err) return finalCallback(err);

                ctx.data.orderNum = count;
                finalCallback();
            });
        });
    }
};
