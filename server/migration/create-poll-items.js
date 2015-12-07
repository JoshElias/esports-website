var async = require("async");

module.exports = function(server) {
    
//    var Poll = server.models.poll;
//    var PollItem = server.models.pollItem;
//    
//    async.waterfall([
//        function (waterfallCb) {
//            console.log("finding polls");
//            Poll.find({}, waterfallCb);
//        }, 
//        function (polls, waterfallCb) {
//            async.each(polls, function (poll, outerEachCb) {
//              console.log("on poll:", poll.id);
//                var items = poll.oldItems;
//                
//                async.each(items, function (item, innerEachCb) {
//                    item.pollId = poll.id
//                    
//                    PollItem.create(item, function (err, newPollItem) {
//                        if (err) { console.log(err); }
//                        else { console.log("Successfully created newPollItem: " + newPollItem.id); }
//                        
//                        return(innerEachCb(err));
//                    })
//                }, outerEachCb)
//            }, waterfallCb)
//        }
//    ], function (err) {
//      if (err) { console.log(err); }
//      return;
//    })
    
};