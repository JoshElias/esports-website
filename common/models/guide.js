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
    
    
    Guide.topGuide = function (heroId, cb) {
        var getGuide = function (sortedIds, topCb) {
            var topId = sortedIds[sortedIds.length-1];
            var filter = {
                where: {
                    id: topId.id
                }
            }
            
            Guide.findOne(filter, function (err, guide) {
                if (guide.guideType === "map") {
                    console.log("found a map guide, moving on");
                    sortedIds.pop();
                    return getGuide(sortedIds, topCb);
                } else {
                    return topCb(err, guide);
                }
                    
            });
        }
                
        async.waterfall([
            function (seriesCb) {
                var Vote = Guide.app.models.vote;
                var order = {};
                var arr = [];
                var filter = {
                    where: {
                        guideId: { exists: true }
                    }
                }
                
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
            function (arr, seriesCb) {
                var sorted = _.sortBy(arr, 'score');
                
                getGuide(sorted, seriesCb);
            }
        ], cb)
        
    }
    
    
    
    
    Guide.remoteMethod(
        'topGuide',
        {
            description: "Returns the guide with the most votes, if a heroId is provided then will return the guide with the most votes for the particular hero.",
            accepts: {arg: 'heroId', type: 'string', required:false, http: {source: 'query'}},
            http: {verb: 'get'},
            isStatic: true,
            returns: {arg: 'guide', type: 'object'}
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
