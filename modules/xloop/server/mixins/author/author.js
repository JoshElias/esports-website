var async = require("async");
var loopback = require("loopback");
var reqCache = require("../../lib/req-cache");
var packageJSON = require("./package");


var AUTHOR_DEFAULT_NAME = "author";


module.exports = function(Model, mixinOptions) {

    mixinOptions = mixinOptions || {};
    var authorName = mixinOptions.authorName || AUTHOR_DEFAULT_NAME;
    var foreignKeyName = authorName+"Id";
    var plural = Model.definition.settings.plural || Model.definition.name + "s";
    console.log("Author plural", plural)

    Model.on("attached", function (obj) {
        Model.app.on("booted", function() {

            var ObjectId = Model.dataSource.connector.getDefaultIdType();
            var User = Model.app.models.user;

            // Add properties and relations to mixin model
            Model.defineProperty(foreignKeyName, { type: ObjectId });
            Model.belongsTo(User, {as: authorName, foreignKey: foreignKeyName});

            // Add properties and relations to slug model
            User.hasMany(Model, {as: plural, foreignKey: foreignKeyName});
        });
    });


    // Ensure the request object on every type of hook
    Model.beforeRemote('**', function(ctx, modelInstance, next) {
        reqCache.setRequest(ctx);
        next();
    });


    // Destroy any relations upon relations
    Model.observe("after save", function(ctx, next) {
        return next();
        ctx.req = reqCache.getRequest();
        async.series([
           // destroyOnDelete(Model, ctx)
        ], next);
    });
};


