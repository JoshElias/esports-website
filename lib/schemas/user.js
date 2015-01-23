var mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    bcrypt = require('bcrypt-nodejs');
 
// User schema
var userSchema = new Schema({
    email: { type: String, unique: true },
    username: { type: String, required: true, unique: true },
    password: { type: String },
    twitchID: String,
    bnetID: String,
    firstName: { type: String, trim: true },
    lastName: { type: String, trim: true },
    photos: {
        profile: String,
        banner: String
    },
    social: {
        twitter: { type: String, trim: true },
        facebook: { type: String, trim: true },
        twitch: { type: String, trim: true },
        instagram: { type: String, trim: true },
        youtube: { type: String, trim: true }
    },
    about: { type: String, trim: true },
    subscription: {
        isSubscribed: { type: Boolean, default: false },
        customerID: String,
        subscriptionID: String,
        last4: String,
        plan: String,
        expiryDate: Date
    },
    isProvider: { type: Boolean, default: false },
    isAdmin: { type: Boolean, default: false },
    createdDate: Date,
    loginCount: { type: Number, default: 0 },
    lastLoginDate: Date,
    activationCode: String,
    resetPasswordCode: String,
    verified: { type: Boolean, default: false },
    active: { type: Boolean, default: true }
});

// Bcrypt middleware on UserSchema
userSchema.pre('save', function(next) {
  var user = this;
 
  if (!user.isModified('password')) { return next(); }
 
  bcrypt.genSalt(10, function(err, salt) {
    if (err) { return next(err); }
 
    bcrypt.hash(user.password, salt, function(){}, function(err, hash) {
        if (err) { return next(err); }
        user.password = hash;
        next();
    });
  });
});

//Password verification
userSchema.methods.comparePassword = function(password, cb) {
    bcrypt.compare(password, this.password, function(err, isMatch) {
        if (err) { return cb(err); }
        cb(isMatch);
    });
};

var User = mongoose.model('User', userSchema);

module.exports = User;