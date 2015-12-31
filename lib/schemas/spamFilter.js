var mongoose = require('mongoose'),
    Schema = mongoose.Schema;
 
// Card schema
var schemaOptions = {
    read: "nearest",
    w:1
}

var spamFilter = new Schema({
    'case': String,
    active: Boolean
}, schemaOptions);

var SpamFilter = mongoose.model('SpamFilter', spamFilter);

module.exports = SpamFilter;