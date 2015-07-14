var mongoose = require('mongoose'),
    Schema = mongoose.Schema;
 
// Map schema
var schemaOptions = {
    read: "nearest",
    w:1
}

var mapSchema = new Schema({
    name: { type: String, trim: true },
    description: { type: String, trim: true },
    orderNum: { type: Number, default: 0 },
    className: { type: String, trim: true },
    active: { type: Boolean, default: false }
}, schemaOptions);

var Map = mongoose.model('Map', mapSchema);

module.exports = Map;