var mongoose = require('mongoose'),
    Schema = mongoose.Schema;
 
// Deck schema
var schemaOptions = {
    read: "nearest",
    w:1
}

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
}, schemaOptions);

var Comment = mongoose.model('Comment', commentSchema);

module.exports = Comment;