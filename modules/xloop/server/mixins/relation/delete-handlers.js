

function hasManyHandler(ctx, instance, relationData, relationName, finalCb) {

    var relation = instance[relationName];
    if(!relation) {
        return relationCb();
    }

    relation.destroyAll(finalCb);
}

function belongsToHandler(ctx, instance, relationData, relationName, finalCb) {

    var modelToDelete = ctx.Model.app.models[relationData.model];
    if(!modelToDelete) {
        return finalCb();
    }

    var idToDelete = instance[relationData.foreignKey];
    if(!idToDelete) {
        return finalCb();
    }

    return modelToDelete.deleteById(idToDelete, finalCb);
}

module.exports = {
    hasMany: hasManyHandler,
    belongsTo: belongsToHandler
};