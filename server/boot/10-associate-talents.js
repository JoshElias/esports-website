
var async = require("async");


module.exports = function(server) {
  /*
	 var Talent = server.models.talent;
    var Hero = server.models.hero;

    async.waterfall([
    	// Get all the users
    	function(seriesCallback) {
    		console.log("Finding users");
    		Hero.find({}, seriesCallback);
    	},
    	// Create user identity for each user
    	function(heros, seriesCallback) {
    		console.log("creating user identies");
    		async.eachSeries(heros, function(hero, callback) {
          async.eachSeries(hero.oldTalents, function(talent, innerCallback) {
            Talent.findOne({_id:talent._id}, function(err, talentInstance) {
                hero.talents.add(talentInstance, function(err) {
                  console.log("added new herotalent")
                  innerCallback(err);
                });
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
