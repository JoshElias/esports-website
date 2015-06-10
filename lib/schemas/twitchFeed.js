var mongoose = require('mongoose');
var Schema = mongoose.Schema;
		

var twitchFeedSchema = new Schema({
    feedId: { type: String },
    feed: [{
        gameName: { type: String },
        displayName: { type: String },
        viewerCount: { type: String },
        channelUrl: { type: String },
        logoUrl: { type: String }
    }],
    lastUpdated : {type:Date, default: Date.now()}
});


var TwitchFeed = mongoose.model('TwitchFeed', twitchFeedSchema);
module.exports = TwitchFeed;