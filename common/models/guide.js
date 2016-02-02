module.exports = function(Guide) {
    var utils = require("../../lib/utils");
    var _ = require('underscore');
    var async = require('async');

    var funcs = [/*utils.validateYoutubeId,*/ utils.generateSlug('name')];
    Guide.observe("before save", function(ctx, next) {
        async.each(funcs, function(func, funcCB) {
            func(ctx, funcCB);
        }, next);
    });

//    Guide.observe("before save", utils.generateSlug("name"));


    var fieldFilter = {
        fieldNames: ["allowComments", "description", "chapters",
            "oldCards", "oldComments", "oldMulligans", "content"],
        acceptedRoles: ["$owner", "$admin", "$premium", "$contentProvider"]
    };
    Guide.observe("loaded", utils.filterFields(fieldFilter));
    
    
    Guide.topGuide = function (heroId, mapClassName, cb) {
        var limit = 20;
        var iter = 1;
        var Vote = Guide.app.models.vote;
        var Hero = Guide.app.models.hero;
        var queryGuides = function (ids, findCb) {
            Guide.find({
                where: {
                    id: {
                        inq: ids
                    }
                },
                fields: {
                    id: true,
                    guideType: true
                },
                include: ['votes']
            }, function (err, guides) {
                if (err) 
                    return findCb(err);
                
                _.each(guides, function (guide) { 
                    var guideJSON = guide.toJSON();
                    guide.voteScore = 0;
                    
                    _.each(guideJSON.votes, function (vote) {
                        guide.voteScore += vote.direction;
                    })
                });
                return findCb(undefined, guides);
            })
        }
        
        var findTopGuide = function (arr, seriesCb) {
            var sorted = _.sortBy(arr, 'score');
            var limited = sorted.slice((sorted.length-(limit*iter)), sorted.length-(limit*(iter-1)));
            var ids = limited = _.map(limited, function (val) { return val.id });

            queryGuides(ids, function (err, guides) {
                if (err) 
                    return seriesCb(err);

                var sortedGuides = _.sortBy(guides, function (val) { return val.voteScore; });
                var i = sortedGuides.length;
                while (i-- > 0) {
                    if (sortedGuides[i].guideType === 'hero')
                        return seriesCb(undefined, sortedGuides[i].id);
                }
                iter++;
                return findTopGuide(arr, seriesCb);
            });
        }
                
        async.waterfall([
            function (seriesCb) {
                var voteFilter = {
                    where: {
                        guideId: { exists: true }
                    }
                }
                var mapClassName = "towers-of-doom"
                var heroId = "55076f1f515139ec1b3ebb43"
                if(heroId) {
                    var heroFilter = {
                        where: {
                            id: heroId
                        },
                        fields: {
                            id: true,
                            name: true
                        },
                        include: "guides"
                    }
                    
                    if (mapClassName) {
                        heroFilter.include = {
                            relation: "guides",
                            fields: {
                                id: true
                            },
                            scope: {
                                include: {
                                    relation: "maps",
                                    fields: {
                                        id: true
                                    }
                                }
                            }
                        }
                    }
                    
                    Hero.findOne(heroFilter, function (err, hero) {
                        if (err)
                            return seriesCb(err);
                        
                        var heroJSON = hero.toJSON();
                        var ids = [];
                        if(mapClassName) {
                            fitleredGuides = _.filter(heroJSON.guides, function (guide) {
                                return _.find(guide.maps, function (map) {
                                    return (map.className === mapClassName)
                                })
                            });
                            
                            ids = _.map(fitleredGuides, function (val) {
                                return val.id;
                            })
                        } else {
                            ids = _.map(heroJSON.guides, function (val) { return val.id; });
                        }
                        voteFilter.where['guideId'] = {
                            inq: ids
                        }
                        
                        return seriesCb(undefined, voteFilter);
                    })
                } else {
                    seriesCb(undefined, voteFilter);
                }
            },
            function (filter, seriesCb) {
                var order = {};
                var arr = [];
                
                Vote.find(filter, function (err, votes) {
                    if (err)
                        return seriesCb(err);
                    
                    _.each(votes, function (vote) {
                        var id = vote.guideId;

                        order[id] = (_.isUndefined(order[id])) ? vote.direction : (order[id] + vote.direction);
                    });
                    
                    _.each(order, function (val, key) {
                        var temp = { id: key, score: val };
                        
                        arr.push(temp);
                    })
                    
                    return seriesCb(err, arr);
                });
            },
            findTopGuide
        ], cb)
        
    }
    
    
    
    
    Guide.remoteMethod(
        'topGuide',
        {
            description: "Returns the guideId with the most votes, if a heroId is provided then will return the guide with the most votes for the particular hero.",
            accepts: [
              {arg: 'heroId', type: 'string', required:false, http: {source: 'query'}},
              {arg: 'mapClassName', type: 'string', required:false, http: {source: 'query'}}
            ],
            http: {verb: 'get'},
            isStatic: true,
            returns: { arg: 'id', type: 'string' }
        }
    );

    /*
    var docFilter =  {
        acceptedRoles: ["$owner", "$admin"],
        filter: {
            isPublic : true
        }
    };
    */
//    Guide.observe("access", utils.filterDocs(docFilter))
};
