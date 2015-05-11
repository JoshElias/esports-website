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
                    select: 'username -_id'
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
            
        };
    },
    guideVote: function (Schemas) {
        return function (req, res, next) {
            
        };
    },
    guideCommentAdd: function (Schemas, mongoose) {
        return function (req, res, next) {
            
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