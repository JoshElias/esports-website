var mongoose = require('mongoose'),
    Schema = mongoose.Schema;
 
// Deck schema
var commentSchema = new Schema({
    author: { type: Schema.ObjectId, ref: 'User' },
    comment: { type: String, trim: true },
    votesCount: { type: Number, default: 1 },
    votes: [{
        userID: { type: Schema.ObjectId, ref: 'User' },
        direction: { type: Number, default: 1 }
    }],
    replies: { type: [Schema.Object], ref: 'Comment' },
    createdDate: Date
});

var Comment = mongoose.model('Comment', commentSchema);

module.exports = Comment;