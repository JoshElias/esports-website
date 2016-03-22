var async = require("async");
var deleteHandlers = require("./delete-handlers");


var DESTROY_CHILDREN_FEATURE_KEY = "DestroyOnDelete";



module.exports = function(Model) {

    // Ensure the request object on every type of hook
    Model.beforeRemote('**', function(ctx, modelInstance, next) {

        // Set loopback Context
        loopback.getCurrentContext().set('req', ctx.req);
        next();
    });

    function attachLoopbackContext(ctx) {
        var loopbackContext = loopback.getCurrentContext();
        if (loopbackContext && !ctx.req) {
            ctx.req = loopback.getCurrentContext().get("req");
        }
    }


    // Destroy any relations upon relations
    Model.observe('before delete', function(ctx, next) {
        attachLoopbackContext(ctx);
        destroyOnDelete(Model)(ctx, next);
    });
};


function destroyOnDelete(Model) {
    return function(ctx, finalCb) {

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

                    if (!relationData[DESTROY_CHILDREN_FEATURE_KEY]) {
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

