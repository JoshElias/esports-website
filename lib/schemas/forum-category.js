var mongoose = require('mongoose'),
    Schema = mongoose.Schema;
 
// Forum category schema
var categorySchema = new Schema({
    title: { type: String, trim: true },
    threads: [{ type: Schema.ObjectId, ref: 'ForumThread' }],
    active: { type: Boolean, default: false }
});

var Category = mongoose.model('ForumCategory', categorySchema);

module.exports = Category;