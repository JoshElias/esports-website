var mongoose = require('mongoose'),
    Schema = mongoose.Schema;
 
// Forum thread schema
var schemaOptions = {
    read: "nearest",
    w:1
}

var threadSchema = new Schema({
    category: { type: Schema.ObjectId, ref: 'ForumCategory' },
    title: { type: String, trim: true },
    description: { type: String, trim: true },
    slug: {
        url: { type: String, trim: true },
        linked: { type: Boolean, default: true }
    },
    description: { type: String, trim: true },
    posts: [{ type: Schema.ObjectId, ref: 'ForumPost' }],
    active: { type: Boolean, default: false }
}, schemaOptions);

var Thread = mongoose.model('ForumThread', threadSchema);

module.exports = Thread;