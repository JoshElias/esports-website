var async = require("async");
var Promise = require("bluebird");
var resultCrawler = require("../../lib/result-crawler");
var reqCache = require("../../lib/req-cache");
var slugFuncs = require("./slug-funcs");
var packageJSON = require("./package");



module.exports = function(Model, mixinOptions) {

    Model.on("attached", function (obj) {
        Model.app.on("booted", function() {
            var ObjectId = Model.dataSource.connector.getDefaultIdType();
            var Slug = Model.app.models.slug;
            var foreignKeyName = Model.definition.name+"Id";

            // Add relation to slug model
            Model.hasMany(Slug, {as: "slugs", foreignKey: foreignKeyName});

            // Add properties and relations to slug model
            Slug.defineProperty(foreignKeyName, { type: ObjectId });
            Slug.belongsTo(Model, {as: "parent", foreignKey: foreignKeyName});
        });
    });


    // Ensure the request object on every type of hook
    Model.beforeRemote('**', function(ctx, modelInstance, next) {
        reqCache.setRequest(ctx);
        next();
    });


    Model.observe("access", function(ctx, next) {
        ctx.req = reqCache.getRequest();
        async.series([
            includeSlug(Model, ctx)
        ], next);
    });


    Model.observe("after save", function(ctx, next) {
        ctx.req = reqCache.getRequest();
        async.series([
            watchSlug(Model, mixinOptions, ctx)
        ], next);
    });




    Model.findBySlug = function(slug, options, finalCb) {
        if (finalCb === undefined && typeof options === "function") {
            finalCb = options;
            options = undefined;
        }

        finalCb = finalCb || new Promise();

        options = options || {};
        options.where = {};
        console.log("slug scope", options);
        var Slug = Model.app.models.slug;
        Slug.findOne({
            where: {
                "parentModelName": Model.definition.name,
                "slug": slug
            },
            include: {
                relation: "parent",
                scope: options
            }
        }, function(err, instance) {
            if(err) return finalCb(err);
            if(!instance || !instance.parent) {
                var noModelErr = new Error('unable to find model');
                noModelErr.statusCode = 404;
                noModelErr.code = 'MODEL_NOT_FOUND';
                return finalCb(noModelErr)
            }

            return finalCb(undefined, instance.parent);
        });

        return finalCb.promise;
    };


    Model.remoteMethod(
        "findBySlug",
        {
            description: "Finds model by slug",
            accepts: [
                {arg: "slug", type: "string", required:true, http: {source: 'query'}},
                {arg: "options", type: "object", http: {source: 'query'}},
            ],
            returns: { type: "object", root: true },
            http: {verb: 'get'},
            isStatic: true
        }
    );


    // add slug properties
    // add find by slug method
    // replace slug in where with findBySLug
    // include slugs
};


function watchSlug(Model, mixinOptions, ctx) {
    return function(finalCb) {

        mixinOptions.mixinName = packageJSON.mixinName;
        mixinOptions.primitiveHandler = primitiveHandler;

        console.log("SLUG MIXINS", mixinOptions.mixinName);
        return resultCrawler.crawl(Model, mixinOptions, ctx, null, finalCb);
    }
}


function primitiveHandler(state, mixinOptions, finalCb) {
console.log("handling slug")
    var model = state.ctx.model;
    var slugOptions = {};

    // Get options from modelConfig
    var modelSlugOptions = state.modelProperties[mixinOptions.mixinName];
    if(typeof modelSlugOptions === "object") {
        for(var key in modelSlugOptions) {
            slugOptions[key] = modelSlugOptions[key];
        }
    }

    // Add any potential options from the client
    if(state.ctx.req && state.ctx.req.body && typeof state.ctx.req.body.slugOptions === "object") {
        for(var key in state.ctx.req.body.slugOptions) {
            slugOptions[key] = state.ctx.req.body.slugOptions[key];
        }
    }

    // Is this a brand new model being saved
    if(state.ctx.isNewInstance) {
        return createSlug(state.ctx.instance, state, slugOptions, finalCb);
    }

    // Query all the relevant models
    var where = {};
    if(state.ctx.where && typeof state.ctx.where === "object") {
        where = state.ctx.where;
    } else if(typeof state.requestData === "object") {
        where = state.requestData;
    }

    var fields = { id: true };
    fields[state.key] = true;
    var query = {
        where: where,
        fields: fields
    };
    return model.find(query, function(err, instances) {
        if(err) return finalCb(err);
        else if(!Array.isArray(instances) || instances.length < 1) {
            return finalCb();
        }

        return async.each(instances, function(instance, instanceCb) {
            return instance.slugs({
                where: {
                    baseKey: state.key
                }
            }, function(err, slugs) {
                if (err) return instanceCb(err);
                else if(!Array.isArray(slugs) || slugs.length < 1) {
                    return createSlug(instance, state, slugOptions, instanceCb)
                }

                return async.each(slugs, function(slug, slugCb) {
                    return updateSlug(slug, instance, state, slugOptions, slugCb);
                }, instanceCb);
            });
        }, finalCb);
    });
}

function createSlug(instance, state, slugOptions, finalCb) {

    var linked = (  slugOptions.linked === undefined
    || slugOptions.linked === null  )
        ? true : slugOptions.linked;
    var slug = (!linked && typeof slugOptions.slug === "string")
        ? slugOptions.slug : slugify(state.data);

    // Add slug modifiers
    var prefixFunc = slugFuncs[slugOptions.prefixFunc];
    if(typeof prefixFunc === "function") {
        slug = prefixFunc(instance) + slug;
    } else if(typeof slugOptions.prefix === "string") {
        slug = slugOptions.prefix + slug;
    }

    return instance.slugs.create({
        slug: slug,
        linked: linked,
        baseKey: state.key,
        parentModelName: state.modelName
    }, finalCb);
}

function updateSlug(slugInstance, instance, state, slugOptions, finalCb) {
    var changes = {};

    // Did the user include linked option?
    var linked;
    if(slugOptions.linked !== undefined || slugOptions.linked !== null) {
        linked = slugOptions.linked
    }

    // Has the linked value changed?
    if(linked !== undefined && linked !== slugInstance.linked) {
        changes.linked = linked;
    } else if(linked === undefined) {
        linked = slugInstance.linked;
    }

    // Has the slug changed?
    var slug = slugify(state.data);

    // Add slug modifiers
    var prefixFunc = slugFuncs[slugOptions.prefixFunc];
    if(typeof prefixFunc === "function") {
        slug += prefixFunc(instance);
    } else if(typeof slugOptions.prefix === "string") {
        slug += slugOptions.prefix;
    }

    if(linked && (slug !== slugInstance.slug)) {
        changes.slug = slug;
    } else if(!linked && (slugOptions.slug !== slugInstance.slug)) {
        changes.slug = slugOptions.slug;
    }

    // Do we need to apply updates?
    if(Object.keys(changes).length < 1) {
        return finalCb();
    }

    return slugInstance.updateAttributes(changes, finalCb);
}


function slugify(string) {
    return (string) ? string.toLowerCase().replace(/-+/g, '').replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') : '';
};



function includeSlug(Model, ctx) {
    return function(finalCb) {

        if(!ctx.query.where || typeof ctx.query.where.slug !== "string") {
            return finalCb();
        }

        return Model.findBySlug(ctx.query.where.slug, ctx.query, finalCb);
    }
}