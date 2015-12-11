var ObjectID = require("mongodb").ObjectID;
var _ = require("underscore");
var loopback = require("loopback");
var async = require("async");


function createPromiseCallback() {
    var cb;

    if (!global.Promise) {
        cb = function() {};
        cb.promise = {};
        Object.defineProperty(cb.promise, 'then', { get: throwPromiseNotDefined });
        Object.defineProperty(cb.promise, 'catch', { get: throwPromiseNotDefined });
        return cb;
    }

    var promise = new global.Promise(function(resolve, reject) {
        cb = function(err, data) {
            if (err) return reject(err);
            return resolve(data);
        };
    });
    cb.promise = promise;
    return cb;
}


function throwPromiseNotDefined() {
    throw new Error(
        'Your Node runtime does support ES6 Promises. ' +
        'Set "global.Promise" to your preferred implementation of promises.');
}


var youtubeRegex = /^[a-zA-Z0-9_-]{11}$/;
function validateYoutubeId(ctx, finalCallback) {
    var data = ctx.data || ctx.instance;
    if(_.isEmpty(data.youtubeId)) {
        return finalCallback();
    }

    var err;
    if(!youtubeRegex.test(data.youtubeId)) {
        err = new Error('Invalid youtubeId');
        err.statusCode = 400;
        err.code = 'INVALID_YOUTUBE_ID';
    }
    
    console.log('returning cb');
    return finalCallback(err);
}


function convertObjectIds(keys) {
    return function(ctx, next) {
        var data = ctx.data || ctx.instance;
        _.each(keys, function(foreignKey) {
            _.each(data, function(modelValue, modelKey){
                if(foreignKey === modelKey && typeof modelValue === "string") {
                    data[foreignKey] = new ObjectID(modelValue);
                }
            })
        });
        next();
    }
}


function slugify(string) {
    return (string) ? string.toLowerCase().replace(/-+/g, '').replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') : '';
};

function generateSlug(ctx, next) {
    var data = ctx.data || ctx.instance;
    if(_.isEmpty(data.slug)) {
        data.slug = slugify(data.name);
    }
    next();
};


function destroyRelations(relationsToDelete) {
    return function(ctx, finalCb) {
        var query = {
            where:ctx.where,
            fields:{ id:true }
        };

        ctx.Model.find(query, function(err, instances) {
            if(err) return finalCb(err);

            async.each(instances, function(instance, instanceCb) {
                async.each(relationsToDelete, function(relationToDelete, childCb) {
                    var relation = instance[relationToDelete];
                    if(!relation) {
                        return childCb();
                    }

                    relation.destroyAll(function(err) {
                        if(!err) console.log("successfully deleted relation:", relationToDelete);
                        return childCb(err);
                    });
                }, instanceCb);
            }, function(err) {
                finalCb(err);
            });
        });
    }
};


function saveChildren(childrenNames) {
    return function(ctx, next) {
//        console.log('entered');
        if (!ctx.isNewInstance) {
            return next();
        }

        var options = ctx.options || {};
        var modelRelations = ctx.Model.settings.relations;
        var loopbackContext = loopback.getCurrentContext();
        var body = {};
        if (loopbackContext && loopbackContext.active) {
            body = loopbackContext.active.http.req.body;
        }
        
//        console.log('finding models');
        ctx.Model.findById(ctx.instance.id.toString(), function (err, instance) {
            if (err) return next(err);
            else if (!instance) {
                console.log("no instance in a new instance? wtf...");
                return next();
            }
//            console.log('creating relations');
            async.forEachOf(modelRelations, function (parentRelation, parentRelationName, eachCb) {
//                console.log('parentRelation: ', parentRelation);
                var parentInstance = instance[parentRelationName];
                var parentData = options[parentRelationName] || body[parentRelationName];
//                console.log('parentData: ', parentData);
//                console.log('parentInstance: ', parentInstance);
                if (!parentInstance || !parentRelation) {
                    return eachCb();
                }
//                console.log('parentData: ', parentData);
                async.each(parentData, function (data, childDataCb) {

                    // find child relations to append to this create
                    var childModel = ctx.Model.app.models[parentRelation.model];
                    var childRelations = childrenNames || childModel.settings.relations;

                    // Get children data from the parent
                    var options = {};
                    for (var childRelationKey in childRelations) {
                        var childData = data[childRelationKey];
                        if (childData) {
                            options[childRelationKey] = data[childRelationKey];
                        }
                    }
                    console.log('data: ', data, options);
                    parentInstance.create(data, options, function (err, childInstance) {
                        
                        if (!err) console.log("created child:", parentRelationName, childInstance);
                        childDataCb(err);
                    });
                }, eachCb);

            }, function (err) {
                next(err);
            });
        });
    }
}


function filterFields(filters) {
    return function(ctx, finalCb) {

        var loopbackContext = loopback.getCurrentContext();
        if (!loopbackContext || !loopbackContext.active) {
            return finalCb();
        }
        var req = loopbackContext.active.http.req;


        if(Array.isArray(filters)) {
            async.eachSeries(filters, filterData, finalCb);
        } else {
            filterData(filters, finalCb);
        }


        function filterData(filter, filterCb) {
            var fieldNames = filter.fieldNames;
            var predicate = filter.predicate || defaultPredicate;
            var roleNames = filter.roleNames;

            if (!predicate(ctx.instance || ctx.data)) {
                return filterCb();
            }

            if (!req || !req.accessToken)
                return removeFields(fieldNames, filterCb);

            var User = loopbackContext.app.models.user;
            User.isInRoles(req.accessToken.userId.toString(), roleNames, function (err, isInRoles) {
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
                data = ctx.data
                removeFunc = deleteField;
            }

            if(!fieldNames) {
                data = undefined;
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
            return now < instance.premium.expiryDate;
        }
    }
};


module.exports = {
    createPromiseCallback : createPromiseCallback,
    validateYoutubeId: validateYoutubeId,
    youtubeRegex : youtubeRegex,
    convertObjectIds : convertObjectIds,
    generateSlug : generateSlug,
    slugify : slugify,
    filterFields: filterFields,

    destroyRelations: destroyRelations,
    saveChildren : saveChildren
}