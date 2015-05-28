var mongoose = require('mongoose'),
    Schema = mongoose.Schema;
 
// Activity schema
var pollSchema = new Schema({
    title: String,
    subTitle: String,
    description: String,
    type: String,
    voteLimit: { type: Number, default: 1 },
    createdDate: Date,
    view: { type: String, default: 'main' },
    voteLimit: { type: Number, default: 1 },
    items: [{
        name: String,
        orderNum: { type: Number, default: 0 },
        votes: { type: Number, default: 0 },
        photos: {
            large: { type: String, default: ''},
            thumb: { type: String, default: ''}
        }
    }]
});

var Poll = mongoose.model('Poll', pollSchema);

module.exports = Poll;