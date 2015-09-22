var mongoose = require('mongoose');
var async = require("async");
var _ = require("underscore");
var DeckSchema = require("./schemas/deck");


// mongoose 
var DB_URL = "mongodb://52.11.14.8:27017,52.8.169.246:27017,54.174.103.94:27017,52.28.87.90:27017,54.79.121.240:27017/tempostorm";
var DB_OPTIONS = {
  	"replSet": {
    	"rs_name": "tempostormRepSet",
    	"strategy": "ping"
  	}
};
mongoose.connect(DB_URL, DB_OPTIONS);


async.waterfall([
	function(seriesCallback) {
		console.log("Getting all the decks");
		DeckSchema.find()
		.select("playerClass")
		.exec(seriesCallback);
	}, 
	function(decks, seriesCallback) {
		console.log("Updating deck's heroName by it's playerClass");
		var deckCount = decks.length;
		async.eachSeries(decks, function(deck, callback) {
			var newDeck = JSON.parse(JSON.stringify(deck));
			var playerClass = newDeck.playerClass;
			var heroName = heroDict[playerClass];
			if(typeof heroName === "undefined") {
				callback("Unable to find hero name");
			}

			DeckSchema.update({_id:deck._id}, {$set:{heroName:heroName}}, {multi:true})
			.exec(function(err) {
				deckCount--;
				console.log("Decks left:",deckCount);
				callback(err);
			})
		}, function(err) {
			seriesCallback(err);
		});
	}], 
function(err) {
	if(err) console.log("Err generating content for decks:", err);
	else console.log("Donerino");

	if(mongoose.connection) {
		mongoose.connection.close();
	}
});

var heroDict = {
	"Mage": "Jaina",
	"Druid": "Malfurion",
	"Hunter":"Rexxar",
	"Paladin": "Uther",
	"Priest": "Anduin",
	"Rogue": "Valeera",
	"Shaman": "Thrall",
	"Warlock": "Guldan",
	"Warrior": "Garrosh"
}
