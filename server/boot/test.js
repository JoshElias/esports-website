


module.exports = function(server) {
/*
    var UserIdentity = server.models.UserIdentity;

    UserIdentity.find({include:"user"}, function(err, userIdentities) {
        if(err) {
            console.error(err);
        } else {
            console.log("USerIds:", userIdentities);
        }
    });

    var query = {};
    query.where = {
        "slug.url" : "arena-mastery-with-ratsmah-druid-drafting-tips-and-trick"
    }

    query.include = [{
        relation: "author",
        scope: {
            fields: {
                username: true,
                id: false
            }
        }
    },
    {
        relation: "relatedArticles",
        scope: {
            fields: {
                title: true,
                slug: true,
                isActive: true,
                createdDate: true,
                id: false
            }
        }
    },
    {
        relation: "comments",
        scope: {
            fields: {
                text: true,
                createdDate: true,
                votesCount: true,
                votes: true,
                id: false
            },
            include: {
                relation: "author",
                scope: {
                    fields: {
                        username: true,
                        email: true
                    }
                }
            }
        }
    },
    {
        relation: "deck",
        scope: {
            fields: {
                id: false,
                cardQuantities: true
            },
            include : "cards"
        }      
    }];
  
    return server.models.article.findOne(query, function(err, results) {
        if(err) console.log("err:",err);
    	console.log("WTF results:",results);
    });
    */
};