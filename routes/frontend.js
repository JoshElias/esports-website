var request = require('request');

module.exports = {
    hots: require('./frontend/hots'),
    overwatch: require('./frontend/overwatch'),
    index: function (config, assets) {
        return function (req, res, next) {
            return res.render(config.APP_INDEX, { cdnUrl: config.CDN_URL, assets: assets });
        };
    },
    login: function(Schemas, jwt, JWT_SECRET) {
        return function(req, res, next) {
            var email = req.body.email || '',
                password = req.body.password || '';

            if (email == '' || password == '') {
                return res.sendStatus(401);
            }

            Schemas.User.findOne({ email: email, active: true, verified: true }, function (err, user) {
                if (err) {
                    return res.sendStatus(401);
                }
                if (!user) {
                    return res.sendStatus(401);
                }
                
                user.comparePassword(password, function(isMatch) {
                    if (!isMatch) {
                        return res.sendStatus(401);
                    }
                    
                    user.loginCount = user.loginCount + 1;
                    user.lastLoginDate = new Date().toISOString();
                    
                    user.save(function (err, user) {
                        if (err) { console.log(err); }

                        var token = jwt.sign({ _id: user._id.toString() }, JWT_SECRET);

                        return res.json({
                            userID: user._id.toString(),
                            username: user.username,
                            email: user.email,
                            subscription: {
                                isSubscribed: user.subscription.isSubscribed,
                                plan: user.subscription.plan,
                                expiry: (user.subscription.isSubscribed) ? false : user.subscription.expiryDate
                            },
                            isAdmin: user.isAdmin,
                            isProvider: user.isProvider,
                            token: token
                        });
                    });
                });
            });
        }
    },
    forgotPassword: function (Schemas, Mail, uuid) {
        return function (req, res, next) {
            var email = req.body.email,
                resetPasswordCode = uuid.v4();
            
            req.assert('email', 'A valid email address is required').notEmpty().isEmail();
            
            var errors = req.validationErrors();
            
            if (errors) {
                return res.json({ success: false, errors: errors });
            } else {
                var error = false,
                    errorMsgs = {};
                
                function sendEmail(user, callback) {
                    var mail = new Mail();
                    
                    mail.forgotPassword({
                        email: user.email,
                        username: user.username,
                        resetPasswordCode: resetPasswordCode
                    }, function () {
                        return callback();
                    });
                }
                
                Schemas.User.findOneAndUpdate({ email: email, active: true, verified: true }, { $set: { resetPasswordCode: resetPasswordCode } }).exec(function (err, user) {
                    if (err || !user) {
                        error = true;
                        errorMsgs.email = {
                            msg: 'Unable to find an active account with that email address'
                        };
                        return res.json({ success: false, errors: errorMsgs });
                    }
                    
                    sendEmail(user, function () {
                        return res.json({ success: true });
                    });
                });
            }
        };
    },
    resetPassword: function (Schemas, Mail) {
        return function (req, res, next) {
            var email = req.body.email,
                resetPasswordCode = req.body.code,
                password = req.body.password,
                cpassword = req.body.cpassword;
            
            req.assert('email', 'A valid email address is required').notEmpty().isEmail();
            req.assert('code', 'Invalid reset code used').notEmpty();
            req.assert('password', 'Password is required').notEmpty();
            req.assert('cpassword', 'Please confirm your password').notEmpty();
            req.assert('cpassword', 'Your passwords do not match').equals(password);
            
            var errors = req.validationErrors();
            
            if (errors) {
                return res.json({ success: false, errors: errors });
            } else {
                function getAccount (callback) {
                    Schemas.User.findOne({ email: email, active: true, verified: true }).exec(function (err, user) {
                        if (err || !user) {
                            return res.json({ success: false, errors: { email: { msg: 'An unknown error has occurred' } } });
                        }
                        return callback(user);
                    });
                }
                
                function verifyCode (user, callback) {
                    if (user.resetPasswordCode !== resetPasswordCode) {
                        return res.json({ success: false, errors: { email: { msg: 'Invalid reset code used' } } });
                    }
                    return callback(user);
                }
                
                function updatePassword (user, callback) {
                    user.password = password;
                    user.resetPasswordCode = '';
                    user.save(function (err, user) {
                        if (err) { return res.json({ success: false, errors: { email: { msg: 'An unknown error has occurred' } } }); }
                        callback(user);
                    });
                }
                
                function sendEmail (user, callback) {
                    var mail = new Mail();
                    
                    mail.resetPassword({
                        email: user.email,
                        username: user.username,
                        password: password
                    }, function () {
                        return callback();
                    });
                }
                
                getAccount(function (user) {
                    verifyCode(user, function (user) {
                        updatePassword(user, function (user) {
                            sendEmail(user, function () {
                                return res.json({ success: true });
                            });
                        });
                    });
                });
            }
        };
    },
    verify: function (Schemas) {
        return function (req, res, next) {
            Schemas.User.findOne({ _id: req.user._id }, function (err, user) {
                if (err || !user) {
                    return res.sendStatus(401);
                }
                return res.json({
                    userID: user._id.toString(),
                    username: user.username,
                    email: user.email,
                    subscription: {
                        isSubscribed: user.subscription.isSubscribed,
                        plan: user.subscription.plan,
                        expiry: (user.subscription.isSubscribed) ? false : user.subscription.expiryDate
                    },
                    isAdmin: user.isAdmin,
                    isProvider: user.isProvider
                });
            });
        }
    },
    signup: function(Schemas, uuid, Mail) {
        return function (req, res, next) {
            var email = req.body.email,
            username = req.body.username,
            password = req.body.password,
            captchaResponse = req.body.captchaResponse,
            captchaSecret = '6LeLJhQTAAAAAPU4djVaXiNX28hLIKGdC7XM9QG4',
            captchaPostUrl = 'https://www.google.com/recaptcha/api/siteverify?secret=' + captchaSecret + ';response=' + captchaResponse,
            userID,
            activationCode = uuid.v4();
          
            function captcha (callback) {
              request.post(
                'https://www.google.com/recaptcha/api/siteverify',
                { 
                  form: { 
                    secret: captchaSecret,
                    response: captchaResponse
                  }
                },
                function (err, cres, body) {
                  if (!err && JSON.parse(body).success && cres.statusCode == 200) {
                    return callback();
                  } else {
                    var ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
                    var FCA = new Schemas.FailedCaptchaAttempt({
                        ip: ip,
                        username: username,
                        email: email,
                        password: password,
                        createdDate: new Date().toISOString()
                    });
                    
                    FCA.save(function(err, data){
                        if (err) {
                            return res.json({ 
                                success: false, errors: { unknown: { msg: "An unknown error has occurred" }}
                            });
                        }
                    });
                    console.log('captcha request failed and was logged');
                    return res.json({ 
                        success: false, errors: { captcha: { msg: "Captcha validation failed and the attempt has been logged" }}
                    });
                  }
                }
              )
            }
            
            req.assert('email', 'A valid email address is required').notEmpty().isEmail();
            req.assert('username', 'Username is required').notEmpty();
            req.assert('username', 'Username must be between 3 and 20 characters').len(3, 20);
            req.assert('username', 'Username is not a valid format').isUsername();
            req.assert('password', 'Password is required').notEmpty();
            req.assert('cpassword', 'Please confirm your password').notEmpty();
            req.assert('cpassword', 'Your passwords do not match').equals(password);
            
            var errors = req.validationErrors();
            
            if (errors) {
                return res.json({ success: false, errors: errors });
            } else {
                var error = false,
                    errorMsgs = {};
                
                function checkEmail(cb) {
                    Schemas.User.count({ email: email }, function(err, count){
                        if (err) {
                            error = true;
                            errorMsgs.unknown = { 
                                msg: 'An unknown error occurred'
                            };
                        }
                        if (count > 0) {
                            error = true;
                            errorMsgs.email = { 
                                msg: 'Email already exists on another account'
                            };
                        }
                        cb();
                    });
                }

                function checkUsername(cb) {
                    Schemas.User.count({ username: username }, function(err, count){
                        if (err) {
                            error = true;
                            errorMsgs.unknown = { 
                                msg: 'An unknown error occurred'
                            };
                        }
                        if (count > 0) {
                            error = true;
                            errorMsgs.username = { 
                                msg: 'Username already in use'
                            };
                        }
                        cb();
                    });
                }
                
                function completeNewUser(callback) {
                    if (error) {
                        return res.json({ success: false, errors: errorMsgs });
                    } else {
                        var newUser = new Schemas.User({
                                email: email,
                                username: username,
                                password: password,
                                activationCode: activationCode,
                                createdDate: new Date().toISOString()
                            });

                        newUser.save(function(err, data){
                            if (err) {
                                return res.json({ success: false,
                                    errors: {
                                        unknown: {
                                            msg: 'An unknown error occurred'
                                        }
                                    }
                                });
                            }
                            userID = data._id;
                            return callback();
                        });
                    }
                }
                
                function addActivity(callback) {
                   var activity = new Schemas.Activity({
                        author: userID,
                        activityType: "signup",
                        createdDate: new Date().toISOString()
                    });
                    activity.save(function(err, data){
                        if (err) {
                            return res.json({ 
                                success: false, errors: { unknown: { msg: "An unknown error has occurred" }}
                            });
                        }
                        return callback();
                    });
                }
                
                function sendEmail(callback) {
                    var mail = new Mail();
                    
                    mail.signup({
                        email: email,
                        username: username,
                        password: password,
                        activationCode: activationCode
                    }, function () {
                        return callback();
                    });
                }
                
                
                captcha(function () {
                  checkEmail(function (){
                      checkUsername(function (){
                          completeNewUser(function () {
                              addActivity(function () {
                                  sendEmail(function () {
                                      return res.json({ success: true });
                                  }); 
                              });
                          });
                      });
                  });
                });
                
            }
        }
    },
    twitch: function (Schemas) {
        return function (accessToken, refreshToken, profile, done) {
            
            function findByTwitch (callback) {
                Schemas.User.findOne({ twitchID: profile.id }).exec(function (err, user) {
                    if (err || !user) { return callback(); }
                    return done(err, user);
                });
            }

            function findByEmail (callback) {
                if (!profile.email || !profile.email.length || profile.email === null) { return callback(); }
                Schemas.User.findOne({ email: profile.email }).exec(function (err, user) {
                    if (err || !user) { return callback(); }

                    user.twitchID = profile.id;
                    user.verified = true;

                    user.save(function (err, user) {
                        return done(err, user);
                    });
                });
            }

            function createTwitchAccount (callback) {
                var newUser = new Schemas.User({
                    email: profile.email,
                    username: profile.username,
                    password: '',
                    twitchID: profile.id,
                    verified: true,
                    createdDate: new Date().toISOString()
                });

                newUser.save(function (err, user) {
                    return done(err, user);
                });
            }

            findByTwitch(function () {
                findByEmail(function () {
                    createTwitchAccount();
                });
            });
        };
    },
    bnet: function (Schemas) {
        return function (accessToken, refreshToken, profile, done) {

            function findByBnet (callback) {
                Schemas.User.findOne({ bnetID: profile.id }).exec(function (err, user) {
                    if (err || !user) return callback();
                    return done(err, user);
                });
            }

            function findByEmail (callback) {
                Schemas.User.findOne({ email: profile.email }).exec(function (err, user) {
                    if (err || !user) return callback();

                    user.bnetID = profile.id;
                    user.verified = true;

                    user.save(function (err, user) {
                        if (err) return res.sendStatus(401);
                        return done(err, user);
                    });
                });
            }

            function createBnetAccount (callback) {
                var newUser = new Schemas.User({
                    email: profile.email,
                    username: profile.username,
                    bnetID: profile.id,
                    verified: true,
                    createdDate: new Date().toISOString()
                });

                newUser.save(function (err, user) {
                    if (err) return res.sendStatus(401);
                    return done(err, user);
                });
            }

            findByBnet(function () {
                findByEmail(function () {
                    createBnetAccount();
                });
            });
        };
    },
    verifyEmail: function (Schemas, Mail, jwt, JWT_SECRET) {
        return function (req, res, next) {
            var email = req.body.email,
                code = req.body.code;
            
            req.assert('email', 'A valid email address is required').notEmpty().isEmail();
            req.assert('code', 'Activation code is required').notEmpty();
            
            var errors = req.validationErrors();
            
            if (errors) {
                return res.json({ success: false, errors: errors });
            } else {
                var error = false,
                    errorMsgs = {};
                
                function sendEmail(user, callback) {
                    var mail = new Mail();
                    
                    mail.activated({
                        email: user.email,
                        username: user.username
                    }, function () {
                        return callback();
                    });
                }
                
                Schemas.User.findOne({ email: email }).exec(function (err, user) {
                    if (err || !user) {
                        error = true;
                        errorMsgs.email = { 
                            msg: 'Unable to find email address on an account'
                        };
                        return res.json({ success: false, errors: errorMsgs });
                    }
                    
                    if (user.verified) {
                        error = true;
                        errorMsgs.email = { 
                            msg: 'Account has already been verified'
                        };
                    } else {
                        if (user.activationCode !== code) {
                            error = true;
                            errorMsgs.code = { 
                                msg: 'Activation code is invalid'
                            };
                        }
                    }
                    
                    if (error) {
                        return res.json({ success: false, errors: errorMsgs });
                    } else {
                        user.activationCode = '';
                        user.verified = true;
                        user.lastLoginDate = new Date().toISOString();
                        user.loginCount = 1;
                        
                        user.save(function (err, user) {
                            sendEmail(user, function () {
                                var token = jwt.sign({ _id: user._id.toString() }, JWT_SECRET);

                                return res.json({
                                    success: true,
                                    userID: user._id.toString(),
                                    username: user.username,
                                    email: user.email,
                                    subscription: {
                                        isSubscribed: user.subscription.isSubscribed,
                                        plan: user.subscription.plan,
                                        expiry: (user.subscription.isSubscribed) ? false : user.subscription.expiryDate
                                    },
                                    isAdmin: user.isAdmin,
                                    token: token
                                });
                            });
                        });
                    }
                });
            }
        };
    },
    profile: function (Schemas, async) {
        return function (req, res, next) {
            var username = req.params.username,
                usr = undefined,
                postCount = 0,
                deckCount = 0,
                guideCount = 0,
                activities = [];
            
            function getUser(callback) {
                Schemas.User.findOne({ username: username, active: true }).select('username email firstName lastName photos social about subscription.isSubscribed').exec(function (err, user) {
                    if (err || !user) { return res.json({ success: false }); }
                    usr = user;
                    return callback();
                });
            };
            
            function countPosts(callback) {
                Schemas.ForumPost.count({ author:usr._id }).exec(function (err, count) {
                    postCount = count;
                    return callback();
                });
            }
            
            function countDecks(callback) {
                Schemas.Deck.count({ author:usr._id }).exec(function (err, count) {
                    deckCount = count;
                    return callback();
                })
            };
            
            function countGuides(callback) {
                Schemas.Guide.count({ author:usr._id }).exec(function (err, count) {
                    guideCount = count;
                    return callback();
                });
            };
            
            getUser(function() {
                countPosts(function() {
                    countDecks(function() {
                        countGuides(function() {
                            return res.json({ success: true, user: usr, postCount: postCount, deckCount: deckCount, guideCount: guideCount, activities: activities });
                        });
                    });
                });
            });
        };
    },
    userProfile: function (Schemas) {
        return function (req, res, next) {
            var username = req.params.username;
            
            Schemas.User.findOne({ username: username, active: true }).exec(function (err, user) {
                if (err || !user) { return res.json({ success: false }); }
                if (user._id.toString() !== req.user._id) { return res.json({ success: false }); }
                return res.json({ success: true, user: user });
            });
        };
    },
    userProfileEdit: function (Schemas, uuid, Mail) {
        return function (req, res, next) {
            var code = uuid.v4();
            
            req.assert('firstName', 'First name cannot be longer than 100 chars').len(0, 100);
            req.assert('lastName', 'Last name cannot be longer than 100 chars').len(0, 100);
            req.assert('about', 'About cannot be longer than 400 chars').len(0, 400);
            
            req.assert('social.twitter', 'Twitter cannot be longer than 100 chars').len(0, 100);
            req.assert('social.facebook', 'Facebook cannot be longer than 100 chars').len(0, 100);
            req.assert('social.twitch', 'Twitch cannot be longer than 100 chars').len(0, 100);
            req.assert('social.instagram', 'Instagram cannot be longer than 100 chars').len(0, 100);
            req.assert('social.youtube', 'Youtube cannot be longer than 100 chars').len(0, 100);
            
            if (req.body.changeEmail) {
                req.assert('newEmail', 'Valid email is required').notEmpty().isEmail();
            }
            
            if (req.body.changePassword) {
                req.assert('newPassword', 'New password is required').notEmpty();
                req.assert('confirmNewPassword', 'Confirm new password is required').notEmpty();
                req.assert('confirmNewPassword', 'New passwords must match').equals(req.body.newPassword);
            }
            
            function checkForm (callback) {
               var errors = req.validationErrors();

                if (errors) {
                    return res.json({ success: false, errors: errors });
                } else {
                    return callback();
                }
            }
            
            function checkNewEmail (callback) {
                if (!req.body.changeEmail) { return callback(); }
                Schemas.User.findOne({ email: req.body.newEmail })
                .exec(function (err, user) {
                    if (err || user) { return res.json({ success: false }); }
                    return callback();
                });
            }
            
            function updateProfile (callback) {
                Schemas.User.findOne({ _id: req.user._id })
                .exec(function (err, user) {
                    if (err || !user) { return res.json({ success: false }); }
                    
                    user.firstName = req.body.firstName;
                    user.lastName = req.body.lastName;
                    user.about = req.body.about;
                    
                    user.social = {
                        twitter: (req.body.social) ? req.body.social.twitter : '',
                        facebook: (req.body.social) ? req.body.social.facebook : '',
                        twitch: (req.body.social) ? req.body.social.twitch : '',
                        instagram: (req.body.social) ? req.body.social.instagram : '',
                        youtube: (req.body.social) ? req.body.social.youtube : ''
                    };
                    
                    if (req.body.changeEmail) {
                        user.newEmail = req.body.newEmail;
                        user.newEmailCode = code;
                    }
                    
                    if (req.body.changePassword) {
                        user.password = req.body.newPassword;
                    }
                    
                    user.save(function (err, user) {
                        if (err) { return res.json({ success: false }); }
                        return callback(user);
                    });
                });
            }
            
            function changeEmail (user, callback) {
                if (!req.body.changeEmail) { return callback(); }
                var mail = new Mail();
                if (user.email) {
                    mail.changeEmail({
                        email: user.email,
                        newEmail: req.body.newEmail,
                        code: code,
                        username: user.username
                    }, callback);
                } else {
                    mail.verifyEmail({
                        email: req.body.newEmail,
                        code: code,
                        username: user.username
                    }, callback);
                }
            }
            
            checkForm(function () {
                checkNewEmail(function () {
                    updateProfile(function (user) {
                        changeEmail(user, function () {
                            return res.json({ success: true });
                        });
                    });
                });
            });
        };
    },
    changeEmail: function (Schemas, uuid, Mail) {
        return function (req, res, next) {
            var userID = req.user._id,
                code = req.body.code,
                newCode = uuid.v4();
            
            function getUser (callback) {
                Schemas.User.findOne({ _id: userID })
                .exec(function (err, user) {
                    if (err || !user) { return res.json({ success: false }); }
                    return callback(user);
                });
            }
            
            function confirmCode (user, callback) {
                if (user.newEmailCode !== code) { return res.json({ success: false }); }
                return callback(user);
            }
            
            function getNewCode (user, callback) {
                user.newEmailCode = newCode;
                user.save(function (err) {
                    if (err) { return res.json({ success: false }); }
                    return callback(user);
                });
            }
            
            function sendEmail (user, callback) {
                var mail = new Mail();
                mail.verifyEmail({
                    email: user.newEmail,
                    username: user.username,
                    code: newCode
                }, function () {
                    return callback(user);
                });
            }
            
            getUser(function (user) {
                confirmCode(user, function (user) {
                    getNewCode(user, function (user) {
                        sendEmail(user, function (user) {
                            return res.json({ success: true });
                        });
                    });
                });
            });
        };
    },
    updateEmail: function (Schemas, Mail) {
        return function (req, res, next) {
            var userID = req.user._id,
                code = req.body.code;
            
            function getUser (callback) {
                Schemas.User.findOne({ _id: userID })
                .exec(function (err, user) {
                    if (err || !user) { return res.json({ success: false }); }
                    return callback(user);
                });
            }
            
            function confirmCode (user, callback) {
                if (user.newEmailCode !== code) { return res.json({ success: false }); }
                return callback(user);
            }
            
            function updateEmail (user, callback) {
                user.email = user.newEmail;
                user.newEmail = '';
                user.newEmailCode = '';
                user.save(function (err, user) {
                    if (err) { return res.json({ success: false }); }
                    return callback(user);
                });
            }
            
            function sendEmail (user, callback) {
                var mail = new Mail();
                mail.confirmedEmail({
                    email: user.email,
                    username: user.username
                }, function () {
                    return callback(user);
                });
            }
            
            getUser(function (user) {
                confirmCode(user, function (user) {
                    updateEmail(user, function (user) {
                        sendEmail(user, function (user) {
                            return res.json({ success: true });
                        });
                    });
                });
            });
        };
    },
    profileActivity: function (Schemas, async) {
        return function (req, res, next) {
            
            
            var username = req.params.username,
                page = req.body.page || 1,
                perpage = req.body.perpage || 20,
                length = req.body.length || 0,
                act, usr,
                tot = 0;
            
            function getTotal(callback) {
                if (length == 0) {
                    Schemas.Activity.count({ author: usr._id, active: true })
                    .exec(function (err, count) {
                        if (err) { return res.json({ success: false }); }
                        tot = count;
                        return callback();
                    });
                } else {
                    return callback();
                }
            }
            
            function getUser (callback) {
                Schemas.User.findOne({ username: username }).select('_id').exec(function (err, user) {
                    if (err || !user) { return res.json({ success: false }); }
                    usr = user
                    return callback();
                });
            }
            
            function getActivity (callback) {
                
                var iterAct = function (activity, callback) {
                    if (activity.forumPost) {
                        Schemas.ForumThread.populate(activity.forumPost, {
                            path: 'thread',
                            select: 'slug.url'
                        }, callback);
                    } else {
                        return callback();
                    }
                };
                
                Schemas.Activity.find({ author: usr._id, active: true })
                .sort('-createdDate')
                .lean()
                .skip(length)
                .limit(4)
                .populate([
                    {
                        path: 'article',
                        select: '_id title slug active comments description'
                    },
                    {
                        path: 'deck',
                        select: '_id name slug public comments description',
                        match: { public: true }
                    },
                    {
                        path: 'forumPost',
                        select: '_id title slug thread comments content'
                    },
                    {
                        path: 'guide',
                        select: '_id name slug public guideType description comments',
                        match: { public: true }
                    },
                    {
                        path: 'snapshot',
                        select: '_id title slug snapNum comments'
                    },
                    {
                        path: 'comment',
                        select: 'comment'
                    }
                ])
                .exec(function (err, activities) {
                    if (err) { return req.json({ success: false }); }
                    async.each(activities, iterAct, function (err) {
                        if (err) { return res.json({ success: false }); }
                        act = activities;
                        return callback(activities);
                    });
                });
            }
            
            getUser(function () {
                getActivity(function () {
                    getTotal(function() {
                        return res.json({ success: true, activities: act, total: tot });
                    });
                });
            });
        };
    },
    profileArticles: function (Schemas) {
        return function (req, res, next) {
            var username = req.params.username,
                page = req.body.page || 1,
                perpage = req.body.perpage || 5;
            
            function getUser (callback) {
                Schemas.User.findOne({ username: username }).select('_id').exec(function (err, user) {
                    if (err || !user) { return res.json({ success: false }); }
                    return callback(user);
                });
            }
            
            function getArticles (user, callback) {
                Schemas.Article.find({ author: user._id, active: true }).sort('-createdDate').skip((perpage * page) - perpage).limit(perpage).exec(function (err, articles) {
                    if (err) { return req.json({ success: false }); }
                    return callback(articles);
                });
            }
            
            getUser(function (user) {
                getArticles(user, function (articles) {
                    return res.json({ success: true, articles: articles });
                });
            });
        };
    },
    profileDecks: function (Schemas) {
        return function (req, res, next) {
            var username = req.params.username,
                page = req.body.page || 1,
                perpage = req.body.perpage || 12;
            
            function getUser (callback) {
                Schemas.User.findOne({ username: username }).select('_id').exec(function (err, user) {
                    if (err || !user) { return res.json({ success: false }); }
                    return callback(user);
                });
            }
            
            function getDecks (user, callback) {
                Schemas.Deck.find({ author: user._id, public: true })
                //.where(where)
                .populate([{
                    path: 'author',
                    select: 'username'
                }])
                .sort('-createdDate')
                //.skip((perpage * page) - perpage)
                //.limit(perpage)
                .exec(function (err, decks) {
                    if (err) { return req.json({ success: false }); }
                    return callback(decks);
                });
            }
            
            getUser(function (user) {
                getDecks(user, function (decks) {
                    return res.json({ success: true, decks: decks });
                });
            });
        };
    },
    profileDecksLoggedIn: function (Schemas) {
        return function (req, res, next) {
            var username = req.params.username,
                page = req.body.page || 1,
                perpage = req.body.perpage || 12;
            
            function getUser (callback) {
                Schemas.User.findOne({ username: username }).select('_id').exec(function (err, user) {
                    if (err || !user) { return res.json({ success: false }); }
                    return callback(user);
                });
            }
            
            function getDecks (user, callback) {
                var where = (req.user._id === user._id.toString()) ? {} : { 'public': true };
                
                Schemas.Deck.find({ author: user._id })
                .where(where)
                .populate([{
                    path: 'author',
                    select: 'username'
                }])
                .sort('-createdDate')
                //.skip((perpage * page) - perpage)
                //.limit(perpage)
                .exec(function (err, decks) {
                    if (err) { return req.json({ success: false }); }
                    return callback(decks);
                });
            }
            
            getUser(function (user) {
                getDecks(user, function (decks) {
                    return res.json({ success: true, decks: decks });
                });
            });
        };
    },
    profileGuides: function (Schemas) {
        return function (req, res, next) {
            
            var username = req.params.username,
                page = req.body.page || 1,
                perpage = req.body.perpage || 12;
            
            function getUser (callback) {
                Schemas.User.findOne({ username: username }).select('_id').exec(function (err, user) {
                    if (err || !user) { return res.json({ success: false }); }
                    return callback(user);
                });
            }
            
            function getGuides (user, callback) {
                Schemas.Guide.find({ author: user._id, public: true })
                //.where(where)
                .sort('-createdDate')
                .select('premium heroes guideType maps slug name description author createdDate comments votesCount')
                .populate([{
                        path: 'heroes.hero',
                        select: 'className'
                    }, {
                        path: 'maps',
                        select: 'className'
                }])
                //.skip((perpage * page) - perpage)
                //.limit(perpage)
                .exec(function (err, guides) {
                    if (err) { return req.json({ success: false }); }
                    return callback(guides);
                });
            }
            
            getUser(function (user) {
                getGuides(user, function (guides) {
                    return res.json({ success: true, guides: guides });
                });
            });
        };
    },
    profileGuidesLoggedIn: function (Schemas) {
        return function (req, res, next) {
            var username = req.params.username,
                page = req.body.page || 1,
                perpage = req.body.perpage || 10,
                guides, total,
                talents = [],
                now = new Date().getTime();
            
            function getUser (callback) {
                Schemas.User.findOne({ username: username }).select('_id').exec(function (err, user) {
                    if (err || !user) { return res.json({ success: false }); }
                    return callback(user);
                });
            }
            
            // get total guides
            function getTotal (callback) {
                Schemas.Guide.count({ public: true, featured: false })
                .exec(function (err, count) {
                    if (err) { return res.json({ success: false }); }
                    total = count;
                    return callback();
                });
            }
            
            // get guides
            function getGuides (user, callback) {
                var where = (req.user._id === user._id.toString()) ? {} : { 'public': true };
                
                Schemas.Guide.find({ author:user._id }) //TODO
                .where(where)
                .lean()
                .select('premium heroes guideType maps slug name description author createdDate comments votesCount')
                .populate([{
                        path: 'author',
                        select: 'username'
                    }, {
                        path: 'heroes.hero',
                        select: 'className'
                    }, {
                        path: 'maps',
                        select: 'className'
                }])
                .sort({ votesCount: -1, createdDate: -1 })
                .skip((perpage * page) - perpage)
                .limit(perpage)
                .exec(function (err, results) {
                    if (err) { return res.json({ success: false }); }
                    guides = results;
                    return callback();
                });
            }
            
            // get talents
            function getTalents (callback) {
                var heroIDs = [];
                for(var i = 0; i < guides.length; i++) {
                    if (guides[i].guideType == 'map') { continue; }
                    for(var j = 0; j < guides[i].heroes.length; j++) {
                        if (heroIDs.indexOf() === -1) {
                            heroIDs.push(guides[i].heroes[j].hero._id);
                        }
                    }
                }
                
                if (!heroIDs.length) { return callback(); }
                Schemas.Hero.find({ active: true, _id: { $in: heroIDs } })
                .select('talents')
                .exec(function (err, results) {
                    if (err || !results) { return res.json({ success: false }); }
                    
                    for(var i = 0; i < results.length; i++) {
                        for(var j = 0; j < results[i].talents.length; j++) {
                            talents.push(results[i].talents[j]);
                        }
                    }
                    return callback();
                });
            }
            
            function assignTalents (callback) {
                if (!talents.length) { return callback(); }
                for(var i = 0; i < guides.length; i++) {
                    if (guides[i].guideType == 'map') { continue; }
                    for(var j = 0; j < guides[i].heroes.length; j++) {
                        for(var key in guides[i].heroes[j].talents) {
                            for(var l = 0; l < talents.length; l++) {
                                if (guides[i].heroes[j].talents[key].toString() === talents[l]._id.toString()) {
                                    guides[i].heroes[j].talents[key] = {
                                        _id: talents[l]._id,
                                        name: talents[l].name,
                                        className: talents[l].className
                                    };
                                    break;
                                }
                            }
                        }
                    }
                }
                return callback();
            }
            
            getUser(function (user) {
                getGuides(user, function () {
                    getTalents(function() {
                        assignTalents(function() {
                            return res.json({ success: true, guides: guides });
                        });
                    });
                });
            });
        };
    },
    deckEdit: function (Schemas) {
        return function (req, res, next) {
            var slug = req.body.slug,
                deck,
                cards = {},
                dust = 0;
            
            function getDeck(callback) {
                Schemas.Deck.findOne({ slug: slug })
                .lean()
                .populate('cards.card')
                .populate('mulligans.withCoin.cards')
                .populate('mulligans.withoutCoin.cards')
                .exec(function (err, results) {
                    if (err || !results) { return res.json({ success: false }); }
                    
                    function fixCards (item, index, theArray) {
                        var obj = {
                            _id: item.card._id,
                            cost: item.card.cost,
                            name: item.card.name,
                            dust: item.card.dust,
                            photos: {
                                small: item.card.photos.small,
                                large: item.card.photos.large
                            },
                            legendary: (item.card.rarity === 'Legendary') ? true : false,
                            qty: item.qty
                        };
                        dust += (obj.qty < 2) ? obj.dust : (obj.dust * 2);
                        theArray[index] = obj;
                    }
                    
                    function fixMulligans (item, index, theArray) {
                        var obj = {
                            _id: item._id,
                            cost: item.cost,
                            name: item.name,
                            dust: item.dust,
                            photos: {
                                small: item.photos.small,
                                large: item.photos.large
                            },
                            legendary: (item.rarity === 'Legendary') ? true : false
                        };
                        theArray[index] = obj;
                    }
                    
                    // fix cards for deck builder
                    results.cards.forEach(fixCards);
                    
                    // fix mulligan cards for deck builder
                    results.mulligans.forEach(function (item, index, theArray) {
                        item.withCoin.cards.forEach(fixMulligans);
                        item.withoutCoin.cards.forEach(fixMulligans);
                    });
                    
                    deck = {
                        _id: results._id,
                        name: results.name,
                        slug: results.slug,
                        deckType: results.deckType,
                        description: results.description,
                        chapters: results.chapters,
                        matches: results.matches,
                        type: results.type,
                        basic: results.basic,
                        cards: results.cards,
                        heroName: results.heroName,
                        playerClass: results.playerClass,
                        public: results.public.toString(),
                        mulligans: results.mulligans,
                        dust: dust,
                        video: results.video,
                        featured: results.featured,
                        premium: {
                            isPremium: results.premium.isPremium,
                            expiryDate: results.premium.expiryDate || ''
                        }
                    };
                    return callback();
                });
            }
            
            getDeck(function () {
                return res.json({
                    success: true,
                    deck: deck
                });
            });
        };
    },
    deckBuilder: function (Schemas, Util) {
        return function (req, res, next) {
            var playerClass = Util.ucfirst(req.body.playerClass),
                page = req.body.page || 1,
                perpage = req.body.perpage || 15,
                classTotal = undefined,
                neutralTotal = undefined,
                search = req.body.search || "",
                mechanics = req.body.mechanics || [],
                mana = req.body.mana,
                man = {},
                mech = {},
                where = {},
                cards = {};
            
            // make sure it is a proper class
            if (['mage', 'shaman', 'warrior', 'rogue', 'paladin', 'priest', 'warlock', 'hunter', 'druid'].indexOf(req.body.playerClass) === -1) {
                return res.json({ success: false });
            }
            
            if (mana == 'all') {
                mana = -1;
            }
            
            if (mechanics.length != 0) {
                mech.$and = [];
                for (var i = 0; i < mechanics.length; i++) {
                    mech.$and.push({ mechanics: mechanics[i]});
                }
            }
            
            if (search) {
                where.$or = [];
                where.$or.push({ name: new RegExp(search, "i") });
                where.$or.push({ expansion: new RegExp(search, "i") });
            }
            
            function getNeutralTotal (callback) {
                var q = Schemas.Card.count({ playerClass: 'Neutral' }).where({ deckable: true, active: true }).where(where).where(mech)
                if (mana > -1) {
                    q.where('cost').equals(mana).exec(function (err, count) {
                        if (err) { return res.json({ success: false }); }
                        neutralTotal = count;
                        return callback();
                    });
                } else if (mana == '7+') {
                    q.where('cost').gte(7).exec(function (err, count) {
                        if (err) { return res.json({ success: false }); }
                        neutralTotal = count;
                        return callback();
                    });
                } else {
                    q.exec(function (err, count) {
                        if (err) { return res.json({ success: false }); }
                        neutralTotal = count;
                        return callback();
                    });
                }
            }
            
            function getClassTotal (callback) {
                var q = Schemas.Card.count({ playerClass: playerClass }).where({ deckable: true, active: true }).where(where).where(mech)
                if (mana > -1) {
                    q.where('cost').equals(mana)
                    .exec(function (err, count) {
                        if (err) { return res.json({ success: false }); }
                        classTotal = count;
                        return callback();
                    });
                } else if (mana == '7+') {
                    q.where('cost').gte(7)
                    .exec(function (err, count) {
                        if (err) { return res.json({ success: false }); }
                        classTotal = count;
                        return callback();
                    });
                } else {
                    q.exec(function (err, count) {
                        if (err) { return res.json({ success: false }); }
                        classTotal = count;
                        return callback();
                    });
                }
            }
            
            function getClass(callback) {
                var q = Schemas.Card.find({ playerClass: playerClass }).skip((perpage * page) - perpage).limit(perpage).where({ deckable: true, active: true }).where(where).where(mech)
                if (mana > -1) {
                    q.where('cost').equals(mana)
                    .sort({ cost: 1, name: 1 }).exec(function (err, results) {
                        if (err || !results) { console.log(err || 'No cards for class'); }
                        cards.class = results;
                        callback();
                    });
                } else if (mana == '7+') {
                    q.where('cost').gte(7)
                    .sort({ cost: 1, name: 1 }).exec(function (err, results) {
                        if (err || !results) { console.log(err || 'No cards for class'); }
                        cards.class = results;
                        callback();
                    });
                } else {
                    q.sort({ cost: 1, name: 1 }).exec(function (err, results) {
                        if (err || !results) { console.log(err || 'No cards for class'); }
                        cards.class = results;
                        callback();
                    });
                }
            }
        
            function getNeutral(callback) {
                var q = Schemas.Card.find({ playerClass: 'Neutral' }).skip((perpage * page) - perpage).limit(perpage).where({ deckable: true, active: true }).where(where).where(mech)
                if (mana > -1) {
                    q.where('cost').equals(mana)
                    .sort({ cost: 1, name: 1 })
                    .exec(function (err, results) {
                        if (err || !results) { console.log(err || 'No cards for neutral'); }
                        cards.neutral = results;
                        callback();
                    });
                } else if (mana == '7+') {
                    q.where('cost').gte(7)
                    .sort({ cost: 1, name: 1 })
                    .exec(function (err, results) {
                        if (err || !results) { console.log(err || 'No cards for neutral'); }
                        cards.neutral = results;
                        callback();
                    });
                } else {
                    q.sort({ cost: 1, name: 1 })
                    .exec(function (err, results) {
                        if (err || !results) { console.log(err || 'No cards for neutral'); }
                        cards.neutral = results;
                        callback();
                    });
                }
            }
    
            getClass(function (){
                getNeutral(function () {
                    getNeutralTotal(function () {
                        getClassTotal(function () {
                            return res.json({
                                success: true,
                                className: playerClass,
                                cards: cards,
                                neutralTotal: neutralTotal,
                                classTotal: classTotal
                            }); 
                        });
                    });
                });
            });
        };
    },
    deckAdd: function (Schemas, Util, mongoose) {
        return function (req, res, next) {
            var userID = req.user._id,
                newDeckID = mongoose.Types.ObjectId(),
                author;
            
            req.assert('name', 'Deck name is required').notEmpty();
            req.assert('name', 'Deck name cannot be more than 60 characters').len(1, 60);
            req.assert('deckType', 'Deck type is required').notEmpty();
            req.assert('description', 'Deck description is required').notEmpty();
            req.assert('description', 'Deck description cannot be more than 400 characters').len(1, 400);
            
            function checkForm (callback) {
               var errors = req.validationErrors();

                if (errors) {
                    return res.json({ success: false, errors: errors });
                } else {
                    return callback();
                }
            }
            
            function getUser (callback) {
                Schemas.User.findOne({ _id: userID })
                .exec(function (err, user) {
                    if (err) { return res.json({ success: false }); }
                    author = user;
                    return callback();
                });
            }
            
            function checkSlug (callback) {
                // check slug length
                if (!Util.slugify(req.body.name).length) {
                    return res.json({ success: false, errors: { name: { msg: 'An invalid name has been entered' } } });
                }
                
                // check if slug exists
                Schemas.Deck.count({ slug: Util.slugify(req.body.name) })
                .exec(function (err, count) {
                    if (err) { return res.json({ success: false, errors: { unknown: { msg: 'An unknown error occurred' } } }); }
                    if (count > 0) {
                        return res.json({ success: false, errors: { name: { msg: 'That deck name already exists. Please choose a different deck name.' } } });
                    }
                    return callback();
                });
            }
            
            function checkDeck (callback) {
                var total = 0;
                
                for (var i = 0; i < req.body.cards.length; i++) {
                    if (req.body.arena === false && req.body.cards[i].qty > 2) {
                        return res.json({ success: false, errors: { name: { msg: 'Constructed decks cannot have more than two of the same card.' } } });
                    }
                    total += req.body.cards[i].qty;
                }
                
                if (total !== 30) {
                    return res.json({ success: false, errors: { name: { msg: 'Deck must contain 30 cards.' } } });
                }
                
                return callback();
            }
            
            function createDeck(callback) {
                // setup cards
                var cards = [],
                    dust = 0;
                for (var i = 0; i < req.body.cards.length; i++) {
                    dust += (req.body.cards[i].qty < 2) ? req.body.cards[i].dust : (req.body.cards[i].dust * 2);
                    cards.push({
                        card: req.body.cards[i]._id,
                        qty: req.body.cards[i].qty
                    });
                }

                // setup mulligan cards
                if (req.body.mulligans && req.body.mulligans.length) {
                    req.body.mulligans.forEach(function (mulligan) {
                        if (mulligan.withCoin.cards.length) {
                            var mCards = [];
                            for (var i = 0; i < mulligan.withCoin.cards.length; i++) {
                                mCards.push(mulligan.withCoin.cards[i]._id);
                            }
                            mulligan.withCoin.cards = mCards;
                        }
                        if (mulligan.withoutCoin.cards.length) {
                            var mCards = [];
                            for (var i = 0; i < mulligan.withoutCoin.cards.length; i++) {
                                mCards.push(mulligan.withoutCoin.cards[i]._id);
                            }
                            mulligan.withoutCoin.cards = mCards;
                        }
                    });
                }
                
                var premium = (author.isAdmin || author.isProvider) ? {
                        isPremium: req.body.premium.isPremium || false,
                        expiryDate: req.body.premium.expiryDate || new Date().toISOString()
                    } : {
                        isPremium: false,
                        expiryDate: new Date().toISOString()
                    },
                    featured = (author.isAdmin || author.isProvider) ? req.body.featured : false,
                    newDeck = new Schemas.Deck({
                        _id: newDeckID,
                        name: req.body.name,
                        slug: Util.slugify(req.body.name),
                        deckType: req.body.deckType,
                        description: req.body.description,
                        chapters: req.body.chapters,
                        matches: req.body.matches,
                        type: req.body.type,
                        basic: req.body.basic,
                        author: req.user._id,
                        cards: cards,
                        heroName: req.body.heroName,
                        playerClass: req.body.playerClass,
                        public: req.body.public,
                        mulligans: req.body.mulligans || [],
                        video: req.body.video,
                        votes: [{
                            userID: req.user._id,
                            direction: 1
                        }],
                        featured: featured,
                        allowComments: true,
                        createdDate: new Date().toISOString(),
                        premium: premium,
                        dust: dust
                    });

                newDeck.save(function(err, data) {
                    if (err) {
                        console.log(err);
                        return res.json({ success: false,
                            errors: {
                                unknown: {
                                    msg: 'An unknown error occurred'
                                }
                            }
                        });
                    }
                    return callback();
                });
            }
            
            
             function addActivity(callback) {
                var activity = new Schemas.Activity({
                    author: userID,
                    activityType: "createDeck",
                    deck: newDeckID,
                    createdDate: new Date().toISOString()
                });
                activity.save(function(err, data) {
                    if (err) {
                        return res.json({ 
                            success: false, errors: { unknown: { msg: "An unknown error has occurred" }}
                        });
                    }
                });
                return callback();
            }
            
            
            checkForm(function () {
                checkSlug(function () {
                    getUser(function () {
                        checkDeck(function () {
                            addActivity(function () {
                                createDeck(function () {
                                    return res.json({ success: true, slug: Util.slugify(req.body.name) });
                                });
                            });
                        });
                    });
                });
                
            });
        };
    },
    deckUpdate: function (Schemas, Util) {
        return function (req, res, next) {
            var userID = req.user._id,
                author;
            
            req.assert('name', 'Deck name is required').notEmpty();
            req.assert('name', 'Deck name cannot be more than 60 characters').len(1, 60);
            req.assert('deckType', 'Deck type is required').notEmpty();
            req.assert('description', 'Deck description is required').notEmpty();
            req.assert('description', 'Deck description cannot be more than 400 characters').len(1, 400);
            
            function checkForm (callback) {
               var errors = req.validationErrors();

                if (errors) {
                    return res.json({ success: false, errors: errors });
                } else {
                    return callback();
                }
            }
            
            function getUser (callback) {
                Schemas.User.findOne({ _id: userID })
                .exec(function (err, user) {
                    if (err) { return res.json({ success: false }); }
                    author = user;
                    return callback();
                });
            }
            
            function checkSlug (callback) {
                // check slug length
                if (!Util.slugify(req.body.name).length) {
                    return res.json({ success: false, errors: { name: { msg: 'An invalid name has been entered' } } });
                }
                
                // check if slug exists
                Schemas.Deck.count({ _id: { $ne: req.body._id }, slug: Util.slugify(req.body.name) })
                .exec(function (err, count) {
                    if (err) { return res.json({ success: false, errors: { unknown: { msg: 'An unknown error occurred' } } }); }
                    if (count > 0) {
                        return res.json({ success: false, errors: { name: { msg: 'That deck name already exists. Please choose a different deck name.' } } });
                    }
                    return callback();
                });
            }
            
            function checkDeck (callback) {
                var total = 0;
                
                for (var i = 0; i < req.body.cards.length; i++) {
                    if (req.body.arena === false && req.body.cards[i].qty > 2) {
                        return res.json({ success: false, errors: { name: { msg: 'Constructed decks cannot have more than two of the same card.' } } });
                    }
                    total += req.body.cards[i].qty;
                }
                
                if (total !== 30) {
                    return res.json({ success: false, errors: { name: { msg: 'Deck must contain 30 cards.' } } });
                }
                
                return callback();
            }

            function updateDeck (callback) {
                // setup cards
                var cards = [];
                for (var i = 0; i < req.body.cards.length; i++) {
                    cards.push({
                        card: req.body.cards[i]._id,
                        qty: req.body.cards[i].qty
                    });
                }

                // setup mulligan cards
                if (req.body.mulligans && req.body.mulligans.length) {
                    req.body.mulligans.forEach(function (mulligan) {
                        if (mulligan.withCoin.cards.length) {
                            var mCards = [];
                            for (var i = 0; i < mulligan.withCoin.cards.length; i++) {
                                mCards.push(mulligan.withCoin.cards[i]._id);
                            }
                            mulligan.withCoin.cards = mCards;
                        }
                        if (mulligan.withoutCoin.cards.length) {
                            var mCards = [];
                            for (var i = 0; i < mulligan.withoutCoin.cards.length; i++) {
                                mCards.push(mulligan.withoutCoin.cards[i]._id);
                            }
                            mulligan.withoutCoin.cards = mCards;
                        }
                    });
                }
                
                console.log(req.body.name, req.body._id);
                
                var premium = (author.isAdmin || author.isProvider) ? {
                        isPremium: req.body.premium.isPremium || false,
                        expiryDate: req.body.premium.expiryDate || new Date().toISOString()
                    } : {
                        isPremium: false,
                        expiryDate: new Date().toISOString()
                    },
                    featured = (author.isAdmin || author.isProvider) ? req.body.featured : false;
                
                Schemas.Deck.findOne({ _id: req.body._id })
                .exec(function (err, deck) {
                    if (err) { return res.json({ success: false, errors: { unknown: { msg: 'An unknown error occurred' } } }); }
                    
                    console.log(deck);
                    
                    deck.name = req.body.name;
                    deck.slug = Util.slugify(req.body.name);
                    deck.deckType = req.body.deckType;
                    deck.description = req.body.description;
                    deck.chapters = req.body.chapters;
                    deck.type = req.body.type;
                    deck.basic = req.body.basic;
                    deck.matches = req.body.matches;
                    deck.cards = cards;
                    deck.public = req.body.public;
                    deck.heroName = req.body.heroName;
                    deck.mulligans = req.body.mulligans || [];
                    deck.video = req.body.video;
                    deck.premium = premium;
                    deck.arena = req.body.arena;
                    deck.featured = featured;
                    
                    deck.save(function(err, data){
                        if (err) { return res.json({ success: false, errors: { unknown: { msg: 'An unknown error occurred' } } }); }
                        return callback();
                    });

                });
            }
            
            function updateActivities(callback) {
                    Schemas.Activity.update({deck: req.body._id, activityType: 'deckComment'}, {active: req.body.public}).exec(function (err, data) {
                        return callback();
                });
            }
            
            checkForm(function () {
                checkSlug(function () {
                    getUser(function () {
                        checkDeck(function () {
                            updateActivities(function () {
                                updateDeck(function () {
                                    return res.json({ success: true, slug: Util.slugify(req.body.name) });
                                });
                            });
                        });
                    });
                });
            });
        };
    },
    deckDelete: function (Schemas) {
        return function (req, res, next) {
            var _id = req.body._id;
            Schemas.Deck.findOne({ _id: _id, author: req.user._id }).remove().exec(function (err) {
                Schemas.Activity.update({ deck: _id }, { exists: false }).exec(function (err) {
                    if (err) { return res.json({ success: false, errors: { unknown: { msg: 'An unknown error occurred' } } }); }
                    return res.json({ success: true });
                });
            });
        };
    },
    uploadToImgur: function (fs, imgur) {
        return function (req, res, next) {
            imgur.setClientId('83f887d8dc07872');

            /*
            imgur.uploadFile()
            .then(function (json) {
                console.log(json.data.link);
            })
            .catch(function (err) {
                console.error(err.message);
            });
            */
            
            return res.json({ success: true });
        };
    },
    articles: function (Schemas) {
        return function (req, res, next) {
            var articleType = req.body.articleType || 'all',
                filter = (req.body.filter && req.body.filter.length) ? req.body.filter : 'all',
                offset = req.body.offset || 0,
                num = req.body.num || 5,
                where = {},
                search = req.body.search || '',
                articles, total;
            
            // filtering articles
            if (articleType !== 'all') {
                where.articleType = (articleType instanceof Array) ? { $in: articleType } : articleType;
            }
            if (filter !== 'all') {
                where.classTags = (filter instanceof Array) ? { $in: filter } : filter;
            }
            
            // search
            if (search) {
                where.$or = [];
                where.$or.push({ title: new RegExp(search, "i") });
                where.$or.push({ description: new RegExp(search, "i") });
                where.$or.push({ content: new RegExp(search, "i") });
            }
            
            // get total articles
            function getTotal (callback) {
                Schemas.Article.count({ active: true })
                .where(where)
                .exec(function (err, count) {
                    if (err) { return res.json({ success: false }); }
                    total = count;
                    return callback();
                });
            }
            
            function getArticles (callback) {
                Schemas.Article.find({ active: true })
                .select("-content -votes")
                .where(where)
                .populate({
                    path: 'author',
                    select: 'username -_id'
                })
                .sort('-createdDate')
                .skip(offset)
                .limit(num)
                .exec(function (err, results) {
                    if (err) { return req.json({ success: false }); }
                    articles = results;
                    return callback();
                });
            }
            
            getArticles(function () {
                getTotal(function () {
                    return res.json({ success: true, articles: articles, total: total, articleType: articleType, filter: filter, offset: offset, num: num, search: search });
                });
            });
        };
    },
    article: function (Schemas) {
        return function (req, res, next) {
            var slug = req.body.slug;
            
            function getArticle (callback) {
                Schemas.Article.findOne({ 'slug.url': slug })
                .lean()
                .populate([{
                        path: 'author',
                        select: 'username -_id email providerDescription about social'
                    },
                    {
                        path: 'related',
                        select: 'title slug.url active -_id author votesCount photos.small articleType',
                    },
                    {
                        path: 'comments',
                        select: '_id author comment createdDate votesCount votes'
                    }
                ])
                .exec(function (err, article) {
                    if (err || !article) { return res.json({ success: false }); }
                    return callback(article); 
                });
            }
            
            function getComments (article, callback) {
                Schemas.Comment.populate(article.comments, {
                    path: 'author',
                    select: 'username email'
                }, function (err, comments) {
                    if (err || !comments) { return res.json({ success: false }); }
                    article.comments = comments;
                    return callback(article);
                });
            }
            
            function getRelated(article, callback) {
                Schemas.Article.populate(article.related, {
                    path: 'author',
                    select: 'username'
                }, function (err, related) {
                    if (err || !related) { return res.json({ success: false }); }
                    article.related = related;
                    return callback(article);
                })
            }
            
            function getDeck (article, callback) {
                Schemas.Deck.findOne({ _id: article.deck })
                .lean()
                .populate([{
                        path: 'cards.card'
                }])
                .exec(function (err, deck) {
                    if (!err && deck) {
                        article.deck = deck;
                    }
                    return callback(article);
                });
            }
            
            getArticle(function (article) {
                getDeck(article, function (article) {
                    getComments(article, function (article) {
                        getRelated(article, function(article) {
                            return res.json({ success: true, article: article });
                        });
                    });
                });
            });
        };
    },
    articleCommentAdd: function (Schemas, mongoose) {
        return function (req, res, next) {
            var articleID = req.body.articleID,
                userID = req.user._id,
                comment = req.body.comment,
                newCommentID = mongoose.Types.ObjectId();
            req.assert('comment', 'Comment cannot be longer than 1000 characters').len(1, 1000);
            
            var errors = req.validationErrors();
            if (errors) {
                return res.json({ success: false, errors: errors });
            }
            
            // new comment
            var newComment = {
                _id: newCommentID,
                author: userID,
                comment: comment,
                votesCount: 1,
                votes: [{
                    userID: userID,
                    direction: 1
                }],
                replies: [],
                createdDate: new Date().toISOString()
            };
            
            // create
            function createComment (callback) {
                var newCmt = new Schemas.Comment(newComment);
                newCmt.save(function (err, data) {
                    if (err) { return res.json({ success: false, errors: { unknown: { msg: 'An unknown error occurred' } } }); }
                    return callback();
                });
            }
            
            // add to article
            function addComment (callback) {
                Schemas.Article.update({ _id: articleID }, { $push: { comments: newCommentID } }, function (err) {
                    if (err) { return res.json({ success: false, errors: { unknown: { msg: 'An unknown error occurred' } } }); }
                    return callback();
                });
            }
            
            // get new comment
            function getComment (callback) {
                Schemas.Comment.populate(newComment, {
                    path: 'author',
                    select: 'username email'
                }, function (err, comment) {
                    if (err || !comment) { return res.json({ success: false }); }
                        return callback(comment);
                });
            }
            
            function addActivity(callback) {
                var activity = new Schemas.Activity({
                    author: userID,
                    activityType: "articleComment",
                    article: articleID,
                    createdDate: new Date().toISOString(),
                    comment: newCommentID
                });
                activity.save(function(err, data) {
                    if (err) {
                        return res.json({ 
                            success: false, errors: { unknown: { msg: "An unknown error has occurred" }}
                        });
                    }
                });
                return callback();
            }
            
            // actions
            createComment(function () {
                addComment(function () {
                    addActivity(function() {
                        getComment(function (comment) {
                            return res.json({
                                success: true,
                                comment: comment
                            });
                        });
                    });
                });
            });
        };
    },
    articleVote: function (Schemas) {
        return function (req, res, next) {
            var id = req.body._id;
            
            Schemas.Article.findOne({ _id: id }).select('author votesCount votes').exec(function (err, article) {
                if (err || !article) { return res.json({ success: false }); }
                article.votes.push(req.user._id);
                article.votesCount++;
                article.save(function (err) {
                    if (err) { return res.json({ success: false }); console.log(err); }
                    return res.json({
                        success: true,
                        votesCount: article.votesCount
                    });
                });
            });
        };
    },
    decksFeatured: function (Schemas) {
        return function (req, res, next) {
            var klass = req.body.klass || false,
                page = req.body.page || 1,
                perpage = req.body.perpage || 10,
                search = req.body.search || false,
                where = {},
                decks, total;
            
            if (klass && klass.length) {
                where.playerClass = (klass instanceof Array) ? { $in: klass } : klass;
            }
            
            if (search) {
                where.$or = [];
                where.$or.push({ name: new RegExp(search, "i") });
                where.$or.push({ description: new RegExp(search, "i") });
                where.$or.push({ contentEarly: new RegExp(search, "i") });
                where.$or.push({ contentMid: new RegExp(search, "i") });
                where.$or.push({ contentLate: new RegExp(search, "i") });
            }
            
            // get total decks
            function getTotal (callback) {
                Schemas.Deck.count({ featured: true })
                .where(where)
                .exec(function (err, count) {
                    if (err) { return res.json({ success: false }); }
                    total = count;
                    return callback();
                });
            }
            
            // get decks
            function getDecks (callback) {
                Schemas.Deck.find({ featured: true })
                .where(where)
                .select('premium playerClass slug name description author createdDate comments votesCount dust heroName')
                .populate({
                    path: 'author',
                    select: 'username -_id'
                })
                .sort({ createdDate: -1 })
                .skip((perpage * page) - perpage)
                .limit(perpage)
                .exec(function (err, results) {
                    if (err) { return res.json({ success: false }); }
                    decks = results;
                    return callback();
                });
            }
            
            getDecks(function () {
                getTotal(function () {
                    return res.json({ success: true, decks: decks, total: total, klass: klass, page: page, perpage: perpage });
                });
            });
            
        };
    },
    decksCommunity: function (Schemas) {
        return function (req, res, next) {
            var klass = req.body.klass || false,
                page = req.body.page || 1,
                perpage = req.body.perpage || 10,
                search = req.body.search || false,
                daysLimit = (!req.body.daysLimit) ? false : parseInt(req.body.daysLimit) || 14,
                where = {},
                decks, total,
                now = new Date().getTime(),
                ago = new Date(now - (60*60*24*daysLimit*1000));
            
            if (klass && klass.length) {
                where.playerClass = (klass instanceof Array) ? { $in: klass } : klass;
            }
            
            if (search) {
                where.$or = [];
                where.$or.push({ name: new RegExp(search, "i") });
                where.$or.push({ description: new RegExp(search, "i") });
                where.$or.push({ contentEarly: new RegExp(search, "i") });
                where.$or.push({ contentMid: new RegExp(search, "i") });
                where.$or.push({ contentLate: new RegExp(search, "i") });
            }
                        
            if (daysLimit) {
                where.createdDate = { $gte: ago };
            }
            
            // get total decks
            function getTotal (callback) {
                Schemas.Deck.count({ public: true, featured: false })
                .where(where)
                .exec(function (err, count) {
                    if (err) { return res.json({ success: false }); }
                    total = count;
                    return callback();
                });
            }
            
            // get decks
            function getDecks (callback) {
                Schemas.Deck.find({ public: true, featured: false })
                .where(where)
                .select('premium playerClass slug name description author createdDate comments votesCount dust heroName')
                .populate({
                    path: 'author',
                    select: 'username -_id'
                })
                .sort({ createdDate: -1 })
                .skip((perpage * page) - perpage)
                .limit(perpage)
                .exec(function (err, results) {
                    if (err) { return res.json({ success: false }); }
                    decks = results;
                    return callback();
                });
            }
            
            getDecks(function () {
                getTotal(function () {
                    return res.json({ success: true, decks: decks, total: total, klass: klass, page: page, perpage: perpage });
                });
            });
            
        };
    },
    decks: function (Schemas) {
        return function (req, res, next) {
            var klass = req.body.klass || 'all',
                page = req.body.page || 1,
                perpage = req.body.perpage || 10,
                search = req.body.search || '',
                age = req.body.age || 'all',
                order = req.body.order || 'high',
                where = {}, sort = {},
                decks, total,
                now = new Date().getTime();
            
            // klass
            if (klass !== 'all') {
                where.playerClass = klass;
            }
            
            // search
            if (search) {
                where.$or = [];
                where.$or.push({ name: new RegExp(search, "i") });
                where.$or.push({ description: new RegExp(search, "i") });
                where.$or.push({ contentEarly: new RegExp(search, "i") });
                where.$or.push({ contentMid: new RegExp(search, "i") });
                where.$or.push({ contentLate: new RegExp(search, "i") });
            }
            
            // age
            switch (age) {
                case '7':
                    where.createdDate = { $gte: new Date(now - (60 * 60 * 24 * 7 * 1000)) };
                    break;
                case '15':
                    where.createdDate = { $gte: new Date(now - (60 * 60 * 24 * 15 * 1000)) };
                    break;
                case '30':
                    where.createdDate = { $gte: new Date(now - (60 * 60 * 24 * 30 * 1000)) };
                    break;
                case '60':
                    where.createdDate = { $gte: new Date(now - (60 * 60 * 24 * 60 * 1000)) };
                    break;
                case '90':
                    where.createdDate = { $gte: new Date(now - (60 * 60 * 24 * 90 * 1000)) };
                    break;
                case 'all':
                default:
                    break;
            }
            
            // sort
            switch (order) {
                case 'low':
                    sort = { votesCount: 1, createdDate: -1 };
                    break;
                case 'new':
                    sort = { createdDate: -1 };
                    break;
                case 'old':
                    sort = { createdDate: 1 };
                    break;
                case 'high':
                default:
                    sort = { votesCount: -1, createdDate: -1 };
                    break;
            }
            
            // get total decks
            function getTotal (callback) {
                Schemas.Deck.count({ public: true })
                .populate({
                    path: 'author',
                    select: 'username -_id'
                })
                .where(where)
                .exec(function (err, count) {
                    if (err) { return res.json({ success: false }); }
                    total = count;
                    return callback();
                });
            }
            
            // get decks
            function getDecks (callback) {
                Schemas.Deck.find({ public: true })
                .select('premium playerClass slug name description author createdDate comments votesCount dust')
                .populate({
                    path: 'author',
                    select: 'username -_id'
                })
                .where(where)
                .sort(sort)
                .skip((perpage * page) - perpage)
                .limit(perpage)
                .exec(function (err, results) {
                    if (err) { return res.json({ success: false }); }
                    decks = results;
                    return callback();
                });
            }
            
            getDecks(function () {
                getTotal(function () {
                    return res.json({ success: true, decks: decks, total: total, klass: klass, page: page, perpage: perpage, search: search, age: age, order: order });
                });
            });
            
        };
    },
    deck: function (Schemas) {
        return function (req, res, next) {
            var slug = req.body.slug;
            Schemas.Deck.findOne({ slug: slug })
            .lean()
            .populate([{
                    path: 'author',
                    select: 'username -_id'
                },{
                    path: 'cards.card'
                },{
                    path: 'mulligans.withCoin.cards',
                    select: 'name photos'
                },{
                    path: 'mulligans.withoutCoin.cards',
                    select: 'name photos'
                },{
                    path: 'comments',
                    select: '_id author comment createdDate votesCount votes'
            }])
            .exec(function (err, deck) {
                if (err || !deck) { return res.json({ success: false }); }
                
                Schemas.Comment.populate(deck.comments, {
                    path: 'author',
                    select: 'username email'
                }, function (err, comments) {
                    if (err || !comments) { return res.json({ success: false }); }
                    deck.comments = comments;

                    return res.json({
                        success: true,
                        deck: deck
                    });
                });
            });
        };
    },
    deckVote: function (Schemas) {
        return function (req, res, next) {
            var id = req.body._id,
                direction = req.body.direction;
            
            Schemas.Deck.findOne({ _id: id }).select('author votesCount votes').exec(function (err, deck) {
                if (err || !deck || deck.author.toString() === req.user._id) { return res.json({ success: false }); }
                var vote = deck.votes.filter(function (vote) {
                    if (vote.userID.toString() === req.user._id) {
                        return vote;
                    }
                })[0];
                if (vote) {
                    if (vote.direction !== direction) {
                        vote.direction = direction;
                        deck.votesCount = (direction === 1) ? deck.votesCount + 2 : deck.votesCount - 2;
                    }
                } else {
                    deck.votes.push({
                        userID: req.user._id,
                        direction: direction
                    });
                    deck.votesCount += direction;
                }
                
                deck.save(function (err) {
                    if (err) { return res.json({ success: false }); }
                    return res.json({
                        success: true,
                        votesCount: deck.votesCount
                    });
                });
            });
        };
    },
    deckCommentAdd: function (Schemas, mongoose) {
        return function (req, res, next) {
            var deckID = req.body.deckID,
                userID = req.user._id,
                comment = req.body.comment,
                newCommentID = mongoose.Types.ObjectId();
            
            req.assert('comment', 'Comment cannot be longer than 1000 characters').len(1, 1000);
            
            var errors = req.validationErrors();
            if (errors) {
                return res.json({ success: false, errors: errors });
            }
            
            // new comment
            var newComment = {
                _id: newCommentID,
                author: userID,
                comment: comment,
                votesCount: 1,
                votes: [{
                    userID: userID,
                    direction: 1
                }],
                replies: [],
                createdDate: new Date().toISOString()
            };
            
            // create
            function createComment (callback) {
                var newCmt = new Schemas.Comment(newComment);
                newCmt.save(function (err, data) {
                    if (err) {
                        console.log(err);
                        return res.json({ success: false,
                            errors: {
                                unknown: {
                                    msg: 'An unknown error occurred'
                                }
                            }
                        });
                    }
                    return callback();
                });
            }
            
            // add to deck
            function addComment (callback) {
                Schemas.Deck.update({ _id: deckID }, { $push: { comments: newCommentID } }, function (err) {
                    if (err) {
                        console.log(err);
                        return res.json({ success: false,
                            errors: {
                                unknown: {
                                    msg: 'An unknown error occurred'
                                }
                            }
                        });
                    }
                    return callback();
                });
            }
            
            // get new comment
            function getComment (callback) {
                Schemas.Comment.populate(newComment, {
                    path: 'author',
                    select: 'username email'
                }, function (err, comment) {
                    if (err || !comment) { return res.json({ success: false }); }
                        return callback(comment);
                });
            }
            
            function addActivity(callback) {
                var activity = new Schemas.Activity({
                    author: userID,
                    activityType: "deckComment",
                    deck: deckID,
                    createdDate: new Date().toISOString(),
                    comment: newCommentID
                });
                activity.save(function(err, data) {
                    if (err) {
                        return res.json({ 
                            success: false, errors: { unknown: { msg: "An unknown error has occurred" }}
                        });
                    }
                });
                return callback();
            }
            
            // actions
            createComment(function () {
                addComment(function () {
                    addActivity(function () {
                        getComment(function (comment) {
                            return res.json({
                                success: true,
                                comment: comment
                            });
                        });
                    });
                });
            });
        };
    },
    forum: function (Schemas, async) {
        return function (req, res, next) {

            Schemas.ForumCategory.find({ active: true })
            .lean()
            .populate({
                path: 'threads',
                match: { active: true }
            })
            .exec(function (err, cats) {
                if (err) { return res.json({ success: false }); }
                
                var getPosts = function (thread, callback) {
                    Schemas.ForumPost.count({ thread: thread._id }).exec(function (err, count) {
                        if (err) { return res.json({ success: false }); }
                        thread.numPosts = count;
                        return callback();
                    });
                };
                
                var iterPost = function (thread, callback) {
                    thread.posts = (thread.posts.length) ? [thread.posts[0]] : [];
                    Schemas.ForumPost.populate(thread.posts, {
                        path: 'author',
                        select: 'username email -_id'
                    }, callback);
                };
                
                var iterThread = function (cat, callback) {
                    Schemas.ForumThread.populate(cat.threads, {
                        path: 'posts',
                        match: { active: true },
                        select: 'title slug author createdDate -_id',
                        options: { sort: '-createdDate' }
                    }, function (err, threads) {
                        async.each(threads, iterPost, function (err) {
                            if (err) { return res.json({ success: false }); }
                            async.each(threads, getPosts, function (err) {
                                if (err) { return res.json({ success: false }); }
                                return callback();
                            });
                        });
                    });
                };
                
                async.each(cats, iterThread, function (err) {
                    if (err) { return res.json({ success: false }); }
                    return res.json({ success: true, categories: cats });
                });
                
            });
        };
    },
    forumThread: function (Schemas) {
        return function (req, res, next) {
            var thread = req.body.thread,
                page = req.body.page || 1,
                perpage = req.body.perpage || 30;
            
            Schemas.ForumThread.findOne({ 'slug.url': thread })
            .populate({
                path: 'posts',
                match: { active: true },
                options: { skip: ((page * perpage) - perpage), limit: perpage, sort: '-createdDate' }
            })
            .exec(function (err, thread) {
                if (err || !thread) { return res.json({ success: false }); }
                
                Schemas.ForumPost.populate(thread.posts, {
                    path: 'author',
                    select: 'username email -_id'
                }, function (err, posts) {
                    if (err || !posts) { return res.json({ success: false }); }
                    
                    thread.posts = posts;
                    
                    return res.json({ success: true, thread: thread });
                });
            });
        };
    },
    forumPost: function (Schemas) {
        return function (req, res, next) {
            var thread,
                threadSlug = req.body.thread,
                post,
                postSlug = req.body.post;
            
            function getThread (callback) {
                Schemas.ForumThread.findOne({ 'slug.url': threadSlug })
                .lean()
                .select('_id title slug')
                .exec(function (err, results) {
                    if (err || !results) { return res.json({ success: false }); }
                    thread = results;
                    return callback();
                });
            }
            
            function getPost (callback) {
                Schemas.ForumPost.findOne({ 'slug.url': postSlug, thread: thread._id })
                .populate([
                    {
                        path: 'author',
                        select: 'username email'
                    },
                    {
                        path: 'comments',
                        select: '_id author comment createdDate votesCount votes'
                        
                    }
                ])
                .exec(function (err, results) {
                    if (err || !results) { return res.json({ success: false }); }
                    post = results;
                    
                    Schemas.Comment.populate(post.comments, {
                        path: 'author',
                        select: 'username email'
                    }, function (err, comments) {
                        if (err || !comments) { return res.json({ success: false }); }

                        post.comments = comments;

                        return callback();
                    });
                });
            }
            
            getThread(function () {
                getPost(function () {
                    return res.json({ success: true, thread: thread, post: post });
                });
            });
        };
    },
    forumPostAdd: function (Schemas, Util, mongoose) {
        return function (req, res, next) {
            
            req.assert('post.title', 'Post title is required').notEmpty();
            req.assert('post.title', 'Post title cannot be longer than 100 characters').len(1, 100);
            req.assert('post.content', 'Post content is required').notEmpty();
            req.assert('post.content', 'Post content cannot be longer than 5000 characters').len(1, 5000);
            
            // check form
            function checkForm (callback) {
                var errors = req.validationErrors();

                if (errors) {
                    return res.json({ success: false, errors: errors });
                } else {
                    return callback();
                }
            }
            
            // vars
            var threadID = req.body.thread._id,
                _id = mongoose.Types.ObjectId(),
                newPost = new Schemas.ForumPost({
                    _id: _id,
                    thread: threadID,
                    title: req.body.post.title,
                    slug: {
                        url: Util.slugify(req.body.post.title),
                        linked: true
                    },
                    author: req.user._id,
                    content: req.body.post.content,
                    comments: [],
                    views: 0,
                    votesCount: 1,
                    votes: [{
                        userID: req.user._id,
                        direction: 1
                    }],
                    createdDate: new Date().toISOString(),
                    active: true
                });
            
            // check slug
            function checkSlug (callback) {
                Schemas.ForumPost.count({ 'slug.url': Util.slugify(req.body.post.title) })
                .exec(function (err, count) {
                    if (err) { return res.json({ success: false, errors: { unknown: { msg: 'An unknown error occurred' } } }); }
                    if (count > 0) {
                        return res.json({ success: false, errors: { title: { msg: 'A post already exists with that title. Please choose another title.' } } });
                    }
                    return callback();
                });
            }
            
            // create post
            function createPost(callback) {
                newPost.save(function(err, data){
                    if (err) {
                        return res.json({ success: false, errors: { unknown: { msg: 'An unknown error occurred' } } });
                    }
                    return callback();
                });
            }
            
            // add post to thread
            function addToThread(callback) {
                Schemas.ForumThread.findOneAndUpdate({ _id: threadID }, { $push: { posts: _id } }).exec(function (err, thread) {
                    if (err || !thread) { return res.json({ success: false, errors: { unknown: { msg: 'An unknown error occurred' } } }); }
                    return callback();
                });
            }
            
            function addActivity(callback) {
                var activity = new Schemas.Activity({
                    author: req.user._id,
                    activityType: "forumPost",
                    forumPost: newPost,
                    createdDate: new Date().toISOString()
                });
                activity.save(function(err, data) {
                    if (err) {
                        return res.json({ 
                            success: false, errors: { unknown: { msg: "An unknown error has occurred" }}
                        });
                    }
                });
                return callback();
            }
            
            checkForm(function () {
                checkSlug(function () {
                    createPost(function () {
                        addActivity(function () {
                            addToThread(function () {
                                return res.json({ success: true });
                            });
                        });
                    });
                });
            });
        };
    },
    forumCommentAdd: function (Schemas, mongoose) {
        return function (req, res, next) {
            // vars
            var postID = req.body.post._id,
                _id = mongoose.Types.ObjectId(),
                newComment = new Schemas.Comment({
                    _id: _id,
                    author: req.user._id,
                    comment: req.body.comment,
                    votesCount: 1,
                    votes: [{
                        userID: req.user._id,
                        direction: 1
                    }],
                    replies: [],
                    createdDate: new Date().toISOString()
                }),
                dataComment;
            
            req.assert('comment', 'Comment cannot be longer than 1000 characters').len(1, 1000);
            
            var errors = req.validationErrors();
            if (errors) {
                return res.json({ success: false, errors: errors });
            }
            
            // create comment
            function createComment(callback) {
                newComment.save(function (err, data) {
                    if (err) {
                        return res.json({ success: false, errors: { unknown: { msg: 'An unknown error occurred' } } });
                    }
                    return callback();
                });
            }
            
            // add comment to post
            function addToPost(callback) {
                Schemas.ForumPost.findOneAndUpdate({ _id: postID }, { $push: { comments: _id } }).exec(function (err, post) {
                    if (err || !post) { return res.json({ success: false, errors: { unknown: { msg: 'An unknown error occurred' } } }); }
                    return callback();
                });
            }
            
            function getComment (callback) {
                Schemas.Comment.populate(newComment, {
                    path: 'author',
                    select: 'username email'
                }, function (err, comment) {
                    if (err || !comment) { return res.json({ success: false }); }

                        dataComment = comment;

                        return callback();
                });
            }
            
            
            
            function addActivity(callback) {
                var activity = new Schemas.Activity({
                    author: req.user._id,
                    activityType: "forumComment",
                    forumPost: postID,
                    createdDate: new Date().toISOString(),
                    comment: _id
                });
                activity.save(function(err, data) {
                    if (err) {
                        return res.json({ 
                            success: false, errors: { unknown: { msg: "An unknown error has occurred" }}
                        });
                    }
                });
                return callback();
            }
            
            
            
            createComment(function () {
                addToPost(function () {
                    addActivity(function () {
                        getComment(function () {
                            res.json({ success: true, comment: dataComment });
                        });
                    });
                });
            });
        };
    },
    commentVote: function (Schemas) {
        return function (req, res, next) {
            var id = req.body._id,
                direction = req.body.direction;
            
            Schemas.Comment.findOne({ _id: id }).select('author votesCount votes').exec(function (err, comment) {
                if (err || !comment || comment.author.toString() === req.user._id) { return res.json({ success: false }); }
                var vote = comment.votes.filter(function (vote) {
                    if (vote.userID.toString() === req.user._id) {
                        return vote;
                    }
                })[0];
                if (vote) {
                    if (vote.direction !== direction) {
                        vote.direction = direction;
                        comment.votesCount = (direction === 1) ? comment.votesCount + 2 : comment.votesCount - 2;
                    }
                } else {
                    comment.votes.push({
                        userID: req.user._id,
                        direction: direction
                    });
                    comment.votesCount += direction;
                }
                
                comment.save(function (err) {
                    if (err) { return res.json({ success: false }); }
                    return res.json({
                        success: true,
                        votesCount: comment.votesCount
                    });
                });
            });
        };
    },
    subSetPlan: function (Schemas, Subscription) {
        return function (req, res, next) {
            var userID = req.user._id,
                plan = req.body.plan,
                cctoken = req.body.cctoken || false;
            
            function getUser (callback) {
                Schemas.User.findOne({ _id: userID })
                .exec(function (err, user) {
                    if (err || !user) { return res.json({ success: false }); }
                    return callback(user);
                });
            }
            
            function setPlan (user, callback) {
                var sub = new Subscription(user);
                sub.setPlan(plan, cctoken, function (err) {
                    if (err) { return res.json({ success: false }); }
                    return callback();
                });
            }
            
            getUser(function (user) {
                setPlan(user, function () {
                    return res.json({ success: true, plan: plan });
                });
            });
        };
    },
    subSetCard: function (Schemas, Subscription) {
        return function (req, res, next) {
            var userID = req.user._id,
                cctoken = req.body.cctoken;
            
            function getUser (callback) {
                Schemas.User.findOne({ _id: userID })
                .exec(function (err, user) {
                    if (err || !user) { return res.json({ success: false }); }
                    return callback(user);
                });
            }
            
            function setCard (user, callback) {
                var sub = new Subscription(user);
                sub.setCard(cctoken, function (err, last4) {
                    if (err) { return res.json({ success: false }); }
                    return callback(last4);
                });
            }
            
            getUser(function (user) {
                setCard(user, function (last4) {
                    return res.json({ success: true, subscription: {
                        last4: last4
                    } });
                });
            });
        };
    },
    subCancel: function (Schemas, Subscription) {
        return function (req, res, next) {
            var userID = req.user._id;
            
            function getUser (callback) {
                Schemas.User.findOne({ _id: userID })
                .exec(function (err, user) {
                    if (err || !user) { return res.json({ success: false }); }
                    return callback(user);
                });
            }
            
            function cancelPlan (user, callback) {
                var sub = new Subscription(user);
                sub.cancel(function (err, expiryDate) {
                    if (err) { return res.json({ success: false }); }
                    return callback(expiryDate);
                });
            }
            
            getUser(function (user) {
                cancelPlan(user, function (expiryDate) {
                    return res.json({ success: true, subscription: {
                        expiryDate: expiryDate
                    }});
                });
            });
        };
    },
    getBanners: function (Schemas) {
        return function (req, res, next) {
            function getBanners (callback) {
                Schemas.Banner.find({ active: true, bannerType: req.body.bannerType })
                .sort({ orderNum: 1 })
                .exec(function (err, banners) {
                    if (err) { return res.json({ success: false, banners: [] }); }
                    return callback(banners);
                });
            }
            
            getBanners(function (banners) {
                return res.json({ success: true, banners: banners });
            });
        };
    },
    pollsPage: function(Schemas, async) {
        return function(req, res, next) {
            var view = req.body.view;
            
            var iterPolls = function(poll, callback) {
                Schemas.Poll.populate(poll.items, {
                    path: 'items',
                    select: '_id name votes orderNum'
                }, callback);
            }
            
            
            function getPolls(callback) {
                Schemas.Poll.find({ view: view })
                .lean()
                .sort({ orderNum : 1 })
                .exec(function (err, polls) {
                    if (err) {return res.json({ success: false, polls: [] }); }
                    async.each(polls, iterPolls, function (err) {
                        if (err) { return res.json({ success: false }); }
                        return callback(polls);
                    });
                });
            }
            
            
            getPolls(function(polls) {
                return res.json({ success: true, polls: polls });
            });
        };
    },
    pollsVote: function (Schemas) {
        return function(req, res, next) {
            var votes = req.body.poll.votes;
            
            function postVotes(callback) {
                Schemas.Poll.findOne({ _id: req.body.poll._id })
                .exec(function(err, poll) {
                    for (var i = 0; i < votes.length; i++) {
                        var item = poll.items.id(votes[i]);
                        item.votes++;
                    }
                    
                    poll.save(function (err) {
                        if (err) { return res.json({ success: false }); }
                        return res.json({
                            success: true,
                            votes: item.votes
                        }); 
                    });
                })
            }
            
            postVotes(function(poll) {
                return res.json({ success: true });
            });
        }
    },
    snapshots: function (Schemas) {
        return function (req, res, next) {
            var filter = req.body.filter || 'all',
                page = req.body.page || 1,
                perpage = req.body.perpage || 5,
                where = {},
                search = req.body.search || '',
                snapshots, total;
            
            if (search) {
                where.$or = [];
                where.$or.push({ title: new RegExp(search, "i") });
                where.$or.push({ description: new RegExp(search, "i") });
                where.$or.push({ content: new RegExp(search, "i") });
            }
            
            // get total articles
            function getTotal (callback) {
                Schemas.Snapshot.count({ active: true })
                .where(where)
                .exec(function (err, count) {
                    if (err) { return res.json({ success: false }); }
                    total = count;
                    return callback();
                });
            }
            
            function getSnapshots (callback) {
                Schemas.Snapshot.find({ active: true })
                .where(where)
                .sort('-createdDate')
                .skip((perpage * page) - perpage)
                .limit(perpage)
                .exec(function (err, results) {
                    if (err) { return req.json({ success: false }); }
                    snapshots = results;
                    return callback();
                });
            }
            
            getTotal(function () {
                getSnapshots(function () {
                    return res.json({
                        success: true, 
                        snapshots: snapshots,
                        total: total
                    });
                });
            });
            
        }
    },
    snapshot: function (Schemas) {
        return function (req, res, next) {
            var slug = req.body.slug,
                snapshot = undefined;
            
            
            function getSnapshot (callback) {
            
                Schemas.Snapshot.findOne({ "slug.url" : slug })
                .lean()
                .populate([
                    {
                        path: 'authors.user',
                    },
                    {
                        path: 'tiers.decks.deck',
                    },
                    {
                        path: 'tiers.decks.tech.cards.card',
                    },
                    {
                        path: 'matches.for',
                        select: 'name playerClass'
                    },
                    {
                        path: 'comments',
                        select: '_id author comment createdDate votesCount votes'
                    },
                    {
                        path: 'matches.against',
                        select: 'name playerClass'
                    }
                ])
                .exec(function (err, results) {
                    if (err || !results) { return res.json({ success: false }); }
                    Schemas.Comment.populate(results.comments, {
                        path: 'author',
                        select: 'username email'
                    }, function (err, c) {
                        results.comments = c;
                        return callback(results);
                    });
                    
                });
            
            }
            
            function fixTrends (snapshot, callback) {
                for (var i = 0; i < snapshot.tiers.length; i++) {
                    for (var j = 0; j < snapshot.tiers[i].decks.length; j++) {
                        snapshot.tiers[i].decks[j].rank.all = [snapshot.tiers[i].decks[j].rank.current].concat(snapshot.tiers[i].decks[j].rank.last);
                    }
                }
                return callback(snapshot);
            }
            
            getSnapshot(function (snapshot) {
                fixTrends(snapshot, function (snapshot) {
                    return res.json({
                        success: true,
                        snapshot: snapshot
                    });
                });
            });
            
        }
    },
    snapshotVote: function (Schemas) {
        return function (req, res, next) {
            var snapshot = req.body.snapshot;
            function vote (callback) {
                Schemas.Snapshot.findOne({ _id: snapshot }).select('votesCount votes').exec(function (err, snapshot) {
                    if (err || !snapshot) { return res.json({ success: false }); }
                    snapshot.votes.push(req.user._id);
                    snapshot.votesCount++;
                    snapshot.save(function (err) {
                        if (err) { return res.json({ success: false }); console.log(err); }
                        return res.json({
                            success: true,
                            votesCount: snapshot.votesCount
                        });
                    });
                });
            }
            vote(function () {
                return res.json({
                    success: true

                });
            });
        }
    },
    snapshotCommentAdd: function (Schemas, mongoose) {
        return function (req, res, next) {
            var snapshotID = req.body.snapshotID,
                userID = req.user._id,
                comment = req.body.comment,
                newCommentID = mongoose.Types.ObjectId();
            req.assert('comment', 'Comment cannot be longer than 1000 characters').len(1, 1000);
            
            var errors = req.validationErrors();
            if (errors) {
                return res.json({ success: false, errors: errors });
            }
            
            // new comment
            var newComment = {
                _id: newCommentID,
                author: userID,
                comment: comment,
                votesCount: 1,
                votes: [{
                    userID: userID,
                    direction: 1
                }],
                replies: [],
                createdDate: new Date().toISOString()
            };
            
            // create
            function createComment (callback) {
                var newCmt = new Schemas.Comment(newComment);
                newCmt.save(function (err, data) {
                    if (err) { return res.json({ success: false, errors: { unknown: { msg: 'An unknown error occurred' } } }); }
                    return callback();
                });
            }
            
            // add to snapshot
            function addComment (callback) {
                Schemas.Snapshot.update({ _id: snapshotID }, { $push: { comments: newCommentID } }, function (err) {
                    if (err) { return res.json({ success: false, errors: { unknown: { msg: 'An unknown error occurred' } } }); }
                    return callback();
                });
            }
            
            // get new comment
            function getComment (callback) {
                Schemas.Comment.populate(newComment, {
                    path: 'author',
                    select: 'username email'
                }, function (err, comment) {
                    if (err || !comment) { return res.json({ success: false }); }
                        return callback(comment);
                });
            }
            
            function addActivity(callback) {
                var activity = new Schemas.Activity({
                    author: userID,
                    activityType: "snapshotComment",
                    snapshot: snapshotID,
                    createdDate: new Date().toISOString(),
                    comment: newCommentID
                });
                activity.save(function(err, data) {
                    if (err) {
                        return res.json({ 
                            success: false, errors: { unknown: { msg: "An unknown error has occurred" }}
                        });
                    }
                });
                return callback();
            }
            
            // actions
            createComment(function () {
                addComment(function () {
                    addActivity(function() {
                        getComment(function (comment) {
                            return res.json({
                                success: true,
                                comment: comment
                            });
                        });
                    });
                });
            });
        }
    },
    getLatestSnapshot: function (Schemas) {
        return function (req, res, next) {
            var snapshot;
            
            function getSnapshot (callback) {
                Schemas.Snapshot.find({ active: true })
                .sort({createdDate:-1})
                .limit(1)
                .populate([
                    {
                        path: 'authors.user',
                    },
                    {
                        path: 'tiers.decks.deck',
                    },
                    {
                        path: 'tiers.decks.tech.cards.card',
                    },
                    {
                        path: 'matches.for',
                        select: 'name playerClass'
                    },
                    {
                        path: 'comments',
                        select: '_id author comment createdDate votesCount votes'
                    },
                    {
                        path: 'matches.against',
                        select: 'name playerClass'
                    }
                ])
                .lean()
                .exec(function (err, results) {
                    if (err) { return req.json({ success: false }); }
//                    Schemas.Comment.populate(results.comments, {
//                        path: 'author',
//                        select: 'username email'
//                    }, function (err, comments) {
//                        if (err || !comments) { return res.json({ success: false }); }
//                        results.comments = comments;
//                    });
                    snapshot = results;
                    return callback();
                });
            }
            getSnapshot(function () {
                return res.json({
                    success: true,
                    snapshot: snapshot
                })
            })
        }
    },
    team: function (Schemas) {
        return function (req, res, next) {
            var hsMembers = [],
                hotsMembers = [],
                wowMembers = [],
                fgcMembers = [],
                fifaMembers = [];
            
            function getMembers (callback) {
                Schemas.TeamMember.find()
                .sort({ orderNum:1 })
                .exec(function (err, results) {
                    if (err) { return req.json({ success: false }); }
                    for (i=0; i != results.length; i++) {
                        var type = results[i].game;
                        switch (type) {
                            case 'hs' : hsMembers.push(results[i]); break;
                            case 'hots' : hotsMembers.push(results[i]); break;
                            case 'wow' : wowMembers.push(results[i]); break;
                            case 'fifa' : fifaMembers.push(results[i]); break;
                            case 'fgc' : fgcMembers.push(results[i]); break;
                        }
                    }
                    return callback(results);
                });
            }
            
            getMembers(function (gm) {
                return res.json({
                    members: gm,
                    hsMembers: hsMembers,
                    hotsMembers: hotsMembers,
                    wowMembers: wowMembers,
                    fgcMembers: fgcMembers,
                    fifaMembers: fifaMembers,
                    success: true
                });
            });
        }
    },
    vod: function (Schemas) {
        return function(req, res, next) {
            
            var where = {},
                now = new Date();
            where.date = { $lte: now };
            function getVod (callback) {
                Schemas.Vod.find()
                .where(where)
                .sort('-date')
                .limit(1)
                .exec(function (err, results) {
                    if (err) { return req.json({ success: false }); }
                    return callback(results);
                });
            }
            
            getVod(function (vod) {
                return res.json({
                    vod: vod[0],
                    success: true
                });
            });
        }
    },
    sendContact: function (Mail) {
        return function(req, res, next) {
            //TODO: ADD FUNCTIONALITY
            return res.json({ success: true });
        }
    }
};