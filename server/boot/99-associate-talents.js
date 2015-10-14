
var async = require("async");

var talentsAdded = 0;
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
            console.log("searching on talent name:",talent.name)
            Talent.findOne({where:{name:talent.name}}, function(err, talentInstance) {
              if(err) innerCallback(err);
              else {
                console.log("added talent Instance:", talentInstance.name);
                console.log("to hero:", hero.name);
                talentInstance.heroes.add(hero, function(err) {
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
