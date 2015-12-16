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

                var relation = instance[relationName];
                if(!relation) {
                    return relationCb();
                }

                relation.destroyAll(function(err) {
                    if(!err) console.log("successfully deleted chillen");
                    return relationCb(err);
                });
            }, instanceCb);
        }, function(err) {
            finalCb(err);
        });
    });
};

/*
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
				// cards
				if(typeof parentData === "undefined") {
					return childrenCb();	
				}
					
				console.log('body:', body);
                var parentModel = ctx.Model.app.models[relationObj.model];
                var childrenRelations = parentModel.settings.relations;
				console.log('childrenRelations:', childrenRelations);

                for(var childRelationName in childrenRelations) {
					var childData = childrenRelations[childRelationName];
					if(typeof childData === "undefined" || childRelationObj.isChild) {
						continue;
					}
					
					options[childRelationName] = childData;
                }
				
				function createChild(instance, data, options, createCb) {
					instance.create(data, options, function (err, childInstance) {
						console.log('created child', childInstance);
						createCb(err);
					});
				}

				createChild(parentInstance, parentData, options, childDataCb);
            }

            createChildren(relationObj, relationName, eachCb);

        }, function (err) {
            next(err);
        });
    });
}
*/

function saveChildren(ctx, next) {
    if (!ctx.isNewInstance) {
        return next();
    }

    var parentRelations = ctx.Model.settings.relations;
    var parentOptions = ctx.options || {};
    var body = {};
    var loopbackContext = loopback.getCurrentContext();
    if (loopbackContext && loopbackContext.active) {
        body = loopbackContext.active.http.req.body;
    }
    var childrenAdded = {};

    ctx.Model.findById(ctx.instance.id.toString(), function (err, parentInstance) {
        if (err) return revertCreates(err);
        else if (!parentInstance) {
            return next();
        }

        // Iterate through all the relationships of the model instance
        async.forEachOf(parentRelations, function (parentRelationObj, parentRelationName, parentRelationCb) {

            // Check if the relationship instance exists on the parent
            var relationInstance = parentInstance[parentRelationName];
            if (!relationInstance) {
                return parentRelationCb();
            }

            // Get the model from the relationship in order to get it's relations
            var relationModel = ctx.Model.app.models[parentRelationObj.model];
            var relationModelRelations = relationModel.settings.relations;

            // See if there's any extra data in the options or body
            var relationData = parentOptions[parentRelationName] || body[parentRelationName];
            if(typeof relationData === "undefined") {
                return parentRelationCb();
            }

            if(Array.isArray(relationData)) {
                async.each(relationData, createChild(relationInstance, relationModel), parentRelationCb);
            } else if(typeof relationData === "object") {
                createChild(relationInstance, relationModel)(relationData, parentRelationCb);
            }


            function createChild(relationInstance, relationModel) {
                return function (childData, childCb) {

                    // Iterate through the relation's relations and see if there are any fields to append to options
                    var childOptions = {};
                    for (var childRelationName in relationModelRelations) {

                        // If the child data contains no data or shouldn't be added (!isChild)
                        var childRelationObj = relationModelRelations[childRelationName];
                        var value = childData[childRelationName];
                        if (typeof value !== "undefined" && childRelationObj.isChild) {
                            childOptions[childRelationName] = value;
                        }
                    }

                    // Create the child through the relation's instance with the options you created
                    relationInstance.create(childData, childOptions, function (err, childInstance) {
                        if(err) return revertCreates(err);

                        // Keep track of all children created just in case we need to delete
                        var modelName = relationModel.definition.name;
                        if(!childrenAdded[modelName]) {
                            childrenAdded[modelName] = {};
                            childrenAdded[modelName].collection = relationModel;
                            childrenAdded[modelName].children = [];
                        }
                        childrenAdded[modelName].children.push(childInstance.id);
                        childCb();
                    });
                }
            }

        }, function (err) {
            next(err);
        });


        function revertCreates(createErr) {
            async.parallel([
                function(seriesCb) {
                    ctx.Model.destroyById(ctx.instance.id.toString(), function(err) {
                        if(err) {
                            // append to errors
                        }
                        seriesCb();
                    });
                },
                // Delete all the children
                function(seriesCb) {
                    async.forEachOf(childrenAdded, function(child, childKey, childCb) {
                        child.collection.destroyAll({where:{id:{inq:child.children}}}, function(err) {
                            if(err) {
                                // append to errors
                            }
                            childCb();
                        });

                    }, function(err) {
                        if(err) {
                            // append to errors
                        }
                        seriesCb();
                    });
                }
            ], function(err) {
                if(err) {
                    // append to errors
                }
                next(createErr);
            })
        }
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
