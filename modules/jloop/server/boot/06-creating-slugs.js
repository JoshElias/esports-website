var async = require("async");


module.exports = function(server) {

    var Article = server.models.article;
    var Slug = server.models.slug;
    var Sluggable = server.models.sluggable;

    async.waterfall([
        // Create article
        function (seriesCb) {
            return Article.create({
                title: "tits-at-the-bar",
                content: "rip",
                isActive: true
            }, seriesCb);
        },
        // Add Slug
        function (article, seriesCb) {
            console.log("new article", article);
            return article.slugs.create({
                slug: "tits-at-the-bar",
                linked: true,
                baseKey: "title"
            }, function(err, newSlug) {
                if(err) return seriesCb(err);

                console.log("new slug", newSlug);
                return seriesCb(undefined, {
                    article: article,
                    slug: newSlug
                });
            });
        },
        // Test the article's include
        function (models, seriesCb) {
            return Article.findById(models.article.id, {
                include: "slugs"
            }, function(err, article) {
                if(err) return seriesCb(err);

                console.log("article include", article);
                return seriesCb(undefined, models);
            });
        },
        // Test the slug's include
        function (models, seriesCb) {
            return Slug.findById(models.slug.id, {
                include: "articles"
            }, function(err, slug) {
                if(err) return seriesCb(err);

                console.log("slug include", slug);
                return seriesCb(undefined, models);
            });
        },
        // Delete the article's slugs
        function (models, seriesCb) {
            return models.article.slugs.destroyAll(function(err) {
                if(err) return seriesCb(err);

                console.log("deleted all slugs");
                return seriesCb(undefined, models);
            });
        },
        // Delete the article
        function (models, seriesCb) {
            return Article.deleteById(models.article.id, function(err) {
                if(!err) console.log("deleted article");
                return seriesCb(err);
            });
        }
    ],
    function (err) {
        if(err) console.log("ERR testing slugs", err);
        else console.log("Successfully tested slugs");
    });
};
