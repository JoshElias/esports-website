var mongoose = require('mongoose'),
    Schema = mongoose.Schema;
 
// Article schema
var snapshotSchema = new Schema({
    snapNum: { type: Number },
    title: { type: String, trim: true },
    authors: [{ type: Schema.ObjectId, ref: 'User' }],
    slug: {
        url: { type: String, trim: true },
        linked: { type: Boolean, default: true },
    },
    content: {
        intro: { type: String, trim: true},
        thoughts: { type: String, trim: true }
    },
    tiers: [{
        tier: { type: Number, default: 1 },
        decks: [{
            explanation: { type: String, trim: true },
            weeklyNotes: { type: String, trim: true },
            deck: { type: Schema.ObjectId, ref: 'Deck' },
            rank: {
                current: { type: Number, default: 1 },
                last: [{ type: Number, default: 0 }]
            },
            tech: [{
                title: { type: String, trim: true },
                cards: [{
                    card: { type: Schema.ObjectId, ref: 'Card' },
                    toss: { type: Boolean, default: false },
                    both: { type: Boolean, default: false },
                    orderNum: { type: Number, default: 1 }
                }],
                orderNum: { type: Number, default: 1 }
            }]
        }]
    }],
    matches: [{ 
        for: { type: Schema.ObjectId, ref: 'Deck' },
        against: { type: Schema.ObjectId, ref: 'Deck' },
        forChance: { type: Number, default: 0 },
        againstChance: { type: Number, default: 0 }
    }],
    createdDate: Date,
    active: { type: Boolean, default: false }
});

var Snapshot = mongoose.model('Snapshot', snapshotSchema);

module.exports = Snapshot;