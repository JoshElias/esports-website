module.exports = {
    index: function (req, res, next) {
        res.render('index');
    },
    login: function(Schemas, jwt, JWT_SECRET) {
        return function(req, res, next) {
            var email = req.body.email || '',
                password = req.body.password || '';

            if (email == '' || password == '') {
                return res.send(401);
            }

            Schemas.User.findOne({ email: email, active: true, verified: true }, function (err, user) {
                if (err) {
                    console.log(err);
                    return res.send(401);
                }
                if (!user) {
                    return res.send(401);
                }
                
                user.comparePassword(password, function(isMatch) {
                    if (!isMatch) {
                        return res.send(401);
                    }
                    
                    user.loginCount = user.loginCount + 1;
                    user.lastLoginDate = new Date().toISOString();
                    
                    user.save(function (err, user) {
                        if (err) { console.log(err); }

                        var token = jwt.sign({ _id: user._id.toString() }, JWT_SECRET);

                        return res.json({
                            userID: user._id.toString(),
                            username: user.username,
                            isAdmin: user.isAdmin,
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
                    return res.send(401);
                }
                return res.json({
                    userID: user._id.toString(),
                    username: user.username,
                    isAdmin: user.isAdmin
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
                    if (err || !user) return callback();
                    return done(err, user);
                });
            }

            function findByEmail (callback) {
                Schemas.User.findOne({ email: profile.email }).exec(function (err, user) {
                    if (err || !user) return callback();

                    user.twitchID = profile.id;
                    user.verified = true;

                    user.save(function (err, user) {
                        if (err) return res.send(401);
                        return done(err, user);
                    });
                });
            }

            function createTwitchAccount (callback) {
                var newUser = new Schemas.User({
                    email: profile.email,
                    username: profile.username,
                    twitchID: profile.id,
                    verified: true,
                    createdDate: new Date().toISOString()
                });

                newUser.save(function (err, user) {
                    if (err) return res.send(401);
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
                        if (err) return res.send(401);
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
                    if (err) return res.send(401);
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
            
            Schemas.User.findOne({ username: username, active: true }).select('username firstName lastName photos social about subscription.isSubscribed').exec(function (err, user) {
                if (err || !user) { return res.send(404); }
                return res.json({ success: true, user: user });
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
                Schemas.Article.find({ author: user._id }).sort('-createdDate').skip((perpage * page) - perpage).limit(perpage).exec(function (err, articles) {
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
                Schemas.Deck.find({ author: user._id }).sort('-createdDate').skip((perpage * page) - perpage).limit(perpage).exec(function (err, decks) {
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
            // TODO: add form checking
            
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
            
            var newDeck = new Schemas.Deck({
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
                    votes: [{
                        userID: req.user._id,
                        direction: 1
                    }],
                    featured: false,
                    allowComments: true,
                    createdDate: new Date().toISOString(),
                    premium: {
                        isPremium: false,
                        expiryDate: new Date().toISOString()
                    }
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
                console.log(data);
                return res.json({ success: true, slug: Util.slugify(req.body.name) });
            });
        };
    },
    uploadToImgur: function (fs, imgur) {
        return function (req, res, next) {
            imgur.setClientId('83f887d8dc07872');

            console.log(req.files);
            
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
                articles, total;
            
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
                    return res.json({ success: true, articles: articles, total: total, klass: klass, page: page, perpage: perpage });
                });
            });
        };
    },
    decks: function (Schemas) {
        return function (req, res, next) {
            var klass = req.body.klass || 'all',
                page = req.body.page || 1,
                perpage = req.body.perpage || 10,
                where = (klass === 'all') ? {} : { 'playerClass': klass },
                decks, total;
            
            // get total decks
            function getTotal (callback) {
                Schemas.Deck.count({ public: true })
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
                .where(where)
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
                    select: 'username'
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
                    console.log(data);
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
                    select: 'username'
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
                
                var getComments = function (thread, callback) {
                    thread.numComments = 0;
                    return callback();
                };
                
                var getPosts = function (thread, callback) {
                    Schemas.ForumPost.count({ thread: thread._id }).exec(function (err, count) {
                        if (err) { return res.json({ success: false }); }
                        thread.numPosts = count;
                        return callback();
                    });
                };
                
                var iterPost = function (thread, callback) {
                    Schemas.ForumPost.populate(thread.posts, {
                        path: 'author',
                        select: 'username -_id'
                    }, callback);
                };
                
                var iterThread = function (cat, callback) {
                    Schemas.ForumThread.populate(cat.threads, {
                        path: 'posts',
                        match: { active: true },
                        select: 'title slug author createdDate -_id',
                        options: { limit: 1, sort: '-createdDate' }
                    }, function (err, threads) {
                        async.each(threads, iterPost, function (err) {
                            if (err) { return res.json({ success: false }); }
                            async.each(threads, getPosts, function (err) {
                                if (err) { return res.json({ success: false }); }
                                async.each(threads, getComments, function (err) {
                                    if (err) { return res.json({ success: false }); }
                                    return callback();
                                });
                            });
                        });
                    });
                };
                
                async.each(cats, iterThread, function (err) {
                    if (err) { return res.json({ success: false }); }
                    console.log(cats);
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
                    select: 'username -_id'
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
            var threadID,
                threadSlug = req.body.thread,
                post,
                postSlug = req.body.post;
            
            function getThread (callback) {
                Schemas.ForumThread.findOne({ 'slug.url': threadSlug }).exec(function (err, thread) {
                    if (err || !thread) { return res.json({ success: false }); }
                    threadID = thread._id.toString();
                    return callback();
                });
            }
            
            function getPost (callback) {
                Schemas.ForumPost.findOneAndUpdate({ 'slug.url': postSlug, thread: threadID }, { $inc: { views: 1 } })
                .populate([
                    {
                        path: 'author',
                        select: 'username'
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
                        select: 'username'
                    }, function (err, comments) {
                        if (err || !comments) { return res.json({ success: false }); }

                        post.comments = comments;

                        return callback();
                    });
                });
            }
            
            getThread(function () {
                getPost(function () {
                    return res.json({ success: true, post: post });
                });
            });
        };
    },
    forumPostAdd: function (Schemas, Util, mongoose) {
        return function (req, res, next) {
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
            
            // create post
            function createPost(callback) {
                newPost.save(function(err, data){
                    if (err) {
                        console.log(err);
                        return res.json({ success: false, errors: { unknown: { msg: 'An unknown error occurred' } } });
                    }
                    console.log(data);
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
            
            createPost(function () {
                addToThread(function () {
                    return res.json({ success: true });
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
            
            // create comment
            function createComment(callback) {
                newComment.save(function (err, data) {
                    if (err) {
                        console.log(err);
                        return res.json({ success: false, errors: { unknown: { msg: 'An unknown error occurred' } } });
                    }
                    console.log(data);
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
                    select: 'username'
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
};