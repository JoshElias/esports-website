
var async = require("async");

var talentsAdded = 0;
module.exports = function(server) {
    /*
    var Guide = server.models.guide;
    var Hero = server.models.hero;

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
					console.log("old heroes:", guide.oldHeroes);
          async.eachSeries(guide.oldHeroes, function(hero, innerCallback) {
            console.log("searching on hero id:" , require("util").inspect(hero, { showHidden: true, depth: null }));
            Hero.findById(hero.hero, function(err, heroInstance) {
              if(err) innerCallback(err);
              else {
                console.log("added hero:", heroInstance.name);
                console.log("to guide:", guide.name);
                heroInstance.guides.add(guide, function(err) {
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
