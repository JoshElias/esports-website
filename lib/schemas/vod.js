var mongoose = require('mongoose'),
    Schema = mongoose.Schema;
 
// Deck schema
var schemaOptions = {
    read: "nearest",
    w:1
}

var vodSchema = new Schema({
    
    date: Date,
    url: { type: String, trim: true },
    vars: {
        list: { type: String, trim: true }
    },
    createdDate: Date
    
}, schemaOptions);

var Vod = mongoose.model('Vod', vodSchema);

module.exports = Vod;