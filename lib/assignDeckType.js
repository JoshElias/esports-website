var mongoose = require('mongoose');
var async = require("async");
var _ = require("underscore");
var DeckSchema = require("./schemas/deck");
var CardSchema = require("./schemas/card");


// mongoose 
mongoose.connect('mongodb://localhost:27017/tempostorm');


async.waterfall([
	function(seriesCallback) {
		console.log("Getting all the decks");
		DeckSchema.find()
		.select("arena")
		.exec(seriesCallback);
	}, 
	function(decks, seriesCallback) {
		console.log("Updating deck's type by arena property");
		async.eachSeries(decks, function(deck, callback) {
			var newDeck = JSON.parse(JSON.stringify(deck));
			var type = (newDeck.arena) ? 2 : 1;

			DeckSchema.update({_id:deck._id}, {/*$unset:{"arena":""},*/$set:{type:type}}, {multi:true})
			.exec(function(err) {
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