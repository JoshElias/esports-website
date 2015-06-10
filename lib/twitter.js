var TwitterFeedSchema = require("./schemas/twitterFeed");
 

// CONSTANTS
var TEMPOSTORM_LIST_ID = 210216046;
var FEED_LIMIT = 10;


function route( app ) {
	app.post("/twitterFeed", twitterFeedHandler);
}

function twitterFeedHandler( req, res ) {
	var limit = (typeof req.body.limit === "number" && req.body.limit <= FEED_LIMIT) ? req.body.limit : FEED_LIMIT;

	TwitterFeedSchema.findOne({feedId:TEMPOSTORM_LIST_ID})
	.select("feed")
	.exec(function(err, twitterFeed) {
		if(err) {
			console.log("ERR getting twitter feed");
			console.log(err);
			res.json({err:err, data:[]});
		} else {
			try {
				var limitedFeed = [];
				if(twitterFeed.feed.length > limit) {
					limitedFeed = twitterFeed.feed.slice(0, limit-1);
				} else {
					limitedFeed = twitterFeed.feed;
				}
				res.json({data:limitedFeed});
			} catch(err) { 
							console.log("ERR getting twitter feed");
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