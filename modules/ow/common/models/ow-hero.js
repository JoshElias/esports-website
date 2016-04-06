module.exports = function(OWHero) {

    OWHero.observe("persist", assignOrderNum);

    function assignOrderNum(ctx, finalCb) {
        if(!ctx.isNewInstance) return finalCb();

        var data = ctx.data || ctx.instance;

        // Assign the orderNum to the current count of heroes
        OWHero.count(function(err, count) {
            if(err) return finalCb(err);

            data.orderNum = count;
            finalCb();
        });
    }
};
