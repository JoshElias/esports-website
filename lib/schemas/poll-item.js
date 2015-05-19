var mongoose = require('mongoose'),
    Schema = mongoose.Schema;
 
// Activity schema
var itemSchema = new Schema({
    title: String,
    subTitle: String,
    description: String,
    type: String,
    votesCount: { type: Number, Default: 0 },
    active: { type:Boolean, default: false }
});

var Poll-item = mongoose.model('Activity', itemSchema);

module.exports = Pollitem;