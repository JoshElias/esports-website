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
    
    
    Guide.topGuide = function (filters, cb) {
        var limit = 10;
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
                
                if(!_.isEmpty(filters)) {
                    var heroFilter = {};
                    
                    if(filters.heroId || (!_.isEmpty(filters.roles) || !_.isEmpty(filters.universes))) {
                        heroFilter = {
                            where: {
                                id: filters.heroId
                            },
                            fields: {
                                id: true,
                                name: true
                            },
                            include: {
                                relation: "guides"
                            }
                        }
                    }
                    
                    if (filters.mapClassName) {
                        heroFilter.include = {
                            relation: "guides",
                            fields: {
                                id: true,
                                name: true
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
                    
                    if (filters.search == "" && (!_.isEmpty(filters.universes) || !_.isEmpty(filters.roles))) {
                        if(_.isUndefined(heroFilter.where))
                            heroFilter.where = {}
                        heroFilter.where.and = [];
                        
                        if (!_.isEmpty(filters.universes)) {
                            heroFilter.where.and.push({ universe: { inq: filters.universes } });
                        }

                        if (!_.isEmpty(filters.roles)) {
                            heroFilter.where.and.push({ role: { inq: filters.roles } });
                        }
                    } else if (filters.search != "") {
                        var pattern = '/.*'+filters.search+'.*/i';
                        if (_.isUndefined(heroFilter.where))
                            heroFilter.where = {};
                        
                        if(_.isUndefined(heroFilter.include))
                            heroFilter.include = {
                                relation: "guides"
                            }
                            
                        heroFilter.where.or = [
                            { name: { regexp: pattern } },
                            { description: { regexp: pattern } }
                        ]
                    }
                    
                    Hero.find(heroFilter, function (err, heroes) {
                        if (err)
                            return seriesCb(err);
                        
                        var ids = [];
                        if(filters.mapClassName) {
                            _.each(heroes, function (hero) {
                                var heroJSON = hero.toJSON();
                                _.each(heroJSON.guides, function (guide) {
                                    _.each(guide.maps, function (map) {
                                        if (map.className == filters.mapClassName)
                                            ids.push(guide.id);
                                    })
                                })
                            })
                        } else {
                            ids = _.map(heroes, function (hero) {
                                var heroJSON = hero.toJSON();

                                return _.map(heroJSON.guides, function (val) { return val.id; })
                            });
                        }
                        voteFilter.where['guideId'] = {
                            inq: _.flatten(ids)
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
                    
                    if(votes.length === 0)
                        return cb(err, null);
                    
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
            description: "Returns the guideId with the most votes, if a heroId is provided then will return the guide with the most votes for the particular hero. Filters take in { heroId, universes, role, mapClassName, search }",
            accepts: [
              {arg: 'filters', type: 'object', required:false, http: {source: 'query'}}
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
