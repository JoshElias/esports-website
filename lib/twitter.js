var Twitter = require('twitter');
var config = require("./config");
 


var FEED_LIMIT = 100;

var client = new Twitter({
  	consumer_key: config.TWITTER_KEY,
  	consumer_secret: config.TWITTER_SECRET,
  	access_token_key: config.TWITTER_TOKEN_KEY,
  	access_token_secret: config.TWITTER_TOKEN_SECRET
});

var options = {
	screen_name: "Tempostorm",
	count: 50,
	trim_user: false,
	exclude_replies: true,
	contributor_details: true,
	include_entities: false
}

// ROUTES
function route( app ) {
	app.post("")
}


// HANDLERS
function twitterFeedHandler( req, res ) {
	var limit = (typeof req.body.limit === "number" && req.body.limit <= FEED_LIMIT) ? req.body.limit : FEED_LIMIT;
	options.count = limit;

	client.get('statuses/home_timeline', options, function(error, tweets, response) {
  		if (!error) {
    		console.log(tweets);
  		}
	}); 
}





// MAIN EXPORTS
module.exports = {
	route : route
}