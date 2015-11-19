
var async = require("async");

var talentsAdded = 0;
module.exports = function(server) {
    /*
	 var Talent = server.models.talent;
    var Hero = server.models.hero;
    var Guide = server.models.guide;

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
    	},
      function(seriesCallback) {
    		Guide.find({}, seriesCallback);
    	},
    	// Create user identity for each user
    	function(guides, seriesCallback) {
    		console.log("creating user identies");
				var talentsTiers = {};
				async.eachSeries(guides, function(guide, callback) {
					console.log("resetting talent tiers");
					talentTiers = {};
          async.eachSeries(guide.oldHeroes, function(hero, innerCallback) {
						console.log("assinging hero:",hero.hero);
						talentTiers[hero.hero] = {};
						Hero.findById(hero.hero, function(err, heroInstance) {
            if(err) innerCallback(err);
            else if (!heroInstance) innerCallback("unable to find hero instance");
            else {
              async.eachSeries(hero.talents, function(talent, superInnerCallback) {
                var relevantTalent;
                for(var key in heroInstance.oldTalents) {
                  var oldTalent = heroInstance.oldTalents[key];
                  if(typeof oldTalent === "function") continue;
                  //console.log("oldTalent id:", oldTalent._id.toString());
                  //console.log("talent id:", talent.toString());
                  if(talent.toString() === oldTalent._id.toString()) {
                    relevantTalent = oldTalent;
                    break;
                  }
                }

								if(!relevantTalent) {
									superInnerCallback();
									return;
								}

                Talent.findOne({where:{name:relevantTalent.name}}, function(err, talentInstance) {
                  if(err) superInnerCallback(err);
                  else if(!talentInstance) superInnerCallback("Unable to find talent instance");
                  else {
										console.log("hero id: ", hero.hero);
										console.log("assinging tier:", relevantTalent.tier);
										console.log("talent id: ", talentInstance.id);
										talentTiers[hero.hero][relevantTalent.tier] = talentInstance.id
										superInnerCallback();
                  }
                });
              }, innerCallback);
            }
          })
				}, function(err) {
					console.log("talent Tiers:", talentTiers);
					guide.updateAttribute("talentTiers", talentTiers, function(err) {
						callback(err);
					});
				});
    }, seriesCallback)
	}],
  function(err) {
    if(err) console.log("ERR creating user identities:", err);
    else console.log("Donerino");
  });
  */
};
