var mongoose = require('mongoose'),
    Schema = mongoose.Schema;
 
// Card schema
var schemaOptions = {
    read: "nearest",
    w:1
}

var cardSchema = new Schema({
    id: String,
    name: String,
    cost: Number,
    cardType: String,
    rarity: String,
    race: String,
    playerClass: String,
    expansion: String,
    text: String,
    mechanics: [String],
    flavor: String,
    artist: String,
    attack: Number,
    health: Number,
    durability: Number,
    dust: Number,
    photos: {
        small: String,
        medium: String,
        large: String
    },
    deckable: Boolean,
    active: Boolean
}, schemaOptions);

var Card = mongoose.model('Card', cardSchema);

module.exports = Card;