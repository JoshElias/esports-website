
var async = require("async");

var talentsAdded = 0;
module.exports = function(server) {
  /*
	 var Talent = server.models.talent;
    var Hero = server.models.hero;

    async.waterfall([
    	// Get all the users
    	function(seriesCallback) {
    		Hero.find({}, seriesCallback);
    	},
    	// Create user identity for each user
    	function(heros, seriesCallback) {
    		console.log("creating user identies");
    		async.eachSeries(heros, function(hero, callback) {
          var talentTiers = {};
          async.eachSeries(hero.oldTalents, function(talent, innerCallback) {
            Talent.findOne({where:{name:talent.name}}, function(err, talentInstance) {
              if(err) innerCallback(err);
              else {
                talentTiers[talentInstance.id] = talent.tier;
                innerCallback();
              }
            });
          }, function(err) {
            hero.updateAttribute("talentTiers", talentTiers, function(err) {
              callback(err);
            });
          });
			  }, seriesCallback);
    	}],
    function(err) {
    	if(err) console.log("ERR creating user identities:", err);
    	else console.log("Donerino");
    });
    */
};
