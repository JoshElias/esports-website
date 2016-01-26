var utils = require("./../../lib/utils");
var _ = require("underscore");
var ObjectID = require("mongodb").ObjectID;

module.exports = function(Vote) {
    
     Vote.getScore = function(parentId, finalCb) {
         finalCb = finalCb || utils.createPromiseCallback();
         if (typeof parentId === "undefined") 
             return finalCb();
         
         var properties = Vote.definition.rawProperties;
         var where = {
             or: []
         };

         _.each(properties, function (val, key) {
             var slicedProp = key.slice(key.length-2);
             if (slicedProp === "Id" || typeof slicedProp === "object") {
                var newCase = {};
                    newCase[key] = new ObjectID(parentId);
                 
                where.or.push(newCase);
             }
         });
         
         Vote.find({ where: where }, function (err, data) {
             if (err) {
                 console.log("err", err); 
                 return finalCb(err);
             }
             
             var tally = 0;
             
             _.each(data, function (val) {
                tally += val.direction;
             });
             
             return finalCb(undefined, tally);
         });
    };
    
    Vote.hasVoted = function(uid, parentId, finalCb) {
        finalCb = finalCb || utils.createPromiseCallback();
        if (typeof uid === "undefined" || typeof parentId === "undefined")
            return finalCb();
        
        var properties = Vote.definition.rawProperties;
        var or = []
        

        _.each(properties, function (val, key) {
            var slicedProp = key.slice(key.length-2);
            if (slicedProp === "Id" || typeof slicedProp === "object") {
                var newCase = {};
                    newCase[key] = new ObjectID(parentId);

                or.push(newCase);
            }
        });
        var where = {
            and: [
                { or: or },
                { authorId: uid }
            ]
        };
        
        Vote.find({ where: where }, function (err, data) {
            if (err) {
                console.log(err);
                return finalCb(err);
            }
            
            if (_.isEmpty(data)) { 
                data = 0;
            } else {
                data = data[0].direction;
            }
            
            return finalCb(undefined, data);
        });
    }
    
     Vote.remoteMethod(
        'getScore',
        {
            description: "Get the calculated vote score of a parent model.",
            accepts: [
                {arg: 'parentId', type: 'string', required:true, http: {source: 'query'}}
             ],
            returns: [
                {arg: 'score', type: 'number'}
            ],
            http: {verb: 'get'},
            isStatic: true
        }
    );
    
    Vote.remoteMethod(
        'hasVoted',
        {
            description: "Takes a uid and a parentId and returns if the user has voted",
            accepts: [
                {arg: 'uid', type: 'string', required:false, http: {source: 'query'}},
                {arg: 'parentId', type: 'string', required:true, http: {source: 'query'}}
             ],
            returns: [
                {arg: 'hasVoted', type: 'number'},
            ],
            http: {verb: 'get'},
            isStatic: true
        }
    );
};
