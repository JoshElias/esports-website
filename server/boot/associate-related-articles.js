
var async = require("async");

module.exports = function(server) {
/*
    var Article = server.models.article;

    Article.find({}, function(err, articles) {
        if(err) {
            console.log("err finding articles");
            return;
        }

        async.eachSeries(articles, async.ensureAsync(function(article, callback) {
            async.eachSeries(article.oldRelatedArticles, async.ensureAsync(function(relatedArticleId, innerCallback) {
                Article.findById(relatedArticleId, function(err, relatedArticleInstance) {
                    if(err) innerCallback(err);
                    else {
                        article.relatedArticles.add(relatedArticleInstance, function(err) {
                            if(!err) console.log("added parent ID:"+article.id.toString()+" to relatedArticle:"+relatedArticleId.toString());
                            else console.log("fuck this err:", err);
                            innerCallback();
                        });
                    }
                });

            }), callback);
        }), function(err) {
            if(err) console.log("ERR adding fuck to fuck:", err);
            else console.log("donnerino");
        })
    });
*/
};
