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
    if(_.isEmpty(!data.youtubeId))
        return finalCallback();

    var err = new Error('Invalid youtubeId');
    err.statusCode = 400;
    err.code = 'INVALID_YOUTUBE_ID';

    return (youtubeRegex.test(data.youtubeId))
        ? finalCallback() : finalCallback(err);
}


function convertObjectIds(keys, ctx) {
    var data = ctx.data || ctx.instance;
  _.each(keys, function(foreignKey) {
    _.each(data, function(modelValue, modelKey){
      if(foreignKey === modelKey && typeof modelValue === "string") {
        data[foreignKey] = new ObjectID(modelValue);
      }
    })
  });
}


function slugify(string) {
    return (string) ? string.toLowerCase().replace(/-+/g, '').replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') : '';
};

function generateSlug(ctx) {
    var data = ctx.data || ctx.instance;
    if(data.name) {
        data.slug = slugify(data.name);
    }
};

function destroyRelations(ctx, relationsToDelete, finalCb) {

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
            childCb(err);
        });
      }, instanceCb);
    }, function(err) {
      finalCb(err);
    });
  });
};


function saveChildren(ctx, childrenNames, next) {
    if (!ctx.isNewInstance) {
        return next();
    }

    var modelRelations = ctx.Model.settings.relations;
    var loopbackContext = loopback.getCurrentContext();
    var body;
    if(loopbackContext.active) {
        body = loopbackContext.active.http.req.body;
    }

    ctx.Model.findById(ctx.instance.id.toString(), function(err, instance) {
        if(err) return next(err);
        else if(!instance) {
            console.log("no instance in a new instance? wtf...");
            return next();
        }

        function createParent(childrenName, createCb) {
            var parentInstance = instance[childrenName];
            var parentData = ctx.options[childrenName] || body[childrenName];
            var parentRelation = modelRelations[childrenName];
            if (!parentInstance || !parentData || !parentRelation) {
                console.log("couldn't find childModel or childData:", childrenInstance, childData, parentRelation);
                return prepareCb();
            }

            async.each(parentData, function(data, childDataCb) {

                // find child relations to append to this create
                var childModel = ctx.Model.app.models[parentRelation.model];
                var childRelations = childModel.settings.relations;

                // Get children data from the parent
                var options = {};
                for(var childRelationKey in childRelations) {
                    if(data[childRelationKey]) {
                        options[childRelationKey] = data[childRelationKey];
                    }
                }

                parentInstance.create(data, options, function(err, childInstance) {
                    if(!err) console.log("created child:", childrenName, childInstance);
                    childDataCb(err);
                });
            }, createCb);
        }

        async.each(childrenNames, createParent, next);
    });
}

module.exports = {
    createPromiseCallback : createPromiseCallback,
    validateYoutubeId: validateYoutubeId,
    youtubeRegex : youtubeRegex,
    convertObjectIds : convertObjectIds,
    generateSlug : generateSlug,
    slugify : slugify,
    destroyRelations: destroyRelations,
    saveChildren : saveChildren
}
