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
        'Set "global.Promise" t``1  o your preferred implementation of promises.');
}

function slugify(string) {
    return (string) ? string.toLowerCase().replace(/-+/g, '').replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') : '';
};

function generateSlug(sourceKey, next) {
  return function(ctx, next) {
    
    var properties = ctx.Model.definition.rawProperties;
    var data;
    var newName;
    
    if(typeof ctx.data === "object" && typeof ctx.data[sourceKey] === "string") {
      console.log('data');
      newName = ctx.data[sourceKey];
      data = ctx.data;
    } else if(typeof ctx.instance === "object" && typeof ctx.instance[sourceKey] === "string") {
      console.log('instance');
      newName = ctx.instance[sourceKey];
      data = ctx.instance;
    }
  
    // If we generated a new slug, update it
    if(typeof data === "object" && typeof newName === "string") {
      var newSlug = slugify(newName);
      console.log('newSlug:', newSlug);
      
      if(!ctx.data) {
        console.log('ctx.data is empty');
        ctx.data = {} 
      }
      
      // Determine if we're updating slug or slug.url
      var slugConfig = properties.slug;
      if (typeof slugConfig === "object" && typeof slugConfig.type === "undefined") {
        console.log('slugConfig.linked:', slugConfig.linked);
        if (!slugConfig.linked) {
          return next();
        }
        console.log('slugConfig:', slugConfig);
         if(!ctx.data.slug !== "object") {
            ctx.data.slug = {
              linked: false
            }
         }
         ctx.data.slug.url = newSlug;
      } else {
        console.log('slug is a string');
        ctx.data.slug = newSlug;
      }
    }
    
    next();
  }
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
                    return relationCb(err);
                });
            }, instanceCb);
        }, function(err) {
            finalCb(err);
        });
    });
};


function saveChildren(ctx, next) {
    var parentRelations = ctx.Model.settings.relations;
    var parentOptions = ctx.options || {};
    var body = {};
    var loopbackContext = loopback.getCurrentContext();
    if (loopbackContext && loopbackContext.active) {
        body = loopbackContext.active.http.req.body;
    }

    var changes = {
        creates: {},
        updates: {}
    }

    var where = {};
    if(ctx.instance && ctx.instance.id) {
      where.id = ctx.instance.id.toString()
    } else if(typeof ctx.where === "object") {
      where = ctx.where;
    } else {
      return next();
    }

    ctx.Model.find({where: where}, function (err, parentInstances) {
        if (err) return revertUpserts(err);
        else if (parentInstances.length < 1) {
            return next();
        }

        // Iterate through all the relationships of the model instance
        async.forEachOf(parentRelations, function (parentRelationObj, parentRelationName, parentRelationCb) {
            if(!parentRelationObj.isChild) {
              return parentRelationCb();
            }

          async.each(parentInstances, function(parentInstance, parentInstanceCb) {

            // Check if the relationship instance exists on the parent
            var relationInstance = parentInstance[parentRelationName];
            if (!relationInstance) {
                return parentInstanceCb();
            }

            // Get the model from the relationship in order to get it's relations

            var relationModel = ctx.Model.app.models[parentRelationObj.model];
            var relationModelRelations = relationModel.settings.relations;

            // See if there's any extra data in the options or body
            var relationData = parentOptions[parentRelationName] || body[parentRelationName];
            if(typeof relationData === "undefined") {
                return parentInstanceCb();
            }
            
            
            if(Array.isArray(relationData)) {
                async.each(relationData, upsertChild(relationInstance, relationModel), parentInstanceCb);
            } else if(typeof relationData === "object") {
                upsertChild(relationInstance, relationModel)(relationData, parentInstanceCb);
            }

            function upsertChild(relationInstance, relationModel) {
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
                    
                    relationModel.find({
                      where: {
                        id: childData.id || ""
                      }
                    }, function(err, childInstance) {
                        if(err) return revertUpserts(err);
                        else if(childInstance.length < 1) {
                            createChild(childData, childOptions, relationInstance, childCb);
                        } else {
                            updateChild(childData, childOptions, childInstance[0], childCb);
                        }
                    });


                    function createChild(childData, childOptions, relationInstance, createCb) {
                        relationInstance.create(childData, childOptions, function (err, childInstance) {
                            if(err) return revertUpserts(err);

                            // Keep track of all children created just in case we need to delete
                            var modelName = relationModel.definition.name;
                            if(!changes.creates[modelName]) {
                                changes.creates[modelName] = {};
                                changes.creates[modelName].collection = relationModel;
                                changes.creates[modelName].children = [];
                            }
                            changes.creates[modelName].children.push(childInstance.id);
                            childCb();
                        });
                    }

                    function updateChild(childData, childOptions, childInstance, updateCb) {
                        childInstance.updateAttributes(childData, childOptions, function (err, newChildInstance) {
                            if(err) return revertUpserts(err);

                            // Keep track of all children created just in case we need to delete
                            var modelName = relationModel.definition.name;
                            if(!changes.updates[modelName]) {
                                changes.updates[modelName] = {};
                                changes.updates[modelName].collection = relationModel;
                                changes.updates[modelName].children = [];
                            }
                            changes.updates[modelName].children.push({
                                id: childInstance,
                                oldData: childInstance.toJSON()
                            });
                            updateCb();
                        });
                    }
                }
            }

          }, parentRelationCb);

        }, function (err) {
            next(err);
        });


        function revertUpserts(createErr) {
          return next(createErr);
            async.parallel([
                // Destroy Parent
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
                    async.forEachOf(changes.creates, function(child, childKey, childCb) {
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
                },
                // Undo all updates
                function(seriesCb) {
                    async.forEachOf(changes.updates, function(update, updateKey, childCb) {
                        async.forEachOf(update.children, function (updateChild, updateChildKey, updateChildCb) {
                            undoUpdates(update, updateChild, updateChildCb);
                        }, childCb)
                    }, function(err) {
                        if(err) {
                            // append to errors
                        }
                        seriesCb();
                    });
                  
                  // Maintain state
                  function undoUpdates(update, updateChild, undoCb) {
                    update.collection.update({
                      id: updateChild.id,
                    }, updateChild.oldData, function(err) {
                        if(err) {
                            // append to errors
                        }
                        undoCb();
                    })
                  }
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

            if(!Array.isArray(fieldNames) || fieldNames.length < 1) {
                return filterCb();
            }

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

function filterDocs(filters) {
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

            var roleNames = filter.acceptedRoles;
            var filter = filter.filter

            if(Object.keys(filter) < 1) {
                return filterCb();
            }

            if (!req || !req.accessToken)
                return addFilter(filter, filterCb);

            User.isInRoles(req.accessToken.userId.toString(), roleNames, function (err, isInRoles) {
                if (err) return filterCb();
                if (isInRoles.none) return addFilter(filter, filterCb);
                else return filterCb();
            });
        }

        function addFilter(filter, removeCb) {
            if(typeof ctx.query.where !== "object") {
                ctx.query.where = {};
            }

            for(var key in filter) {

                ctx.query.where[key] = filter[key];
            }

            return removeCb();
        }
    }
};

function getEventualValue(ctx, key) {
    if(typeof ctx.data !== "undefined" && typeof ctx.data[key] !== "undefined") {
        return ctx.data[key];
    } else if(typeof ctx.instance !== "undefined" && typeof ctx.instance[key] !== "undefined") {
        return ctx.instance[key];
    } else if(typeof ctx.currentInstance !== "undefined" && typeof ctx.currentInstance[key] !== "undefined") {
        return ctx.currentInstance[key];
    }
}




module.exports = {
    createPromiseCallback : createPromiseCallback,
    generateSlug : generateSlug,
    slugify : slugify,
    filterFields: filterFields,
    filterDocs : filterDocs,
    getEventualValue : getEventualValue,
    destroyRelations: destroyRelations,
    saveChildren : saveChildren
};
