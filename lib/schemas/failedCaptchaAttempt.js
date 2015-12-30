var mongoose = require('mongoose'),
    Schema = mongoose.Schema;
 
// Card schema
var schemaOptions = {
    read: "nearest",
    w:1
}

var failedCaptchaAttemptSchema = new Schema({
    ip: String,
    username: String,
    email: String,
    password: String,
    createdDate: Date
}, schemaOptions);

var FailedCaptchaAttempt = mongoose.model('FailedCaptchaAttempt', failedCaptchaAttemptSchema);

module.exports = FailedCaptchaAttempt;