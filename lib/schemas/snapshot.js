var mongoose = require('mongoose'),
    Schema = mongoose.Schema;
 
// Article schema
var snapshotSchema = new Schema({
    title: { type: String, trim: true },
    slug: { type: String, trim: true },
    content: {
        intro: { type: String, trim: true},
        thoughts: { type: String, trim: true }
    },
    tiers: [{
        deck: { type: Schema.ObjectId, ref: 'Deck' },
        rank: { type: Number, default: 0 },
        change: { type: Number, default: 0 },
        tech: { 
            techCatagory: [{ 

                card: { type: Schema.ObjectId, ref: 'Card' }
            }]
        },
        matches: [{ 
            deck: { type: Schema.ObjectId, ref: 'Deck' },
            chance: { type: Number, default: 0 }
        }]
    }],
    createdDate: Date,
    active: { type: Boolean, default: false }
});

var Snapshot = mongoose.model('Snapshot', snapshotSchema);

module.exports = Snapshot;