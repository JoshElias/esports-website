var mongoose = require('mongoose'),
    Schema = mongoose.Schema;
 
// Team Member schema
var schemaOptions = {
    read: "nearest",
    w:1
}

var teamMemberSchema = new Schema({
    game: { type: String, trim: true },
    screenName: { type: String, trim: true },
    fullName: { type: String, trim: true },
    description: { type: String, trim: true },
    social: {
        twitter: { type: String, trim: true },
        twitch: { type: String, trim: true },
        youtube: { type: String, trim: true },
        facebook: { type: String, trim: true },
        instagram: { type: String, trim: true },
        esea: { type: String, trim: true }
    },
    photo: { type: String, trim: true },
    orderNum: { type: Number, default: 0 },
    active: { type: String, trim: true }
    
}, schemaOptions);

var TeamMember = mongoose.model('TeamMember', teamMemberSchema);

module.exports = TeamMember;