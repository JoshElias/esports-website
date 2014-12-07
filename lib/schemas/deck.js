var mongoose = require('mongoose'),
    Schema = mongoose.Schema;
 
// Deck schema
var deckSchema = new Schema({
    name: { type: String, trim: true },
    slug: { type: String, trim: true },
    deckType: String,
    description: { type: String, trim: true },
    contentEarly: { type: String, trim: true },
    contentMid: { type: String, trim: true },
    contentLate: { type: String, trim: true },
    author: { type: Schema.ObjectId, ref: 'User' },
    cards: [{
        card: { type: Schema.ObjectId, ref: 'Card' },
        qty: Number
    }],
    playerClass: String,
    public: Boolean,
    mulligans: [{
        klass: String,
        withCoin: {
            cards: [{ type: Schema.ObjectId, ref: 'Card' }],
            instructions: String
        },
        withoutCoin: {
            cards: [{ type: Schema.ObjectId, ref: 'Card' }],
            instructions: String
        }
    }],
    against: {
        strong: [{
            klass: String,
            isStrong: Boolean
        }],
        weak: [{
            klass: String,
            isWeak: Boolean
        }],
        instructions: String
    },
    parentDeck: { type: Schema.ObjectId, ref: 'Deck' },
    views: { type: Number, default: 0 },
    votesCount: { type: Number, default: 1 },
    votes: [{
        userID: Schema.ObjectId,
        direction: { type: Number, default: 1 }
    }],
    featured: { type: Boolean, default: false },
    allowComments: { type: Boolean, default: true },
    comments: [{ type: Schema.ObjectId, ref: 'Comment' }],
    createdDate: Date,
    premium: {
        isPremium: { type: Boolean, default: false },
        expiryDate: Date
    }
});

var Deck = mongoose.model('Deck', deckSchema);

module.exports = Deck;