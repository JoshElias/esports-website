module.exports = {
    guides: function (Schemas) {
        return function (req, res, next) {
            var guideType = req.body.guideType || 'all',
                hero = req.body.hero || 'all',
                map = req.body.map || 'all',
                page = req.body.page || 1,
                perpage = req.body.perpage || 10,
                search = req.body.search || '',
                age = req.body.age || 'all',
                order = req.body.order || 'high',
                where = {}, sort = {},
                guides, total, heroID, mapID, 
                now = new Date().getTime();
            
            function getHeroID (callback) {
                if (hero === 'all') { return callback(); }
                Schemas.Hero.findOne({ className: hero, active: true })
                .select('_id')
                .exec(function (err, results) {
                    if (err || !results) { return res.json({ success: false }); }
                    heroID = results._id;
                    return callback();
                });
            }
            
            function getMapID (callback) {
                if (map === 'all') { return callback(); }
                Schemas.Map.findOne({ className: map, active: true })
                .select('_id')
                .exec(function (err, results) {
                    if (err || !results) { return res.json({ success: false }); }
                    mapID = results._id;
                    return callback();
                });
            }
            
            function getFilters (callback) {
                // guide type
                if (guideType !== 'all') {
                    where.guideType = guideType;
                }
                
                // hero
                if (hero !== 'all') {
                    if (guideType !== 'map') {
                        where['heroes.hero'] = heroID;
                    } else {
                        where.synergy = heroID;
                    }
                }

                // map
                if (map !== 'all') {
                    where.maps = mapID;
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
                return callback();
            }
            
            // get total guides
            function getTotal (callback) {
                Schemas.Guide.count({ public: true })
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
            
            // get guides
            function getGuides (callback) {
                Schemas.Guide.find({ public: true })
                .select('premium heroes guideType maps slug name description author createdDate comments votesCount')
                .populate([{
                        path: 'author',
                        select: 'username -_id'
                    }, {
                        path: 'heroes.hero',
                        select: 'className'
                    }, {
                        path: 'maps',
                        select: 'className'
                }])
                .where(where)
                .sort(sort)
                .skip((perpage * page) - perpage)
                .limit(perpage)
                .exec(function (err, results) {
                    if (err) { return res.json({ success: false }); }
                    guides = results;
                    return callback();
                });
            }
            
            getHeroID(function () {
                getMapID(function () {
                    getFilters(function () {
                        getGuides(function () {
                            getTotal(function () {
                                return res.json({
                                    success: true,
                                    guides: guides,
                                    total: total,
                                    guideType: guideType,
                                    hero: hero,
                                    map: map,
                                    page: page,
                                    perpage: perpage,
                                    search: search,
                                    age: age,
                                    order: order
                                });
                            });
                        });
                    });
                });
            });
        };
    },
    guidesCommunity: function (Schemas) {
        return function (req, res, next) {
            var hero = req.body.hero || 'all',
                page = req.body.page || 1,
                perpage = req.body.perpage || 10,
                where = {},
                guides, total,
                now = new Date().getTime(),
                weekAgo = new Date(now - (60*60*24*7*1000));
            
            if (hero !== 'all') {
                where.heroes = hero;
            }
            
            where.createdDate = { $gte: weekAgo };
            
            // get total guides
            function getTotal (callback) {
                Schemas.Guide.count({ public: true, featured: false })
                .where(where)
                .exec(function (err, count) {
                    if (err) { return res.json({ success: false }); }
                    total = count;
                    return callback();
                });
            }
            
            // get guides
            function getGuides (callback) {
                Schemas.Guide.find({ public: true, featured: false })
                .where(where)
                .select('premium heroes guideType maps slug name description author createdDate comments votesCount')
                .populate([{
                        path: 'author',
                        select: 'username -_id'
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
            
            getGuides(function () {
                getTotal(function () {
                    return res.json({ success: true, guides: guides, total: total, hero: hero, page: page, perpage: perpage });
                });
            });
        };
    },
    guidesFeatured: function (Schemas) {
        return function (req, res, next) {
            var hero = req.body.hero || 'all',
                page = req.body.page || 1,
                perpage = req.body.perpage || 10,
                where = (hero === 'all') ? {} : { 'heroes': hero },
                guides, total;
            
            // get total guides
            function getTotal (callback) {
                Schemas.Guide.count({ featured: true })
                .where(where)
                .exec(function (err, count) {
                    if (err) { return res.json({ success: false }); }
                    total = count;
                    return callback();
                });
            }
            
            // get guides
            function getGuides (callback) {
                Schemas.Guide.find({ featured: true })
                .where(where)
                .select('premium heroes guideType maps slug name description author createdDate comments votesCount')
                .populate([{
                        path: 'author',
                        select: 'username -_id'
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
            
            getGuides(function () {
                getTotal(function () {
                    return res.json({ success: true, guides: guides, total: total, hero: hero, page: page, perpage: perpage });
                });
            });
        };
    },
    guide: function (Schemas) {
        return function (req, res, next) {
            var slug = req.body.slug;
            Schemas.Guide.findOne({ slug: slug })
            .lean()
            .populate([{
                    path: 'heroes.hero',
                    select: 'name description role heroType universe className talents title'
                },{
                    path: 'author',
                    select: 'username'
                },{
                    path: 'comments',
                    select: '_id author comment createdDate votesCount votes'
            }])
            .exec(function (err, guide) {
                if (err || !guide) { return res.json({ success: false }); }
                
                Schemas.Comment.populate(guide.comments, {
                    path: 'author',
                    select: 'username email'
                }, function (err, comments) {
                    if (err || !comments) { return res.json({ success: false }); }
                    guide.comments = comments;

                    return res.json({
                        success: true,
                        guide: guide
                    });
                });
            });
        };
    },
    guideBuilder: function (Schemas, Util) {
        return function (req, res, next) {
            
        };
    },
    guideEdit: function (Schemas) {
        return function (req, res, next) {

        };
    },
    guideAdd: function (Schemas, Util) {
        return function (req, res, next) {
            
        };
    },
    guideUpdate: function (Schemas, Util) {
        return function (req, res, next) {
            
            
        };
    },
    guideDelete: function (Schemas) {
        return function (req, res, next) {
            var _id = req.body._id;
            Schemas.Guide.findOne({ _id: _id, author: req.user._id }).remove().exec(function (err) {
                if (err) { return res.json({ success: false, errors: { unknown: { msg: 'An unknown error occurred' } } }); }
                return res.json({ success: true });
            });
        };
    },
    guideVote: function (Schemas) {
        return function (req, res, next) {
            var id = req.body._id,
                direction = req.body.direction;
            
            Schemas.Guide.findOne({ _id: id }).select('author votesCount votes').exec(function (err, guide) {
                if (err || !guide || guide.author.toString() === req.user._id) { return res.json({ success: false }); }
                var vote = guide.votes.filter(function (vote) {
                    if (vote.userID.toString() === req.user._id) {
                        return vote;
                    }
                })[0];
                if (vote) {
                    if (vote.direction !== direction) {
                        vote.direction = direction;
                        guide.votesCount = (direction === 1) ? guide.votesCount + 2 : guide.votesCount - 2;
                    }
                } else {
                    guide.votes.push({
                        userID: req.user._id,
                        direction: direction
                    });
                    guide.votesCount += direction;
                }
                
                guide.save(function (err) {
                    if (err) { return res.json({ success: false }); }
                    return res.json({
                        success: true,
                        votesCount: guide.votesCount
                    });
                });
            });
        };
    },
    guideCommentAdd: function (Schemas, mongoose) {
        return function (req, res, next) {
            var guideID = req.body.guideID,
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
            
            // add to guide
            function addComment (callback) {
                Schemas.Guide.update({ _id: guideID }, { $push: { comments: newCommentID } }, function (err) {
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
                    activityType: "guideComment",
                    guide: guideID,
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
    heroes: function (Schemas) {
        return function (req, res, next) {
            function getHeroes (callback) {
                Schemas.Hero.find({ active: true })
                .sort({ name: 1 })
                .exec(function (err, results) {
                    if (err || !results) { res.json({ success: false }); }
                    return callback(results);
                });
            }
            
            getHeroes(function (heroes) {
                return res.json({ success: true, heroes: heroes });
            });
        };
    },
    hero: function (Schemas) {
        return function (req, res, next) {
            var _id = req.body._id;
            
            function getHero (callback) {
                Schemas.Hero.find({ _id: _id, active: true })
                .exec(function (err, results) {
                    if (err || !results) { res.json({ success: false }); }
                    return callback(results);
                });
            }
            
            getHero(function (hero) {
                return res.json({ success: true, hero: hero });
            });
        };
    },
    maps: function (Schemas) {
        return function (req, res, next) {
            function getMaps (callback) {
                Schemas.Map.find({ active: true })
                .sort({ name: 1 })
                .exec(function (err, results) {
                    if (err || !results) { res.json({ success: false }); }
                    return callback(results);
                });
            }
            
            getMaps(function (maps) {
                return res.json({ success: true, maps: maps });
            });
        };
    }
};