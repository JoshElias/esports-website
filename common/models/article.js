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
    var privateFields = ["content", "oldComments", "oldRelatedArticles"];

    function removePrivateFields(ctx, modelInstance, finalCb) {
        var Role = Article.app.models.Role;
        var RoleMapping = Article.app.models.RoleMapping;
        var User = Article.app.models.user;
        
        // sets the private fields to false
        function removeFields() {
            if (ctx.result) {
                var answer;
                if (Array.isArray(modelInstance)) {
                    answer = [];
                    ctx.result.forEach(function (result) {
                        if(!isPremium(result)) {
                            answer.push(result);
                            return;
                        }
                        
                        var replacement = {};
                        for(var key in result) {
                            if(privateFields.indexOf(key) === -1) {
                                replacement[key] = result[key];
                            }
                        }
                        answer.push(replacement);
                    });
                } else if(isPremium(ctx.result)) {
                    answer = {};
                    for(var key in ctx.result) {
                        if(privateFields.indexOf(key) === -1) {
                            answer[key] = ctx.result[key];
                        }
                    }
                } 
              
                if (typeof answer !== "undefined") {
                  ctx.result = answer;
                }
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

        User.isInRoles(ctx.req.accessToken.userId.toString(), ["$owner", "$admin", "$premium", "$contentProvider"], function(err, isInRoles) {
            if(err) return finalCb();
            if(isInRoles.none) return removeFields();
            else return finalCb();
        });
    };


  Article.validatesUniquenessOf('slug.url', {message: 'Slug url already exists'});
};
