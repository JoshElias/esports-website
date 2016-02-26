module.exports = function(Article) {
    var utils = require(".././utils");
    var async = require('async');
  
//    var funcs = [/*utils.validateYoutubeId,*/ utils.generateSlug('title')];
    Article.observe("before save", utils.generateSlug('title'));
  
    var filter =  {
      fieldNames: ["content", "oldComments", "oldRelatedArticles"],
      acceptedRoles: ["$owner", "$admin", "$premium", "$contentProvider"]
    };
    Article.observe("loaded", utils.filterFields(filter));

/*
    Article.observe("persist", function(ctx, next) {
        var data = ctx.data || ctx.instance;

        // Validate unique slug.url
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
    });*/
    //Article.validatesUniquenessOf('slug.url', {message: 'Slug url already exists'});
};
