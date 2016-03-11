var async = require("async");


function destroyChildren(ctx, finalCb) {
    var query = {
        where: ctx.where,
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

/*
function saveChildren(ctx, next) {
    var parentRelations = ctx.Model.settings.relations;
    var parentOptions = ctx.options || {};
    var loopbackContext = loopback.getCurrentContext();
    if (!loopbackContext || !loopbackContext.active || !loopbackContext.active.http) {
        return next();
    }
    var body = loopbackContext.active.http.req.body;

    var changes = {
        creates: {},
        updates: {}
    };

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
*/

module.exports = {
    destroyChildren: destroyChildren
};