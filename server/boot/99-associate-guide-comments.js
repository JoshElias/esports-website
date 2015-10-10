
var async = require("async");

module.exports = function(server) {
/*
	  var Guide = server.models.guide;
    var Comment = server.models.comment;

    async.waterfall([
    	// Get all the users
    	function(seriesCallback) {
    		console.log("Finding users");
    		Guide.find({}, seriesCallback);
    	},
    	// Create user identity for each user
    	function(guides, seriesCallback) {
    		console.log("creating user identies");
    		async.eachSeries(guides, function(guide, callback) {
          async.eachSeries(guide.oldComments, function(commentId, innerCallback) {
            console.log("searching on comment name:" , commentId)
            Comment.findOne({where:{id:commentId}}, function(err, commentInstance) {
              if(err) innerCallback(err);
              else {
                console.log("added map Instance:", commentInstance);
                console.log("to guide:", guide.id);
                commentInstance.updateAttribute("guideId", guide.id, function(err) {
                  if(err) console.log(err);
                   innerCallback(err);
                });
              }
            });
          }, callback);
			  }, seriesCallback);
    	}],
    function(err) {
    	if(err) console.log("ERR creating user identities:", err);
    	else console.log("Donerino");
    });
		*/
};
