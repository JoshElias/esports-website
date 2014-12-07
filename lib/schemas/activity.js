var mongoose = require('mongoose'),
    Schema = mongoose.Schema;
 
// Activity schema
var activitySchema = new Schema({
    author: { type: Schema.ObjectId, ref: 'User' },
    activityType: String,
    refID: Schema.ObjectId,
    activity: String,
    createdDate: Date
});

var Activity = mongoose.model('Activity', activitySchema);

module.exports = Activity;