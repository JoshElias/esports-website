var mongoose = require('mongoose'),
    Schema = mongoose.Schema;
 
// Banner schema
var bannerSchema = new Schema({
    title: { type: String, trim: true },
    description: { type: String, trim: true },
    photo: { type: String, trim: true },
    button: {
        hasButton: Boolean,
        buttonText: { type: String, trim: true },
        buttonLink: { type: String, trim: true }
    },
    orderNum: Number,
    active: { type: Boolean, default: false }
});

var Banner = mongoose.model('Banner', bannerSchema);

module.exports = Banner;