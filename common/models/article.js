module.exports = function(Article) {
    var utils = require("../../lib/utils");


    var filter =  {
      fieldNames: ["content", "oldComments", "oldRelatedArticles"],
      acceptedRoles: ["$owner", "$admin", "$premium", "$contentProvider"]
    }
    Article.observe("loaded", utils.filterFields(filter));


    Article.observe("persist", function(ctx, next) {
        var data = ctx.data || ctx.instance;

        var uniqueErr = new Error('Article title must be unique');
        uniqueErr.statusCode = 422;
        uniqueErr.code = 'DUPLICATE_SLUG';

        if(data.slug && data.slug.url) {
            Article.find({where:{"slug.url":data.slug.url}}, function(err, articles) {
                if(err) return next(err);

                if(articles.length > 0) {
                    return next(uniqueErr);
                }

                return next();
            });
        }
    });
    //Article.validatesUniquenessOf('slug.url', {message: 'Slug url already exists'});
};
