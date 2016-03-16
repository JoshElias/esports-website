

var relationDeleteHandlers = {
    hasMany: hasManyHandler,
    belongsTo: belongsTo
};

function hasManyHandler(ctx, instance, relationData, relationName, finalCb) {

    var relation = instance[relationName];
    if(!relation) {
        return relationCb();
    }

    relation.destroyAll(finalCb);
}

function belongsToHandler(ctx, instance, relationData, relationName, finalCb) {
    console.log("DELETING belongsTo")
    var modelToDelete = ctx.Model.app.models[relationData.model];
    if(!modelToDelete) {
        console.log("NO MODEL TO DELTE");
        return finalCb();
    }

    var idToDelete = instance[relationData.foreignKey];
    console.log("instance", instance);
    if(!idToDelete) {
        console.log("NO ID TO DELETE");
        return finalCb();
    }

    return modelToDelete.deleteById(idToDelete, finalCb);
}

module.exports = {
    hasMany: hasManyHandler,
    belongsTo: belongsToHandler
};