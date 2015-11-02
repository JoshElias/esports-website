var mongoose = require('mongoose'),
    Schema = mongoose.Schema;
 
// OverwatchAbility schema
var schemaOptions = {
    read: "nearest",
    w:1
}

var overwatchAbilitySchema = new Schema({
    name: { type: String, trim: true },
    description: { type: String, trim: true },
    className: { type: String, trim: true },
    orderNum: { type: Number, default: 1 },
    heroId: { type: Schema.ObjectId, ref: 'OverwatchHero' },
    isActive: { type: Boolean, default: false }
}, schemaOptions);

var OverwatchAbility = mongoose.model('OverwatchAbility', overwatchAbilitySchema);

module.exports = OverwatchAbility;