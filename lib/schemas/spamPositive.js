var mongoose = require('mongoose'),
    Schema = mongoose.Schema;
 
// Card schema
var schemaOptions = {
    read: "nearest",
    w:1
}

var spamPositiveSchema = new Schema({
    ip: String,
    userId: { type: Schema.ObjectId, ref: 'User' },
    userAgent: String,
    referer: String,
    createdDate: Date,
    qty: { type: Number, default: 1 },
    matches: Array
}, schemaOptions);

var SpamPositive = mongoose.model('SpamPositive', spamPositiveSchema);

module.exports = SpamPositive;