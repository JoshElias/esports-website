var async = require("async");
var loopback = require("loopback");
var deleteHandlers = require("./delete-handlers");
var reqCache = require("../../lib/req-cache");
var packageJSON = require("./package");



module.exports = function(Model) {

    // Ensure the request object on every type of hook
    Model.beforeRemote('**', function(ctx, modelInstance, next) {
        reqCache.setRequest(ctx);
        next();
    });


    // Destroy any relations upon relations
    Model.observe('before delete', function(ctx, next) {
        ctx.req = reqCache.getRequest();
        async.series([
            destroyOnDelete(Model, ctx)
        ], next);
    });
};



function destroyOnDelete(Model, ctx) {
    return function(finalCb) {

        var relations = Model.settings.relations;

        // Create query to retrieve the objectId(s) of the instances we are deleting
        var query = {
            where: ctx.where,
            fields: {id: true}
        };

        // Append all foreing keys to the query fields
        var foreignKeys = getForeignKeys(Model.definition.rawProperties);
        for (var key in foreignKeys) {
            query.fields[foreignKeys[key]] = true;
        }

        Model.find(query, function (err, instances) {
            if (err) return finalCb(err);

            async.each(instances, function (instance, instanceCb) {
                async.forEachOf(relations, function (relationData, relationName, relationCb) {

                    if (!relationData[packageJSON.mixinName]) {
                        return relationCb();
                    }

                    var deleteHandler = deleteHandlers[relationData.type];
                    if (!deleteHandler) {
                        return relationCb();
                    }

                    return deleteHandler(ctx, instance, relationData, relationName, relationCb);

                }, instanceCb);
            }, function (err) {
                finalCb(err);
            });
        });
    }
}

function isForeignKey(key) {
    if(typeof key !== "string" || key.length < 3)
        return false;

    var suffix = key.slice(key.length-2, key.length);
    if(suffix !== ID_SUFFIX) {
        return false;
    }

    return true;
}

function getForeignKeys(properties) {
    var foreignKeys = [];
    for(var key in properties) {
        if(isForeignKey(key)) {
            foreignKeys.push(key);
        }
    }
    return foreignKeys;
}

