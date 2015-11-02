var mongoose = require('mongoose'),
    Schema = mongoose.Schema;
 
// OverwatchHero schema
var schemaOptions = {
    read: "nearest",
    w:1
}

var overwatchHeroSchema = new Schema({
    heroName: { type: String, trim: true },
    heroRole: { type: String, trim: true },
    realName: { type: String, trim: true },
    age: { type: String, trim: true },
    occupation: { type: String, trim: true },
    location: { type: String, trim: true },
    organization: { type: String, trim: true },
    description: { type: String, trim: true },
    youtubeId: { type: String, trim: true },
    className: { type: String, trim: true },
    orderNum: { type: Number, default: 1 },
    isActive: { type: Boolean, default: false }
}, schemaOptions);

var OverwatchHero = mongoose.model('OverwatchHero', overwatchHeroSchema);

module.exports = OverwatchHero;