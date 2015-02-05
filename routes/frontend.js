module.exports = {
    index: function (config) {
        return function (req, res, next) {
            return res.render(config.tpl);
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
                activationCode = uuid.v4();
            
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
                            return callback();
                        });
                    }
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
                
                checkEmail(function (){
                    checkUsername(function (){
                        completeNewUser(function () {
                            sendEmail(function () {
                                return res.json({ success: true });
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
    profile: function (Schemas) {
        return function (req, res, next) {
            var username = req.params.username;
            
            Schemas.User.findOne({ username: username, active: true }).select('username email firstName lastName photos social about subscription.isSubscribed').exec(function (err, user) {
                if (err || !user) { return res.sendStatus(404); }
                return res.json({ success: true, user: user });
            });
        };
    },
    userProfile: function (Schemas) {
        return function (req, res, next) {
            var username = req.params.username;
            
            Schemas.User.findOne({ username: username, active: true }).exec(function (err, user) {
                if (err || !user) { return res.sendStatus(404); }
                if (user._id.toString() !== req.user._id) { return res.sendStatus(404); }
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
    profileActivity: function (Schemas) {
        return function (req, res, next) {
            var username = req.params.username,
                page = req.body.page || 1,
                perpage = req.body.perpage || 20;
            
            function getUser (callback) {
                Schemas.User.findOne({ username: username }).select('_id').exec(function (err, user) {
                    if (err || !user) { return res.json({ success: false }); }
                    return callback(user);
                });
            }
            
            function getActivity (user, callback) {
                Schemas.Activity.find({ author: user._id }).sort('-createdDate').skip((perpage * page) - perpage).limit(perpage).exec(function (err, activities) {
                    if (err) { return req.json({ success: false }); }
                    return callback(activities);
                });
            }
            
            getUser(function (user) {
                getActivity(user, function (activities) {
                    return res.json({ success: true, activities: activities });
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
    deckEdit: function (Schemas) {
        return function (req, res, next) {
            var slug = req.body.slug,
                deck,
                cards = {};
            
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
                        contentEarly: results.contentEarly,
                        contentMid: results.contentMid,
                        contentLate: results.contentLate,
                        cards: results.cards,
                        playerClass: results.playerClass,
                        public: results.public.toString(),
                        mulligans: results.mulligans,
                        against: {
                            strong: results.against.strong,
                            weak: results.against.weak,
                            instructions: results.against.instructions
                        },
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
            
            function getClass(callback) {
                Schemas.Card.find({ playerClass: deck.playerClass }).where({ deckable: true }).sort({ cost: 1, name: 1 }).exec(function (err, results) {
                    if (err || !results) { console.log(err || 'No cards for class'); }
                    cards.class = results;
                    return callback();
                });
            }
        
            function getNeutral(callback) {
                Schemas.Card.find({ playerClass: 'Neutral' }).where({ deckable: true }).sort({ cost: 1, name: 1 }).exec(function (err, results) {
                    if (err || !results) { console.log(err || 'No cards for neutral'); }
                    cards.neutral = results;
                    return callback();
                });
            }
            
            getDeck(function () {
                getClass(function () {
                    getNeutral(function () {
                        //console.log(deck);
                        return res.json({
                            success: true,
                            deck: deck,
                            cards: cards
                        });
                    });
                });
            });
        };
    },
    deckBuilder: function (Schemas, Util) {
        return function (req, res, next) {
            var playerClass = Util.ucfirst(req.body.playerClass),
                cards = {};
            
            // make sure it is a proper class
            if (['mage', 'shaman', 'warrior', 'rogue', 'paladin', 'priest', 'warlock', 'hunter', 'druid'].indexOf(req.body.playerClass) === -1) {
                return res.json({ success: false });
            }
            
            function getClass(callback) {
                Schemas.Card.find({ playerClass: playerClass }).where({ deckable: true }).sort({ cost: 1, name: 1 }).exec(function (err, results) {
                    if (err || !results) { console.log(err || 'No cards for class'); }
                    cards.class = results;
                    callback();
                });
            }
        
            function getNeutral(callback) {
                Schemas.Card.find({ playerClass: 'Neutral' }).where({ deckable: true }).sort({ cost: 1, name: 1 }).exec(function (err, results) {
                    if (err || !results) { console.log(err || 'No cards for neutral'); }
                    cards.neutral = results;
                    callback();
                });
            }
    
            getClass(function (){
                getNeutral(function () {
                    return res.json({
                        success: true,
                        className: playerClass,
                        cards: cards
                    });
                });
            });
        };
    },
    deckAdd: function (Schemas, Util) {
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
                Schemas.Deck.count({ slug: Util.slugify(req.body.name) })
                .exec(function (err, count) {
                    if (err) { return res.json({ success: false, errors: { unknown: { msg: 'An unknown error occurred' } } }); }
                    if (count > 0) {
                        return res.json({ success: false, errors: { name: { msg: 'That deck name already exists. Please choose a different deck name.' } } });
                    }
                    return callback();
                });
            }
            
            function createDeck(callback) {
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
                
                
                
                var premium = (author.isAdmin || author.isProvider) ? {
                        isPremium: req.body.premium.isPremium || false,
                        expiryDate: req.body.premium.expiryDate || new Date().toISOString()
                    } : {
                        isPremium: false,
                        expiryDate: new Date().toISOString()
                    },
                    featured = (author.isAdmin || author.isProvider) ? req.body.featured : false,
                    newDeck = new Schemas.Deck({
                        name: req.body.name,
                        slug: Util.slugify(req.body.name),
                        deckType: req.body.deckType,
                        description: req.body.description,
                        contentEarly: req.body.contentEarly,
                        contentMid: req.body.contentMid,
                        contentLate: req.body.contentLate,
                        author: req.user._id,
                        cards: cards,
                        playerClass: req.body.playerClass,
                        public: req.body.public,
                        mulligans: req.body.mulligans || [],
                        against: {
                            strong: req.body.against.strong || [],
                            weak: req.body.against.weak || [],
                            instructions: req.body.against.instructions || ''
                        },
                        video: req.body.video,
                        votes: [{
                            userID: req.user._id,
                            direction: 1
                        }],
                        featured: featured,
                        allowComments: true,
                        createdDate: new Date().toISOString(),
                        premium: premium
                    });

                newDeck.save(function(err, data){
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
            
            checkForm(function () {
                checkSlug(function () {
                    getUser(function () {
                        createDeck(function () {
                            return res.json({ success: true, slug: Util.slugify(req.body.name) });
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
            req.assert('name', 'Deck name cannot be more than 40 characters').len(1, 40);
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
                
                var premium = (author.isAdmin || author.isProvider) ? {
                        isPremium: req.body.premium.isPremium || false,
                        expiryDate: req.body.premium.expiryDate || new Date().toISOString()
                    } : {
                        isPremium: false,
                        expiryDate: new Date().toISOString()
                    },
                    featured = (author.isAdmin || author.isProvider) ? req.body.featured : false;
                
                Schemas.Deck.findOne({ _id: req.body._id, author: req.user._id })
                .exec(function (err, deck) {
                    if (err) { return res.json({ success: false, errors: { unknown: { msg: 'An unknown error occurred' } } }); }

                    deck.name = req.body.name;
                    deck.slug = Util.slugify(req.body.name);
                    deck.deckType = req.body.deckType;
                    deck.description = req.body.description;
                    deck.contentEarly = req.body.contentEarly;
                    deck.contentMid = req.body.contentMid;
                    deck.contentLate = req.body.contentLate;
                    deck.cards = cards;
                    deck.public = req.body.public;
                    deck.mulligans = req.body.mulligans || [];
                    deck.against = {
                        strong: req.body.against.strong || [],
                        weak: req.body.against.weak || [],
                        instructions: req.body.against.instructions || ''
                    };
                    deck.video = req.body.video;
                    deck.premium = premium;
                    deck.featured = featured;
                    
                    deck.save(function(err, data){
                        if (err) { return res.json({ success: false, errors: { unknown: { msg: 'An unknown error occurred' } } }); }
                        return callback();
                    });

                });
            }
            
            checkForm(function () {
                checkSlug(function () {
                    getUser(function () {
                        updateDeck(function () {
                            return res.json({ success: true, slug: Util.slugify(req.body.name) });
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
                if (err) { return res.json({ success: false, errors: { unknown: { msg: 'An unknown error occurred' } } }); }
                return res.json({ success: true });
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
            var klass = req.body.klass,
                page = req.body.page || 1,
                perpage = req.body.perpage || 5,
                where = (klass === 'all') ? {} : { 'classTags': klass },
                search = req.body.search || '',
                articles, total;
            
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
                .where(where)
                .populate({
                    path: 'author',
                    select: 'username -_id'
                })
                .sort('-createdDate')
                .skip((perpage * page) - perpage)
                .limit(perpage)
                .exec(function (err, results) {
                    if (err) { return req.json({ success: false }); }
                    articles = results;
                    return callback();
                });
            }
            
            getArticles(function () {
                getTotal(function () {
                    return res.json({ success: true, articles: articles, total: total, klass: klass, page: page, perpage: perpage, search: search });
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
                        select: 'username -_id'
                    },{
                        path: 'related',
                        select: 'title slug.url active -_id',
                    },{
                        path: 'comments',
                        select: '_id author comment createdDate votesCount votes'
                }])
                .exec(function (err, article) {
                    if (err || !article) { return res.json({ success: false }); }
                    
                    Schemas.Comment.populate(article.comments, {
                        path: 'author',
                        select: 'username email'
                    }, function (err, comments) {
                        if (err || !comments) { return res.json({ success: false }); }
                        article.comments = comments;
                        
                        return getDeck(article, callback);
                    });
                    
                });
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
                return res.json({ success: true, article: article });
            });
        };
    },
    articleCommentAdd: function (Schemas, mongoose) {
        return function (req, res, next) {
            var articleID = req.body.articleID,
                userID = req.user._id,
                comment = req.body.comment,
                newCommentID = mongoose.Types.ObjectId();
            
            req.assert('comment.comment', 'Comment cannot be longer than 1000 characters').len(1, 1000);
            
            var errors = req.validationErrors();
            if (errors) {
                return res.json({ success: false, errors: errors });
            }
            
            // new comment
            var newComment = {
                _id: newCommentID,
                author: userID,
                comment: comment.comment,
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
            
            // actions
            createComment(function () {
                addComment(function () {
                    getComment(function (comment) {
                        return res.json({
                            success: true,
                            comment: comment
                        });
                    });
                });
            });
        };
    },
    articleVote: function (Schemas) {
        return function (req, res, next) {
            var id = req.body._id,
                direction = req.body.direction;
            
            Schemas.Article.findOne({ _id: id }).select('author votesCount votes').exec(function (err, article) {
                if (err || !article || article.author.toString() === req.user._id) { return res.json({ success: false }); }
                var vote = article.votes.filter(function (vote) {
                    if (vote.userID.toString() === req.user._id) {
                        return vote;
                    }
                })[0];
                if (vote) {
                    if (vote.direction !== direction) {
                        vote.direction = direction;
                        article.votesCount = (direction === 1) ? article.votesCount + 2 : article.votesCount - 2;
                    }
                } else {
                    article.votes.push({
                        userID: req.user._id,
                        direction: direction
                    });
                    article.votesCount += direction;
                }
                
                article.save(function (err) {
                    if (err) { return res.json({ success: false }); }
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
            var klass = req.body.klass || 'all',
                page = req.body.page || 1,
                perpage = req.body.perpage || 10,
                where = (klass === 'all') ? {} : { 'playerClass': klass },
                decks, total;
            
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
                .select('premium playerClass slug name description author createdDate comments votesCount')
                .populate({
                    path: 'author',
                    select: 'username -_id'
                })
                .sort({ votesCount: -1, createdDate: -1 })
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
            var klass = req.body.klass || 'all',
                page = req.body.page || 1,
                perpage = req.body.perpage || 10,
                where = {},
                decks, total,
                now = new Date().getTime(),
                weekAgo = new Date(now - (60*60*24*7*1000));
            
            if (klass !== 'all') {
                where.playerClass = klass;
            }
            
            where.createdDate = { $gte: weekAgo };
            
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
                .select('premium playerClass slug name description author createdDate comments votesCount')
                .populate({
                    path: 'author',
                    select: 'username -_id'
                })
                .sort({ votesCount: -1, createdDate: -1 })
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
                .select('premium playerClass slug name description author createdDate comments votesCount')
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
                if (err || !deck) { console.log(err || 'Unable to load deck: ' + slug); return res.json({ success: false }); }
                
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
            
            req.assert('comment.comment', 'Comment cannot be longer than 1000 characters').len(1, 1000);
            
            var errors = req.validationErrors();
            if (errors) {
                return res.json({ success: false, errors: errors });
            }
            
            // new comment
            var newComment = {
                _id: newCommentID,
                author: userID,
                comment: comment.comment,
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
            
            // actions
            createComment(function () {
                addComment(function () {
                    getComment(function (comment) {
                        return res.json({
                            success: true,
                            comment: comment
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
                Schemas.ForumPost.findOneAndUpdate({ 'slug.url': postSlug, thread: thread._id }, { $inc: { views: 1 } })
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
            
            checkForm(function () {
                checkSlug(function () {
                    createPost(function () {
                        addToThread(function () {
                            return res.json({ success: true });
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
                    comment: req.body.comment.comment,
                    votesCount: 1,
                    votes: [{
                        userID: req.user._id,
                        direction: 1
                    }],
                    replies: [],
                    createdDate: new Date().toISOString()
                }),
                dataComment;
            
            req.assert('comment.comment', 'Comment cannot be longer than 1000 characters').len(1, 1000);
            
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
            
            createComment(function () {
                addToPost(function () {
                    getComment(function () {
                        res.json({ success: true, comment: dataComment });
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
                    } });
                });
            });
        };
    },
    getBanners: function (Schemas) {
        return function (req, res, next) {
            function getBanners (callback) {
                Schemas.Banner.find({ active: true })
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
    }
};