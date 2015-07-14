var mongoose = require('mongoose'),
    Schema = mongoose.Schema;
 
// Article schema
var schemaOptions = {
    read: "nearest",
    w:1
}

var articleSchema = new Schema({
    title: { type: String, trim: true },
    slug: {
        url: { type: String, trim: true },
        linked: { type: Boolean, default: true },
    },
    description: { type: String, trim: true },
    content: { type: String, trim: true },
    author: { type: Schema.ObjectId, ref: 'User' },
    photos: {
        large: { type: String, trim: true },
        medium: { type: String, trim: true },
        small: { type: String, trim: true }
    },
    related: [{ type: Schema.ObjectId, ref: 'Article' }],
    deck: { type: Schema.ObjectId, ref: 'Deck' },
    guide: { type: Schema.ObjectId, ref: 'Guide' },
    classTags: [String],
    theme: { type: String, trim: true },
    views: { type: Number, default: 0 },
    votesCount: { type: Number, default: 1 },
    votes: [{
        userID: Schema.ObjectId,
        direction: { type: Number, default: 1 }
    }],
    featured: { type: Boolean, default: false },
    comments: [{ type: Schema.ObjectId, ref: 'Comment' }],
    createdDate: Date,
    premium: {
        isPremium: { type: Boolean, default: false },
        expiryDate: Date
    },
    articleType: [{ type: String, trim: true }],
    active: { type: Boolean, default: false }
}, schemaOptions);

var Article = mongoose.model('Article', articleSchema);

module.exports = Article;