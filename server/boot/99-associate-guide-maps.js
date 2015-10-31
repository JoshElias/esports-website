
var async = require("async");

module.exports = function(server) {
/*
	  var Guide = server.models.guide;
    var Map = server.models.map;

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
          async.eachSeries(guide.oldMaps, function(mapId, innerCallback) {
            console.log("searching on map name:" , mapId)
            Map.findOne({where:{id:mapId}}, function(err, mapInstance) {
              if(err) innerCallback(err);
              else {
                console.log("added map Instance:", mapInstance);
                console.log("to guide:", guide.name);
                mapInstance.guides.add(guide, function(err) {
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
