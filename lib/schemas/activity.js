var mongoose = require('mongoose'),
    Schema = mongoose.Schema;
 
// Activity schema
var activitySchema = new Schema({
    author: { type: Schema.ObjectId, ref: 'User' },
    activityType: String,
    article: { type: Schema.ObjectId, ref: 'Article' },
    forumPost: { type: Schema.ObjectId, ref: 'ForumPost' },
    deck: { type: Schema.ObjectId, ref: 'Deck' },
    createdDate: Date,
    active: { type: Boolean, default: true }
});

var Activity = mongoose.model('Activity', activitySchema);

module.exports = Activity;