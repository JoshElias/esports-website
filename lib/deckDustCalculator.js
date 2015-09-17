var mongoose = require('mongoose');
var async = require("async");
var DeckSchema = require("./schemas/deck");
var CardSchema = require("./schemas/card");


// mongoose 
mongoose.connect('mongodb://localhost:27017/tempostorm');

// caches
var cardDustCache = {};
var deckDustCache = {};

async.waterfall([
	function(seriesCallback) {
		console.log("Getting all the card costs");
		CardSchema.find().exec(function(err, cards) {
			if(err) seriesCallback(err);
			else {
				try {
					for(var key in cards) {
						var card = cards[key];
						cardDustCache[card._id.toString()] = card.dust; 
					}
					seriesCallback();

				} catch(err) {
					seriesCallback(err);
				}
			}
		});
	}, 
	function(seriesCallback) {
		console.log("Iterating through decks");
		var stream = DeckSchema.find().select("cards").stream();
		stream.on('data', function (deck) {
			try {
				var cardsObj = deck.cards;
				var totalDeckDustCost = 0;
		 		for(var i = 0; i<cardsObj.length; i++) {
		 			var currentCardObj = cardsObj[i];
		 			var cardDustCost = cardDustCache[currentCardObj.card.toString()];
		 			totalDeckDustCost += (cardDustCost*currentCardObj.qty);
		 		}
		 		deckDustCache[deck._id.toString()] = totalDeckDustCost;
			} catch(err) {
				seriesCallback(err);
				return;
			}	
		}).on('error', function (err) {
		  seriesCallback(err);
		}).on('close', function () {
		  seriesCallback()
		});
	},
	function(seriesCallback) {
		console.log("Updating all decks with dust cost");
		async.forEachOfSeries(deckDustCache, function(dustCost, key, callback) {
			DeckSchema.update({_id:key}, {$set:{dust:dustCost}}, {multi:true}, function(err) {
				callback(err);
			})
		}, function(err) {
			seriesCallback(err);
		});
	}
], function(err) {
	if(err) console.log("Err getting dust cost for decks:", err);
	console.log("Donerino");
});