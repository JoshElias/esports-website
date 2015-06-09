var _ = require("underscore");
var async = require("async");
var util = require("util");
var request = require("request");
var config = require("./config");
var UserSchema = require("./schemas/user");

// CONSTANTS
var TEMPOSTORM_NAMES = [
	"reynad27","gaarabestshaman","hyp3d", "hearthtrolden", "tempo_storm", "ratsmah", "reckful", "frodan",
	"dreadnaught_heroes","arthelon","so1dier","kaeyoh","zoiatv",
	"KingRonnie","stan_csgo","hades_tv","glorinsz",
	"nychrisg"
];
var FEED_LIMIT = 100;


// ROUTES
function route( app ) {
	app.post("/twitchFeed", twitchFeedHandler);
};


// HANDLERS
function twitchFeedHandler( req, res ) {
	console.log("1");
	var requestLimit = req.body.limit;
	var limit = (typeof requestLimit === "number" && requestLimit <= FEED_LIMIT) 
		? requestLimit : FEED_LIMIT;
	var requestGameFilter = req.body.gameFilter;

	async.waterfall([
		// Get tempostorm players feed
		function(seriesCallback) {
			console.log("2");
			getActiveFeed(TEMPOSTORM_NAMES, seriesCallback);
		},
		// Get all site users handles without tempostorm players
		function(tempostormFeed, seriesCallback) {
			console.log("3");
			var userHandles = [];
			UserSchema.find({twitchHandle : {$exists: true, $ne: ""}})
			.select("twitchHandle")
			.exec(function(err, users) {
				if(err) seriesCallback(err);
				else if(!users) seriesCallback(undefined, tempostormFeed, []);
				else {
					for(var key in users) {
						var twitchHandle = users[key].twitchHandle;
						if(TEMPOSTORM_NAMES.indexOf(twitchHandle) === -1) {
							userHandles.push(twitchHandle);
						}
					}
					seriesCallback(undefined, tempostormFeed, userHandles);
				}
			});
		},
		// Get active user feeds
		function(tempostormFeed, userHandles, seriesCallback) {
			console.log("4");
			getActiveFeed(userHandles, function(err, userFeed) {
				console.log("Returning from active feed: "+userFeed);
				if(err) seriesCallback(err);
				else {

					seriesCallback(undefined, tempostormFeed, userFeed);
				}
			}); 
		},
		// Combine feeds
		function(tempostormFeed, userFeed, seriesCallback) {
			console.log("5");
			try {
				Array.prototype.push.apply(tempostormFeed, userFeed);	
				//var limitedFeed = tempostormFeed.slice(0, limit);
				seriesCallback(undefined, tempostormFeed);
			} catch(err) {
				seriesCallback(err);
			}
		},
		// Filter by desired games
		function(feeds, seriesCallback) {
			console.log("6");
			if(!Array.isArray(requestGameFilter)) {
				seriesCallback(undefined, feeds);
				return;
			}

			try {
				var filteredFeeds = _.filter(feeds, function(feed) {
					return (requestGameFilter.indexOf(feed.gameName) !== -1);
				});
				seriesCallback(undefined, filteredFeeds);
			} catch(err) {
				seriesCallback(err);
			}
		},
		// Impose limit
		function(filteredFeeds, seriesCallback) {
			console.log("7");
			try {
				var limitedFeed = filteredFeeds.slice(0, limit);
				seriesCallback(undefined, limitedFeed);
			} catch(err) {
				seriesCallback(err);
			}
		}],
	function(err, streamFeed) {
		console.log("8");
		console.log(err);
		if(err) res.json({err:err});
		else {
			res.json({streamFeed:streamFeed});
		}
	});
};


// METHODS
function getStreamByHandle( twitchHandle, finalCallback ) {
	if(typeof twitchHandle !== "string") {
		finalCallback("Unable to get stream with invalid twitch handle");
		return;
	}

	var requestOptions = {
	  	url: "https://api.twitch.tv/kraken/streams/"+twitchHandle,
	    headers: {
	    	"Accept": "application/vnd.twitchtv.v3+json",
	    	"Client-ID": config.TWITCH_ID 
	  	}
	};

	request(requestOptions, function(err, res, body) {
		if(err) finalCallback(err);
		else if(res.status === 401) finalCallback("Unable to find handle");
		else {
			finalCallback(undefined, body);
		}
  	});
};

function cleanStreamData( streamData ) {
	if(typeof streamData !== "object") {
		throw new Error("Unable to clean stream data with invalid stream data");
	}

	return {
		channelUrl : streamData.stream.channel.url,
		gameName : streamData.stream.game,
		viewerCount : streamData.stream.viewers,
		displayName : streamData.stream.channel.display_name,
		logoUrl : streamData.stream.channel.logo
	}
}

function getActiveFeed( handles, finalCallback) {
	console.log("Getting active feeds");
	if(!Array.isArray(handles)) {
		finalCallback("Unable to get active feed with invalid handles");
		return;
	}
	if(handles.length < 1) {
		finalCallback(undefined, []);
		return;
	}

	async.waterfall([
		// Get each user's stream 
		function(seriesCallback) {
			console.log("a");
			async.map(handles, function(handle, mapCallback) {
				getStreamByHandle(handle, function(err, stream) {
    				if(!err) {
    					mapCallback(undefined, JSON.parse(stream));
    				}
				});
			}, function(err, streams) {
				seriesCallback(err, streams);
			});
		},
		// Filter out offline streams 
		function(streams, seriesCallback) {
			console.log("b");
			try {
				var onlineStreams = _.filter(streams, function(stream) {
					return stream.stream;
				})
				seriesCallback(undefined, onlineStreams);
			} catch(err) {
				seriesCallback(err);
			}
		},
		// Clean stream data
		function(onlineStreams, seriesCallback) {
			console.log("c");
			try {
				for(var key in onlineStreams) {
					onlineStreams[key] = cleanStreamData(onlineStreams[key]);
				}
				seriesCallback(undefined, onlineStreams);
			} catch(err) {
				seriesCallback(err);
			}
		},
		// Sort by viewer count
		function(onlineStreams, seriesCallback) {
			console.log("d");
			try {
				var sortedStreams = _.sortBy(onlineStreams, function(stream) {
					return stream.viewerCount;
				});
				seriesCallback(undefined, sortedStreams);
			} catch(err) {
				seriesCallback(err);
			}
		}],
	function(err, streamFeed) {
		console.log('f');
		console.log("ACtive stream error: "+err);
		finalCallback(err, streamFeed);
	});
}


// MAIN EXPORTS
module.exports = {
	route : route
};