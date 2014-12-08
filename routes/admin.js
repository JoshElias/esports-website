module.exports = {
    cards: function (Schemas) {
        return function (req, res, next) {
            Schemas.Card.find({}).select('_id name cardType rarity race playerClass mechanics').exec(function (err, cards) {
                if (err) {
                    console.log(err);
                    return res.json({
                        success: false,
                        errors: {
                            unknown: {
                                msg: 'An unknown error occurred'
                            }
                        }
                    });
                }
                return res.json({ success: true, cards: cards });
            });
        };
    },
    card: function (Schemas) {
        return function (req, res, next) {
            var _id = req.body._id;
            Schemas.Card.findOne({ _id: _id }).exec(function (err, card) {
                if (err || !card) {
                    console.log(err || 'No card found');
                    return res.json({
                        success: false,
                        errors: {
                            unknown: {
                                msg: 'An unknown error occurred'
                            }
                        }
                    });
                }
                return res.json({ success: true, card: card });
            });
        };
    },
    cardAdd: function (Schemas) {
        return function (req, res, next) {
            // add form validation
            
            // insert new card
            var newCard = new Schemas.Card({
                id: req.body.id,
                name: req.body.name,
                cost: req.body.cost,
                cardType: req.body.cardType,
                rarity: req.body.rarity,
                race: req.body.race,
                playerClass: req.body.playerClass,
                expansion: req.body.expansion,
                text: req.body.text,
                mechanics: req.body.mechanics || [],
                flavor: req.body.flavor,
                artist: req.body.artist,
                attack: req.body.attack || 0,
                health: req.body.health || 0,
                durability: req.body.durability || 0,
                dust: req.body.dust,
                photos: {
                    small: req.body.photos.small,
                    medium: req.body.photos.medium,
                    large: req.body.photos.large
                },
                deckable: req.body.deckable,
                active: req.body.active
            });
            
            newCard.save(function(err, data){
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
                return res.json({ success: true });
            });
        };
    },
    cardEdit: function (Schemas) {
        return function (req, res, next) {
            var _id = req.body._id;
            Schemas.Card.findOne({ _id: _id }).exec(function (err, card) {
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
                
                card.id = req.body.id;
                card.name = req.body.name;
                card.cost = req.body.cost;
                card.cardType = req.body.cardType;
                card.rarity = req.body.rarity;
                card.race = req.body.race;
                card.playerClass = req.body.playerClass;
                card.expansion = req.body.expansion;
                card.text = req.body.text;
                card.mechanics = req.body.mechanics || [];
                card.flavor = req.body.flavor;
                card.artist = req.body.artist;
                card.attack = req.body.attack || 0;
                card.health = req.body.health || 0;
                card.durability = req.body.durability || 0;
                card.dust = req.body.dust;
                card.photos = {
                    small: req.body.photos.small,
                    medium: req.body.photos.medium,
                    large: req.body.photos.large
                };
                card.deckable = req.body.deckable;
                card.active = req.body.active;
                
                card.save(function (err) {
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
                    return res.json({ success: true });
                });
            });
        };
    },
    cardDelete: function (Schemas) {
        return function (req, res, next) {
            var _id = req.body._id;
            Schemas.Card.findOne({ _id: _id }).remove().exec(function (err) {
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
                return res.json({ success: true });
            });
        };
    },
    decksAll: function (Schemas) {
        return function (req, res, next) {
            function getDecks(callback) {
                Schemas.Deck.find({}).select('_id name').exec(function (err, decks){
                    if (err) { return res.json({ success: false }); }
                    return callback(decks);
                });
            }
            
            getDecks(function (decks) {
                return res.json({ success: true, decks: decks });
            });
        };
    },
    decks: function (Schemas) {
        return function (req, res, next) {
            var page = req.body.page,
                perpage = req.body.perpage,
                start = (page * perpage) - perpage,
                decks, total;
            
            function getDecks(callback) {
                Schemas.Deck.find({}).skip(start).limit(perpage).exec(function (err, results){
                    if (err) {
                        console.log(err);
                        return res.json({
                            success: false,
                            errors: {
                                unknown: {
                                    msg: 'An unknown error occurred'
                                }
                            }
                        });
                    }
                    decks = results;
                    callback();
                });
            }
            
            function getCount(callback) {
                Schemas.Deck.count({}).exec(function (err, count){
                    if (err) {
                        console.log(err);
                        return res.json({
                            success: false,
                            errors: {
                                unknown: {
                                    msg: 'An unknown error occurred'
                                }
                            }
                        });
                    }
                    total = count;
                    callback();
                });
            }
            
            getDecks(function () {
                getCount(function () {
                    return res.json({ success: true, decks: decks, total: total });
                });
            });
        };
    },
    deck: function (Schemas) {
        return function (req, res, next) {
            var _id = req.body._id,
                deck,
                cards = {},
                newCards = [];
            
            function getDeck(callback) {
                Schemas.Deck.findOne({ _id: _id }).populate('cards.card').exec(function (err, results) {
                    if (err || !results) {
                        console.log(err || 'No card found');
                        return res.json({
                            success: false,
                            errors: {
                                unknown: {
                                    msg: 'An unknown error occurred'
                                }
                            }
                        });
                    }

                    // fix cards for deck builder
                    results.cards.forEach(function (item) {
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
                        newCards.push(obj);
                    });
                    
                    deck = {
                        _id: results._id,
                        name: results.name,
                        slug: results.slug,
                        deckType: results.deckType,
                        description: results.description,
                        content: results.content,
                        cards: newCards,
                        playerClass: results.playerClass,
                        public: results.public.toString(),
                        against: {
                            strong: results.against.strong,
                            weak: results.against.weak
                        },
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
    deckAdd: function (Schemas, Util) {
        return function (req, res, next) {
            // setup cards
            var cards = [];
            for (var i = 0; i < req.body.cards.length; i++) {
                cards.push({
                    card: req.body.cards[i]._id,
                    qty: req.body.cards[i].qty
                });
            }
            
            var newDeck = new Schemas.Deck({
                    name: req.body.name,
                    slug: Util.slugify(req.body.name),
                    deckType: req.body.deckType,
                    description: req.body.description,
                    content: req.body.content,
                    author: req.user._id,
                    cards: cards,
                    playerClass: req.body.playerClass,
                    public: req.body.public,
                    against: {
                        strong: [],
                        weak: []
                    },
                    votes: [{
                        userID: req.user._id,
                        direction: 1
                    }],
                    featured: false,
                    allowComments: true,
                    createdDate: new Date().toISOString(),
                    premium: {
                        isPremium: req.body.premium.isPremium,
                        expiryDate: req.body.premium.expiryDate || new Date().toISOString()
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
                return res.json({ success: true });
            });
        };
    },
    deckEdit: function (Schemas, Util) {
        return function (req, res, next) {
            var _id = req.body._id;
            
            // setup cards
            var cards = [];
            for (var i = 0; i < req.body.cards.length; i++) {
                cards.push({
                    card: req.body.cards[i]._id,
                    qty: req.body.cards[i].qty
                });
            }
            
            Schemas.Deck.findOne({ _id: _id }).exec(function (err, deck) {
                if (err || !deck) {
                    console.log(err || 'Deck not found');
                    return res.json({ success: false,
                        errors: {
                            unknown: {
                                msg: 'An unknown error occurred'
                            }
                        }
                    });
                }
                
                deck.name = req.body.name;
                deck.slug = Util.slugify(req.body.name);
                deck.deckType = req.body.deckType;
                deck.description = req.body.description;
                deck.content = req.body.content;
                deck.cards = cards;
                deck.public = req.body.public;
                deck.against = {
                    strong: [],
                    weak: []
                };
                deck.featured = false;
                deck.premium = {
                    isPremium: req.body.premium.isPremium,
                    expiryDate: req.body.premium.expiryDate || new Date().toISOString()
                };
                
                deck.save(function (err) {
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
                    return res.json({ success: true });
                });
            });
        };
    },
    deckDelete: function (Schemas) {
        return function (req, res, next) {
            var _id = req.body._id;
            Schemas.Deck.findOne({ _id: _id }).remove().exec(function (err) {
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
                return res.json({ success: true });
            });
        };
    },
    articlesAll: function (Schemas) {
        return function (req, res, next) {
            function getArticles(callback){
                Schemas.Article.find({})
                .select('_id title author')
                .populate({
                    path: 'author',
                    select: 'username -_id'
                })
                .exec(function (err, articles) {
                    if (err) { return res.json({ success: false, articles: [] }); }
                    return callback(articles);
                });
            }
            
            getArticles(function (articles) {
                return res.json({ success: true, articles: articles });
            });
        };
    },
    articles: function (Schemas) {
        return function (req, res, next) {
            Schemas.Article.find({}).exec(function (err, articles){
                if (err) {
                    console.log(err);
                    return res.json({
                        success: false,
                        errors: {
                            unknown: {
                                msg: 'An unknown error occurred'
                            }
                        }
                    });
                }
                return res.json({ success: true, articles: articles });
            });
        };
    },
    article: function (Schemas) {
        return function (req, res, next) {
            var _id = req.body._id;
            Schemas.Article.findOne({ _id: _id }).exec(function (err, article) {
                if (err || !article) {
                    console.log(err || 'No article found');
                    return res.json({
                        success: false,
                        errors: {
                            unknown: {
                                msg: 'An unknown error occurred'
                            }
                        }
                    });
                }
                return res.json({ success: true, article: article });
            });
        };
    },
    articleAdd: function (Schemas) {
        return function (req, res, next) {
            // add form validation
            
            // insert new card
            var newArticle = new Schemas.Article({
                title: req.body.title,
                slug: {
                    url: req.body.slug.url,
                    linked: req.body.slug.linked
                },
                description: req.body.description,
                content: req.body.content,
                author: req.user._id,
                photos: {
                    banner: '',
                    featured: ''
                },
                related: [],
                //deck: '',
                views: 0,
                votesCount: 1,
                votes: [{
                    userID: req.user._id,
                    direction: 1
                }],
                featured: req.body.featured,
                comments: [],
                createdDate: new Date().toISOString(),
                premium: {
                    isPremium: req.body.premium.isPremium,
                    expiryDate: req.body.premium.expiryDate
                },
                active: req.body.active
            });
            
            newArticle.save(function(err, data){
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
                return res.json({ success: true });
            });
        };
    },
    articleEdit: function (Schemas) {
        return function (req, res, next) {
            var _id = req.body._id;
            
            Schemas.Article.findOne({ _id: _id }).exec(function (err, article) {
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
                
                article.title = req.body.title;
                article.slug = {
                    url: req.body.slug.url,
                    linked: req.body.slug.linked
                };
                article.description = req.body.description;
                article.content = req.body.content;
                article.photos = {
                    banner: '',
                    featured: ''
                };
                article.related = [];
                //article.deck = req.body.deck;
                article.featured = req.body.featured;
                article.premium = {
                    isPremium: req.body.premium.isPremium,
                    expiryDate: req.body.premium.expiryDate
                };
                article.active = req.body.active;
                                
                article.save(function (err) {
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
                    return res.json({ success: true });
                });
            });
        };
    },
    articleDelete: function (Schemas) {
        return function (req, res, next) {
            var _id = req.body._id;
            Schemas.Article.findOne({ _id: _id }).remove().exec(function (err) {
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
                return res.json({ success: true });
            });
        };
    },
    users: function (Schemas) {
        return function (req, res, next) {
            Schemas.User.find({}).exec(function (err, users) {
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
                return res.json({
                    success: true,
                    users: users
                });
            });
        };
    },
    user: function (Schemas) {
        return function (req, res, next) {
            var _id = req.body._id;
            
            Schemas.User.findOne({ _id: _id }).exec(function (err, user) {
                if (err || !user) {
                    console.log(err || 'User not found');
                    return res.json({ success: false,
                        errors: {
                            unknown: {
                                msg: 'An unknown error occurred'
                            }
                        }
                    });
                }
                return res.json({
                    success: true,
                    user: user
                });
            });
        };
    },
    userAdd: function (Schemas) {
        return function (req, res, next) {
            req.assert('email', 'A valid email address is required').notEmpty().isEmail();
            req.assert('username', 'Username is required').notEmpty();
            req.assert('password', 'Password is required').notEmpty();
            req.assert('cpassword', 'Please confirm your password').notEmpty().equals(req.body.password);
            
            var errors = req.validationErrors(true);
            
            if (errors) {
                return res.json({ success: false, errors: errors });
            } else {
                var error = false,
                    errorMsgs = {};
                
                function checkEmail(cb) {
                    Schemas.User.count({ email: req.body.email }, function(err, count){
                        if (err) {
                            console.log('1');
                            error = true;
                            errorMsgs.unknown = { 
                                msg: 'An unknown error occurred'
                            };
                        }
                        if (count > 0) {
                            console.log('Email already exists on another account');
                            error = true;
                            errorMsgs.email = { 
                                msg: 'Email already exists on another account'
                            };
                        }
                        cb();
                    });
                }

                function checkUsername(cb) {
                    Schemas.User.count({ username: req.body.username }, function(err, count){
                        if (err) {
                            console.log('2');
                            error = true;
                            errorMsgs.unknown = { 
                                msg: 'An unknown error occurred'
                            };
                        }
                        if (count > 0) {
                            console.log('Username already in use');
                            error = true;
                            errorMsgs.username = { 
                                msg: 'Username already in use'
                            };
                        }
                        cb();
                    });
                }
                
                function completeNewUser() {
                    if (error) {
                        return res.json({ success: false, errors: errorMsgs });
                    } else {
                        var newUser = new Schemas.User({
                                email: req.body.email,
                                username: req.body.username,
                                password: req.body.password,
                                firstName: req.body.firstName,
                                lastName: req.body.lastName,
                                about: req.body.about,
                                social: {
                                    twitter: req.body.social.twitter,
                                    facebook: req.body.social.facebook,
                                    twitch: req.body.social.twitch,
                                    instagram: req.body.social.instagram,
                                    youtube: req.body.social.youtube
                                },
                                subscription: {
                                    isSubscribed: req.body.subscription.isSubscribed,
                                    expiryDate: req.body.subscription.expiryDate || new Date().toISOString()
                                },
                                isAdmin: req.body.isAdmin,
                                active: req.body.active,
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
                            console.log(data);
                            return res.json({ success: true });
                        });
                    }
                }

                checkEmail(function (){
                    checkUsername(function (){
                        completeNewUser();
                    });
                });
            }
        };
    },
    userDelete: function (Schemas) {
        return function (req, res, next) {
            var _id = req.body._id;
            Schemas.User.findOne({ _id: _id }).remove().exec(function (err) {
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
                return res.json({ success: true });
            });
        };
    },
    userEdit: function (Schemas) {
        return function (req, res, next) {
            var _id = req.body._id;
            
            // form validation
            req.assert('email', 'A valid email address is required').notEmpty().isEmail();
            req.assert('username', 'Username is required').notEmpty();
            if (req.body.changePassword) {
                req.assert('newPassword', 'Password is required').notEmpty();
                req.assert('confirmNewPassword', 'Please confirm your password').notEmpty().equals(req.body.newPassword);
            }
            
            var errors = req.validationErrors(true);
            
            if (errors) {
                return res.json({ success: false, errors: errors });
            } else {
                
                function checkEmail(callback) {
                    Schemas.User.count({ email: req.body.email, _id: { $ne: _id } }).exec(function (err, count) {
                        if (err) { return res.json({ success: false, errors: { unknown: { msg: 'An unknown error occurred' } } }); }
                        if (count > 0) {
                            return res.json({ success: false, errors: { email: { msg: 'Email address already exists on another account' } } });
                        }
                        return callback();
                    });
                }
                
                function checkUsername(callback) {
                    Schemas.User.count({ username: req.body.username, _id: { $ne: _id } }).exec(function (err, count) {
                        if (err) { return res.json({ success: false, errors: { unknown: { msg: 'An unknown error occurred' } } }); }
                        if (count > 0) {
                            return res.json({ success: false, errors: { username: { msg: 'Username already in use' } } });
                        }
                        return callback();
                    });
                }
                
                function updateUser(callback) {
                    Schemas.User.findOne({ _id: _id }).exec(function (err, user) {
                        if (err || !user) {
                            console.log(err || 'User not found');
                            return res.json({ success: false,
                                errors: {
                                    unknown: {
                                        msg: 'An unknown error occurred'
                                    }
                                }
                            });
                        }

                        user.email = req.body.email;
                        user.username = req.body.username;
                        if (req.body.changePassword) {
                            user.password = req.body.newPassword;
                        }
                        user.firstName = req.body.firstName;
                        user.lastName = req.body.lastName;
                        user.about = req.body.about;
                        user.social = {
                            twitter: req.body.social.twitter,
                            facebook: req.body.social.facebook,
                            twitch: req.body.social.twitch,
                            instagram: req.body.social.instagram,
                            youtube: req.body.social.youtube
                        };
                        user.subscription = {
                            isSubscribed: req.body.subscription.isSubscribed,
                            expiryDate: req.body.subscription.expiryDate || new Date().toISOString()
                        };
                        user.isAdmin = req.body.isAdmin;
                        user.active = req.body.active;

                        user.save(function (err) {
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
                    });
                }
                
                checkEmail(function () {
                    checkUsername(function () {
                        updateUser(function () {
                            return res.json({ success: true });
                        });
                    });
                });
            }
        };
    },
    categories: function (Schemas) {
        return function (req, res, next) {
            Schemas.ForumCategory.find({}).populate('threads').exec(function (err, cats) {
                if (err) { return res.json({ success: false }); }
                return res.json({ success: true, categories: cats });
            });
        };
    },
    category: function (Schemas) {
        return function (req, res, next) {
            var _id = req.body._id;
            Schemas.ForumCategory.findOne({ _id: _id }).exec(function (err, cat) {
                if (err || !cat) { return res.json({ success: false }); }
                return res.json({ success: true, category: cat });
            });
        };
    },
    categoryAdd: function (Schemas) {
        return function (req, res, next) {
            // add form validation
            
            // insert new category
            var newCategory = new Schemas.ForumCategory({
                title: req.body.title,
                active: req.body.active
            });
            
            newCategory.save(function(err, data){
                if (err) {
                    console.log(err);
                    return res.json({ success: false, errors: { unknown: { msg: 'An unknown error occurred' } } });
                }
                console.log(data);
                return res.json({ success: true });
            });
        };
    },
    categoryDelete: function (Schemas) {
        return function (req, res, next) {
            var _id = req.body._id;
            Schemas.ForumCategory.findOne({ _id: _id }).remove().exec(function (err) {
                if (err) { return res.json({ success: false }); }
                return res.json({ success: true });
            });
        };
    },
    categoryEdit: function (Schemas) {
        return function (req, res, next) {
            var _id = req.body._id;
            
            Schemas.ForumCategory.findOne({ _id: _id }).exec(function (err, cat) {
                if (err) {
                    console.log(err);
                    return res.json({ success: false, errors: { unknown: { msg: 'An unknown error occurred' } } });
                }
                
                cat.title = req.body.title;
                cat.active = req.body.active;
                                
                cat.save(function (err) {
                    if (err) {
                        console.log(err);
                        return res.json({ success: false, errors: { unknown: { msg: 'An unknown error occurred' } } });
                    }
                    return res.json({ success: true });
                });
            });
        };
    },
    threads: function (Schemas) {
        return function (req, res, next) {
            Schemas.ForumThread.find({}).exec(function (err, threads) {
                if (err) { return res.json({ success: false }); }
                return res.json({ success: true, threads: threads });
            });
        };
    },
    thread: function (Schemas) {
        return function (req, res, next) {
            var _id = req.body._id;
            Schemas.ForumThread.findOne({ _id: _id }).exec(function (err, thread) {
                if (err || !thread) { return res.json({ success: false }); }
                return res.json({ success: true, thread: thread });
            });
        };
    },
    threadAdd: function (Schemas, mongoose) {
        return function (req, res, next) {
            // add form validation
            
            // vars
            var category = req.body.category,
                _id = mongoose.Types.ObjectId(),
                newThread = new Schemas.ForumThread({
                _id: _id,
                category: category,
                title: req.body.title,
                description: req.body.description,
                slug: {
                    url: req.body.slug.url,
                    linked: req.body.slug.linked
                },
                active: req.body.active
            });
            
            // create thread
            function createThread(callback) {
                newThread.save(function(err, data){
                    if (err) {
                        console.log(err);
                        return res.json({ success: false, errors: { unknown: { msg: 'An unknown error occurred' } } });
                    }
                    console.log(data);
                    return callback();
                });
            }
            
            // add thread to category
            function addToCategory(callback) {
                Schemas.ForumCategory.findOneAndUpdate({ _id: category }, { $push: { threads: _id } }).exec(function (err, cat) {
                    if (err || !cat) { return res.json({ success: false, errors: { unknown: { msg: 'An unknown error occurred' } } }); }
                    return callback();
                });
            }
            
            createThread(function () {
                addToCategory(function () {
                    return res.json({ success: true });
                });
            });
            
        };
    },
    threadDelete: function (Schemas) {
        return function (req, res, next) {
            var _id = req.body._id,
                category = req.body.category;
            Schemas.ForumThread.findOne({ _id: _id }).remove().exec(function (err, thread) {
                if (err) { console.log(err); return res.json({ success: false }); }
                
                Schemas.ForumCategory.findOne({ _id: category }).exec(function (err, cat) {
                    if (err || !cat) { console.log(err); return res.json({ success: false }); }
                    cat.threads.remove(_id);
                    cat.save(function (err) {
                        if (err) { console.log(err); return res.json({ success: false }); }
                        return res.json({ success: true });
                    });
                });
            });
        };
    },
    threadEdit: function (Schemas) {
        return function (req, res, next) {
            var _id = req.body._id,
                oldCategory;
            
            // update thread
            function updateThread(callback) {
                Schemas.ForumThread.findOne({ _id: _id }).exec(function (err, thread) {
                    if (err || !thread) {
                        console.log(err || 'Unable to find thread');
                        return res.json({ success: false, errors: { unknown: { msg: 'An unknown error occurred' } } });
                    }

                    oldCategory = thread.category.toString();

                    thread.category = req.body.category;
                    thread.title = req.body.title;
                    thread.description = req.body.description;
                    thread.slug = {
                        url: req.body.slug.url,
                        linked: req.body.slug.linked
                    };
                    thread.active = req.body.active;

                    thread.save(function (err) {
                        if (err) {
                            console.log(err);
                            return res.json({ success: false, errors: { unknown: { msg: 'An unknown error occurred' } } });
                        }
                        return callback();
                    });
                });
            }
            
            // add to new category
            function addToCategory(callback) {
                Schemas.ForumCategory.findOneAndUpdate({ _id: req.body.category }, { $push: { threads: _id } }).exec(function (err, cat) {
                    if (err || !cat) { return res.json({ success: false, errors: { unknown: { msg: 'An unknown error occurred' } } }); }
                    return callback();
                });
            }

            // remove from old category
            function removeFromCategory(callback) {
                Schemas.ForumCategory.findOne({ _id: oldCategory }).exec(function (err, cat) {
                    if (err || !cat) { console.log(err); return res.json({ success: false }); }
                    cat.threads.remove(_id);
                    cat.save(function (err) {
                        if (err) { console.log(err); return res.json({ success: false }); }
                    });
                });
            }

            
            updateThread(function () {
                if (req.body.category !== oldCategory) {
                    addToCategory(function () {
                        removeFromCategory(function () {
                            return res.json({ success: true });
                        });
                    });
                } else {
                    return res.json({ success: true });
                }
            });
        };
    },
    uploadCard: function (fs, gm) {
        return function(req, res, next) {
            // check if image file
            var types = ['image/png', 'image/jpeg', 'image/gif'];
            if (types.indexOf(req.files.file.type) === -1) {
                fs.unlink(req.files.file.path, function(err){
                    if (err) return next(err);
                    var output = {
                            success: false,
                            error: 'Invalid photo uploaded.',
                        };
                    return res.json(output);
                });
            } else {
                var arr = req.files.file.name.split('.'),
                    name = arr.splice(0, arr.length - 1).join('.'),
                    ext = '.' + arr.pop(),
                    large = name + '.large' + ext,
                    medium = name + '.medium' + ext,
                    path = BASE_DIR + '/photos/cards/';
                    console.log(BASE_DIR + '/photos/cards/');
                    copyFile();
                /*
                // check if dir exists
                fs.exists(path, function(exists){
                    if (!exists) {
                        fs.mkdir(path, 0755, function(err){
                            if (err) return next(err);
                            copyFile();
                        });
                    } else {
                        copyFile();
                    }
                });
                */

                function copyFile() {
                    // read file
                    fs.readFile(req.files.file.path, function(err, data){
                        if (err) return next(err);
                        // write file
                        fs.writeFile(path + large, data, function(err){
                            if (err) return next(err);
                            // chmod new file
                            console.log(1);
                            fs.chmod(path + large, 0777, function(err){
                                if (err) return next(err);
                                // delete tmp file
                            console.log(2);
                                fs.unlink(req.files.file.path, function(err){
                                    if (err) return next(err);
                                    // resize
                            console.log(3);
                                    gm('./photos/cards/' + large).quality(100).resize(284, 395, "!").write('./photos/cards/' + large, function(err){
                                        //if (err) return next(err);
                            console.log(4);
                                        gm(path + large).quality(100).resize(213, 295, "!").write(path + medium, function(err){
                                            if (err) return next(err);
                            console.log(5);
                                            var output = {
                                                    success: true,
                                                    large: large,
                                                    medium: medium,
                                                    path: path
                                                };
                                            return res.json(output);
                                        });
                                    });
                                });
                            });
                        });
                    });
                }
            }
        };
    },
    uploadDeck: function (fs, gm) {
        return function(req, res, next) {
            // check if image file
            var types = ['image/png', 'image/jpeg', 'image/gif'];
            if (types.indexOf(req.files.file.type) === -1) {
                fs.unlink(req.files.file.path, function(err){
                    if (err) return next(err);
                    var output = {
                            success: false,
                            error: 'Invalid photo uploaded.',
                        };
                    return res.json(output);
                });
            } else {
                var arr = req.files.file.name.split('.'),
                    name = arr.splice(0, arr.length - 1).join('.'),
                    ext = '.' + arr.pop(),
                    small = name + '.small' + ext,
                    path = BASE_DIR + '/photos/cards/';
                    console.log(BASE_DIR + '/photos/cards/');
                    copyFile();

                /*
                // check if dir exists
                fs.exists(path, function(exists){
                    if (!exists) {
                        fs.mkdir(path, 0755, function(err){
                            if (err) return next(err);
                            copyFile();
                        });
                    } else {
                        copyFile();
                    }
                });
                */

                function copyFile() {
                    // read file
                    fs.readFile(req.files.file.path, function(err, data){
                        if (err) return next(err);
                        // write file
                        fs.writeFile(path + small, data, function(err){
                            if (err) return next(err);
                            // chmod new file
                            fs.chmod(path + small, 0755, function(err){
                                if (err) return next(err);
                                // delete tmp file
                                fs.unlink(req.files.file.path, function(err){
                                    if (err) return next(err);
                                    // resize
                                    gm(path + small).quality(100).resize(110, 26, "!").write(path + small, function(err){
                                        if (err) return next(err);
                                        var output = {
                                                success: true,
                                                small: small,
                                                path: path
                                            };
                                        return res.json(output);
                                    });
                                });
                            });
                        });
                    });
                }
            }
        };
    }
};