
var async = require("async");

module.exports = function(server) {
/*
    var Article = server.models.article;

    Article.find({}, function(err, articles) {
        if(err) {
            console.log("err finding articles");
            return;
        }

        console.log("articles length:",articles.length);
        async.eachSeries(articles, async.ensureAsync(function(article, callback) {
            console.log("iterating on article:", article.id);
            async.eachSeries(article.oldRelatedArticles, async.ensureAsync(function(relatedArticleId, innerCallback) {
                console.log("iterating on reply:", relatedArticleId);
                Article.findById(relatedArticleId, function(err, relatedArticleInstance) {
                    if(err) innerCallback(err);
                    else {
                        article.relatedArticles.add(relatedArticleInstance, function(err) {
                            if(!err) console.log("added parent ID:"+article.id.toString()+" to relatedArticle:"+relatedArticleId.toString());
                            innerCallback(err);
                        });
                    }
                });

            }), callback);
        }), function(err) {
            if(err) console.log("ERR adding parentCommentIds to comments:", err);
            console.log("donnerino");
        })
    });
    */
};
