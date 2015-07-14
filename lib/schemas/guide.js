var mongoose = require('mongoose'),
    Schema = mongoose.Schema;
 
// Guide schema
var schemaOptions = {
    read: "nearest",
    w:1
}

var guideSchema = new Schema({
    name: { type: String, trim: true },
    slug: { type: String, trim: true },
    guideType: { type: String, trim: true },
    description: { type: String, trim: true },
    content: [{
        title: { type: String, trim: true },
        body: { type: String, trim: true },
        orderNum: { type: Number, default: 1 }
    }],
    author: { type: Schema.ObjectId, ref: 'User' },
    heroes: [{
        hero: { type: Schema.ObjectId, ref: 'Hero' },
        talents: {
            tier1: Schema.ObjectId,
            tier4: Schema.ObjectId,
            tier7: Schema.ObjectId,
            tier10: Schema.ObjectId,
            tier13: Schema.ObjectId,
            tier16: Schema.ObjectId,
            tier20: Schema.ObjectId            
        }
    }],
    maps: [{ type: Schema.ObjectId, ref: 'Map' }],
    synergy: [{ type: Schema.ObjectId, ref: 'Hero' }],
    against: {
        strong: [{ type: Schema.ObjectId, ref: 'Hero' }],
        weak: [{ type: Schema.ObjectId, ref: 'Hero' }]
    },
    public: { type: Boolean, default: true },
    video: { type: String, trim: true },
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
    }
}, schemaOptions);

var Guide = mongoose.model('Guide', guideSchema);

module.exports = Guide;