var ObjectID = require("mongodb").ObjectID;
var _ = require("underscore");
var loopback = require("loopback");
var async = require("async");
var server = require("../server/server");


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

    return finalCallback(err);
}


function convertObjectIds(ctx, next) {
  if(ctx.isNewInstance) {
    return next();
  }

  var properties = ctx.Model.settings.properties;

  _.each(properties, function(property, name) {
    var where = ctx.where[name];
    if(typeof property.type === "undefined" && where) {
      console.log("converting objectID:", where)
      where = new ObjectID(ctx.where[name]);
    }
  });
  next();
}
/*
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
*/


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


function destroyRelations(ctx, finalCb) {
    var query = {
        where:ctx.where,
        fields:{ id:true }
    };
    var relations = ctx.Model.settings.relations;

    ctx.Model.find(query, function(err, instances) {
        if(err) return finalCb(err);

        async.each(instances, function(instance, instanceCb) {
            async.forEachOf(relations, function(relationObj, relationName, relationCb) {
                if(!relationObj.isChild) {
                    return relationCb();
                }

                var relation = instance[child];
                if(!relation) {
                    return relationCb();
                }

                relation.destroyAll(function(err) {
                    if(!err) console.log("successfully deleted relation:", children);
                    return relationCb(err);
                });
            }, instanceCb);
        }, function(err) {
            finalCb(err);
        });
    });
};


function saveChildren(ctx, next) {

    if (!ctx.isNewInstance) {
        return next();
    }

    var relations = ctx.Model.settings.relations;
    var options = ctx.options || {};
    var body = {};
    var loopbackContext = loopback.getCurrentContext();
    if (loopbackContext && loopbackContext.active) {
        body = loopbackContext.active.http.req.body;
    }

    ctx.Model.findById(ctx.instance.id.toString(), function (err, instance) {
        if (err) return next(err);
        else if (!instance) {
            return next();
        }

        async.forEachOf(relations, function (relationObj, relationName, eachCb) {
            var parentInstance = instance[relationName];
            if (!parentInstance) {
                return eachCb();
            }

            function createChildren(relationObj, relationName, childrenCb) {
                var parentData = options[relationName] || body[relationName];
                var parentModel = ctx.Model.app.models[relationObj.model];
                var childrenRelations = parentModel.settings.relations;

                async.forEachOf(parentData, function (data, dataKey, childDataCb) {
                    if(typeof childrenRelations[dataKey] === "undefined") {
                        return childDataCb();
                    }

                    var childRelation = childrenRelations[dataKey];
                    if(typeof childRelation === "undefined" || !childRelation.isChild) {
                        return childDataCb();
                    }

                    var value = data[dataKey];
                    if (typeof value !== "undefined") {
                        options[dataKey] = value;
                    }

                    function createChild(instance, data, options, createCb) {
                        instance.create(data, options, function (err, childInstance) {
                            createCb(err);
                        });
                    }

                    createChild(parentInstance, data, options, childDataCb);

                }, childrenCb);
            }

            createChildren(relationObj, relationName, eachCb);

        }, function (err) {
            next(err);
        });
    });
}


function filterFields(filters) {
    return function(ctx, finalCb) {

        var loopbackContext = loopback.getCurrentContext();
        if (!loopbackContext || !loopbackContext.active) {
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
            var roleNames = filter.roleNames;

            if (!predicate(ctx.instance || ctx.data)) {
                return filterCb();
            }

            if (!req || !req.accessToken)
                return removeFields(fieldNames, filterCb);

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
                data = ctx.data;
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
