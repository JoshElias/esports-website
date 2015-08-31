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
                talents = [],
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
                .lean()
                .select('premium heroes guideType maps slug name description author createdDate comments votesCount')
                .populate([{
                        path: 'author',
                        select: 'username -_id'
                    }, {
                        path: 'heroes.hero',
                        select: 'name className talents'
                    }, {
                        path: 'maps',
                        select: 'name className'
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
            
            getHeroID(function () {
                getMapID(function () {
                    getFilters(function () {
                        getGuides(function () {
                            getTotal(function () {
                                getTalents(function () {
                                    assignTalents(function () {
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
                });
            });
        };
    },
    guidesCommunity: function (Schemas) {
        return function (req, res, next) {
            var filters = req.body.filters || 'all',
                offset = req.body.offset || 0,
                perpage = req.body.perpage || 10,
                where = {},
                guides, total,
                talents = [],
                now = new Date().getTime(),
                weekAgo = new Date(now - (60*60*24*30*1000));
            
            if (filters !== 'all' && filters.length) {
                var dbFilters = (filters instanceof Array) ? { $in: filters } : filters;
                where.$or = [];
                where.$or.push({ 'heroes.hero': dbFilters });
                where.$or.push({ 'maps': dbFilters });
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
                .lean()
                .where(where)
                .select('premium heroes guideType maps slug name description author createdDate comments votesCount')
                .populate([{
                        path: 'author',
                        select: 'username -_id'
                    }, {
                        path: 'heroes.hero',
                        select: 'name className'
                    }, {
                        path: 'maps',
                        select: 'name className'
                }])
                .sort({ votesCount: -1, createdDate: -1 })
                .skip(offset)
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
            
            getGuides(function () {
                getTalents(function () {
                    assignTalents(function () {
                        getTotal(function () {
                            return res.json({ success: true, guides: guides, total: total });
                        });
                    });
                });
            });
        };
    },
    guidesFeatured: function (Schemas) {
        return function (req, res, next) {
            var filters = req.body.filters || 'all',
                offset = req.body.offset || 0,
                perpage = req.body.perpage || 10,
                where = {},
                guides, total,
                talents = [];
            
            if (filters !== 'all' && filters.length) {
                var dbFilters = (filters instanceof Array) ? { $in: filters } : filters;
                where.$or = [];
                where.$or.push({ 'heroes.hero': dbFilters });
                where.$or.push({ 'maps': dbFilters });
            }
            
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
                .lean()
                .where(where)
                .select('premium heroes guideType maps slug name description author createdDate comments votesCount')
                .populate([{
                        path: 'author',
                        select: 'username -_id'
                    }, {
                        path: 'heroes.hero',
                        select: 'name className'
                    }, {
                        path: 'maps',
                        select: 'name className'
                }])
                .sort({ createdDate: -1 })
                .skip(offset)
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
            
            getGuides(function () {
                getTalents(function () {
                    assignTalents(function () {
                        getTotal(function () {
                            return res.json({ success: true, guides: guides, total: total });
                        });
                    });
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
                    path: 'maps',
                    select: 'name description className'
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
    guideEdit: function (Schemas) {
        return function (req, res, next) {
            var slug = req.body.slug,
                userID = req.user._id;
            
            Schemas.Guide.findOne({ slug: slug, author: userID })
            .lean()
            .populate([{
                    path: 'heroes.hero'
            }])
            .exec(function (err, guide) {
                if (err || !guide) { return res.json({ success: false }); }
                
                return res.json({
                    success: true,
                    guide: guide
                });
            });
        };
    },
    guideAdd: function (Schemas, Util, mongoose) {
        return function (req, res, next) {
            var userID = req.user._id,
                guideID = mongoose.Types.ObjectId();
            
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
                        _id: guideID,
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
                    guide: guideID,
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
    guideUpdate: function (Schemas, Util) {
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
            var _id = req.body._id;
            Schemas.Guide.findOne({ _id: _id, author: req.user._id }).remove().exec(function (err) {
                Schemas.Activity.update({ guide: _id }, { exists: false }).exec(function (err) {
                    if (err) { return res.json({ success: false, errors: { unknown: { msg: 'An unknown error occurred' } } }); }
                    return res.json({ success: true });
                });
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
                    createdDate: new Date().toISOString(),
                    comment: newCommentID
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
                .select("-abilities")
                .sort({ name: 1 })
                .exec(function (err, results) {
                    if (err || !results) { return res.json({ success: false }); }
                    return callback(results);
                });
            }
            
            getHeroes(function (heroes) {
                return res.json({ success: true, heroes: heroes });
            });
        };
    },
    heroesList: function (Schemas) {
        return function (req, res, next) {
            function getHeroes (callback) {
                Schemas.Hero.find({ active: true })
                .select('name description role heroType universe title className')
                .sort({ name: 1 })
                .exec(function (err, results) {
                    if (err || !results) { return res.json({ success: false }); }
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
                Schemas.Hero.findOne({ _id: _id, active: true })
                .exec(function (err, results) {
                    if (err || !results) { return res.json({ success: false }); }
                    return callback(results);
                });
            }
            
            getHero(function (hero) {
                return res.json({ success: true, hero: hero });
            });
        };
    },
    heroByClass: function (Schemas) {
        return function (req, res, next) {
            var hero = req.body.hero;
            
            function getHero (callback) {
                Schemas.Hero.findOne({ className: hero, active: true })
                .exec(function (err, results) {
                    if (err || !results) { return res.json({ success: false }); }
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
                    if (err || !results) { return res.json({ success: false }); }
                    return callback(results);
                });
            }
            
            getMaps(function (maps) {
                return res.json({ success: true, maps: maps });
            });
        };
    }
};