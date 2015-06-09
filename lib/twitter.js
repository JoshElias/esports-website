var _ = require("underscore");
var Twitter = require('twitter');
var config = require("./config");
var Autolinker = require("autolinker");
 

// CONSTANTS
var FEED_LIMIT = 100;
var TWITTER_URL_PREFIX = "https://twitter.com/";
var TEMPOSTORM_LIST_ID = 210216046;


// MEMBERS
var twitterClient = new Twitter({
  	consumer_key: config.TWITTER_KEY,
  	consumer_secret: config.TWITTER_SECRET,
  	access_token_key: config.TWITTER_TOKEN_KEY,
  	access_token_secret: config.TWITTER_TOKEN_SECRET
});

var twitterOptions = {
	list_id: TEMPOSTORM_LIST_ID,
	count: 50,
	include_entities: false,
	include_rts: true
}

var linkerClient = new Autolinker({
	email: true,
	twitter: true,
	hashtag: "twitter"
});


// ROUTES
function route( app ) {
	app.post("/twitterFeed", twitterFeedHandler);
}


// HANDLERS
function twitterFeedHandler( req, res ) {
	
	// Get Options
	var limit = (typeof req.body.limit === "number" && req.body.limit <= FEED_LIMIT) ? req.body.limit : FEED_LIMIT;
	twitterOptions.count = limit;

	// Send request
	twitterClient.get('lists/statuses', twitterOptions, function(err, tweets, response) {
  		if(err) res.send({err:err});
  		else {
  			var cleanedTweets = _.map(tweets, function(tweet) {
  				return cleanTwitchEntry(tweet);
  			});
  			res.send(cleanedTweets);
  		}
	}); 
}


// METHODS
function cleanTwitchEntry( twitterEntry ) {
	var cleanEntry = {};
	try {
		cleanEntry.screenName = twitterEntry.user.screen_name;
		cleanEntry.displayName = "@"+cleanEntry.screenName;
		cleanEntry.authorUrl = TWITTER_URL_PREFIX+cleanEntry.screenName;
		cleanEntry.text = linkerClient.link(twitterEntry.text);
		cleanEntry.logoUrl = twitterEntry.user.profile_image_url_https;
		cleanEntry.timestamp = twitterEntry.user.created_at;
	} catch(err) {
		console.log("Error cleaning twitch entry");
		console.log(err)
	}
	return cleanEntry;
}


// MAIN EXPORTS
module.exports = {
	route : route
}