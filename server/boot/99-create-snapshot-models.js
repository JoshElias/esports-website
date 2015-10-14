
var async = require("async");

module.exports = function(server) {
/*
		var Snapshot = server.models.snapshot;
	  var DeckTier = server.models.deckTier;
		var DeckTech = server.models.deckTech;
		var CardTech = server.models.cardTech;
		var SnapshotAuthor = server.models.snapshotAuthor;
		var DeckMatchup = server.models.deckMatchup;

    async.waterfall([
    	// Get all snapshots
    	function(seriesCallback) {
    		console.log("Finding users");
    		Snapshot.find({}, seriesCallback);
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




		function convertSnapshot(snapshot, finalCallback) {
			async.waterfall([


			],
			function(err) {
				if(err) console.log(err);
				else console.log("finished processing snapshot");
				finalCallback(err);
			});
		}

		function createDeckTier(snapshot, finalCallback) {
			async.eachSeries(snapshot.tiers, function(tier, seriesCallback) {
				snapshot.deckTiers = [];
				async.eachSeries(tier.decks, function(deck, innerCallback) {
					try {
						var deckTier = {
							description: deck.explanation,
							weeklyNotes: deck.weeklyNotes,
							deckId: deck.deck,
							tier: tier.tier,
							ranks: deck.rank.last
						}
					} catch(err) {
						innerCallback(err);
					}

					DeckTier.insert(deckTier, function(err, newDeckTier) {
						if(newDeckTier) snapshot.deckTiers.push(newDeckTier);
						innerCallback(err);
					});
				}, seriesCallback);
			}, finalCallback);
		}

		function createDeckTech(snapshot, finalCallback) {
			async.eachSeries(snapshot.tiers, function(tier, seriesCallback) {
				async.eachSeries(tier.decks, function(deck, innerCallback) {
					async.eachSeries(deck.tech, function(tech, superInnerCallback) {
						try {
							var deckTech = {
								title: tech.title,
								orderNum: tech.orderNum,
								deckId: deck.deck,

							}
						} catch(err) {
							innerCallback(err);
						}

						DeckTech.insert(deckTech, function(err) {
							innerCallback(err);
						});


					}, innerCallback);
				}, seriesCallback);
			}, finalCallback);
		}

		function createCardTech(snapshot, finalCallback) {

		}

		function createSnapshotAuthor(snapshot, finalCallback) {

		}

		function createDeckMatchup(snapshot, finalCallback) {

		}
*/

};
