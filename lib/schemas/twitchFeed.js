var mongoose = require('mongoose');
var Schema = mongoose.Schema;
		
var schemaOptions = {
    read: "nearest",
    w:1
}

var twitchFeedSchema = new Schema({
    feedId: { type: String },
    feed: [{
        gameName: { type: String },
        displayName: { type: String },
        viewerCount: { type: Number },
        channelUrl: { type: String },
        logoUrl: { type: String }
    }],
    lastUpdated : {type:Date, default: Date.now()}
}, schemaOptions);


var TwitchFeed = mongoose.model('TwitchFeed', twitchFeedSchema);
module.exports = TwitchFeed;