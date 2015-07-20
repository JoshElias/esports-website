var mongoose = require('mongoose'),
    Schema = mongoose.Schema;
 
// Activity schema
var schemaOptions = {
    read: "nearest",
    w:1
}

var activitySchema = new Schema({
    author: { type: Schema.ObjectId, ref: 'User' },
    activityType: String,
    article: { type: Schema.ObjectId, ref: 'Article' },
    forumPost: { type: Schema.ObjectId, ref: 'ForumPost' },
    deck:  { type: Schema.ObjectId, ref: 'Deck' },
    guide: { type: Schema.ObjectId, ref: 'Guide' },
    createdDate: Date,
    exists: { type: Boolean, default: true },
    active: { type: Boolean, default: true }
}, schemaOptions);

var Activity = mongoose.model('Activity', activitySchema);

module.exports = Activity;