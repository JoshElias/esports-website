


function filter(ctx, finalCb) {

    var filterOptions = {
        optionKey: "$validate",
        tag: "$validate",
        stateVars: {
            report: {
                passed: true,
                elements: {},
                errors: {}
            }
        }
    };
    filterOptions.newStateHandler = newStateHandler;
    filterOptions.primitiveHandler = primitiveHandler;
    filterOptions.postHandler = postHandler;

    return modelCrawler.crawl(ctx, crawlOptions, finalCb);
}


function filterFields(filters) {
    return function(ctx, finalCb) {

        var loopbackContext = loopback.getCurrentContext();
        if (!loopbackContext || typeof loopbackContext.active !== "object" || Object.keys(loopbackContext.active).length < 1) {
            return finalCb();
        }

        var req = loopbackContext.active.http.req;
        var User = ctx.Model.app.models.user;


        if(Array.isArray(filters)) {
            async.eachSeries(filters, filterData, finalCb);
        } else {
            filterData(filters, finalCb);
        }


        function filterData(filter, filterCb) {
            var fieldNames = filter.fieldNames;
            var predicate = filter.predicate || defaultPredicate;
            var acceptedRoles = filter.acceptedRoles;

            if(!Array.isArray(fieldNames) || fieldNames.length < 1) {
                return filterCb();
            }

            if (!predicate(ctx.instance || ctx.data)) {
                return filterCb();
            }

            if (!req || !req.accessToken) {
                return removeFields(fieldNames, filterCb);
            }

            User.isInRoles(req.accessToken.userId.toString(), acceptedRoles, function (err, isInRoles) {
                if (err) return filterCb();
                if (isInRoles.none) return removeFields(fieldNames, filterCb);
                else return filterCb();
            });
        }

        function removeFields(fieldNames, removeCb) {
            var data;
            var removeFunc;

            function unsetField(fieldName) {
                data.unsetAttribute(fieldName);
            }

            function deleteField(fieldName) {
                delete data[fieldName];
            }

            if (ctx.instance) {
                data = ctx.instance;
                removeFunc = unsetField;
            } else {
                data = ctx.data;
                removeFunc = deleteField;
            }

            for (var key in fieldNames) {
                removeFunc(fieldNames[key]);
            }

            return removeCb();
        }

        function defaultPredicate(instance) {
            if(!instance || !instance.premium || !instance.premium.isPremium || !instance.premium.expiryDate)
                return false;

            var now = new Date();
            var temp = now < new Date(instance.premium.expiryDate);
            return temp;
        }
    }
};