module.exports = {
    isAdmin: function (Schemas) {
        return function (req, res, next) {
            var userID = req.user._id;
            
            Schemas.User.findOne({ _id: userID })
            .select('isAdmin')
            .exec(function (err, user) {
                if (err || !user.isAdmin) { return res.sendStatus(401); }
                return next();
            });
        };
    },
    cards: function (Schemas) {
        return function (req, res, next) {
            Schemas.Card.find({}).select('_id name cardType rarity race playerClass expansion mechanics').exec(function (err, cards) {
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
                Schemas.Deck.find({}).select('_id name').sort('name').exec(function (err, decks){
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
                search = req.body.search || '',
                where = (search.length) ? { name: new RegExp(search, "i") } : {},
                decks, total;
            
            function getTotal (callback) {
                Schemas.Deck.count({})
                .where(where)
                .exec(function (err, count) {
                    if (err) { return res.json({ success: false }); }
                    total = count;
                    return callback();
                });
            }
            
            function getDecks (callback) {
                Schemas.Deck.find({})
                .where(where)
                .sort({ name: 1 })
                .skip((perpage * page) - perpage)
                .limit(perpage)
                .exec(function (err, results) {
                    if (err) { return res.json({ success: false }); }
                    decks = results;
                    return callback();
                });
            }
            
            getTotal(function () {
                getDecks(function () {
                    return res.json({
                        success: true,
                        decks: decks,
                        total: total,
                        page: page,
                        perpage: perpage,
                        search: search
                    });
                });
            });
        };
    },
    deck: function (Schemas) {
        return function (req, res, next) {
            var _id = req.body._id,
                deck,
                cards = {};
            
            function getDeck(callback) {
                Schemas.Deck.findOne({ _id: _id })
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
                        arena: results.arena,
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
            var userID = req.user._id;
            
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
                        video: req.body.video,
                        votes: [{
                            userID: req.user._id,
                            direction: 1
                        }],
                        arena: req.body.arena,
                        featured: req.body.featured,
                        allowComments: true,
                        createdDate: new Date().toISOString(),
                        premium: {
                            isPremium: req.body.premium.isPremium || false,
                            expiryDate: req.body.premium.expiryDate || new Date().toISOString()
                        }
                    });

                newDeck.save(function(err, data){
                    if (err) { return res.json({ success: false, errors: { unknown: { msg: 'An unknown error occurred' } } }); }
                    return callback();
                });
            }
            
            checkForm(function () {
                checkSlug(function () {
                    createDeck(function () {
                        return res.json({ success: true, slug: Util.slugify(req.body.name) });
                    });
                });
                
            });
        };
    },
    deckEdit: function (Schemas, Util) {
        return function (req, res, next) {
            var userID = req.user._id;
            
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
                
                Schemas.Deck.findOne({ _id: req.body._id })
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
                    deck.premium = {
                        isPremium: req.body.premium.isPremium || false,
                        expiryDate: req.body.premium.expiryDate || new Date().toISOString()
                    };
                    deck.arena = req.body.arena;
                    deck.featured = req.body.featured;
                    
                    deck.save(function(err, data){
                        if (err) { return res.json({ success: false, errors: { unknown: { msg: 'An unknown error occurred' } } }); }
                        return callback();
                    });

                });
            }
            
            checkForm(function () {
                checkSlug(function () {
                    updateDeck(function () {
                        return res.json({ success: true, slug: Util.slugify(req.body.name) });
                    });
                });
            });
        };
    },
    deckDelete: function (Schemas) {
        return function (req, res, next) {
            var _id = req.body._id,
                deck;
            
            function getDeck (callback) {
                Schemas.Deck.findOne({ _id: _id }).exec(function (err, results) {
                    if (err || !results) { return res.json({ success: false }); }
                    deck = results;
                    return callback();
                });
            }
            
            function deleteComments (callback) {
                if (!deck.comments.length) { return callback(); }
                Schemas.Comment.find({ _id: { $in: deck.comments } })
                .remove()
                .exec(function (err) {
                    if (err) { return res.json({ success: false }); }
                    return callback();
                });
            }
            
            function deleteDeck (callback) {
                Schemas.Deck.findOne({ _id: _id }).remove().exec(function (err) {
                    if (err) { return res.json({ success: false }); }
                    return callback();
                });
            }
            
            getDeck(function () {
                deleteComments(function () {
                    deleteDeck(function () {
                        return res.json({ success: true });
                    });
                });
            });
            
        };
    },
    articlesAll: function (Schemas) {
        return function (req, res, next) {
            function getArticles(callback){
                Schemas.Article.find({})
                .select('_id title createdDate slug.url')
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
            var page = req.body.page || 1,
                perpage = req.body.perpage || 50,
                search = req.body.search || '',
                where = (search.length) ? { title: new RegExp(search, "i") } : {},
                total, articles;
            
            function getTotal (callback) {
                Schemas.Article.count({})
                .where(where)
                .exec(function (err, count) {
                    if (err) { return res.json({ success: false }); }
                    total = count;
                    return callback();
                });
            }
            
            function getArticles (callback) {
                Schemas.Article.find({})
                .where(where)
                .sort({ createdDate: -1 })
                .skip((perpage * page) - perpage)
                .limit(perpage)
                .exec(function (err, results) {
                    if (err) { return res.json({ success: false }); }
                    articles = results;
                    return callback();
                });
            }
            
            getTotal(function () {
                getArticles(function () {
                    return res.json({
                        success: true,
                        articles: articles,
                        total: total,
                        page: page,
                        perpage: perpage,
                        search: search
                    });
                });
            });
            
        };
    },
    article: function (Schemas) {
        return function (req, res, next) {
            var _id = req.body._id;
            Schemas.Article.findOne({ _id: _id })
            //.populate('deck', '_id name')
            .populate([
                {
                    path: 'deck',
                    select: '_id name'
                },
                {
                    path: 'related',
                    select: '_id title slug.url'
                }
            ])
            .exec(function (err, article) {
                if (err || !article) {
                    console.log(err || 'No article found');
                    return res.json({
                        success: false
                    });
                }
                
                return res.json({ success: true, article: article });
                
            });
        };
    },
    articleAdd: function (Schemas) {
        return function (req, res, next) {
            var articleID,
                relatedID = [];
            // add form validation
            
            
            for (var i = 0; i < req.body.related.length; i++) {
                relatedID.push(req.body.related[i]._id);
            }
            
            // insert new article
            function insertArticle(callback) {
                var newArticle = new Schemas.Article({
                    articleType: req.body.articleType,
                    title: req.body.title,
                    slug: {
                        url: req.body.slug.url,
                        linked: req.body.slug.linked
                    },
                    description: req.body.description,
                    content: req.body.content,
                    author: req.body.author,
                    photos: {
                        large: req.body.photos.large,
                        medium: req.body.photos.medium,
                        small: req.body.photos.small
                    },
                    deck: (req.body.deck ? req.body.deck._id : undefined),
                    related: relatedID || undefined,
                    classTags: req.body.classTags,
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
                    theme: req.body.theme,
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
                    articleID = data._id;
                    return callback();
                });
            }
            
            function addActivity(callback) {
                var activity = new Schemas.Activity({
                    author: req.body.author,
                    activityType: "createArticle",
                    article: articleID,
                    active: req.body.active,
                    createdDate: new Date().toISOString()
                });
                activity.save(function(err, data) {
                    if (err) {
                        return res.json({ 
                            success: false, errors: { unknown: { msg: "An unknown error has occurred" }}
                        });
                    }
                    return callback();
                });
            }
            
            //actions
            insertArticle(function() {
                addActivity(function() {
                    res.json({ success: true });
                });
            });
        };
    },
    articleEdit: function (Schemas) {
        return function (req, res, next) {
            var _id = req.body._id,
                relatedID = [];
            
            for (var i = 0; i < req.body.related.length; i++) {
                relatedID.push(req.body.related[i]._id);
            }
            
            function updateActivity (callback) {
                Schemas.Activity.update({article: _id, activityType: 'createArticle'}, {author: req.body.author, active: req.body.active}).exec(function (err, data) {
                    Schemas.Activity.update({article: _id, activityType: 'articleComment'}, {active: req.body.active}).exec(function (err, data) {
                        return callback();
                    });
                });
            }
            
            function editArticle (callback) {
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
                    
                    oldActivityid = article._id;
                    
                    article.articleType = req.body.articleType;
                    article.title = req.body.title;
                    article.slug = {
                        url: req.body.slug.url,
                        linked: req.body.slug.linked
                    };
                    article.description = req.body.description;
                    article.content = req.body.content;
                    article.author = req.body.author;
                    article.photos = {
                        large: req.body.photos.large,
                        medium: req.body.photos.medium,
                        small: req.body.photos.small
                    };
                    article.deck = (req.body.deck ? req.body.deck._id : undefined);
                    article.related = relatedID || undefined;
                    article.classTags = req.body.classTags || [];
                    article.featured = req.body.featured;
                    article.premium = {
                        isPremium: req.body.premium.isPremium,
                        expiryDate: req.body.premium.expiryDate
                    };
                    article.theme = req.body.theme;
                    article.active = req.body.active;

                    article.save(function (err) {
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
                });
            }
            
            editArticle(function() {
                updateActivity(function () {
                    res.json({ success: true });
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
    articleGetNames: function (Schemas, async) {
        return function (req, res, next) {
            var _id = req.body._id,
                names = [];
            
            
            var iterComment = function (comment, callback) {
                Schemas.Comment.populate(comment, {
                    path: 'author',
                    select: 'username email'
                }, callback);
            };
            
            Schemas.Article.findOne({_id:_id})
            .select('comments')
            .populate([
                {
                    path: 'comments',
                    select: 'author'
                }
            ])
            .lean()
            .exec(function (err, data) {
                if (err) { return res.json({ success: false }); }
                
                async.each(data.comments, iterComment, function (err) {
                    if (err) { return res.json({ success: false }); }
                    
                    for (var i = 0; i < data.comments.length; i++) {
                        names.push('@' + data.comments[i].author.username + ' - ' + data.comments[i].author.email);
                    }
                    
                    return res.json({ success: true, names: names });
                });
            });
            
        };
    },
    heroes: function (Schemas) {
        return function (req, res, next) {
            var page = req.body.page,
                perpage = req.body.perpage,
                start = (page * perpage) - perpage,
                search = req.body.search || '',
                where = (search.length) ? { name: new RegExp(search, "i") } : {},
                heroes, total;
            
            function getTotal (callback) {
                Schemas.Hero.count({})
                .where(where)
                .exec(function (err, count) {
                    if (err) { return res.json({ success: false }); }
                    total = count;
                    return callback();
                });
            }
            
            function getHeroes (callback) {
                Schemas.Hero.find({})
                .where(where)
                .sort({ name: 1 })
                .skip((perpage * page) - perpage)
                .limit(perpage)
                .exec(function (err, results) {
                    if (err) { return res.json({ success: false }); }
                    heroes = results;
                    return callback();
                });
            }
            
            getTotal(function () {
                getHeroes(function () {
                    return res.json({
                        success: true,
                        heroes: heroes,
                        total: total,
                        page: page,
                        perpage: perpage,
                        search: search
                    });
                });
            });
        };
    },
    allHeroes: function (Schemas) {
        return function (req, res, next) {
            var heroes;
            
            function getHeroes (callback) {
                Schemas.Hero.find({})
                .sort({ orderNum: 1 })
                .exec(function (err, results) {
                    if (err) { return res.json({ success: false }); }
                    heroes = results;
                    return callback();
                });
            }
            
            getHeroes(function () {
                return res.json({
                    success: true,
                    heroes: heroes
                });
            });
        };
    },
    hero: function (Schemas) {
        return function (req, res, next) {
            var heroID = req.body._id;
            
            function getHero(callback) {
                Schemas.Hero.findOne({ _id: heroID }).exec(function (err, hero) {
                    if (err || !hero) { return res.json({ success: false }); }
                    callback(hero);
                });
            }
            
            getHero(function (hero) {
                return res.json({ success: true, hero: hero });
            });
        };
    },
    heroDelete: function (Schemas) {
        return function (req, res, next) {
            var _id = req.body._id;
            
            function deleteHero (callback) {
                Schemas.Hero.findOne({ _id: _id }).remove().exec(function (err) {
                    if (err) { return res.json({ success: false }); }
                    return callback();
                });
            }
            
            deleteHero(function () {
                return res.json({ success: true });
            });
        };
    },
    heroAdd: function (Schemas) {
        return function (req, res, next) {
            var hero = req.body,
                orderNum = 1;
            
            function getOrderNum (callback) {
                Schemas.Hero.findOne({})
                .sort({ orderNum: -1 })
                .exec(function (err, result) {
                    if (err || !result) {
                        orderNum = 1;
                    } else {
                        orderNum = result.orderNum + 1;
                    }
                    return callback();
                });
            }
            
            function createHero(callback) {
                var newHero = new Schemas.Hero({
                        name: hero.name,
                        description: hero.description,
                        title: hero.title,
                        role: hero.role,
                        heroType: hero.heroType,
                        manaType: hero.manaType,
                        universe: hero.universe,
                        price: {
                            gold: hero.price.gold
                        },
                        abilities: hero.abilities,
                        talents: hero.talents,
                        characters: hero.characters,
                        orderNum: orderNum,
                        className: hero.className,
                        active: hero.active
                    });

                newHero.save(function(err, data){
                    if (err) { return res.json({ success: false, errors: { unknown: { msg: 'An unknown error occurred' } } }); }
                    return callback();
                });
            }
            
            getOrderNum(function () {
                createHero(function () {
                    return res.json({ success: true });
                });
            });
        };
    },
    heroEdit: function (Schemas) {
        return function (req, res, next) {
            var hero = req.body;
            
            function updateHero(callback) {
                Schemas.Hero.findOne({ _id: hero._id }).exec(function (err, result) {
                    if (err || !result) { return res.json({ success: false }); }
                    
                    result.name = hero.name;
                    result.description = hero.description;
                    result.title = hero.title;
                    result.role = hero.role;
                    result.heroType = hero.heroType;
                    result.manaType = hero.manaType;
                    result.universe = hero.universe;
                    result.price = {
                        gold: hero.price.gold
                    };
                    result.abilities = hero.abilities;
                    result.talents = hero.talents;
                    result.characters = hero.characters;
                    result.className = hero.className;
                    result.active = hero.active;
                    
                    result.save(function(err, data){
                        if (err) { return res.json({ success: false, errors: { unknown: { msg: 'An unknown error occurred' } } }); }
                        return callback();
                    });
                });
            }
            
            updateHero(function () {
                return res.json({ success: true });
            });
        };
    },
    maps: function (Schemas) {
        return function (req, res, next) {
            var page = req.body.page,
                perpage = req.body.perpage,
                start = (page * perpage) - perpage,
                search = req.body.search || '',
                where = (search.length) ? { name: new RegExp(search, "i") } : {},
                maps, total;
            
            function getTotal (callback) {
                Schemas.Map.count({})
                .where(where)
                .exec(function (err, count) {
                    if (err) { return res.json({ success: false }); }
                    total = count;
                    return callback();
                });
            }
            
            function getMaps (callback) {
                Schemas.Map.find({})
                .where(where)
                .sort({ name: 1 })
                .skip((perpage * page) - perpage)
                .limit(perpage)
                .exec(function (err, results) {
                    if (err) { return res.json({ success: false }); }
                    maps = results;
                    return callback();
                });
            }
            
            getTotal(function () {
                getMaps(function () {
                    return res.json({
                        success: true,
                        maps: maps,
                        total: total,
                        page: page,
                        perpage: perpage,
                        search: search
                    });
                });
            });
        };
    },
    allMaps: function (Schemas) {
        return function (req, res, next) {
            var maps;
            
            function getMaps (callback) {
                Schemas.Map.find({})
                .sort({ orderNum: 1 })
                .exec(function (err, results) {
                    if (err) { return res.json({ success: false }); }
                    maps = results;
                    return callback();
                });
            }
            
            getMaps(function () {
                return res.json({
                    success: true,
                    maps: maps
                });
            });
        };
    },
    map: function (Schemas) {
        return function (req, res, next) {
            var mapID = req.body._id;
            
            function getMap(callback) {
                Schemas.Map.findOne({ _id: mapID }).exec(function (err, map) {
                    if (err || !map) { return res.json({ success: false }); }
                    callback(map);
                });
            }
            
            getMap(function (map) {
                return res.json({ success: true, map: map });
            });
        };
    },
    mapDelete: function (Schemas) {
        return function (req, res, next) {
            var _id = req.body._id;
            
            function deleteMap (callback) {
                Schemas.Map.findOne({ _id: _id }).remove().exec(function (err) {
                    if (err) { return res.json({ success: false }); }
                    return callback();
                });
            }
            
            deleteMap(function () {
                return res.json({ success: true });
            });
        };
    },
    mapAdd: function (Schemas) {
        return function (req, res, next) {
            var map = req.body,
                orderNum = 1;
            
            function getOrderNum (callback) {
                Schemas.Map.findOne({})
                .sort({ orderNum: -1 })
                .exec(function (err, result) {
                    if (err || !result) {
                        orderNum = 1;
                    } else {
                        orderNum = result.orderNum + 1;
                    }
                    return callback();
                });
            }
            
            function createMap(callback) {
                var newMap = new Schemas.Map({
                        name: map.name,
                        description: map.description,
                        orderNum: orderNum,
                        className: map.className,
                        active: map.active
                    });

                newMap.save(function(err, data){
                    if (err) { return res.json({ success: false, errors: { unknown: { msg: 'An unknown error occurred' } } }); }
                    return callback();
                });
            }
            
            getOrderNum(function () {
                createMap(function () {
                    return res.json({ success: true });
                });
            });
        };
    },
    mapEdit: function (Schemas) {
        return function (req, res, next) {
            var map = req.body;
            
            function updateMap(callback) {
                Schemas.Map.findOne({ _id: map._id }).exec(function (err, result) {
                    if (err || !result) { return res.json({ success: false }); }
                    
                    result.name = map.name;
                    result.description = map.description;
                    result.className = map.className;
                    result.active = map.active;
                    
                    result.save(function(err, data){
                        if (err) { return res.json({ success: false, errors: { unknown: { msg: 'An unknown error occurred' } } }); }
                        return callback();
                    });
                });
            }
            
            updateMap(function () {
                return res.json({ success: true });
            });
        };
    },
    allGuides: function (Schemas) {
        return function (req, res, next) {
            var guides;
            
            function getGuides (callback) {
                Schemas.Guide.find({})
                .select('_id name')
                .sort({ name: 1 })
                .exec(function (err, results) {
                    if (err) { return res.json({ success: false }); }
                    guides = results;
                    return callback();
                });
            }
            
            getGuides(function () {
                return res.json({
                    success: true,
                    guides: guides
                });
            });
        };
    },
    guides: function (Schemas) {
        return function (req, res, next) {
            var page = req.body.page,
                perpage = req.body.perpage,
                start = (page * perpage) - perpage,
                search = req.body.search || '',
                where = (search.length) ? { name: new RegExp(search, "i") } : {},
                guides, total;
            
            function getTotal (callback) {
                Schemas.Guide.count({})
                .where(where)
                .exec(function (err, count) {
                    if (err) { return res.json({ success: false }); }
                    total = count;
                    return callback();
                });
            }
            
            function getGuides (callback) {
                Schemas.Guide.find({})
                .where(where)
                .sort({ name: 1 })
                .skip((perpage * page) - perpage)
                .limit(perpage)
                .exec(function (err, results) {
                    if (err) { return res.json({ success: false }); }
                    guides = results;
                    return callback();
                });
            }
            
            getTotal(function () {
                getGuides(function () {
                    return res.json({
                        success: true,
                        guides: guides,
                        total: total,
                        page: page,
                        perpage: perpage,
                        search: search
                    });
                });
            });
        };
    },
    guide: function (Schemas) {
        return function (req, res, next) {
            var _id = req.body._id,
                guide;
            
            function getGuide(callback) {
                Schemas.Guide.findOne({ _id: _id })
                .lean()
                .populate('heroes.hero')
                .exec(function (err, results) {
                    if (err || !results) { return res.json({ success: false }); }
                    guide = results;
                    return callback();
                });
            }
            
            getGuide(function () {
                return res.json({
                    success: true,
                    guide: guide
                });
            });
        };
    },
    guideAdd: function (Schemas, Util, mongoose) {
        return function (req, res, next) {
            var userID = req.user._id;
            
            req.assert('name', 'Guide name is required').notEmpty();
            req.assert('name', 'Guide name cannot be more than 60 characters').len(1, 60);
            req.assert('description', 'Guide description is required').notEmpty();
            req.assert('description', 'Guide description cannot be more than 400 characters').len(1, 400);
            
            function checkForm (callback) {
               var errors = req.validationErrors();

                if (errors) {
                    return res.json({ success: false, errors: errors });
                } else {
                    return callback();
                }
            }
            
            function checkSlug (callback) {
                // check slug length
                if (!Util.slugify(req.body.name).length) {
                    return res.json({ success: false, errors: { name: { msg: 'An invalid name has been entered' } } });
                }
                
                // check if slug exists
                Schemas.Guide.count({ slug: Util.slugify(req.body.name) })
                .exec(function (err, count) {
                    if (err) { return res.json({ success: false, errors: { unknown: { msg: 'An unknown error occurred' } } }); }
                    if (count > 0) {
                        return res.json({ success: false, errors: { name: { msg: 'That guide name already exists. Please choose a different guide name.' } } });
                    }
                    return callback();
                });
            }
            
            function createGuide(callback) {
                var heroes = [];
                
                for (var i = 0; i < req.body.heroes.length; i++) {
                    var obj = {
                        hero: req.body.heroes[i].hero._id,
                        talents: req.body.heroes[i].talents
                    };
                    heroes.push(obj);
                }
                
                var newGuide = new Schemas.Guide({
                        name: req.body.name,
                        slug: Util.slugify(req.body.name),
                        guideType: req.body.guideType,
                        description: req.body.description,
                        content: req.body.content,
                        author: req.user._id,
                        heroes: (req.body.guideType === 'hero') ? heroes : [],
                        maps: req.body.maps,
                        synergy: req.body.synergy,
                        against: {
                            strong: req.body.against.strong || [],
                            weak: req.body.against.weak || []
                        },
                        public: req.body.public,
                        video: req.body.video,
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
                            isPremium: req.body.premium.isPremium || false,
                            expiryDate: req.body.premium.expiryDate || new Date().toISOString()
                        }
                    });

                newGuide.save(function(err, data){
                    if (err) { return res.json({ success: false, errors: { unknown: { msg: 'An unknown error occurred' } } }); }
                    return callback();
                });
            }
            
            function addActivity(callback) {
                var activity = new Schemas.Activity({
                    author: userID,
                    activityType: "createGuide",
                    guide: mongoose.Types.ObjectId(),
                    active: req.body.public,
                    createdDate: new Date().toISOString()
                });
                activity.save(function(err, data) {
                    if (err) {
                        return res.json({ 
                            success: false, errors: { unknown: { msg: "An unknown error has occurred" }}
                        });
                    }
                    return callback();
                });
            }
            
            checkForm(function () {
                checkSlug(function () {
                    createGuide(function () {
                        addActivity(function () {
                            return res.json({ success: true, slug: Util.slugify(req.body.name) });
                        });
                    });
                });
                
            });
        };
    },
    guideEdit: function (Schemas, Util) {
        return function (req, res, next) {
            var userID = req.user._id;
            
            req.assert('name', 'Guide name is required').notEmpty();
            req.assert('name', 'Guide name cannot be more than 60 characters').len(1, 60);
            req.assert('description', 'Guide description is required').notEmpty();
            req.assert('description', 'Guide description cannot be more than 400 characters').len(1, 400);
            
            function checkForm (callback) {
               var errors = req.validationErrors();

                if (errors) {
                    return res.json({ success: false, errors: errors });
                } else {
                    return callback();
                }
            }
            
            function checkSlug (callback) {
                // check slug length
                if (!Util.slugify(req.body.name).length) {
                    return res.json({ success: false, errors: { name: { msg: 'An invalid name has been entered' } } });
                }
                
                // check if slug exists
                Schemas.Guide.count({ _id: { $ne: req.body._id }, slug: Util.slugify(req.body.name) })
                .exec(function (err, count) {
                    if (err) { return res.json({ success: false, errors: { unknown: { msg: 'An unknown error occurred' } } }); }
                    if (count > 0) {
                        return res.json({ success: false, errors: { name: { msg: 'That deck name already exists. Please choose a different deck name.' } } });
                    }
                    return callback();
                });
            }
            
            function updateGuide (callback) {
                Schemas.Guide.findOne({ _id: req.body._id })
                .exec(function (err, guide) {
                    if (err) { return res.json({ success: false, errors: { unknown: { msg: 'An unknown error occurred' } } }); }
                    
                    var heroes = [];
                    for (var i = 0; i < req.body.heroes.length; i++) {
                        var obj = {
                            hero: req.body.heroes[i].hero._id,
                            talents: req.body.heroes[i].talents
                        };
                        heroes.push(obj);
                    }
                    
                    guide.name = req.body.name;
                    guide.slug = Util.slugify(req.body.name);
                    guide.guideType = req.body.guideType;
                    guide.description = req.body.description;
                    guide.content = req.body.content;
                    guide.heroes = (req.body.guideType === 'hero') ? heroes : [];
                    guide.maps = req.body.maps;
                    guide.synergy = req.body.synergy;
                    guide.against = {
                        strong: req.body.against.strong || [],
                        weak: req.body.against.weak || []
                    };
                    guide.public = req.body.public;
                    guide.video = req.body.video;
                    guide.featured = req.body.featured;
                    guide.premium = {
                        isPremium: req.body.premium.isPremium || false,
                        expiryDate: req.body.premium.expiryDate || new Date().toISOString()
                    };
                    
                    guide.save(function(err, data){
                        if (err) { return res.json({ success: false, errors: { unknown: { msg: 'An unknown error occurred' } } }); }
                        return callback();
                    });
                });
            }
            
            function updateActivities(callback) {
                console.log(req.body._id);
                    Schemas.Activity.update({guide: req.body._id, activityType: 'guideComment'}, {active: req.body.public}).exec(function (err, data) {
                        return callback();
                });
            }
            
            checkForm(function () {
                checkSlug(function () {
                    updateGuide(function () {
                        updateActivities(function () {
                            return res.json({ success: true, slug: Util.slugify(req.body.name) });
                        });
                    });
                });
            });
        };
    },
    guideDelete: function (Schemas) {
        return function (req, res, next) {
            var _id = req.body._id,
                guide;
            
            function getGuide (callback) {
                Schemas.Guide.findOne({ _id: _id }).exec(function (err, results) {
                    if (err || !results) { return res.json({ success: false }); }
                    guide = results;
                    return callback();
                });
            }
            
            function deleteComments (callback) {
                if (!guide.comments.length) { return callback(); }
                Schemas.Comment.find({ _id: { $in: guide.comments } })
                .remove()
                .exec(function (err) {
                    if (err) { return res.json({ success: false }); }
                    return callback();
                });
            }
            
            function deleteGuide (callback) {
                Schemas.Guide.findOne({ _id: _id }).remove().exec(function (err) {
                    if (err) { return res.json({ success: false }); }
                    return callback();
                });
            }
            
            getGuide(function () {
                deleteComments(function () {
                    deleteGuide(function () {
                        return res.json({ success: true });
                    });
                });
            });
        };
    },
    usersProviders: function (Schemas) {
        return function (req, res, next) {
            Schemas.User.find({ isProvider: true }).select('_id username').exec(function (err, users) {
                if (err) { return res.json({ success: false }); }
                return res.json({
                    success: true,
                    users: users
                });
            });
        };
    },
    users: function (Schemas) {
        return function (req, res, next) {
            var page = req.body.page || 1,
                perpage = req.body.perpage || 50,
                search = req.body.search || '',
                where = (search.length) ? { username: new RegExp(search, "i") } : {},
                total, users;
            
            function getTotal (callback) {
                Schemas.User.count({})
                .where(where)
                .exec(function (err, count) {
                    if (err) { return res.json({ success: false }); }
                    total = count;
                    return callback();
                });
            }
            
            function getUsers (callback) {
                Schemas.User.find({})
                .where(where)
                .sort({ username: 1 })
                .skip((perpage * page) - perpage)
                .limit(perpage)
                .exec(function (err, results) {
                    if (err) { return res.json({ success: false }); }
                    users = results;
                    return callback();
                });
            }
            
            getTotal(function () {
                getUsers(function () {
                    return res.json({
                        success: true,
                        users: users,
                        total: total,
                        page: page,
                        perpage: perpage,
                        search: search
                    });
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
                                verified: true,
                                isAdmin: req.body.isAdmin,
                                isProvider: req.body.isProvider,
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

                        user.email = req.body.email || '';
                        user.username = req.body.username;
                        if (req.body.changePassword) {
                            user.password = req.body.newPassword;
                        }
                        user.firstName = req.body.firstName || '';
                        user.lastName = req.body.lastName || '';
                        user.about = req.body.about || '';
                        user.social = req.body.social || {
                            twitter: '',
                            facebook: '',
                            twitch: '',
                            instagram: '',
                            youtube: ''
                        };
                        user.subscription = {
                            isSubscribed: req.body.subscription.isSubscribed,
                            expiryDate: req.body.subscription.expiryDate || new Date().toISOString()
                        };
                        user.isAdmin = req.body.isAdmin || false;
                        user.active = req.body.active;
                        user.isProvider = req.body.isProvider || false;

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
    uploadCard: function (fs, gm, amazon) {
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
                    path = __dirname+'/../photos/cards/';
                    copyFile(function () {
                        var files = [];
                        files.push({
                            path: path + medium,
                            name: medium
                        });
                        files.push({
                            path: path + large,
                            name: large
                        });
                        amazon.upload(files, 'cards/', function () {
                            return res.json({
                                success: true,
                                large: large,
                                medium: medium,
                                path: './photos/cards/'
                            });
                        });
                    });
                function copyFile(callback) {
                    // read file
                    fs.readFile(req.files.file.path, function(err, data){
                        if (err) return next(err);
                        // write file
                        fs.writeFile(path + large, data, function(err){
                            if (err) return next(err);
                            // chmod new file
                            fs.chmod(path + large, 0777, function(err){
                                if (err) return next(err);
                                // delete tmp file
                                fs.unlink(req.files.file.path, function(err){
                                    if (err) return next(err);
                                    // resize
                                    gm(path + large).quality(100).resize(284, 395, "!").write(path + large, function(err){
                                        if (err) return next(err);
                                        gm(path + large).quality(100).resize(213, 295, "!").write(path + medium, function(err){
                                            if (err) return next(err);
                                            fs.chmod(path + medium, 0777, function(err){
                                                if (err) return next(err);
                                                return callback();
                                            });
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
    uploadDeck: function (fs, gm, amazon) {
        return function(req, res, next) {
            // check if image file
            var types = ['image/png', 'image/jpeg', 'image/gif'];
            if (types.indexOf(req.files.file.type) === -1) {
                fs.unlink(req.files.file.path, function(err){
                    if (err) return next(err);
                    return res.json({
                        success: false,
                        error: 'Invalid photo uploaded.',
                    });
                });
            } else {
                var arr = req.files.file.name.split('.'),
                    name = arr.splice(0, arr.length - 1).join('.'),
                    ext = '.' + arr.pop(),
                    small = name + '.small' + ext,
                    path = __dirname+'/../photos/cards/';
                    copyFile(function () {
                        var files = [];
                        files.push({
                            path: path + small,
                            name: small
                        });
                        amazon.upload(files, 'cards/', function () {
                            return res.json({
                                success: true,
                                small: small,
                                path: './photos/cards/'
                            });
                        });
                    });

                function copyFile(callback) {
                    // read file
                    fs.readFile(req.files.file.path, function(err, data){
                        if (err) return next(err);
                        // write file
                        fs.writeFile(path + small, data, function(err){
                            if (err) return next(err);
                            // chmod new file
                            fs.chmod(path + small, 0777, function(err){
                                if (err) return next(err);
                                // delete tmp file
                                fs.unlink(req.files.file.path, function(err){
                                    if (err) return next(err);
                                    // resize
                                    gm(path + small).quality(100).resize(110, 26, "!").write(path + small, function(err){
                                        if (err) return next(err);
                                        return callback();
                                    });
                                });
                            });
                        });
                    });
                }
            }
        };
    },
    uploadArticle: function (fs, gm, amazon, Util) {
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
                    large = Util.slugify(name) + '.large' + ext,
                    medium = Util.slugify(name) + '.medium' + ext,
                    small = Util.slugify(name) + '.small' + ext,
                    path = __dirname+'/../photos/articles/';
                    copyFile(function () {
                        var files = [];
                        files.push({
                            path: path + large,
                            name: large
                        });
                        files.push({
                            path: path + medium,
                            name: medium
                        });
                        files.push({
                            path: path + small,
                            name: small
                        });
                        amazon.upload(files, 'articles/', function () {
                            return res.json({
                                success: true,
                                large: large,
                                medium: medium,
                                small: small,
                                path: './photos/articles/'
                            });
                        });
                    });

                function copyFile(callback) {
                    // read file
                    fs.readFile(req.files.file.path, function(err, data){
                        if (err) return next(err);
                        // write file
                        fs.writeFile(path + large, data, function(err){
                            if (err) return next(err);
                            // chmod new file
                            fs.chmod(path + large, 0777, function(err){
                                if (err) return next(err);
                                // delete tmp file
                                fs.unlink(req.files.file.path, function(err){
                                    if (err) return next(err);
                                    // resize
                                    gm(path + large).quality(100).gravity('Center').crop(1920, 480, 0, 0).write(path + large, function(err){
                                        if (err) return next(err);
                                        gm(path + large).quality(100).resize(800, 200, "!").write(path + medium, function(err){
                                            if (err) return next(err);
                                            fs.chmod(path + medium, 0777, function(err){
                                                if (err) return next(err);
                                                gm(path + large).quality(100).resize(400, 100, "!").write(path + small, function(err){
                                                    if (err) return next(err);
                                                    fs.chmod(path + small, 0777, function(err){
                                                        if (err) return next(err);
                                                        return callback();
                                                    });
                                                });
                                            });
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
    uploadPoll: function (fs, gm, amazon) {
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
                    thumb = name + '.thumb' + ext,
                    path = __dirname+'/../photos/polls/';
                    copyFile(function () {
                        var files = [];
                        files.push({
                            path: path + large,
                            name: large
                        });
                        files.push({
                            path: path + thumb,
                            name: thumb
                        });
                        amazon.upload(files, 'polls/', function () {
                            return res.json({
                                success: true,
                                large: large,
                                thumb: thumb,
                                path: '/photos/polls'
                            });
                        });
                    });

                function copyFile(callback) {
                    // read file
                    fs.readFile(req.files.file.path, function(err, data){
                        if (err) return next(err);
                        // write file
                        fs.writeFile(path + large, data, function(err){
                            if (err) return next(err);
                            // chmod new file
                            fs.chmod(path + large, 0777, function(err){
                                if (err) return next(err);
                                // delete tmp file
                                fs.unlink(req.files.file.path, function(err){
                                    if (err) return next(err);
                                    // resize
                                    gm(path + large).quality(100).resize(800, 600, ">").write(path + large, function(err){
                                        if (err) return next(err);
                                        gm(path + large).quality(100).resize(140, 140, "^").write(path + thumb, function(err){
                                            if (err) return next(err);
                                            gm(path + thumb).quality(100).gravity('Center').crop(140, 140).write(path + thumb, function(err){
                                                if (err) return next(err);
                                                fs.chmod(path + thumb, 0777, function(err){
                                                    if (err) return next(err);
                                                    return callback();
                                                });
                                            });
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
    uploadBanner: function (fs, gm, amazon) {
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
                    large = name + ext,
                    path = __dirname+'/../photos/banners/';
                    copyFile(function () {
                        var files = [];
                        files.push({
                            path: path + large,
                            name: large
                        });
                        amazon.upload(files, 'banners/', function () {
                            return res.json({
                                success: true,
                                large: large,
                                path: '/photos/banners'
                            });
                        });
                    });
                function copyFile(callback) {
                    // read file
                    fs.readFile(req.files.file.path, function(err, data){
                        if (err) return next(err);
                        // write file
                        fs.writeFile(path + large, data, function(err){
                            if (err) return next(err);
                            // chmod new file
                            fs.chmod(path + large, 0777, function(err){
                                if (err) return next(err);
                                // delete tmp file
                                fs.unlink(req.files.file.path, function(err){
                                    if (err) return next(err);
                                    // resize
                                    gm(path + large).quality(100).resize(1900, 499, ">").write(path + large, function(err){
                                        if (err) return next(err);
                                        return callback();
                                    });
                                });
                            });
                        });
                    });
                }
            }
        };
    },
    polls: function (Schemas) {
        return function (req, res, next) {
            var page = req.body.page || 1,
                perpage = req.body.perpage || 50,
                search = req.body.search || '',
                where = (search.length) ? { title: new RegExp(search, "i") } : {},
                total, polls;
            
    
            
            function getTotal (callback) {
                Schemas.Poll.count({})
                .where(where)
                .exec(function (err, count) {
                    if (err) { return res.json({ success: false }); }
                    total = count;
                    return callback();
                });
            }
            
            function getPolls (callback) {
                Schemas.Poll.find({})
                .where(where)
                .sort({ title: 1 })
                .skip((perpage * page) - perpage)
                .limit(perpage)
                .exec(function (err, results) {
                    if (err) { return res.json({ success: false }); }
                    polls = results;
                    return callback();
                });
            }
            
            getTotal(function () {
                getPolls(function () {
                    return res.json({
                        success: true,
                        polls: polls,
                        total: total,
                        page: page,
                        perpage: perpage,
                        search: search
                    });
                });
            });
        };
    },
    poll: function (Schemas) {
        return function (req, res, next) {
            var _id = req.body._id;
            
            Schemas.Poll.findOne({ _id: _id }).exec(function (err, poll) {
                if (err || !poll) {
                    console.log(err || 'Poll not found');
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
                    poll: poll
                });
            });
        };
    },
    pollAdd: function (Schemas) {
        return function (req, res, next) {
            req.assert('title', 'Please enter a title').notEmpty();
            req.assert('subTitle', 'A Sub Title is required').notEmpty();
            req.assert('description', 'A description is required').notEmpty();
            req.assert('type', 'A type is required').notEmpty();
            
            var errors = req.validationErrors(true);
            
            if (errors) {
                return res.json({ success: false, errors: errors });
            } else {
                var error = false,
                    errorMsgs = {};
                
                
                function checkTitle(callback) {
                    Schemas.Poll.count({ title: req.body.title }, function(err, count){
                        if (err) {
                            error = true;
                            errorMsgs.unknown = { 
                                msg: 'An unknown error occurred'
                            };
                        }
                        if (count > 0) {
                            error = true;
                            errorMsgs.title = { 
                                msg: 'Title already in use.'
                            };
                        }
                        callback();
                    });
                }
                
                
                function completeNewPoll() {
                    if (error) {
                        return res.json({ success: false, errors: errorMsgs });
                    } else {
                        var newPoll = new Schemas.Poll({
                                title: req.body.title,
                                subTitle: req.body.subTitle,
                                description: req.body.description,
                                type: req.body.type,
                                items: req.body.items, 
                                active: req.body.active,
                                view: req.body.view,
                                voteLimit: req.body.voteLimit,
                                createdDate: new Date().toISOString()
                            });

                        newPoll.save(function(err, data){
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
                    }
                }
                checkTitle(function() {
                    completeNewPoll();
                });
            }
        };
    },
    pollEdit: function (Schemas) {
        return function (req, res, next) {
            var _id = req.body._id;
            
            req.assert('title', 'Please enter a title').notEmpty();
            req.assert('subTitle', 'A Sub Title is required').notEmpty();
            req.assert('description', 'A description is required').notEmpty();
            req.assert('type', 'A type is required').notEmpty();
            
            var errors = req.validationErrors(true);
            
            if (errors) {
                return res.json({ success: false, errors: errors });
            } else {
                
                function checkTitle(callback) {
                    Schemas.Poll.count({ title: req.body.title, _id: { $ne: _id } }).exec(function (err, count) {
                        if (err) { return res.json({ success: false, errors: { unknown: { msg: 'An unknown error occurred' } } }); }
                        if (count > 0) {
                            return res.json({ success: false, errors: { email: { msg: 'A poll with that title already exists.' } } });
                        }
                        return callback();
                    });
                }
                
                function updatePoll(callback) {
                    Schemas.Poll.findOne({ _id: _id }).exec(function (err, poll) {
                        if (err || !poll) {
                            console.log(err || 'Poll not found');
                            return res.json({ success: false,
                                errors: {
                                    unknown: {
                                        msg: 'An unknown error occurred'
                                    }
                                }
                            });
                        }

                        poll.title = req.body.title || '';
                        poll.subTitle = req.body.subTitle,
                        poll.description = req.body.description,
                        poll.type = req.body.type,
                        poll.active = req.body.active,
                        poll.view = req.body.view,
                        poll.items = req.body.items,
                        poll.voteLimit = req.body.voteLimit;
                        poll.save(function (err) {
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
                
                checkTitle(function () {
                    updatePoll(function () {
                        return res.json({ success: true });
                    });
                });
            }
        };
    },
    pollDelete: function (Schemas) {
        return function (req, res, next) {
            var _id = req.body._id;
            Schemas.Poll.findOne({ _id: _id }).remove().exec(function (err) {
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
    itemEdit: function (Schemas) {
        return function (req, res, next) {
            _id = req.body._id;
            
            var errors = req.validationErrors(true);
            
            Schemas.Poll.findOne({ _id: _id }).exec(function (err, item) {
                if (err || !item) {
                    console.log(err || 'item not found');
                    return res.json({ success: false,
                        errors: {
                            unknown: {
                                msg: 'An unknown error occurred'
                            }
                        }
                    });
                }

                item.name = req.body.name || '';
                item.photos = req.body.photos;

                item.save(function (err) {
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
                });
            });
        };
    },
    banners: function (Schemas) {
        return function (req, res, next) {
            var total = undefined,
                tsBanners = [],
                hsBanners = [],
                hotsBanners = [];

            function getTotal (callback) {
                Schemas.Banner.count({})
                .exec(function (err, count) {
                    if (err) { return res.json({ success: false }); }
                    total = count;
                    return callback();
                });
            }
            
            function getBanners (callback) {
                Schemas.Banner.find({})
                .sort({ orderNum: 1 })
                .exec(function (err, results) {
                    if (err) { return res.json({ success: false }); }
                    for (i=0; i != results.length; i++) {
                        var type = results[i].bannerType;
                        switch (type) {
                            case 'ts'  : tsBanners.push(results[i]); break;
                            case 'hs'  : hsBanners.push(results[i]); break;
                            case 'hots': hotsBanners.push(results[i]); break;
                        }
                    }
                    banners = results;
                    return callback();
                });
                
                
            }
            
            getTotal(function () {
                getBanners(function () {
                    return res.json({
                        success: true,
                        tsBanners: tsBanners,
                        hsBanners: hsBanners,
                        hotsBanners: hotsBanners,
                        total: total,
                    });
                });
            });
        }
    },
    bannersOrder: function (Schemas) {
        return function (req, res, next) {
            for (i=0; i < req.body.banners.length; i++) {
                Schemas.Banner.findByIdAndUpdate(req.body.banners[i]._id, { $set: { orderNum: req.body.banners[i].orderNum }}).exec(function (err, banner) {
                    if (err || !banner) {
                        console.log(err || 'Banner not found');
                        return res.json({ success: false,
                            errors: {
                                unknown: {
                                    msg: 'An unknown error occurred'
                                }
                            }
                        });
                    }
                });
            }
            
            //console.log(req.body.banners);
        }
    },
    banner: function (Schemas) {
        return function (req, res, next) {
            var _id = req.body._id;
            
            Schemas.Banner.findOne({ _id: _id }).exec(function (err, banner) {
                if (err || !banner) {
                    console.log(err || 'Banner not found');
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
                    banner: banner
                });
            });
        }
    },
    bannerDelete: function (Schemas) {
        return function (req, res, next) {
            var _id = req.body._id;
            Schemas.Banner.findOne({ _id: _id }).remove().exec(function (err) {
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
        }
    },
    bannerAdd: function (Schemas) {
        return function (req, res, next) {
            var _id = req.body._id;
            
            req.assert('title', 'Please enter a title').notEmpty();
            req.assert('description', 'A description is required').notEmpty();
            
            var errors = req.validationErrors(true);
            
            if (errors) {
                return res.json({ success: false, errors: errors });
            } else {
                var error = false,
                    errorMsgs = {};
            
                function completeNewBanner() {
                    if (error) {
                        return res.json({ success: false, errors: errorMsgs });
                    } else {
                        var newPoll = new Schemas.Banner({
                                bannerType: req.body.bannerType,
                                title: req.body.title,
                                description: req.body.description,
                                photo: req.body.photo,
                                button: {
                                    hasButton: req.body.button.hasButton,
                                    buttonText: req.body.button.buttonText || '',
                                    buttonLink: req.body.button.buttonLink || ''
                                },
                                active: req.body.active,
                            });

                        newPoll.save(function(err, data){
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
                    }
                }
                completeNewBanner(function () {
                    return res.json({ success: true });
                });
            }
            
        }
    },
    bannerEdit: function (Schemas) {
        return function (req, res, next) {
            var _id = req.body._id;
            
            req.assert('title', 'Please enter a title').notEmpty();
            req.assert('description', 'A description is required').notEmpty();
            
            var errors = req.validationErrors(true);
            
            if (errors) {
                return res.json({ success: false, errors: errors });
            } else {
                var error = false,
                    errorMsgs = {};
            
                function updateBanner(callback) {
                        Schemas.Banner.findOne({ _id: _id }).exec(function (err, banner) {
                            if (err || !banner) {
                                console.log(err || 'Banner not found');
                                return res.json({ success: false,
                                    errors: {
                                        unknown: {
                                            msg: 'An unknown error occurred'
                                        }
                                    }
                                });
                            }

                            banner.title = req.body.title || '';
                            banner.description = req.body.description,
                            banner.bannerType = req.body.bannerType,
                            banner.button = {
                                    hasButton: req.body.button.hasButton,
                                    buttonText: req.body.button.buttonText || '',
                                    buttonLink: req.body.button.buttonLink || ''
                            },
                            banner.active = req.body.active,
                            banner.photo = req.body.photo
                            banner.save(function (err) {
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
                updateBanner(function () {
                    return res.json({ success: true });
                });
            }
        }
    },
    getObjectID: function (mongoose) {
        return function (req, res, next) {
            var id = mongoose.Types.ObjectId();
            return res.json({ success: true, id: id });
        };
    }
};