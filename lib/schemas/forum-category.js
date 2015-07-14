var mongoose = require('mongoose'),
    Schema = mongoose.Schema;
 
// Forum category schema
var schemaOptions = {
    read: "nearest",
    w:1
}

var categorySchema = new Schema({
    title: { type: String, trim: true },
    threads: [{ type: Schema.ObjectId, ref: 'ForumThread' }],
    active: { type: Boolean, default: false }
}, schemaOptions);

var Category = mongoose.model('ForumCategory', categorySchema);

module.exports = Category;