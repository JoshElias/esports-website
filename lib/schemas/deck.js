var mongoose = require('mongoose'),
    Schema = mongoose.Schema;
 
// Deck schema
var schemaOptions = {
    read: "nearest",
    w:1
}

var deckSchema = new Schema({
    name: { type: String, trim: true },
    slug: { type: String, trim: true },
    deckType: String,
    description: { type: String, trim: true },
    chapters: [{
        title: { type: String, trim: true },
        content: { type: String, trim: true }
    }],
    matches: [{
        deckName: { type: String, trim: true },
        klass: { type: String, trim: true },
        match: { type: Number, default: 0 }
    }],
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
    video: String,
    parentDeck: { type: Schema.ObjectId, ref: 'Deck' },
    views: { type: Number, default: 0 },
    votesCount: { type: Number, default: 1 },
    votes: [{
        userID: Schema.ObjectId,
        direction: { type: Number, default: 1 }
    }],
    type: { type: Number, default: 1 },
    basic: { type: Boolean, default: false },
    featured: { type: Boolean, default: false },
    allowComments: { type: Boolean, default: true },
    comments: [{ type: Schema.ObjectId, ref: 'Comment' }],
    createdDate: Date,
    premium: {
        isPremium: { type: Boolean, default: false },
        expiryDate: Date
    },
    dust: { type:Number, default:0 },
    content: [{
        title: {type:String},
        body: {type:String},
        orderNum: {type:Number}
    }]
}, schemaOptions);

var Deck = mongoose.model('Deck', deckSchema);

module.exports = Deck;