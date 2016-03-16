var utils = require("../../server/lib/utils");


module.exports = function(Slug) {


    Slug.observe("before save", function(ctx, finalCb) {

        console.log("ctx keys", Object.keys(ctx));
        return finalCb();
        /*
        var data = ctx.data || ctx.instance["__data"];

        // Get the parent object that this slug is for
        var foreignKey = utils.getFirstForeignKey(data);
        var foreignId = data[foreignKey];
        var modelName = utils.modelNameFromForeignKey(foreignKey);
        var model = ctx.Model.app.models[modelName];

        ctx.Model.findbyId(foreignId, function(err, parent) {

        });




        // Are we creating this slug?
        var isNewInstance = ctx.isNewInstance;

        if(isNewInstance) {
            var data = ctx.data || ctx.instance["__data"];

            if(data.linked) {
                var foreignKey = utils.getFirstForeignKey(data);
                var foreignId = data[foreignKey];
                var modelName = utils.modelNameFromForeignKey(foreignKey);
                var model = ctx.Model.app.models[modelName];
                var baseKey = data.baseKey;
                var slug = data.slug;


                // Check for uniqueness
                Slug.find({
                    where:{
                        slug: slug
                    },
                    limit: 1
                }, function(err, slugs) {

                });
            }
        }

        // Are we updating the slug?
        var slug = ctx.data.slug || ctx.instance["__data"].slug;

        // Check if this slug is based on a key
        var basedKey = ctx.data.baseKey || ctx.instance["__data"].baseKey;

        */
    });
};
