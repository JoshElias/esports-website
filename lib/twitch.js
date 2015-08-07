var TwitchFeedSchema = require("./schemas/twitchFeed");
 

// CONSTANTS
var TWITCH_FEED_ID = "tempostorm-twitch-feed";
var FEED_LIMIT = 10;


function route( app ) {
	app.post("/twitchFeed", twitchFeedHandler);
}

function twitchFeedHandler( req, res ) {
	var limit = (typeof req.body.limit === "number" && req.body.limit <= FEED_LIMIT) ? req.body.limit : FEED_LIMIT;

	TwitchFeedSchema.findOne({feedId:TWITCH_FEED_ID})
	.select("feed")
	.exec(function(err, twitchFeed) {
		if(err || !twitchFeed) {
			console.log("ERR getting twitch feed or feed is null");
			console.log(err);
			res.json({err:err, data:[]});
		} else {
			try {
				var limitedFeed = [];
				if(twitchFeed.feed.length > limit) {
					limitedFeed = twitchFeed.feed.slice(0, limit);
				} else {
					limitedFeed = twitchFeed.feed;
				}
				res.json({data:limitedFeed});
			} catch(err) { 
				console.log("ERR trimming twitchFeed");
				console.log(err);
				res.json({err:err, data:[]});
			}
		}
	});
}




// MAIN EXPORTS
module.exports = {
	route : route
}