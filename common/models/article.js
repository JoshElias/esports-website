module.exports = function(Article) {
  var utils = require("../../lib/utils");

  var foreignKeys = ["authorId"];
  Article.observe("persist", function(ctx, next) {

    utils.convertObjectIds(foreignKeys, ctx);
    next();
  });


  Article.afterRemote("**", function(ctx, modelInstance, next) {
      removePrivateFields(ctx, modelInstance, next);
  });


    // Filter out sensitive user information depending on ACL
    var privateFields = ["content", "oldComments", "photoNames",
        "oldRelatedArticles"];

    function removePrivateFields(ctx, modelInstance, finalCb) {
        var Role = Article.app.models.Role;
        var RoleMapping = Article.app.models.RoleMapping;
        var User = Article.app.models.user;
        
        // sets the private fields to false
        function removeFields() {
            if (ctx.result) {
                var answer;
                if (Array.isArray(modelInstance)) {
                    answer = ctx.result;
                    ctx.result.forEach(function (result) {
                        if(!isPremium(result))
                            return;

                        privateFields.forEach(function(privateField) {
                            if(typeof answer[privateField] !== "undefined") {
                                answer[privateField] = undefined;
                            }
                        });
                    });
                } else if(isPremium(ctx.result)) {
                    answer = ctx.result;
                    privateFields.forEach(function (privateField) {
                        if (typeof answer[privateField] !== "undefined") {
                            answer[privateField] = undefined;
                        }
                    });
                }
                ctx.result = answer;
            }
            finalCb();
        }

        function isPremium(article) {
            if(!article || !article.premium || !article.premium.isPremium || !article.premium.expiryDate)
                return false;

            var now = new Date();
            return now < article.premium.expiryDate;
        }

        if(!ctx || !ctx.req || !ctx.req.accessToken)
            return removeFields();

        User.isInRoles(["$owner", "$admin", "$premium", "$contentProvider"], function(err, isInRoles) {
            if(err) return finalCb();
            if(!isInRoles.all) return removeFields();
            else return finalCb();
        });
    };


  Article.validatesUniquenessOf('slug.url', {message: 'Slug url already exists'});
};
