
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
    		Snapshot.find({}, seriesCallback);
    	},
    	// Create user identity for each user
    	function(snapshots, seriesCallback) {
    		async.eachSeries(snapshots, function(snapshot, callback) {
					convertSnapshot(snapshot, callback);
			  }, seriesCallback);
    	}],
    function(err) {
    	if(err) console.log("ERR creating user identities:", err);
    	else console.log("Donerino");
    });

		function convertSnapshot(snapshot, finalCallback) {
			async.waterfall([
				function(seriesCallback) {
					createDeckTier(snapshot, seriesCallback);
				},
				createDeckTech,
				createCardTech,
				createSnapshotAuthor,
				createDeckMatchup
			],
			function(err) {
				if(err) console.log(err);
				else console.log("finished processing snapshot");
				finalCallback(err);
			});
		}

		function createDeckTier(snapshot, finalCallback) {
			async.eachSeries(snapshot.tiers, function(tier, seriesCallback) {
				async.eachSeries(tier.decks, function(deck, innerCallback) {
					try {
						deck.rank.last.unshift(deck.rank.current);
						var deckTier = {
							name: deck.name,
							description: deck.explanation,
							weeklyNotes: deck.weeklyNotes,
							deckId: deck.deck.toString(),
							snapshotId: snapshot.id.toString(),
							tier: tier.tier,
							ranks: deck.rank.last
						}
					} catch(err) {
						innerCallback(err);
					}
					DeckTier.create(deckTier, function(err, newDeckTier) {
						if(err) innerCallback(err);
						else  {
								deck.deckTier = newDeckTier;
								innerCallback();
						}
					});
				}, seriesCallback);
			}, function(err) {
				finalCallback(err, snapshot);
			});
		}

		function createDeckTech(snapshot, finalCallback) {
			async.eachSeries(snapshot.tiers, function(tier, seriesCallback) {
				async.eachSeries(tier.decks, function(deck, innerCallback) {
					async.eachSeries(deck.tech, function(tech, superInnerCallback) {
						try {
							var deckTech = {
								title: tech.title,
								orderNum: tech.orderNum,
								deckId: deck.deck.toString(),
								deckTierId: deck.deckTier.id.toString()
							}
						} catch(err) {
							superInnerCallback(err);
						}

						DeckTech.create(deckTech, function(err, newDeckTech) {
							if(err) superInnerCallback(err);
							else {
								tech.deckTech = newDeckTech;
								superInnerCallback();
							}
						});
					}, innerCallback);
				}, seriesCallback);
			}, function(err) {
				finalCallback(err, snapshot);
			});
		}

		function createCardTech(snapshot, finalCallback) {
			async.eachSeries(snapshot.tiers, function(tier, seriesCallback) {
				async.eachSeries(tier.decks, function(deck, innerCallback) {
					async.eachSeries(deck.tech, function(tech, superInnerCallback) {
						async.eachSeries(tech.cards, function(card, retardedInnerCallback) {
							try {
								var cardTech = {
									cardId: card.card.toString(),
									orderNum: card.orderNum,
									both: card.both,
									toss: card.toss,
									deckTechId: tech.deckTech.id.toString()
								}
							} catch(err) {
								retardedInnerCallback(err);
							}

							CardTech.create(cardTech, function(err, newCardTech) {
								if(err) retardedInnerCallback(err);
								else {
									card.cardTech = newCardTech;
									retardedInnerCallback();
								}
							});
						}, superInnerCallback);
					}, innerCallback);
				}, seriesCallback);
			}, function(err) {
				finalCallback(err, snapshot);
			});
		}

		function createSnapshotAuthor(snapshot, finalCallback) {
			async.eachSeries(snapshot.oldAuthors, function(author, seriesCallback) {
				try {
					var snapshotAuthor = {
						userId: author.user.toString(),
						description: author.description,
						expertClasses: author.klass,
						snapshotId: snapshot.id.toString()
					}
				} catch(err) {
					seriesCallback(err);
				}

				SnapshotAuthor.create(snapshotAuthor, function(err, newSnapshotAuthor) {
					if(err) retardedInnerCallback(err);
					else {
						author.snapshotAuthor = newSnapshotAuthor;
						seriesCallback();
					}
				});
			}, function(err) {
				finalCallback(err, snapshot);
			});
		}

		function createDeckMatchup(snapshot, finalCallback) {
			async.eachSeries(snapshot.matches, function(match, seriesCallback) {
				try {
					var deckMatchup = {
						forDeckId: match.for.toString(),
						againstDeckId: match.against.toString(),
						forChance: match.forChance,
						againstChance: match.againstChance,
						snapshotId: snapshot.id.toString()
					}
				} catch(err) {
					seriesCallback(err);
				}

				DeckMatchup.create(deckMatchup, function(err, newDeckMatchup) {
					if(err) retardedInnerCallback(err);
					else {
						match.deckMathup = newDeckMatchup;
						seriesCallback();
					}
				});
			}, function(err) {
				finalCallback(err, snapshot);
			});
		}
*/
};