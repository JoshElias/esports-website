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
		.select("contentEarly contentMid contentLate")
		.exec(seriesCallback);
	}, 
	function(decks, seriesCallback) {
		console.log("Updating deck's content");
		async.eachSeries(decks, function(deck, callback) {
			var newContent = generateContent(JSON.parse(JSON.stringify(deck)));
			DeckSchema.update({_id:deck._id}, {$set:{content:newContent}, 
				$unset:{contentEarly:"",contentMid:"", contentLate:"", against:""}},
				{multi:true})
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

function generateContent(deck) {
	var content = [];
	if(typeof deck.contentEarly === "string" && deck.contentEarly.length > 0) {
		content.push({
			title: "Early Game",
			body: deck.contentEarly,
			orderNum: 0
		});
	}
	if(typeof deck.contentMid === "string" && deck.contentMid.length > 0) {
		content.push({
			title: "Mid Game",
			body: deck.contentMid,
			orderNum: 1
		});
	}
	if(typeof deck.contentLate === "string" && deck.contentLate.length > 0) {
		content.push({
			title: "Late Game",
			body: deck.contentLate,
			orderNum: 2
		});
	}
	return content;
}