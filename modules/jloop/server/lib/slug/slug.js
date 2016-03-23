var async = require("async");
var requestCrawler = require("./../request-crawler");
var slugFuncs = require("./slug-funcs");
var app = require("../../../../../server/server");


var SLUG_GENERATE_FEATURE_KEY = "$slug";
var SLUG_MODEL_NAME = "slug";


function handleSlug(ctx, finalCb) {

    var filterOptions = {
        featureKey: SLUG_GENERATE_FEATURE_KEY
    };
    filterOptions.primitiveHandler = primitiveHandler;

    return requestCrawler.crawl(ctx, filterOptions, finalCb);
}


function primitiveHandler(state, finalCb) {

    var model = state.model;
    var slugOptions = {};

    // Get options from modelConfig
    var modelSlugOptions = state.modelProperties[SLUG_GENERATE_FEATURE_KEY];
    if(typeof modelSlugOptions === "object") {
        for(var key in modelSlugOptions) {
            slugOptions[key] = modelSlugOptions[key];
        }
    }

    // Add any potential options from the client
    if(state.ctx.req && state.ctx.req.body && typeof state.ctx.req.body.slugOptions === "object") {
        for(var key in state.ctx.req.body.slugOptions ) {
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



module.exports = {
    handleSlug: handleSlug,
    slugify: slugify
};
