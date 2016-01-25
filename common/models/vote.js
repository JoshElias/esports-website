var utils = require("./../../lib/utils");
var _ = require("underscore");

module.exports = function(Vote) {
    
    
     Vote.getScore = function(parentId, finalCb) {
         var properties = Vote.definition.properties;
         console.log(properties);
         console.log("?????????????????????????????????????????");
         
         _.each(properties, function (val, key) {
             var slicedProp = key.slice(key.length-2);
             
             if (slicedProp === "Id" || typeof slicedProp === "object") {
                 console.log(key + ": " + val);
             }
         })
         
         finalCb = finalCb || utils.createPromiseCallback();
         if (typeof this.parentId === "undefined") 
             return finalCb();

         
         
         Vote.find({ where: { parentId: this.parentId } }, function (data) {
             console.log(data);
             var tally = 0;
             
             _.each(data, function (val) {
                 tally += val.direction;
             });
         });
         
         
         return finalCb();
    };
    
    
    
     Vote.remoteMethod(
        'getScore',
        {
            description: "Get the calculated vote score of a parent model.",
            accepts: [
                {arg: 'parentId', type: 'array', required:true, http: {source: 'query'}}
             ],
            returns: {arg: 'score', type: 'number'},
            http: {verb: 'get'},
            isStatic: true
        }
    );
};
