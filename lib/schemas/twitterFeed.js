var mongoose = require('mongoose');
var Schema = mongoose.Schema;


var twitterFeedSchema = new Schema({
    feedId: { type: Number },
    feed: [{
        screenName: { type: String },
        displayName: { type: String },
        authorUrl: { type: String },
        text: { type: String },
        logoUrl: { type: String }
    }],
    lastUpdated : {type:Date, default: Date.now()}
    
});


var TwitterFeed = mongoose.model('TwitterFeed', twitterFeedSchema);
module.exports = TwitterFeed;