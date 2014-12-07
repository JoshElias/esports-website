var mongoose = require('mongoose'),
    Schema = mongoose.Schema;
 
// Forum post schema
var postSchema = new Schema({
    thread: { type: Schema.ObjectId, ref: 'ForumThread' },
    title: { type: String, trim: true },
    slug: {
        url: { type: String, trim: true },
        linked: { type: Boolean, default: true }
    },
    author: { type: Schema.ObjectId, ref: 'User' },
    content: { type: String, trim: true },
    comments: [{ type: Schema.ObjectId, ref: 'Comment' }],
    views: { type: Number, default: 0 },
    votesCount: { type: Number, default: 1 },
    votes: [{
        userID: { type: Schema.ObjectId, ref: 'User' },
        direction: { type: Number, default: 1 }
    }],
    createdDate: Date,
    active: { type: Boolean, default: true }
});

var Post = mongoose.model('ForumPost', postSchema);

module.exports = Post;