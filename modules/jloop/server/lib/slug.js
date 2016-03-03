function slugify(string) {
    return (string) ? string.toLowerCase().replace(/-+/g, '').replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') : '';
};

function generateSlug(sourceKey) {
    return function(ctx, next) {
        var properties = ctx.Model.definition.rawProperties;
        var data;
        var newName;

        if(typeof ctx.data === "object" && typeof ctx.data[sourceKey] === "string") {
            newName = ctx.data[sourceKey];
            data = ctx.data;
        } else if(typeof ctx.instance === "object" && typeof ctx.instance[sourceKey] === "string") {
            newName = ctx.instance[sourceKey];
            data = ctx.instance;
        }

        if (typeof data === "undefined") {
            return next();
        }
        if (typeof data.slug === "object" && typeof data.slug.linked !== "undefined" && !data.slug.linked) {
            return next();
        }
        // If we generated a new slug, update it
        if(typeof data === "object" && typeof newName === "string") {
            var newSlug = slugify(newName);
            if(!ctx.data) {
                ctx.data = {}
            }
            // Determine if we're updating slug or slug.url
            var slugConfig = properties.slug;
            if (typeof slugConfig === "object"
                && (typeof slugConfig.type === "undefined"
                || typeof slugConfig.type === "object"
                || slugConfig.type === "object")) {

                if (ctx.currentInstance && ctx.currentInstance.slug && !ctx.currentInstance.slug.linked) {
                    return next();
                }

                if (typeof data.slug !== "object") {
                    var clientSlugLinked = (data.slug  && typeof data.slug.linked !== "undefined")
                        ? typeof data.slug.linked : undefined;
                    var currentSlugLinked = (ctx.currentInstance
                    && ctx.currentInstance.slug
                    && typeof ctx.currentInstance.slug.linked !== "undefined")
                        ? typeof ctx.currentInstance.slug.linked : undefined;
                    var linked = clientSlugLinked || currentSlugLinked;

                    data.slug = {
                        linked: linked
                    }
                } else {
                    data.slug.url = newSlug;
                }
            } else {
                data.slug = newSlug;
            }
        }

        return next();
    }
};