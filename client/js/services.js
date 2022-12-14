'use strict';

angular.module('app.services', [])
    .service('MetaService', function() {

    var statusCode = undefined;

    var ogType = '';
    var ogUrl = '';
    var ogImage = '';
    var ogTitle = 'They';
    var ogDescription = ''

    var title = '';
    var metaDescription = '';
    var metaKeywords = '';
    return {
        setStatusCode: function (s) {
            statusCode = s;
        },
        setOg: function(newOgUrl, newOgTitle, newOgDescription, newOgType, newOgImage) {
            ogUrl = newOgUrl || 'https://tempostorm.com';
            ogTitle = newOgTitle || 'TempoStorm';
            ogDescription = newOgDescription || 'TempoStorm Official Website.';
            ogType = newOgType || 'website';
            ogImage = newOgImage || '';
        },
        set: function(newTitle, newMetaDescription, newKeywords) {
            metaKeywords = newKeywords;
            metaDescription = newMetaDescription;
            title = newTitle;
        },
        ogMetaType: function() { return ogType; },
        ogMetaUrl: function() { return ogUrl; },
        ogMetaImage: function() {
            if(!ogImage || ogImage == '') {
                return tpl + 'img/100x100tsoglogo.png'
            }
            return ogImage.toLowerCase();
        },
        ogMetaTitle: function(){ return ogTitle; },
        ogMetaDescription: function() { return ogDescription.replace(/<\/?[^>]+(>|$)/g, ""); },
        metaTitle: function(){ return (title + ' - TempoStorm'); },
        metaDescription: function() { return metaDescription; },
        metaKeywords: function() { return metaKeywords; },
        getStatusCode: function() { return statusCode; }
    }
})
    .factory('CrudMan', [
        function () {
            //    var arrs = {};
            var crud = {
                exists  : [],
                toDelete: [],
                toWrite: [] //toWrite holds both items to create and items to update and we can check against what's in exists to determine whether or not we need to create or update
            }
            var e = 'exists';
            var d = 'toDelete';
            var w = 'toWrite';

            var CrudMan = function () {
                var arrs = {};

                function getArrs () {
                    return arrs;
                }

                function find (item, arrName, crud) {
                    return _.find(arrs[arrName][crud], function (val) { return val == item });
                }

                function createArr (arrName) {
                    arrs[arrName] = angular.copy(crud);
                }

                function setExists (inArr, arrName) {
                    if (!arrs[arrName]) {
                        this.createArr(arrName);
                    }

                    _.each(inArr, function (val) { arrs[arrName].exists.push(angular.copy(val)); });
                }

                function removeFromArr (item, arrName, crud) {
                    var arr = arrs[arrName];
                    var idx = arr[crud].indexOf(item);

                    arr[crud].splice(idx, 1);
                }

                function addToDelete (item, arrName) {
                    var arr = arrs[arrName];

                    if (find(item, arrName, w)) {
                        var idx = arr[w].indexOf(item);

                        arr[w].splice(idx, 1);
                    }

                    if (!find(item, arrName)) {
                        arr[d].push(item);
                    }
                }

                function addToArr (item, arrName) {
                    var arr = arrs[arrName];

                    if (find(item, arrName)) {
                        var idx = arr[d].indexOf(item);

                        arr[d].splice(idx, 1);
                    }

                    if (!find(item, arrName)) {
                        arr[w].push(item);
                    }
                }

                function toggleItem (item, arrName) {
                    if (find(item, arrName, e)) {
                        arrs[arrName][d].push(item);
                    } else if (find(item, arrName, w)) {
                        removeFromArr(item, arrName, w);
                    } else {
                        addToArr(item, arrName, w);
                    }
                }

                return {
                    setExists: setExists,
                    toggle: toggleItem,
                    add: addToArr,
                    delete: addToDelete,
                    createArr: createArr,
                    getArrs: getArrs
                }
            }

            return CrudMan();
        }
    ])
    .factory('AuthenticationService', function() {
        var loggedIn = false,
        admin = false,
        provider = false;

    return {
        isLogged: function () {
            return loggedIn;
        },
        setLogged: function (value) {
            loggedIn = value;
        },
        isAdmin: function () {
            return admin;
        },
        setAdmin: function (value) {
            admin = value;
        },
        isProvider: function () {
            return provider;
        },
        setProvider: function (value) {
            provider = value;
        }
    }
})
    .factory('UserRoleService', function () {
        return {
            roles: undefined,
            setRoles: function (roles) {
                this.roles = (!_.isUndefined(roles.isInRoles)) ? roles.isInRoles : roles;
            },
            getRoles: function () {
                return this.roles;
            }
        }
    })
    .factory('LoginService', ['$state', '$cookies', 'User', 'EventService', 'LoopBackAuth', function ($state, $cookies, User, EventService, LoopBackAuth) {
        return {
            login: function (email, password, remember, cb) {
                var options = { rememberMe: remember }
                var where = { email: email, password: password }
                var callback = function (err, data) {
                    return (cb != undefined) ? cb(err, data) : null;
                }

                User.login(options, where)
                    .$promise
                    .then(function (data) {

                    var user = data.user;

                    EventService.emit("EVENT_LOGIN", user);
                    return callback(null, data);
                })
                    .catch(function (err) {
                    return callback(err);
                });
            },
            logout: function (cb) {
                var callback = function (err) {
                    return (cb != undefined) ? cb(err) : null;
                }

                User.logout()
                    .$promise
                    .then(function () {
                    EventService.emit("EVENT_LOGOUT");

                    var state = $state.current;
                    var access = state.access;
                    if (access !== undefined && (access.auth || access.admin)) {
                        $state.go('app.login');
                    }

                })
                    .catch(function(err) {
                    console.log("error logging out:", err);
                })
                    .finally(function () {
                    LoopBackAuth.clearUser();
                    LoopBackAuth.clearStorage();

                    return callback();
                });


            },
            thirdPartyRedirect: function (path, provider) {
                var redirectObj = {
                    name: $state.current.name,
                    params: $state.params
                }
                $cookies.put("redirectStateString", JSON.stringify(redirectObj));
                window.location.replace("/"+path+"/"+provider);
            }
        }
    }])
    .factory('SubscriptionService', ['$http', function ($http) {
        var isSubscribed = false,
            tsPlan = false,
            expiry = false;

        return {
            isSubscribed: function () {
                var now = new Date().getTime();

                if (isSubscribed) { return true; }
                if (expiry) {
                    return (expiry > now);
                } else {
                    return false;
                }
            },
            getSubscription: function () {
                return {
                    isSubscribed: isSubscribed,
                    tsPlan: tsPlan,
                    expiry: expiry
                };
            },
            setSubscribed: function (value) {
                isSubscribed = value;
            },
            setTsPlan: function (value) {
                tsPlan = value;
            },
            setExpiry: function (value) {
                expiry = (value) ? new Date(value).getTime(): value;
            }
        };
    }])
    .factory('UserService', ['$http', '$compile', function($http, $compile) {
        return {
            login: function (email, password) {
                return $http.post('/login', { email: email, password: password });
            },

            signup: function (email, username, password, cpassword) {
                return $http.post('/signup', {
                    email: email,
                    username: username,
                    password: password,
                    cpassword: cpassword
                });
            },

            forgotPassword: function (email) {
                return $http.post('/forgot-password', { email: email });
            },

            resetPassword: function (email, code, password, cpassword) {
                return $http.post('/forgot-password/reset', { email: email, code: code, password: password, cpassword: cpassword });
            },

            verifyEmail: function (email, code) {
                return $http.post('/verify', { email: email, code: code });
            },

            verify: function () {
                return $http.post('/api/verify', {});
            },

            twitch: function () {
                return $http.post('/auth/twitch', {});
            },

            logout: function () {
            }
        }
    }])
    .factory('LoginModalService', ['$rootScope', '$compile', 'AlertService', function ($rootScope, $compile, AlertService) {
        var box = undefined;
        return {
            showModal: function (state, callback) {
                $rootScope.LoginModalService.callback = callback;
                $rootScope.LoginModalService.state = state;

                box = bootbox.dialog({
                    title: function() {
                        switch(state) {
                            case 'login':  return "User Login" ; break;
                            case 'signup': return "User Signup"; break;
                            case 'forgot': return "Forgot Password"; break;
                            case 'verify': return "Verify Email"; break;
                            default:       return "User Login"; break;
                        }
                    },
                    className: 'login-modal',
                    message: $compile('<login-modal callback="LoginModalService.callback()"></login-modal>')($rootScope)
                });
                box.on('hide.bs.modal', function () {
                    $(".app").removeClass("backdrop-blur");
                    AlertService.reset();
                });

                box.modal('show');

                $(".app").addClass("backdrop-blur");
            },
            hideModal: function () {
                if (box) {
                    box.modal('hide');
                }
            }
        }
    }])
    .factory('ArticleService', ['$http', '$q', function ($http, $q) {
        return {
            getArticles: function (articleType, filter, offset, num, search) {
                var d = $q.defer(),
                    articleType = articleType || 'all',
                    filter = filter || 'all',
                    offset = offset || 0,
                    num = num || 20,
                    search = search || '';

                $http.post('/articles', { articleType: articleType, filter: filter, offset: offset, num: num, search: search }).success(function (data) {
                    d.resolve(data);
                });
                return d.promise;
            },
            getArticle: function (slug) {
                var d = $q.defer();
                $http.post('/article', { slug: slug }).success(function (data) {
                    d.resolve(data);
                });
                return d.promise;
            },
            addComment: function (article, comment) {
                return $http.post('/api/article/comment/add', { articleID: article._id, comment: comment });
            }
        };
    }])
    .factory('AdminSnapshotService', ['$http', '$q', function($http, $q) {
        return {
            getSnapshots: function (page, perpage, search) {
                var page = page || 1,
                    perpage = perpage || 10,
                    search = search || '';

                var d = $q.defer();
                $http.post('/api/admin/snapshots', { page: page, perpage: perpage, search: search }).success(function (data) {
                    d.resolve(data);
                });
                return d.promise;
            },
            getSnapshot: function (_id) {
                var d = $q.defer();
                $http.post('/api/admin/snapshot', { _id: _id }).success(function (data) {
                    d.resolve(data);
                })
                return d.promise;
            },
            getLatest: function () {
                var d = $q.defer();
                $http.post('/api/admin/snapshot/latest', {}).success(function (data) {
                    d.resolve(data);
                })
                return d.promise;
            },
            addSnapshot: function (snapshot) {
                return $http.post('/api/admin/snapshot/add', snapshot);
            },
            editSnapshot: function (snapshot) {
                return $http.post('/api/admin/snapshot/edit', snapshot);
            },
            deleteSnapshot: function (_id) {
                var d = $q.defer();
                $http.post('/api/admin/snapshot/delete', { _id: _id }).success(function (data) {
                    d.resolve(data);
                });
                return d.promise;
            }
        }
    }])
    .factory ('SnapshotService', ['$http', '$q', '$localStorage', function ($http, $q, $localStorage) {
        return {
            getSnapshots: function (page, perpage, search) {
                var d = $q.defer(),
                    page = page || 1,
                    perpage = perpage || 10,
                    search = search || '';

                $http.post('/snapshots', { page: page, perpage: perpage, search: search }).success(function (data) {
                    d.resolve(data);
                });

                return d.promise;
            },
            getSnapshot: function (slug) {
                var d = $q.defer();
                $http.post('/snapshot', {slug: slug}).success(function (data) {
                    d.resolve(data);
                });

                return d.promise;
            },
            getLatest: function () {
                var d = $q.defer();
                $http.post('/snapshot/latest', {}).success(function (data) {
                    d.resolve(data);
                });

                return d.promise;
            },
            addComment: function (snapshot, comment) {
                return $http.post('/api/snapshot/comment/add', { snapshotID: snapshot._id, comment: comment });
            },
            vote: function (snapshot) {
                return $http.post('/api/snapshot/vote', { snapshot: snapshot });
            },
            setStorage: function (isOpen) {
                return $localStorage['metaCom-'] = isOpen;
            },
            getStorage: function () {
                return $localStorage['metaCom-'];
            }
        }
    }])
    .service('HOTSSnapshot', ['HotsSnapshot', 'SnapshotAuthor', 'HeroTier', 'GuideTier', 'GuideTierTalent', 'Util',
        function (HotsSnapshot, SnapshotAuthor, HeroTier, GuideTier, GuideTierTalent, Util) {

            var defaultSnapshot = {
                snapNum: 0,
                title: "default title",
                intro: "default intro",
                thoughts: "default thoughts",
                slugs: [
                    {
                        linked: true,
                        slug: "default slug"
                    }
                ],
                authors: [],
                heroTiers: [],
                isActive: false,
                createdDate: undefined,
                comments: []
            };
            var defaultAuthor = {
                description: "",
                expertClasses: [],
                hotsSnapshotId: "",
                authorId: ""
            };
            var defaultGuideTier = {
                heroTierId: "",
                guideId: "",
                orderNum: 0
            };
            var defaultCrud = {
                exists: [],
                toDelete: [],
                toWrite: []
            };
            var exists = new Object();

            var HOTSSnapshot = function (snapshot) {
                if (!snapshot) {
                    snapshot = angular.copy(defaultSnapshot);
                }

                if (snapshot.heroTiers) {
                    snapshot.heroTiers = _.sortBy(snapshot.heroTiers, function (val) { return val.orderNum });
                }

                this.load(snapshot);
            };

            HOTSSnapshot.prototype.load = function (snapshot) {
                exists['authors'] = angular.copy(defaultCrud);
                exists['heroTiers'] = angular.copy(defaultCrud);
                exists['guideTiers'] = angular.copy(defaultCrud);
                exists['guideTierTalents'] = angular.copy(defaultCrud);

                this.snapNum       = snapshot.snapNum;
                this.title         = snapshot.title;
                this.intro         = snapshot.intro;
                this.thoughts      = snapshot.thoughts;
                this.slugs         = snapshot.slugs;
                this.authors       = snapshot.authors;
                this.heroTiers     = snapshot.heroTiers;
                this.isActive      = snapshot.isActive;
                this.createdDate   = snapshot.createdDate;
                this.comments      = snapshot.comments;
                this.isCommentable = snapshot.isCommentable;
                this.tiers         = new Array();

                if(!!snapshot.id) {
                    this.id = snapshot.id;

                    exists['authors'].exists = angular.copy(this.authors);
                    exists['heroTiers'].exists = angular.copy(this.heroTiers);
                }
            };

            //begin method definitions
            HOTSSnapshot.prototype.addTier = function () {
                var tier = {
                    heroes: [],
                    tier: this.tiers.length + 1
                };

                this.tiers.push(tier);
            };

            HOTSSnapshot.prototype.buildTiers = function () {
                var heroTiers = this.heroTiers;
                var tiers = angular.copy(this.tiers);
                var largestTier = tiers.length;

                if (!!heroTiers) {
                    var newTiers = [];

                    _.each(heroTiers, function (heroTier, idx) {
                        heroTier.orderNum = idx;

                        if (heroTier.tier > largestTier)
                            largestTier = heroTier.tier;
                    });

                    for (var i = 0; i < largestTier; i++) {
                        var newTier = {
                            heroes: [],
                            tier: newTiers.length + 1
                        };

                        newTiers.push(newTier);
                    }

                    for (var i = 0; i < heroTiers.length; i++) {
                        var item = heroTiers[i];

                        newTiers[item.tier - 1].heroes.push(item);
                    }

                    for (var i = 0; i < newTiers.length; i++) {
                        if (!this.tiers[i])
                            this.addTier();

                        this.tiers[i].heroes = newTiers[i].heroes;
                    }

                    // this.tiers = newTiers;
                }
            };

            HOTSSnapshot.prototype.newHero = function (obj) {
                var hero = {
                    summary      : obj.summary,
                    tier         : obj.tier,
                    previousTier : obj.previousTier,
                    hero         : obj.hero,
                    burstScore   : obj.burstScore,
                    pushScore    : obj.pushScore,
                    surviveScore : obj.surviveScore,
                    scaleScore   : obj.scaleScore,
                    utilityScore : obj.utilityScore,
                    orderNum     : obj.orderNum,
                    guideTierId  : obj.guideTierId,
                    heroId       : obj.heroId,
                    snapshotId   : obj.snapshotId
                };

                this.heroTiers.push(hero);
            };

            HOTSSnapshot.prototype.newAuthor = function (obj) {
                var author = {
                    description: obj.description,
                    expertClasses: obj.expertClasses,
                    hotsSnapshotId: obj.hotsSnapshotId,
                    authorId: obj.authorId,
                    user: obj.user,
                    orderNum: obj.orderNum
                };

                this.authors.push(author);
            };

            HOTSSnapshot.prototype.addGuideToHero = function (hero, guide) {
                var that = this;
                var tierGuide = angular.copy(defaultGuideTier);
                tierGuide['guide'] = guide;
                tierGuide['guideId'] = guide.id;
                tierGuide['heroTierId'] = hero.id || "";

                console.log(hero.guides);

                //this is temporary until we decide to enable multiple guides per hero
                if (hero.guides && hero.guides.length > 0 && hero.guides[0].id) {
                    _.each(hero.guides, function (tierGuide) {
                        that.removeGuideFromHero(tierGuide.id, hero.id);
                    });
                }

                if (!hero.guides)
                    hero.guides = [];

                hero.guides.push(tierGuide);
            };

            HOTSSnapshot.prototype.removeTier = function (tier) {
                var that = this;
                var heroes = this.heroTiers;
                var tiers = this.tiers;
                var tierToRemove = tier;

                if (typeof tier == "number") {
                    tierToRemove = _.find(tiers, function (fTier) {
                        return tier == fTier.tier;
                    });
                }

                _.each(tierToRemove.heroes, function (hero) {
                    return that.removeHero(hero);
                });

                _.each(heroes, function (hero) {
                    var heroTier = hero.tier;

                    if (heroTier > tier)
                        hero.tier = heroTier - 1;
                });

                tiers.splice(tiers.length-1, 1);
            };

            HOTSSnapshot.prototype.removeHero = function (hero) {
                var that = this;

                _.each(hero.guides, function (guide) {
                    that.removeGuideFromHero(guide.id, hero.id);
                });

                if (hero.id)
                    exists.heroTiers.toDelete.push(hero);

                this.heroTiers.splice(this.heroTiers.indexOf(hero),1);
            };

            HOTSSnapshot.prototype.removeGuideFromHero = function (guideId, heroId) {
                var hero = _.find(this.heroTiers, function (h) {
                    return h.heroId == heroId || h.id == heroId;
                });

                var guide = _.find(hero.guides, function (g) {
                    return g.guideId == guideId || g.id == guideId;
                });

                if (guide.id)
                    exists.guideTiers.toDelete.push(guide);

                hero.guides = _.difference(hero.guides, [guide]);
            };

            HOTSSnapshot.prototype.removeAuthor = function (obj) {
                var authors = this.authors;

                this.authors = _.difference(authors, [obj]);

                if(!!obj.id)
                    exists.authors.toDelete.push(obj);
            };

            HOTSSnapshot.prototype.newTier = function () {

                this.tiers.push();
            };

            HOTSSnapshot.prototype.submit = function (cb) {
                var arrs = exists;
                var snapshot = angular.copy(this);

                if (!snapshot.id)
                    snapshot.createdDate = new Date().toISOString();

                //clean slug before submitting so we don't end up with things like meta-snapshot-meta-snapshot
                //in the slug field
                // snapshot.slugs[0].slug = Util.slugify(snapshot.title);

                snapshot.slugOptions = {
                    slug: snapshot.slugs[0].slug,
                    linked: false
                };

                //build our crudman toWrite arrays
                _.each(arrs, function (arr, key) {
                    var exists  = arr.exists;
                    var toWrite = arr.toWrite;

                    _.each(snapshot[key], function (val) {
                        var diff =  _.find(exists, function (eVal) {
                            var valStr = JSON.stringify(val);
                            var eValStr = JSON.stringify(eVal);

                            return valStr == eValStr;
                        });

                        if (!diff) {
                            toWrite.push(val);
                        }
                    });
                });
                
                //clean our snapshot object so that our request isn't larger than 1mb
                var cleanSnap = Util.cleanObj(snapshot, [
                    'createDate',
                    'id',
                    'intro',
                    'isActive',
                    'isCommentable',
                    'slugOptions',
                    'slug',
                    'snapNum',
                    'thoughts',
                    'title'
                ]);

                async.waterfall([
                    function (seriesCb) {
                        HotsSnapshot.upsert(cleanSnap)
                        .$promise
                        .then(function (data) {

                            //gross, kill me pls
                            if (data._id) {
                                data.id = data._id;
                                delete data._id;
                            }

                            return seriesCb(undefined, data);
                        })
                        .catch(seriesCb);
                    }, function (newSnapshot, seriesCb) {
                        var authors = arrs.authors;
                        var hotsSnapshotId = newSnapshot.id;

                        async.forEach(authors.toWrite, function (author, eachCb) {
                            author.hotsSnapshotId = hotsSnapshotId;

                            SnapshotAuthor.upsert(author)
                            .$promise
                            .then(function (data) {
                                console.log('successfully submitted author:', data);
                                return eachCb(undefined);
                            })
                            .catch(function (err) {
                                console.log(err);

                                return eachCb(err);
                            })
                        }, function () {
                            //if (err)
                                //TODO ERR HANDLING

                            return seriesCb(undefined, newSnapshot);
                        });
                    }, function (newSnapshot, seriesCb) {
                        var heroTiers = arrs.heroTiers;
                        var snapshotId = newSnapshot.id;
                        var tierGuides = [];

                        async.forEach(heroTiers.toWrite, function (heroTier, eachCb) {
                            heroTier.snapshotId = snapshotId;

                            HeroTier.upsert(heroTier)
                            .$promise
                            .then(function (data) {
                                console.log('successfully submitted heroTier: ', data);
                                _.each(heroTier.guides, function (guide) {
                                    if (!guide.heroTierId)
                                        guide.heroTierId = data.id;

                                    if (guide.guide.isPublic && !guide.slug)
                                        guide.slug = guide.guide.slugs[0];
                                });

                                if (heroTier.guides && heroTier.guides.length)
                                    tierGuides.push(heroTier.guides);

                                return eachCb(undefined);
                            });
                        }, function (err) {
                            //if (err)
                                //TODO ERR HANDLING

                            return seriesCb(undefined, tierGuides);
                        });
                    }, function (tierGuides, seriesCb) {
                        var guides = _.flatten(tierGuides);
                        
                        async.forEach(guides, function (guide, eachCb) {
                            var tempGuide = guide.guide;
                            delete guide.guide;

                            GuideTier.upsert(guide)
                            .$promise
                            .then(function (guideTier) {
                                var guideTalents = tempGuide.guideTalents;

                                _.each(guideTalents, function (guideTalent) {
                                    var toPush = {
                                        tier: guideTalent.tier,
                                        guideTierId: guideTier.id,
                                        talentId: guideTalent.talentId
                                    };

                                    exists['guideTierTalents'].toWrite.push(toPush);
                                });

                                return eachCb(undefined);
                            });
                        }, seriesCb);

                    }, function (seriesCb) {
                        var guideTalents = exists['guideTierTalents'].toWrite;

                        async.forEach(guideTalents, function (guideTalent, forEachCb) {
                            GuideTierTalent.upsert(guideTalent)
                            .$promise
                            .then(function () {
                                return forEachCb();
                            })
                            .catch(forEachCb);
                        }, seriesCb);
                    }, function (seriesCb) {
                        var objs = {
                            guideTiers: GuideTier,
                            heroTiers: HeroTier,
                            authors: SnapshotAuthor,
                            guideTierTalents: GuideTierTalent
                        };

                        async.forEachOf(objs, function (obj, key, forEachCb) {
                            async.forEach(arrs[key].toDelete, function (toDelete, eachCb) {
                                obj.deleteById({
                                    id: toDelete.id
                                })
                                .$promise
                                .then(function () {
                                    console.log('delete ' + key);
                                    return eachCb();
                                })
                                .catch(function (e) {
                                    if(e.status == 404) {
                                        console.error("An error occured:");
                                        console.error(e);
                                        console.error("Continuing...");

                                        return eachCb();
                                    }

                                    return eachCb(e);
                                });
                            }, forEachCb);
                        }, seriesCb);
                    }
                ], function (err) {
                    if (err) {
                        exists['authors'].toWrite = [];
                        exists['heroTiers'].toWrite = [];
                        exists['guideTiers'].toWrite = [];
                        exists['guideTierTalents'].toWrite = [];

                        return cb(err);
                    }

                    return cb(undefined);
                });
            };

            return function (snapshot) { return new HOTSSnapshot(snapshot); }
        }
    ])
    .factory('AdminTeamService', ['$http', '$q', function ($http, $q) {
        return {
            getMembers: function () {
                var d = $q.defer();
                $http.post('/api/admin/teams').success(function (data) {
                    d.resolve(data);
                });
                return d.promise;
            },
            getMember: function (id) {
                var d = $q.defer();
                $http.post('/api/admin/team', { _id: id }).success(function (data) {
                    d.resolve(data);
                });
                return d.promise;
            },
            addMember: function (member) {
                var d = $q.defer();
                $http.post('/api/admin/team/add', { member: member }).success(function (data) {
                    d.resolve(data);
                });
                return d.promise;
            },
            editMember: function (member) {
                var d = $q.defer();
                $http.post('/api/admin/team/edit', { member: member }).success(function (data) {
                    d.resolve(data);
                });
                return d.promise;
            },
            deleteMember: function (member) {
                var d = $q.defer();
                $http.post('/api/admin/team/remove', { member: member }).success(function (data) {
                    d.resolve(data);
                });
                return d.promise;
            },
            updateOrder: function (arr) {
                $http.post('/api/admin/team/order', { members: arr })
            }
        }
    }])
    .factory('ProfileService', ['$http', '$q', function ($http, $q) {
        return {
            //        loadActivities: function (length) {
            //            var d = $q.defer();
            //            $http.post('/profile/' + username + '/activity/load', { length: length }).success(function (data) {
            //                d.resolve(data);
            //            });
            //            return d.promise;
            //        },
            getUserProfile: function (username) {
                var d = $q.defer();
                $http.post('/api/profile/' + username, {}).success(function (data) {
                    d.resolve(data);
                });
                return d.promise;
            },
            getProfile: function (username) {
                var d = $q.defer();
                $http.post('/profile/' + username, {}).success(function (data) {
                    d.resolve(data);
                });
                return d.promise;
            },
            getActivity: function (username, length, page, perpage) {
                var d = $q.defer(),
                    page = page || 1,
                    perpage = perpage || 20;
                $http.post('/profile/' + username + '/activity', { length: length, page: page, perpage: perpage }).success(function (data) {
                    d.resolve(data);
                });
                return d.promise;
            },
            getArticles: function (username, page, perpage) {
                var d = $q.defer(),
                    page = page || 1,
                    perpage = perpage || 20;
                $http.post('/profile/' + username + '/articles', { page: page, perpage: perpage }).success(function (data) {
                    d.resolve(data);
                });
                return d.promise;
            },
            getDecks: function (username, page, perpage) {
                var d = $q.defer(),
                    page = page || 1,
                    perpage = perpage || 20;
                $http.post('/profile/' + username + '/decks', { page: page, perpage: perpage }).success(function (data) {
                    d.resolve(data);
                });
                return d.promise;
            },
            getDecksLoggedIn: function (username, page, perpage) {
                var d = $q.defer(),
                    page = page || 1,
                    perpage = perpage || 20;
                $http.post('/api/profile/' + username + '/decks', { page: page, perpage: perpage }).success(function (data) {
                    d.resolve(data);
                });
                return d.promise;
            },
            getGuides: function (username, page, perpage) {
                var d = $q.defer(),
                    page = page || 1,
                    perpage = perpage || 20;
                $http.post('/profile/' + username + '/guides', { page: page, perpage: perpage }).success(function (data) {
                    d.resolve(data);
                });
                return d.promise;
            },
            getGuidesLoggedIn: function (username, page, perpage) {
                var d = $q.defer(),
                    page = page || 1,
                    perpage = perpage || 20;
                $http.post('/api/profile/' + username + '/guides', { page: page, perpage: perpage }).success(function (data) {
                    d.resolve(data);
                });
                return d.promise;
            },
            updateProfile: function (user) {
                return $http.post('/api/profile/edit', user);
            },
            changeEmail: function (code) {
                var d = $q.defer(),
                    code = code || false;
                $http.post('/api/profile/changeEmail', { code: code }).success(function (data) {
                    d.resolve(data);
                });
                return d.promise;
            },
            updateEmail: function (code) {
                var d = $q.defer(),
                    code = code || false;
                $http.post('/api/profile/updateEmail', { code: code }).success(function (data) {
                    d.resolve(data);
                });
                return d.promise;
            }
        };
    }])
    .factory('AuthInterceptor', ['$q', '$cookies', 'LoopBackAuth', function ($q, $cookies, LoopBackAuth) {
        return {
            responseError: function(rejection) {
                if(rejection.status == 401) {
                    console.log(" triggered reponse error interceptor")
                    // Clearing the loopback values from the client browser for safe
                    LoopBackAuth.clearUser();
                    LoopBackAuth.clearStorage();
                }
                return $q.reject(rejection);
            }
        }

        function getAuthCookie(key) {
            var value = $cookies.get(key);
            if(typeof value == "undefined")
                return undefined;

            var valueElements = value.split(":");
            var cleanCookie = valueElements[1];
            valueElements = cleanCookie.split(".");
            valueElements.splice(-1, 1);
            cleanCookie = valueElements.join(".");
            return cleanCookie;
        }
    }])
    .factory('AdminCardService', ['$http', '$q', function ($http, $q) {
        return {
            getCards: function () {
                var d = $q.defer();
                $http.post('/api/admin/cards', {}).success(function (data) {
                    d.resolve(data);
                });
                return d.promise;
            },
            getDeckableCards: function () {
                var d = $q.defer();
                $http.post('/api/admin/cards/deckable', {}).success(function (data) {
                    d.resolve(data);
                });
                return d.promise;
            },
            getCard: function (_id) {
                var d = $q.defer();
                $http.post('/api/admin/card', { _id: _id }).success(function (data) {
                    d.resolve(data);
                });
                return d.promise;
            },
            addCard: function (card) {
                return $http.post('/api/admin/card/add', card);
            },
            deleteCard: function (_id) {
                var d = $q.defer();
                $http.post('/api/admin/card/delete', { _id: _id }).success(function (data) {
                    d.resolve(data);
                });
                return d.promise;
            },
            editCard: function (card) {
                return $http.post('/api/admin/card/edit', card);
            }
        };
    }])
    .factory('AlertService', function () {
    var success = {};
    var error = {};
    var alert = false;
    var persist = false;

    return {
        getPersist: function () {
            return persist;
        },
        setPersist: function (value) {
            persist = value;
        },
        getSuccess: function () {
            return success;
        },
        setSuccess: function (value) {
            this.reset();
            (value.persist !== undefined) ? this.setPersist(value.persist) : null;
            success = value;
            alert = value.show
        },
        getError: function () {
            return error;
        },
        setError: function (value) {
            this.reset();
            error = value;
            alert = value.show;
            (value.persist !== undefined) ? this.setPersist(value.persist) : null;

            // array of errors
            //			console.log('errorList:', value.errorList);
            //			console.log('lbErr:', value.lbErr);
            var errorList = [];
            value.errorList ? errorList = value.errorList : errorList = [];
            if (value.lbErr
                && value.lbErr.data
                && value.lbErr.data.error
                && value.lbErr.data.error.details
                && value.lbErr.data.error.details.messages) {
                var errMsgs = value.lbErr.data.error.details.messages;
                angular.forEach(errMsgs, function(errArr) {
                    angular.forEach(errArr, function(errMsg) {
                        errorList.push(errMsg);
                    });
                });
                // attach lb errors to error object
            } else if (value.lbErr
                       && value.lbErr.data
                       && value.lbErr.data.error
                       && value.lbErr.data.error.message) {
                errorList.push(value.lbErr.data.error.message);
            }
            error.errorList = errorList;
            //			console.log('error.errorList:', error.errorList);
        },
        reset: function () {
            success = {};
            error = {};
            alert = false;
        },
        hasAlert: function () {
            return alert;
        },
        setShow: function(showVal) {
            alert = showVal;
        },
        getShow: function() {
            return alert;
        }
    }
})
    .factory('AdminArticleService', ['$http', '$q', function ($http, $q) {
        return {
            articleTypes: function () {
                return [

                ];
            },
            getAllArticles: function () {
                var d = $q.defer();
                $http.post('/api/admin/articles/all', {}).success(function (data) {
                    d.resolve(data);
                });
                return d.promise;
            },
            getArticles: function (page, perpage, search) {
                var page = page || 1,
                    perpage = perpage || 50,
                    search = search || '',
                    d = $q.defer();
                $http.post('/api/admin/articles', { page: page, perpage: perpage, search: search }).success(function (data) {
                    d.resolve(data);
                });
                return d.promise;
            },
            getArticle: function (_id) {
                var d = $q.defer();
                $http.post('/api/admin/article', { _id: _id }).success(function (data) {
                    d.resolve(data);
                });
                return d.promise;
            },
            addArticle: function (article) {
                return $http.post('/api/admin/article/add', article);
            },
            editArticle: function (article) {
                return $http.post('/api/admin/article/edit', article);
            },
            deleteArticle: function (_id) {
                var d = $q.defer();
                $http.post('/api/admin/article/delete', { _id: _id }).success(function (data) {
                    d.resolve(data);
                });
                return d.promise;
            },
            getNames: function(article) {
                return $http.post('/api/admin/article/names', article);
            }
        }
    }])
    .factory('AdminDeckService', ['$http', '$q', function ($http, $q) {
        return {
            getAllDecks: function () {
                var d = $q.defer();
                $http.post('/api/admin/decks/all', {}).success(function (data) {
                    d.resolve(data);
                });
                return d.promise;
            },
            getDecks: function (page, perpage, search) {
                var d = $q.defer(),
                    page = page || 1,
                    perpage = perpage || 50,
                    search = search || '';

                $http.post('/api/admin/decks', { page: page, perpage: perpage, search: search }).success(function (data) {
                    d.resolve(data);
                });
                return d.promise;
            },
            getDeck: function (_id) {
                var d = $q.defer();
                $http.post('/api/admin/deck', { _id: _id }).success(function (data) {
                    d.resolve(data);
                });
                return d.promise;
            },
            addDeck: function (deck) {
                return $http.post('/api/admin/deck/add', deck);
            },
            editDeck: function (deck) {
                return $http.post('/api/admin/deck/edit', deck);
            },
            deleteDeck: function (_id) {
                var d = $q.defer();
                $http.post('/api/admin/deck/delete', { _id: _id }).success(function (data) {
                    d.resolve(data);
                });
                return d.promise;
            }
        }
    }])
    .factory('AdminHeroService', ['$http', '$q', function ($http, $q) {
        return {
            getHeroes: function (page, perpage, search) {
                var d = $q.defer(),
                    page = page || 1,
                    perpage = perpage || 50,
                    search = search || '';

                $http.post('/api/admin/heroes', { page: page, perpage: perpage, search: search }).success(function (data) {
                    d.resolve(data);
                });
                return d.promise;
            },
            getAllHeroes: function () {
                var d = $q.defer();
                $http.post('/api/admin/heroes/all', {}).success(function (data) {
                    d.resolve(data);
                });
                return d.promise;
            },
            getHero: function (_id) {
                var d = $q.defer();
                $http.post('/api/admin/hero', { _id: _id }).success(function (data) {
                    d.resolve(data);
                });
                return d.promise;
            },
            addHero: function (hero) {
                return $http.post('/api/admin/hero/add', hero);
            },
            editHero: function (hero) {
                return $http.post('/api/admin/hero/edit', hero);
            },
            deleteHero: function (_id) {
                var d = $q.defer();
                $http.post('/api/admin/hero/delete', { _id: _id }).success(function (data) {
                    d.resolve(data);
                });
                return d.promise;
            }
        }
    }])
    .factory('AdminMapService', ['$http', '$q', function ($http, $q) {
        return {
            getMaps: function (page, perpage, search) {
                var d = $q.defer(),
                    page = page || 1,
                    perpage = perpage || 50,
                    search = search || '';

                $http.post('/api/admin/maps', { page: page, perpage: perpage, search: search }).success(function (data) {
                    d.resolve(data);
                });
                return d.promise;
            },
            getAllMaps: function () {
                var d = $q.defer();
                $http.post('/api/admin/maps/all', {}).success(function (data) {
                    d.resolve(data);
                });
                return d.promise;
            },
            getMap: function (_id) {
                var d = $q.defer();
                $http.post('/api/admin/map', { _id: _id }).success(function (data) {
                    d.resolve(data);
                });
                return d.promise;
            },
            addMap: function (map) {
                return $http.post('/api/admin/map/add', map);
            },
            editMap: function (map) {
                return $http.post('/api/admin/map/edit', map);
            },
            deleteMap: function (_id) {
                var d = $q.defer();
                $http.post('/api/admin/map/delete', { _id: _id }).success(function (data) {
                    d.resolve(data);
                });
                return d.promise;
            }
        }
    }])
    .factory('AdminHOTSGuideService', ['$http', '$q', function ($http, $q) {
        return {
            getAllGuides: function () {
                var d = $q.defer();
                $http.post('/api/admin/guides/all', {}).success(function (data) {
                    d.resolve(data);
                });
                return d.promise;
            },
            getGuides: function (page, perpage, search) {
                var d = $q.defer(),
                    page = page || 1,
                    perpage = perpage || 50,
                    search = search || '';

                $http.post('/api/admin/guides', { page: page, perpage: perpage, search: search }).success(function (data) {
                    d.resolve(data);
                });
                return d.promise;
            },
            getGuide: function (_id) {
                var d = $q.defer();
                $http.post('/api/admin/guide', { _id: _id }).success(function (data) {
                    d.resolve(data);
                });
                return d.promise;
            },
            addGuide: function (guide) {
                return $http.post('/api/admin/guide/add', guide);
            },
            editGuide: function (guide) {
                return $http.post('/api/admin/guide/edit', guide);
            },
            deleteGuide: function (_id) {
                var d = $q.defer();
                $http.post('/api/admin/guide/delete', { _id: _id }).success(function (data) {
                    d.resolve(data);
                });
                return d.promise;
            }
        }
    }])
    .factory('AdminUserService', ['$http', '$q', function ($http, $q) {
        return {
            getProviders: function () {
                var d = $q.defer();
                $http.post('/api/admin/users/providers', {}).success(function (data) {
                    d.resolve(data);
                });
                return d.promise;
            },
            getUsers: function (page, perpage, search) {
                var page = page || 1,
                    perpage = perpage || 50,
                    search = search || '';
                var d = $q.defer();
                $http.post('/api/admin/users', { page: page, perpage: perpage, search: search }).success(function (data) {
                    d.resolve(data);
                });
                return d.promise;
            },
            getUser: function (_id) {
                var d = $q.defer();
                $http.post('/api/admin/user', { _id: _id }).success(function (data) {
                    d.resolve(data);
                });
                return d.promise;
            },
            addUser: function (user) {
                return $http.post('/api/admin/user/add', user);
            },
            editUser: function (user) {
                return $http.post('/api/admin/user/edit', user);
            },
            deleteUser: function (_id) {
                var d = $q.defer();
                $http.post('/api/admin/user/delete', { _id: _id }).success(function (data) {
                    d.resolve(data);
                });
                return d.promise;
            }
        };
    }])
    .factory('PollService', ['$http', '$q', '$localStorage', function ($http, $q, $localStorage) {
        return {
            getPolls: function (view) {
                var d = $q.defer();
                $http.post('/polls', { view: view }).success(function (data) {
                    d.resolve(data);
                });
                return d.promise;
            },
            postVote: function(poll, votes) {
                return $http.post('/polls/vote', { poll: poll, votes: votes});
            },
            setStorage: function (poll, votes) {
//                console.log(poll, votes);
                return $localStorage['tspoll-' + poll] = votes;
            },
            getStorage: function (poll) {
                return $localStorage['tspoll-' + poll];
            }
        };
    }])
    .factory('AdminPollService', ['$http', '$q', function ($http, $q) {
        return {
            getPolls: function (page, perpage, search) {
                var page = page || 1,
                    perpage = perpage || 50,
                    search = search || '';
                var d = $q.defer();
                $http.post('/api/admin/polls', { page: page, perpage: perpage, search: search }).success(function (data) {
                    d.resolve(data);
                });
                return d.promise;
            },
            getPoll: function (_id) {
                var d = $q.defer();
                $http.post('/api/admin/poll', { _id: _id }).success(function (data) {
                    d.resolve(data);
                });
                return d.promise;
            },
            addPoll: function (poll) {
                return $http.post('/api/admin/poll/add', poll);
            },
            editPoll: function (poll) {
                return $http.post('/api/admin/poll/edit', poll);
            },
            deletePoll: function (_id) {
                var d = $q.defer();
                $http.post('/api/admin/poll/delete', { _id: _id }).success(function (data) {
                    d.resolve(data);
                });
                return d.promise;
            }
        };
    }])
    .factory('AdminBannerService', ['$http', '$q', function($http, $q){
        return {
            getBanners: function (page, perpage, search) {
                var d = $q.defer(),
                    page = page,
                    perpage = perpage,
                    search = search;

                $http.post('/api/admin/banners', {}).success(function (data) {
                    d.resolve(data);
                });
                return d.promise;
            },
            getBanner: function (_id) {
                var d = $q.defer();
                $http.post('/api/admin/banner', { _id: _id }).success(function (data) {
                    d.resolve(data);
                });
                return d.promise;
            },
            addBanner: function (banner) {
                return $http.post('api/admin/banner/add', banner);
            },
            editBanner: function (banner) {
                return $http.post('api/admin/banner/edit', banner);
            },
            deleteBanner: function (_id) {
                var d = $q.defer();
                $http.post('/api/admin/banner/delete', { _id: _id }).success(function (data) {
                    d.resolve(data);
                });
                return d.promise;
            },
            updateOrder: function (banners) {
                var d = $q.defer();
                $http.post('/api/admin/banners/order', {banners: banners});
            }
        }
    }])
    .factory('AdminForumService', ['$http', '$q', function ($http, $q) {
        return {
            getCategories: function () {
                var d = $q.defer();
                $http.post('/api/admin/forum/categories', {}).success(function (data) {
                    d.resolve(data);
                });
                return d.promise;
            },
            getCategory: function (_id) {
                var d = $q.defer();
                $http.post('/api/admin/forum/category', { _id: _id }).success(function (data) {
                    d.resolve(data);
                });
                return d.promise;
            },
            addCategory: function (category) {
                return $http.post('/api/admin/forum/category/add', category);
            },
            editCategory: function (category) {
                return $http.post('/api/admin/forum/category/edit', category);
            },
            deleteCategory: function (_id) {
                var d = $q.defer();
                $http.post('/api/admin/forum/category/delete', { _id: _id }).success(function (data) {
                    d.resolve(data);
                });
                return d.promise;
            },
            getThreads: function () {
                var d = $q.defer();
                $http.post('/api/admin/forum/threads', {}).success(function (data) {
                    d.resolve(data);
                });
                return d.promise;
            },
            getThread: function (_id) {
                var d = $q.defer();
                $http.post('/api/admin/forum/thread', { _id: _id }).success(function (data) {
                    d.resolve(data);
                });
                return d.promise;
            },
            addThread: function (thread) {
                return $http.post('/api/admin/forum/thread/add', thread);
            },
            editThread: function (thread) {
                return $http.post('/api/admin/forum/thread/edit', thread);
            },
            deleteThread: function (_id, category) {
                var d = $q.defer();
                $http.post('/api/admin/forum/thread/delete', { _id: _id, category: category }).success(function (data) {
                    d.resolve(data);
                });
                return d.promise;
            }
        };
    }])
    .factory('AdminVodService', ['$http', '$q', function ($http, $q) {
        return {
            getVods: function () {
                var d = $q.defer();
                $http.post('/api/admin/vods').success(function (data) {
                    d.resolve(data);
                });
                return d.promise;
            },
            getVod: function (_id) {
                var d = $q.defer();
                $http.post('/api/admin/vod', { _id: _id }).success(function (data) {
                    d.resolve(data);
                });
                return d.promise;
            },
            vodAdd: function (vod) {
                var d = $q.defer();
                $http.post('/api/admin/vod/add', { vod: vod }).success(function (data) {
                    d.resolve(data);
                });
                return d.promise;
            },
            vodEdit: function (vod) {
                var d = $q.defer();
                $http.post('/api/admin/vod/edit', { vod: vod }).success(function (data) {
                    d.resolve(data);
                });
                return d.promise;
            },
            vodRemove: function (_id) {
                var d = $q.defer();
                $http.post('/api/admin/vod/delete', { _id: _id }).success(function (data) {
                    d.resolve(data);
                });
                return d.promise;
            }
        }
    }])
    .service('Pagination', function () {

    var pagination = {};

    pagination.new = function (perpage, total) {

        perpage = perpage || 50;

        var paginate = {
            page: 1,
            perpage: perpage,
            total: total
        };

        paginate.results = function () {
            return paginate.total;
        };

        paginate.pages = function () {
            return Math.ceil(paginate.results() / paginate.perpage);
        };

        paginate.pagesArray = function () {
            var arr = [],
                pages = paginate.pages();
            for (var i = 1; i <= pages; i++) {
                arr.push(i);
            }
            return arr;
        };

        paginate.pageStart = function () {
            return ((paginate.page * paginate.perpage) - paginate.perpage);
        };

        paginate.showStart = function () {
            return (paginate.results()) ? paginate.pageStart() + 1 : 0;
        };

        paginate.showEnd = function () {
            var end = paginate.page * paginate.perpage;
            return (end > paginate.results()) ? paginate.results() : end;
        };

        paginate.isPage = function (page) {
            return (paginate.page === page);
        };

        paginate.getPage = function () {
            return paginate.page;
        };

        paginate.setPage = function (page) {
            paginate.page = page;
        };

        return paginate;
    }

    return pagination;
  })
  .factory('StateParamHelper', ['$state', '$timeout', function ($state, $timeout) {
      var servObj = {};
      // ui.router hack for updating $stateParams without reloading resolves/controller
      // and allows History API to work.

      servObj.updateStateParams = function(stateParams) {
          $state.current.reloadOnSearch = false;

          $state.transitionTo($state.current.name, stateParams, {
              location: true,
              inherit: true,
              relative: $state.$current.name,
              notify: false
          });

          $timeout(function () {
            $state.current.reloadOnSearch = undefined;
          });
      };

      servObj.replaceHistoryWith404 = function() {
          $state.transitionTo('app.404', {}, {
              location: "replace"
          });
      };
      // this method expects:
      // page - number
      // count - number
      // perpage - number
      servObj.validatePage = function (page, count, perpage) {
          // 404 if page entered manually is not valid
          if (angular.isUndefined(page)) return;

          var page = angular.isNumber(page) ? page : parseInt(page);

          if (angular.isDefined(page) && angular.isNumber(page) && page !== 1) {
              if (page <= 0) {
                  this.replaceHistoryWith404();
//                  console.log('page too low');
              } else if (page > Math.ceil(count / perpage)) {
//                  console.log('page to high');
                  this.replaceHistoryWith404();
              } else if (isNaN(page)) {
//                  console.log('was NaN');
                  this.replaceHistoryWith404();
              }
          }
//          console.log('cleared page validation');
      };

      // this method expects:
      // stateFilters - a stateParam array of values
      // availFilters - an array of available filters
      servObj.validateFilters = function (stateFilters, availFilters) {
          var found = _.difference(stateFilters, availFilters);
          if (!_.isEmpty(found)) {
              this.replaceHistoryWith404();
          }
      };

      return servObj;
  }])
  .factory('AjaxPagination', ['$state', '$timeout', function ($state, $timeout) {
        var pagination = {};

        pagination.update = function (serviceName, searchFilter, countFilter, callback) {
            async.series([
                function (seriesCallback) {
                    serviceName.count(countFilter)
                        .$promise
                        .then(function (count) {
                        //                    console.log('count:', count);
                        seriesCallback(null, count);
                    })
                        .catch(function (err) {
                        //                    console.log('err:', err);
                        seriesCallback(err);
                    });
                },
                function (seriesCallback) {
                    serviceName.find(searchFilter)
                        .$promise
                        .then(function (data) {
                        //                    console.log('data:', data);
                        seriesCallback(null, data);
                    })
                        .catch(function (err) {
                        //                    console.log('err:', err);
                        seriesCallback(err);
                    });
                }
            ], function(err, results) {
                if (err) {
                    //                console.log('series err:', err);
                    if (callback) {
                        callback(err);
                    }
                } else {
                    //                console.log('results:', results);
                    if (callback) {
                        callback(null, results[1], results[0]);
                    }
                }
            });
        };

        pagination.new = function (options, callback) {
            //      console.log('callback:', callback);
            var paginate = {
                page: options.page || 1,
                perpage: options.perpage || 10,
                total: options.total || 0,
                loading: false,
                callback: function (newTotal) {
                    this.loading = false;
                    this.total = newTotal;
                }
            };

            paginate.isLoading = function () {
                return paginate.loading;
            };

            paginate.getPage = function () {
                return paginate.page;
            };

            paginate.getPerpage = function () {
                return paginate.perpage;
            };

            paginate.setTotal = function (total) {
                paginate.total = total;
            }

            paginate.getTotal = function () {
                return paginate.total;
            };

            paginate.setPage = function (page) {
                if (paginate.isLoading()) { return false; }
                paginate.page = page;
                paginate.loading = true;

                return callback(paginate.page, paginate.perpage).then(function (newTotal) {
                    return paginate.callback(newTotal);
                });
            };

            paginate.pagesArray = function () {
                var pages = [],
                    start = 1,
                    end = paginate.totalPages();

                if (this.totalPages() > 5) {
                    if (paginate.getPage() < 3) {
                        start = 1;
                        end = start + 4;
                    } else if (paginate.getPage() > paginate.totalPages() - 2) {
                        end = paginate.totalPages();
                        start = end - 4;
                    } else {
                        start = paginate.getPage() - 2;
                        end = paginate.getPage() + 2;
                    }

                }

                for (var i = start; i <= end; i++) {
                    pages.push(i);
                }

                return pages;
            };

            paginate.isPage = function (page) {
                return (page === paginate.getPage());
            };

            paginate.totalPages = function (page) {
                return (paginate.getTotal() > 0) ? Math.ceil(paginate.getTotal() / paginate.getPerpage()) : 0;
            };

            paginate.from = function () {
                return (paginate.getPage() * paginate.getPerpage()) - paginate.getPerpage() + 1;
            };

            paginate.to = function () {
                return ((paginate.getPage() * paginate.getPerpage()) > paginate.getTotal()) ? paginate.getTotal() : paginate.getPage() * paginate.getPerpage();
            };

            return paginate;
        };

        return pagination;
    }])
    .factory('Util', ['$http', '$cookies', function ($http, $cookies) {
        return {
            getAuthCookie: function (key) {
                var value = $cookies.get(key);
                if (typeof value == "undefined")
                    return undefined;

                var valueElements = value.split(":");
                var cleanCookie = valueElements[1];
                valueElements = cleanCookie.split(".");
                valueElements.splice(-1, 1);
                cleanCookie = valueElements.join(".");
                return cleanCookie;
            },
            toSelect: function (arr) {
                arr = arr || [];
                var out = [];
                for (var i = 0; i < arr.length; i++) {
                    out.push({ name: arr[i], value: arr[i] });
                }
                return out;
            },
            slugify: function (str) {
                return (str) ? str.toLowerCase().replace(/-+/g, '').replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') : '';
            },
            numberWithCommas : function (x) {
                x = x || 0;
                return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
            },
            getObjectID: function () {
                return $http.post('/api/admin/id', {});
            },
            cleanObj: function (obj, properties) {
                var out = {};

                _.each(properties, function (pVal) {
                    out[pVal] = obj[pVal];
                });

                return out;
            },
            tally: function (arr, key) {
                var out = 0;
                _.each(arr, function(obj) {

                    out += obj[key];

                });
                return out;
            },
            setSlug: function (obj) {
                var sl = {};
                try {
                    var slug = angular.copy(obj.slugs[0]);
                    sl = {
                        url: slug.slug,
                        linked: slug.linked
                    };

                    delete obj.slugs;
                } finally {
                    return sl;
                }
            },
            replaceLineBreak: function (str) {
                return str.replace(/\n/g, '<br>');
            }
        };
    }])
    .factory('Base64', function () {
    var digitsStr =
    //   0       8       16      24      32      40      48      56     63
    //   v       v       v       v       v       v       v       v      v
        "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz+-";
    var digits = digitsStr.split('');
    var digitsMap = {};
    for (var i = 0; i < digits.length; i++) {
        digitsMap[digits[i]] = i;
    }
    return {
        fromInt: function(int32) {
            var result = '';
            while (true) {
                result = digits[int32 & 0x3f] + result;
                int32 >>>= 6;
                if (int32 === 0)
                    break;
            }
            return result;
        },
        toInt: function(digitsStr) {
            var result = 0;
            var digits = digitsStr.split('');
            for (var i = 0; i < digits.length; i++) {
                result = (result << 6) + digitsMap[digits[i]];
            }
            return result;
        }
    };
})
    .factory('Hearthstone', function () {
    var hs = {};

    hs.types = ['Minion', 'Spell', 'Weapon'];
    hs.rarities = ['Basic', 'Common', 'Rare', 'Epic', 'Legendary'];
    hs.races = ['', 'Beast', 'Demon', 'Dragon', 'Murloc', 'Pirate', 'Totem', 'Mech'];
    hs.classes = ['Neutral', 'Druid', 'Hunter', 'Mage', 'Paladin', 'Priest', 'Rogue', 'Shaman', 'Warlock', 'Warrior'];
    hs.heroNames = {
        Mage: ['Jaina','Medivh'],
        Shaman: ['Thrall'],
        Warrior: ['Garrosh','Magni'],
        Rogue: ['Valeera'],
        Paladin: ['Uther', 'Liadrin'],
        Priest: ['Anduin'],
        Warlock: ['Guldan'],
        Hunter: ['Rexxar', 'Alleria'],
        Druid: ['Malfurion']
    };
    hs.mechanics = ['Battlecry', 'C\'Thun', 'Charge', 'Choose One', 'Combo', 'Deathrattle', 'Discover', 'Divine Shield', 'Enrage', 'Freeze', 'Inspire', 'Jousting', 'Overload', 'Secret', 'Silence', 'Spell Damage', 'Stealth', 'Summon', 'Taunt', 'Windfury'];
    hs.deckTypes = ['None', 'Aggro', 'Control', 'Midrange', 'Combo', 'Theory Craft'];
    hs.expansions = ['Basic', 'Naxxramas', 'Goblins Vs. Gnomes', 'Blackrock Mountain', 'The Grand Tournament', 'League of Explorers', 'Whispers of the Old Gods'];

    return hs;
})
    .factory('HOTS', function () {
    var hots = {};

    hots.roles = ["Warrior", "Assassin", "Support", "Specialist"];
    hots.types = ["Melee", "Ranged"];
    hots.universes = ["Warcraft", "Starcraft", "Diablo", "Blizzard", "Overwatch"];
    hots.abilityTypes = ["Combat Trait", "Ability", "Heroic Ability", "Heroic Skill", "Mount"];
    hots.manaTypes = ['Mana', 'Brew', 'Energy', 'Fury'];
    hots.tiers = [1,4,7,10,13,16,20];
    hots.heroRows = [9, 8, 9, 8, 9, 8];
    hots.mapRows = [4,3,4];

    hots.genStats = function () {
        var stats = [],
            obj;

        for (var i = 0; i < 30; i++) {
            obj = {
                level: i + 1,
                health: '',
                healthRegen: '',
                mana: '',
                manaRegen: '',
                attackSpeed: '',
                range: '',
                damage: ''
            };
            stats.push(obj);
        }

        return stats;
    };

    return hots;
})
    .factory('OVERWATCH', function () {
    var ow = {};

    ow.roles = ["Defense", "Offense", "Support", "Tank"];

    return ow;
})
.factory('DeckBuilder', ['$sce', '$http', '$q', '$timeout', 'CardWithoutCoin', 'CardWithCoin', 'User', 'Hearthstone', 'CrudMan', function ($sce, $http, $q, $timeout, CardWithoutCoin, CardWithCoin, User, Hearthstone, CrudMan) {

    var deckBuilder = {};

    deckBuilder.new = function (playerClass, data) {
        data = data || {};

        var d = new Date();
        d.setMonth(d.getMonth() + 1);

        var db = {
            id: data.id || null,
            authorId: data.authorId || User.getCurrentId(),
            author: data.author === 'undefined' ? undefined : data.author,
            name: data.name || '',
            dust: data.dust || 0,
            youtubeId: data.youtubeId || '',
            description: data.description || '',
            chapters: data.chapters || [],
            deckType: data.deckType || 'None',
            gameModeType: data.gameModeType || 'constructed',
            basic: _.isUndefined(data.basic) ? false : data.basic,
            matchups: data.matchups || [],
            cards: data.cards || [],
            heroName: data.heroName || '',
            playerClass: playerClass,
            createdDate: data.createdDate || new Date().toISOString(),
            premium: data.premium || {
                isPremium: false,
                expiryDate: d
            },
            comments: data.comments || [],
            slug: data.slug || '',
            isFeatured: _.isUndefined(data.isFeatured) ? false : data.isFeatured,
            isCommentable: _.isUndefined(data.isCommentable) ? true : data.isCommentable,
            isPublic: data.isPublic !== undefined && data.isPublic === false ? false : true,
            voteScore: data.voteScore || 1,
            votes: data.votes || [],
            mulligans: data.mulligans || [
                {
                    className: 'Druid',
                    mulligansWithoutCoin: [],
                    mulligansWithCoin: [],
                    instructionsWithCoin: '',
                    instructionsWithoutCoin: ''
                },
                {
                    className: 'Hunter',
                    mulligansWithoutCoin: [],
                    mulligansWithCoin: [],
                    instructionsWithCoin: '',
                    instructionsWithoutCoin: ''
                },
                {
                    className: 'Mage',
                    mulligansWithoutCoin: [],
                    mulligansWithCoin: [],
                    instructionsWithCoin: '',
                    instructionsWithoutCoin: ''
                },
                {
                    className: 'Paladin',
                    mulligansWithoutCoin: [],
                    mulligansWithCoin: [],
                    instructionsWithCoin: '',
                    instructionsWithoutCoin: ''
                },
                {
                    className: 'Priest',
                    mulligansWithoutCoin: [],
                    mulligansWithCoin: [],
                    instructionsWithCoin: '',
                    instructionsWithoutCoin: ''
                },
                {
                    className: 'Rogue',
                    mulligansWithoutCoin: [],
                    mulligansWithCoin: [],
                    instructionsWithCoin: '',
                    instructionsWithoutCoin: ''
                },
                {
                    className: 'Shaman',
                    mulligansWithoutCoin: [],
                    mulligansWithCoin: [],
                    instructionsWithCoin: '',
                    instructionsWithoutCoin: ''
                },
                {
                    className: 'Warlock',
                    mulligansWithoutCoin: [],
                    mulligansWithCoin: [],
                    instructionsWithCoin: '',
                    instructionsWithoutCoin: ''
                },
                {
                    className: 'Warrior',
                    mulligansWithoutCoin: [],
                    mulligansWithCoin: [],
                    instructionsWithCoin: '',
                    instructionsWithoutCoin: ''
                }
            ]
        };

            db.init = function() {
                if (db.cards.length) {
                    db.sortDeck();
                }
            };

        db.validVideo = function () {
            //var r = /^(?:https?:\/\/)?(?:www\.)?(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))((\w|-){11})(?:\S+)?$/;
            //return (db.video.length) ? db.video.match(r) : true;
            return true;
        };

        db.isStrong = function (strong) {
            return strong.isStrong;
        };

        db.isWeak = function (weak) {
            return weak.isWeak;
        };

        db.toggleStrong = function (strong) {
            strong.isStrong = !strong.isStrong;
        };

        db.toggleWeak = function (weak) {
            weak.isWeak = !weak.isWeak;
        };

        db.getStrong = function (klass) {
            var strong = db.against.strong;
            for (var i = 0; i < strong.length; i++) {
                if (strong[i].klass === klass) {
                    return strong[i];
                }
            }
            return false;
        };

        db.getWeak = function (klass) {
            var weak = db.against.weak;
            for (var i = 0; i < weak.length; i++) {
                if (weak[i].klass === klass) {
                    return weak[i];
                }
            }
            return false;
        };

        db.inMulligan = function (mulligan, withCoin, card) {
            var c = (withCoin) ? mulligan.withCoin.cards : mulligan.withoutCoin.cards;
            // check if card already exists
            for (var i = 0; i < c.length; i++) {
                if (c[i].id === card.id) {
                    return true;
                }
            }
            return false;
        };

        db.toggleMulligan = function (mulligan, withCoin, card) {
            //            console.log('mulligan: ', mulligan);
            //            console.log('card: ', card);
            //            console.log('with coin: ', withCoin);

            var cardMulligans = (withCoin) ? mulligan.mulligansWithCoin : mulligan.mulligansWithoutCoin,
                exists = false,
                index = -1;

            // check if card already exists
            for(var i = 0; i < cardMulligans.length; i++) {
                if (cardMulligans[i].id === card.id) {
                    exists = true;
                    index = i;
                    break;
                }
            }

            if (exists) {
                cardMulligans.splice(index, 1);
                //                console.log('spliced coinMulligan: ', cardMulligans);
            } else {
                // card doesn't exist in deck.mulligans
                if (cardMulligans.length < 6) {
                    card.cardId = card.id;
                    cardMulligans.push(card);
                    //                    console.log('added to mulligan: ', cardMulligans);
                }
            }
        };

        db.calcImgPosition = function(card) {
            var pos = 0;
            var pxRatio = 28;
            if (card.cardQuantity > 1) {
                pos += 1;
            }
            if (card.card.rarity === 'Legendary') {
                pos += 1;
            }
            return pxRatio * pos;
        };

        db.toggleGameMode = function(gameMode) {
            var cardQtyMoreThan2 = false;
            if (gameMode === 'constructed' || gameMode === 'brawl') {
                for(var i = 0; i < db.cards.length; i++) {
                    if (db.cards[i].cardQuantity > 2) {
                        cardQtyMoreThan2 = true;
                        break;
                    }
                }
                if (cardQtyMoreThan2) {
                    // Alert user that all cards with more than 2 will be reduced to 2
                    var box = bootbox.dialog({
                        title: 'Are you sure you want to change this deck from <strong>' + db.gameModeType + '</strong> to <strong>' + gameMode + '</strong>?',
                        message: 'All cards with more than 2 will be reduced to 2.',
                        buttons: {
                            delete: {
                                label: 'Continue',
                                className: 'btn-danger',
                                callback: function () {
                                    $timeout(function() {
                                        for(var i = 0; i < db.cards.length; i++) {
                                            if (db.cards[i].cardQuantity > 2) {
                                                db.cards[i].cardQuantity = 2;
                                            }
                                        }
                                        db.gameModeType = gameMode;
                                    });
                                }
                            },
                            cancel: {
                                label: 'Cancel',
                                className: 'btn-default pull-left',
                                callback: function () {
                                    box.modal('hide');
                                }
                            }
                        },
                        closeButton: false
                    });
                    box.modal('show');
                } else {
                    db.gameModeType = gameMode;
                }
            } else {
                db.gameModeType = gameMode;
            }
        };

        db.getMulligan = function (klass) {
            var mulligans = db.mulligans;
            for (var i = 0; i < mulligans.length; i++) {
                if (mulligans[i].className === klass) {
                    //                    console.log('mulligan: ', mulligans[i]);
                    return mulligans[i];
                }
            }
            return false;
        };

        db.getContent = function () {
            return $sce.trustAsHtml(db.content);
        };

        db.isAddable = function (card) {
            if (db.gameModeType === 'arena') { return true; }
            if (card.playerClass !== db.playerClass && card.playerClass !== 'Neutral') { return false; }
            var exists = false,
                index = -1,
                isLegendary = (card.rarity === 'Legendary') ? true : false;

            // check if card already exists
            for (var i = 0; i < db.cards.length; i++) {
                if (db.cards[i].card.id === card.id) {
                    exists = true;
                    index = i;
                    break;
                }
            }

            if (exists) {
                return (!isLegendary && db.cards[index].cardQuantity === 1);
            } else {
                return true;
            }
        };

        // add card
        db.addCard = function (card) {

            var exists = false,
                index = -1,
                isLegendary = (card.rarity === 'Legendary') ? true : false,
                totalCards = db.getSize();

            //            console.log('adding card: ', card);

            // check if card already exists
            for (var i = 0; i < db.cards.length; i++) {
                if (db.cards[i].cardId === card.id) {
                    exists = true;
                    index = i;
                    break;
                }
            }

            // add card
            if (exists) {
                // check gameModeType
                if(db.gameModeType === 'arena') {

                    db.cards[index].cardQuantity += 1;
                    return true;
                } else {
                    // mode is constructed or brawl mode
                    if (!isLegendary && db.cards[index].cardQuantity === 1) {

                        db.cards[index].cardQuantity += 1;
                        return true;
                    }
                    // increase qty by one
                    if (!isLegendary && (db.cards[index].cardQuantity === 1 || db.arena)) {

                        db.cards[index].cardQuantity = db.cards[index].cardQuantity + 1;
                        return true;
                    }
                }
            } else {
                var newCard = {
                    deckId: db.id,
                    cardId: card.id,
                    cardQuantity: 1,
                    card: card
                };
                // add new card
                db.cards.push(newCard);
                // sort deck
                db.sortDeck();
            }
        };

        db.sortDeck = function () {
            var weights = {
                'Weapon' : 0,
                'Spell': 1,
                'Minion': 2
            };

            function dynamicSort(property) {
                return function (a, b) {
                    if (property == 'cardType') {
                        if (weights[a[property]] < weights[b[property]]) return -1;
                        if (weights[a[property]] > weights[b[property]]) return 1;
                    } else {
                        if (a[property] < b[property]) return -1;
                        if (a[property] > b[property]) return 1;
                    }
                    return 0;
                }
            }

            function dynamicSortMultiple() {
                var props = arguments;
                return function (a, b) {
                    var i = 0,
                        result = 0;

                    while(result === 0 && i < props.length) {
                        result = dynamicSort(props[i])(a.card, b.card);
                        i++;
                    }
                    return result;
                }
            }

            db.cards.sort(dynamicSortMultiple('cost', 'cardType', 'name'));
        };

        db.removeCardFromDeck = function (card) {
            //            console.log('card rem: ', card);
            var cardRemovedFromDeck = false,
                index = -1,
                cardMulliganExists = false,
                cancel = false;

            //			console.log('db.cards:', db.cards);
            for (var i = 0; i < db.cards.length; i++) {
                if (card.id === db.cards[i].card.id) {
                    //					console.log('card.id:', card.id);
                    //					console.log('db.cards[i].card.id:', db.cards[i].card.id);
                    if (db.cards[i].cardQuantity > 1) {
                        db.cards[i].cardQuantity = db.cards[i].cardQuantity - 1;
                        return;
                    } else {
                        index = i;
                        cardRemovedFromDeck = true;
                        break;
                    }
                }
            }

            if(cardRemovedFromDeck) {
                //                console.log('card was removed');
                // search all card with coin mulligans
                //				console.log('db.mulligans:', db.mulligans);
                for(var i = 0; i < db.mulligans.length; i++) {
                    if (db.mulligans[i].mulligansWithCoin.length > 0) {
                        for(var j = 0; j < db.mulligans[i].mulligansWithCoin.length; j++) {
                            if (db.mulligans[i].mulligansWithCoin[j].id === card.id) {
                                cardMulliganExists = true;
                                break;
                            }
                        }
                    }

                    if (db.mulligans[i].mulligansWithoutCoin.length > 0) {
                        for(var j = 0; j < db.mulligans[i].mulligansWithoutCoin.length; j++) {
                            if (db.mulligans[i].mulligansWithoutCoin[j].id === card.id) {
                                cardMulliganExists = true;
                                break;
                            }
                        }
                    }
                }
            }

            if (cardMulliganExists) {
                var box = bootbox.dialog({
                    title: 'Are you sure you want to remove <strong>' + card.name + '</strong>?',
                    message: 'Current mulligans for ' + card.name + ' will be lost as well.',
                    buttons: {
                        delete: {
                            label: 'Continue',
                            className: 'btn-danger',
                            callback: function () {

                                $timeout(function() {
                                    db.cards.splice(index, 1);
                                });

                                for(var i = 0; i < db.mulligans.length; i++) {
                                    for(var j = 0; j < db.mulligans[i].mulligansWithCoin.length; j++) {
                                        if (db.mulligans[i].mulligansWithCoin[j].id === card.id) {
                                            db.mulligans[i].mulligansWithCoin.splice(j, 1);
                                        }
                                    }
                                    for(var j = 0; j < db.mulligans[i].mulligansWithoutCoin.length; j++) {
                                        if (db.mulligans[i].mulligansWithoutCoin[j].id === card.id) {
                                            db.mulligans[i].mulligansWithoutCoin.splice(j, 1);
                                        }
                                    }
                                }
                            }
                        },
                        cancel: {
                            label: 'Cancel',
                            className: 'btn-default pull-left',
                            callback: function () {
                                box.modal('hide');
                            }
                        }
                    },
                    closeButton: false
                });
                box.modal('show');
            } else {
                if (index !== -1) {
                    db.cards.splice(index, 1);
                }
            }
        };

        db.removeCard = function (card) {
            if (card.cardQuantity > 1) {
                card.cardQuantity = card.cardQuantity - 1;
            } else {
                var index = db.cards.indexOf(card);

                db.cards.splice(index, 1);
            }
        };

        db.manaCurve = function (mana) {
            var big = 0,
                cnt;
            // figure out largest mana count
            for (var i = 0; i <= 7; i++) {
                cnt = db.manaCount(i);
                if (cnt > big) big = cnt;
            }

            if (big === 0) return 0;

            return Math.ceil(db.manaCount(mana) / big * 100);
        };

        db.manaCount = function (mana) {
            var cnt = 0;
            for (var i = 0; i < db.cards.length; i++) {
                if (db.cards[i].card.cost === mana || (mana === 7 && db.cards[i].card.cost >= 7)) {
                    cnt += db.cards[i].cardQuantity;
                }
            }
            return cnt;
        };

        //        db.manaCount = function (mana) {
        //            var cnt = 0;
        //            for (var i = 0; i < db.cards.length; i++) {
        //                if (db.cards[i].card.cost === mana || (mana === 7 && db.cards[i].cost >= 7)) {
        //                    cnt += db.cards[i].cardQuantity;
        //                }
        //            }
        //            return cnt;
        //        };

        db.cardQuantityById = function (cardId) {
            for(var i = 0; i < db.cards.length; i++) {
                if (db.cards[i].card.id === cardId) {
                    return db.cards[i].cardQuantity;
                }
            }
            return 0;
        };

        db.getSize = function() {
            var size = 0;
            for(var i = 0; i < db.cards.length; i++) {
                size += db.cards[i].cardQuantity;
            }
            return size;
        };

        //        db.getSize = function () {
        //            var size = 0;
        //            for (var i = 0; i <= 7; i++) {
        //                size += db.manaCount(i);
        //            }
        //            return size;
        //        };

        db.getDust = function () {
            var dust = 0;
            for (var i = 0; i < db.cards.length; i++) {
                dust += db.cards[i].cardQuantity * db.cards[i].card.dust;
            }
            return dust;
        };

        db.validDeck = function () {
            // attch dust value to deck
            db.dust = db.getDust();
            // 30 cards in deck
            if (db.getSize() !== 30) {
                return false;
            } else if (db.getSize() === 30) {
                return true;
            }
        };

        db.moveChapterUp = function (chapter) {
            var oldIndex = db.chapters.indexOf(chapter),
                newIndex = oldIndex - 1;

            if (newIndex < 0) { return false; }

            db.chapters.splice(oldIndex, 1);
            db.chapters.splice(newIndex, 0, chapter);
        };

        db.moveChapterDown = function (chapter) {
            var oldIndex = db.chapters.indexOf(chapter),
                newIndex = oldIndex + 1;

            if (newIndex < 0) { return false; }

            db.chapters.splice(oldIndex, 1);
            db.chapters.splice(newIndex, 0, chapter);
        };

        db.addChapter = function () {
            db.chapters.push({
                title: '',
                content: ''
            });
        }

        db.removeChapter = function (index) {
            db.chapters.splice(index,1);
        }

        db.newMatch = function (klass) {
            //            console.log('vhat class?: ', klass);
            var m = {
                deckName: '',
                className: '',
                forChance: 0,
                match: 0
            };

            m.className = klass;
            db.matchups.push(m);
        }

        db.removeMatch = function (index) {
            db.matchups.splice(index,1);
        }

        db.init();
        return db;
    };
    return deckBuilder;
}])
.factory('GuideBuilder', ['$sce', '$http', '$q', 'User', 'HeroTalent', function ($sce, $http, $q, User, HeroTalent) {

        var guideBuilder = {};

        guideBuilder.new = function (guideType, data) {
            //        console.log('DATA:', data);

            if (data && data.guideHeroes) {
                data.heroes = data.guideHeroes
            }

            data = data || {};
            var d = new Date();
            d.setMonth(d.getMonth() + 1);

            // init tiers to null for existing/cached heros if their talents do not currently exist
            function createTiers(heroes) {
                var guideHeroes = [];
                //            console.log('heroes:', heroes);
                _.each(heroes, function(hero) {
                    //                console.log('hero:', hero);
                    var newObj = {};
                    newObj.hero = hero.hero;
                    newObj.talents = {
                        tier1: hero.talents && hero.talents.tier1 ? hero.talents.tier1 : null,
                        tier4: hero.talents && hero.talents.tier4 ? hero.talents.tier4 : null,
                        tier7: hero.talents && hero.talents.tier7 ? hero.talents.tier7 : null,
                        tier10: hero.talents && hero.talents.tier10 ? hero.talents.tier10 : null,
                        tier13: hero.talents && hero.talents.tier13 ? hero.talents.tier13 : null,
                        tier16: hero.talents && hero.talents.tier16 ? hero.talents.tier16 : null,
                        tier20: hero.talents && hero.talents.tier20 ? hero.talents.tier20 : null
                    };

                    _.each(hero.hero.talents, function(heroTalent) {
                        _.each(data.guideTalents, function(guideTalent) {
                            if (heroTalent.talent.id === guideTalent.talentId) {
                                newObj.talents['tier'+guideTalent.tier] = guideTalent.talentId;
                            }
                        });
                    });

                    guideHeroes.push(newObj);

                });

                //            console.log('guideHeroes:', guideHeroes);
                return guideHeroes;
            }

            //        console.log('data.maps:', data.maps);

            var gb = {
                id: data.id || null,
                name: data.name || '',
                slug: data.slug || '',
                guideType: guideType,
                description: data.description || '',
                content: data.content || [],
                heroes: data.heroes ? createTiers(data.heroes) : [],
                createdDate: data.createdDate || new Date().toISOString(),
                maps: data.maps || [],
                synergy: data.synergy || [],
                against: data.against || {
                    strong: [],
                    weak: []
                },
                youtubeId: data.youtubeId || '',
                premium: data.premium || {
                    isPremium: false,
                    expiryDate: d
                },
                isFeatured: _.isUndefined(data.isFeatured) ? false : data.isFeatured,
                isPublic:  _.isUndefined(data.isPublic) ? true : data.isPublic,
                isCommentable: _.isUndefined(data.isCommentable) ? true : data.isCommentable,
                votes: data.votes || [],
                voteScore: data.voteScore || 0,
                viewCount: data.viewCount || 0,
                authorId: data.authorId || User.getCurrentId(),
                talentTiers: data.talentTiers || {}
            };
            //        console.log('gb:', gb);
            // constrain maps to 1 if map guide
            if (guideType === 'map' && gb.maps.length > 1) {
                gb.maps = [gb.maps[0]];
            }

            gb.validVideo = function () {
                //var r = /^(?:https?:\/\/)?(?:www\.)?(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))((\w|-){11})(?:\S+)?$/;
                //return (gb.video.length) ? gb.video.match(r) : true;
                return true;
            };

            gb.getContent = function (content) {
                return $sce.trustAsHtml(content);
            };

            gb.moveContentUp = function (content) {
                var oldIndex = gb.content.indexOf(content),
                    newIndex = oldIndex - 1;

                if (newIndex < 0) { return false; }

                gb.content.splice(oldIndex, 1);
                gb.content.splice(newIndex, 0, content);
            };

            gb.moveContentDown = function (content) {
                var oldIndex = gb.content.indexOf(content),
                    newIndex = oldIndex + 1;

                if (newIndex > (gb.content.length - 1)) { return false; }

                gb.content.splice(oldIndex, 1);
                gb.content.splice(newIndex, 0, content);
            };

            gb.toggleHero = function (hero) {
                if (gb.hasHero(hero)) {
                    console.log(1);
                    for (var i = 0; i < gb.heroes.length; i++) {
                        if (gb.heroes[i].hero.id === hero.id) {
                            gb.heroes.splice(i, 1);
                            return true;
                        }
                    }
                } else {
                    if (gb.heroes.length === 5) { return false; }

                    HeroTalent.find({
                        filter: {
                            where: {
                                heroId: hero.id
                            },
                            include: ['talent']
                        }
                    }).$promise
                        .then(function (heroTalents) {
                        hero.talents = heroTalents;
                    })
                        .catch(function (err) {
                    });

                    var obj = {};
                    obj.hero = hero;
                    obj.talents = {
                        tier1: null,
                        tier4: null,
                        tier7: null,
                        tier10: null,
                        tier13: null,
                        tier16: null,
                        tier20: null
                    };
                    gb.heroes.push(obj);
                }
            };

            //        gb.hasHero = function (hero) {
            //            if (!hero) { return false; }
            //            for (var i = 0; i < gb.heroes.length; i++) {
            //                if (gb.heroes[i].hero._id === hero._id) {
            //                    return true;
            //                }
            //            }
            //            return false;
            //        };

            gb.hasHero = function (hero) {
                if (!hero) { return false; }
                for (var i = 0; i < gb.heroes.length; i++) {
                    if (gb.heroes[i].hero.id === hero.id) {
                        return true;
                    }
                }
                return false;
            };

            gb.hasAnyHero = function () {
                return gb.heroes.length;
            };

            gb.tiers = function () {
                return [1, 4, 7, 10, 13, 16, 20];
            };

            gb.talentsByTier = function (hero, tier) {
                var temp = _.filter(hero.talents, function (val) {
                    return val.tier == tier
                });
                var talents = _.map(temp, function (val) { val.talent.orderNum = val.orderNum; return val.talent; });
                return talents;
            };

            //        gb.toggleTalent = function (hero, talent) {
            //            if (gb.hasTalent(hero, talent)) {
            //                hero.talents['tier'+talent.tier] = null;
            //            } else {
            //                hero.talents['tier'+talent.tier] = talent._id;
            //            }
            //        };

            gb.toggleTalent = function (hero, talent) {
                //          console.log('hero:', hero);
                var talentId = talent.id;
                var tal = _.find(hero.hero.talents, function (val) { return val.talentId == talentId });

                if (gb.hasTalent(hero, talent)) {
                    hero.talents['tier'+tal.tier] = null;
                } else {
                    hero.talents['tier'+tal.tier] = talentId;
                }
            };

            //        gb.hasAnyTalent = function (hero, talent) {
            //            return (hero.talents['tier'+talent.tier] !== null);
            //        };

            gb.hasAnyTalent = function (hero, talent) {
                var talentId = talent.id;
                var tal = _.find(hero.hero.talents, function (val) { return val.talentId == talentId });

                return (hero.talents['tier'+tal.tier] !== null);
            };

            gb.allTalentsDone = function () {
                for (var i = 0; i < gb.heroes.length; i++) {
                    if ( gb.heroes[i].talents.tier1 === null ||
                        gb.heroes[i].talents.tier4 === null ||
                        gb.heroes[i].talents.tier7 === null ||
                        gb.heroes[i].talents.tier10 === null ||
                        gb.heroes[i].talents.tier13 === null ||
                        gb.heroes[i].talents.tier16 === null ||
                        gb.heroes[i].talents.tier20 === null ) {
                        return false;
                    }
                }
                return true;
            };

            //        gb.hasTalent = function (hero, talent) {
            //            return (hero.talents['tier'+talent.tier] == talent._id);
            //        };

            gb.hasTalent = function (hero, talent) {
                var talentId = talent.id;
                var tal = _.find(hero.hero.talents, function (val) { return val.talentId == talentId });

                return (hero.talents['tier'+tal.tier] == talent.id);
            };

            gb.toggleSynergy = function (hero) {
                if (gb.hasSynergy(hero)) {
                    for (var i = 0; i < gb.synergy.length; i++) {
                        if (gb.synergy[i] === hero.id) {
                            gb.synergy.splice(i, 1);
                            return true;
                        }
                    }
                } else {
                    gb.synergy.push(hero.id);
                }
            };

            gb.hasSynergy = function (hero) {
                for (var i = 0; i < gb.synergy.length; i++) {
                    if (gb.synergy[i] === hero.id) {
                        return true;
                    }
                }
                return false;
            };

            gb.toggleStrong = function (hero) {
                if (gb.hasStrong(hero)) {
                    for (var i = 0; i < gb.against.strong.length; i++) {
                        if (gb.against.strong[i] === hero.id) {
                            gb.against.strong.splice(i, 1);
                            return true;
                        }
                    }
                } else {
                    gb.against.strong.push(hero.id);
                }
            };

            gb.hasStrong = function (hero) {
                for (var i = 0; i < gb.against.strong.length; i++) {
                    if (gb.against.strong[i] === hero.id) {
                        return true;
                    }
                }
                return false;
            };

            gb.toggleWeak = function (hero) {
                if (gb.hasWeak(hero)) {
                    for (var i = 0; i < gb.against.weak.length; i++) {
                        if (gb.against.weak[i] === hero.id) {
                            gb.against.weak.splice(i, 1);
                            return true;
                        }
                    }
                } else {
                    gb.against.weak.push(hero.id);
                }
            };

            gb.hasWeak = function (hero) {
                for (var i = 0; i < gb.against.weak.length; i++) {
                    if (gb.against.weak[i] === hero.id) {
                        return true;
                    }
                }
                return false;
            };

            gb.hasAnyChapter = function () {
                return gb.content.length;
            };

            gb.hasAnyMap = function () {
                return gb.maps.length;
            };

            gb.setMap = function (map) {
                gb.maps = [map];
            };

            gb.toggleMap = function (map) {
                if (gb.hasMap(map)) {
                    for (var i = 0; i < gb.maps.length; i++) {
                        if (gb.maps[i].id === map.id) {
                            gb.maps.splice(i, 1);
                            return true;
                        }
                    }
                } else {
                    gb.maps.push(map);
                }
            };

            gb.hasMap = function (map) {
                for (var i = 0; i < gb.maps.length; i++) {
                    if (gb.maps[i].id === map.id) {
                        return true;

                    }
                }
                return false;
            };

            gb.addContent = function () {
                gb.content.push({
                    title: 'NEW CHAPTER',
                    body: ''
                });
            };

            gb.deleteContent = function (content) {
                var index = gb.content.indexOf(content);
                if (index !== -1) {
                    gb.content.splice(index, 1);
                }
            };

            return gb;
        }

        return guideBuilder;
    }])
    .factory('DeckService', ['$http', '$q', function ($http, $q) {
        return {
            getDecksCommunity: function (klass, page, perpage, search) {
                klass = klass || false;
                page = page || 1;
                perpage = perpage || 24;
                search = search || false;

                var d = $q.defer();
                $http.post('/decks/community', { klass: klass, page: page, perpage: perpage, search: search }).success(function (data) {
                    d.resolve(data);
                });
                return d.promise;
            },
            getDecksFeatured: function (klass, page, perpage, search) {
                klass = klass || false;
                page = page || 1;
                perpage = perpage || 24;
                search = search || false;

                var d = $q.defer();
                $http.post('/decks/featured', { klass: klass, page: page, perpage: perpage, search: search }).success(function (data) {
                    d.resolve(data);
                });
                return d.promise;
            },
            getDecks: function (klass, page, perpage, search, age, order) {
                klass = klass || 'all';
                page = page || 1;
                perpage = perpage || 24;
                search = search || '';
                age = age || 'all';
                order = order || 'high';

                var d = $q.defer();
                $http.post('/decks', { klass: klass, page: page, perpage: perpage, search: search, age: age, order: order }).success(function (data) {
                    d.resolve(data);
                });
                return d.promise;
            },
            getDeck: function (slug) {
                var d = $q.defer();
                $http.post('/deck', { slug: slug }).success(function (data) {
                    d.resolve(data);
                });
                return d.promise;
            },
            deckEdit: function (slug) {
                var d = $q.defer();
                $http.post('/api/deck', { slug: slug }).success(function (data) {
                    d.resolve(data);
                });
                return d.promise;
            },
            deckDelete: function (_id) {
                return $http.post('/api/deck/delete', { _id: _id });
            },
            addComment: function (deck, comment) {
                return $http.post('/api/deck/comment/add', { deckID: deck._id, comment: comment });
            }
        };
    }])
    .factory('HOTSGuideService', ['$http', '$q', function ($http, $q) {
        return {
            getGuidesCommunity: function (filters, offset, perpage, search, daysLimit) {
                filters = filters || false;
                offset = offset || 0;
                perpage = perpage || 10;
                search = search || false;
                daysLimit = daysLimit || false;

                var d = $q.defer();
                $http.post('/hots/guides/community', { filters: filters, offset: offset, perpage: perpage, search: search, daysLimit: daysLimit }).success(function (data) {
                    d.resolve(data);
                });
                return d.promise;
            },
            getGuidesFeatured: function (filters, offset, perpage, search) {
                filters = filters || false;
                offset = offset || 0;
                perpage = perpage || 10;
                search = search || false;

                var d = $q.defer();
                $http.post('/hots/guides/featured', { filters: filters, offset: offset, perpage: perpage, search: search }).success(function (data) {
                    d.resolve(data);
                });
                return d.promise;
            },
            getGuides: function (guideType, filters, page, perpage, search) {
                guideType = guideType || 'all';
                filters = filters || false;
                page = page || 1;
                perpage = perpage || 24;
                search = search || '';

                var d = $q.defer();
                $http.post('/hots/guides', { guideType: guideType, filters: filters, page: page, perpage: perpage, search: search }).success(function (data) {
                    d.resolve(data);
                });
                return d.promise;
            },
            getGuide: function (slug) {
                var d = $q.defer();
                $http.post('/hots/guide', { slug: slug }).success(function (data) {
                    d.resolve(data);
                });
                return d.promise;
            },
            getMaps: function () {
                var d = $q.defer();
                $http.post('/hots/maps', {}).success(function (data) {
                    d.resolve(data);
                });
                return d.promise;
            },
            guideEdit: function (slug) {
                var d = $q.defer();
                $http.post('/api/hots/guide', { slug: slug }).success(function (data) {
                    d.resolve(data);
                });
                return d.promise;
            },
            addGuide: function (guide) {
                return $http.post('/api/hots/guide/add', guide);
            },
            editGuide: function (guide) {
                return $http.post('/api/hots/guide/update', guide);
            },
            guideDelete: function (_id) {
                return $http.post('/api/hots/guide/delete', { _id: _id });
            },
            addComment: function (guide, comment) {
                return $http.post('/api/hots/guide/comment/add', { guideID: guide._id, comment: comment });
            }
        };
    }])
    .factory('HOTSGuideQueryService', ['Hero', 'Map', 'Guide', 'Article', 'Util', function (Hero, Map, Guide, Article, Util) {
        return {
            getArticles: function (filters, isFeatured, limit, finalCallback) {
//                console.log('filters:', filters);
//                console.log('isFeatured:', isFeatured);
//                console.log('limit:', limit);
//                console.log('finalCallback:', finalCallback);
                async.waterfall([
                    function(seriesCallback) {
                        var where = {};

                        if ((!_.isEmpty(filters.roles) || !_.isEmpty(filters.universes)) && _.isEmpty(filters.heroes)) {

                            if (!_.isEmpty(filters.roles) || !_.isEmpty(filters.universes)) {
                                where.or = [];
                            }

                            if (!_.isEmpty(filters.roles)) {
                                where.or.push({ role: { inq: filters.roles }})
                            }

                            if (!_.isEmpty(filters.universes)) {
                                where.or.push({ universe: { inq: filters.universes }})
                            }

                            if (!_.isEmpty(filters.search)) {
                                var pattern = '/.*'+filters.search+'.*/i';
                                where.or = [
                                    { name: { regexp: pattern }},
                                    { description: { regexp: pattern }}
                                ]
                            }

//                            console.log('where:', where);
                            Hero.find({
                                filter: {
                                    where: where,
                                    fields: ["name"]
                                }
                            }, function (heroes) {
//                                console.log('heroes: ', heroes);
                                return seriesCallback(undefined, heroes);
                            }, function (err) {
                                console.log(err);
                                return finalCallback(err);
                            });

                        } else if (!_.isEmpty(filters.heroes)) {
                            var heroNames = _.map(filters.heroes, function (hero) { return hero.name });

                            if (!_.isEmpty(filters.search)) {
                                var pattern = '/.*'+filters.search+'.*/i';
                                where.or = [
                                    { name: { regexp: pattern }},
                                    { description: { regexp: pattern }}
                                ]
                            }

                            where.name = { inq: heroNames };

                            Hero.find({
                                filter: {
                                    where: where,
                                    fields: ["name"]
                                }
                            }, function (heroes) {
//                                console.log(heroes);
                                return seriesCallback(undefined, heroes);
                            }, function (err) {
                                console.log(err);
                                return finalCallback(err);
                            });
                        } else if (_.isEmpty(filters.heroes)) {

                            if (!_.isEmpty(filters.search)) {
                                var pattern = '/.*'+filters.search+'.*/i';
                                where.or = [
                                    { title: { regexp: pattern }},
                                    { description: { regexp: pattern }}
                                ]
                            }

                            Hero.find({
                                filter: {
                                    where: where,
                                    fields: ["name"]
                                }
                            }, function (heroes) {
//                                console.log(heroes);
                                return seriesCallback(undefined, heroes);
                            }, function (err) {
                                console.log(err);
                                return finalCallback(err);
                            });
                        }

                    },
                    function(heroes, seriesCallback) {
                        var where = {};

                        if (_.isEmpty(filters.heroes)) {
                            where = {
                                isActive: true,
                                articleType: ['hots']
                            }
                        } else {
                            where = {
                                isActive: true,
                                articleType: ['hots'],
                                classTags: {
                                    inq: _.map(heroes, function(hero) { return hero.name; })
                                }
                            };
                        }

//                        console.log('where:', where);

                        Article.find({
                            filter: {
                                where: where,
                                fields: {
                                    id: true,
                                    authorId: true,
                                    title: true,
                                    description: true,
                                    photoNames: true,
                                    themeName: true,
                                    slug: true,
                                    articleType: true,
                                    premium: true,
                                    createdDate: true
                                },
                                include: ['author', 'slugs'],
                                order: "createdDate DESC",
                                limit: limit
                            }
                        }, function (articles) {
//                            console.log('ARTICLES!!:', articles);
                            _.each(articles, function (article) {
                                article.slug = Util.setSlug(article);
                            });

                            return finalCallback(undefined, articles);
                        }, function (err) {
                            console.log(err);
                            return finalCallback(err);
                        })
                    }
                ])
            },
            topGuide: function (filters, finalCallback) {
                if (
                !_.isUndefined(filters.heroes[0]) ||
                !_.isEmpty(filters.universes) ||
                !_.isEmpty(filters.roles) ||
                !_.isEmpty(filters.search)
                ) {
                    var filter = { filters: {} }
                    filter.filters['heroId']       = (!_.isUndefined(filters.heroes[0])) ? filters.heroes[0].id : undefined;
                    filter.filters['mapClassName'] = (!_.isUndefined(filters.map)) ? filters.map.className : undefined;
                    filter.filters['universes']    = filters.universes;
                    filter.filters['roles']        = filters.roles;
                    filter.filters['search']       = filters.search;
                } else {
                    var filter = {}
                }

                console.log(filter);
                Guide.topGuide(filter)
                .$promise
                .then(function (data) {
                    console.log(data);
                    data.slug = Util.setSlug(data);
                    return finalCallback(undefined, data);
                })
                .catch(function (err) {
                    console.log(err);
                    return finalCallback(err);
                })
            },
            getGuides: function (filters, isFeatured, search, limit, page, finalCallback) {
                var order = "voteScore DESC";
                var heroWhere = {};
                var heroGuideWhere = {};
                var guideWhere = (isFeatured === null) ? { guideType: "hero" } : {};

                if (filters.search == "" && (!_.isEmpty(filters.universes) || !_.isEmpty(filters.roles))) {
                    heroWhere.and = [];

                    if (!_.isEmpty(filters.universes)) {
                        heroWhere.and.push({ universe: { inq: filters.universes } });
                    }

                    if (!_.isEmpty(filters.roles)) {
                        heroWhere.and.push({ role: { inq: filters.roles } });
                    }

                    if (!_.isEmpty(filters.search)) {
                        var pattern = '/.*'+filters.search+'.*/i';
                        heroWhere.or = [
                            { title: { regexp: pattern }},
                            { description: { regexp: pattern }}
                        ]
                    }

                } else if (filters.search != "") {

                    var pattern = '/.*'+filters.search+'.*/i';
                    heroWhere.or = [
                        { name: { regexp: pattern } },
                        { description: { regexp: pattern } }
                    ]
                }

                if (isFeatured !== null) {
                    guideWhere.isFeatured = isFeatured;
                    order = "createdDate DESC";
                }

//                console.log('heroWhere:', heroWhere);

                async.waterfall([
                    function(seriesCallback) {
                        var selectedUniverses = filters.universes,
                            selectedRoles = filters.roles

                        Hero.find({
                            filter: {
                                fields: {
                                    id: true
                                },
                                where: heroWhere,
                                include: [
                                    {
                                        relation: "guides",
                                        scope: {
                                            fields: {id: true},
                                            where: heroGuideWhere
                                        }
                                    }
                                ]
                            }
                        }, function (heroes) {
                            return seriesCallback(undefined, heroes);
                        }, function (err) {
                            return seriesCallback(err);
                        })
                    }, function (heroes, seriesCallback) {
                        var selectedGuideIds = [];
                        _.each(heroes, function(hero) {
                            selectedGuideIds.push(_.map(hero.guides, function (guide) { return guide.id }));
                        })
                        selectedGuideIds = _.flatten(selectedGuideIds);
                        return seriesCallback(undefined, selectedGuideIds);
                    }, function (selectedGuideIds, seriesCallback) {
                        guideWhere.id = { inq: selectedGuideIds };
                        guideWhere.isPublic = true;

                        Guide.find({
                            filter: {
                                limit: limit,
                                order: order,
                                skip: ((page*limit) - limit),
                                where: guideWhere,
                                fields: {
                                    name: true,
                                    authorId: true,
                                    slug: true,
                                    voteScore: true,
                                    guideType: true,
                                    premium: true,
                                    id: true,
                                    talentTiers: true,
                                    createdDate: true
                                },
                                include: [
                                    {
                                        relation: "author",
                                        scope: {
                                            fields: ['username']
                                        }
                                    },
                                    {
                                        relation: 'guideHeroes',
                                        scope: {
                                            include: [
                                                {
                                                    relation: 'talents'
                                                },
                                                {
                                                    relation: 'hero',
                                                    scope: {
                                                        include: (isFeatured !== null) ? false : ['talents'],
                                                        fields: ['name', 'className']
                                                    }
                                                }
                                            ]
                                        }
                                    },
                                    {
                                        relation: 'guideTalents',
                                        scope: {
                                            include: {
                                                relation: 'talent',
                                                scope: {
                                                    fields: {
                                                        name: true,
                                                        className: true
                                                    }
                                                }
                                            }
                                        }
                                    },
                                    {
                                        relation: 'votes',
                                        scope: {
                                            fields: {
                                                id: true,
                                                direction: true
                                            }
                                        }
                                    },
                                    {
                                        relation: 'slugs'
                                    }
                                ]
                            }
                        }).$promise.then(function (guides) {

                            _.each(guides, function(guide) {
                                guide.voteScore = Util.tally(guide.votes, 'direction');
                                guide.slug = Util.setSlug(guide);
                            });

                            return seriesCallback(undefined, guides, guideWhere);
                        }).catch(function (err) {
                            return seriesCallback(err);
                        });
                    }, function (guides, guideWhere, seriesCallback) {
                        Guide.count({
                            where: guideWhere
                        })
                            .$promise
                            .then(function (heroGuideCount) {
                            return seriesCallback(null, guides, heroGuideCount);
                        })
                            .catch(function (err) {
                            return seriesCallback(err);
                        });
                    }
                ], function (err, guides, count) {
                    if (err) return finalCallback(err);
                    return finalCallback(undefined, guides, count);
                });
            },
            getHeroGuides: function (filters, isFeatured, limit, page, finalCallback) {
                //          console.log('got here');
                //          console.log('filters:', filters);
                //          console.log('isFeatured:', isFeatured);
                //          console.log('limit:', limit);
                //          console.log('page:', page);
                //          console.log('selectedHeroes:', selectedHeroes);
                var selectedHeroes = filters.heroes,
                    order = "voteScore DESC";

                //            if (_.isEmpty(selectedHeroes)) {
                //                return;
                //            }

                var where = {
                    guideType: "hero"
                }

                if (isFeatured !== null) {
                    where.isFeatured = isFeatured
                    order = "createdDate DESC";
                }

                async.waterfall([
                    function (seriesCallback) {
                        var selectedHeroIds = _.map(selectedHeroes, function (hero) { return hero.id; })

                        Hero.find({
                            filter: {
                                fields: {
                                    id: true
                                },
                                where: {
                                    id: { inq: selectedHeroIds }
                                },
                                include: [
                                    {
                                        relation: "guides",
                                        scope: {
                                            fields: ["id"],
                                            where: where
                                        }
                                    }
                                ]
                            }
                        }, function (heroes) {
                            return seriesCallback(undefined, heroes);
                        }, function (err) {
                            return finalCallback(err);
                        })
                    }, function (heroes, seriesCallback) {
                        var selectedGuideIds = [];

                        _.each(heroes, function (hero) {
                            _.each(filters.heroes, function (selectedHero) {
                                if (hero.id == selectedHero.id) {
                                    var filteredGuides = _.map(hero.guides, function (guide) { return guide.id; })
                                    }
                                selectedGuideIds.push(filteredGuides);
                            })

                        })
                        return seriesCallback(undefined, selectedGuideIds);
                    }, function (guideIds, seriesCallback) {
                        guideIds = _.flatten(guideIds);
                        //                    console.log('guideIds:', guideIds);

                        Guide.find({
                            filter: {
                                limit: limit,
                                skip: ((limit * page) - limit),
                                order: order,
                                where: {
                                    id: { inq: guideIds },
                                    isPublic: true
                                },
                                fields: {
                                    name: true,
                                    authorId: true,
                                    slug: true,
                                    voteScore: true,
                                    guideType: true,
                                    premium: true,
                                    id: true,
                                    talentTiers: true,
                                    createdDate: true
                                },
                                include: [
                                    {
                                        relation: "author",
                                        scope: {
                                            fields: ['username']
                                        }
                                    },
                                    {
                                        relation: 'guideHeroes',
                                        scope: {
                                            include: [
                                                {
                                                    relation: 'talents'
                                                },
                                                {
                                                    relation: 'hero',
                                                    scope: {
                                                        include: (isFeatured !== null) ? false : ['talents'],
                                                        fields: ['name', 'className']
                                                    }
                                                }
                                            ]
                                        }
                                    },
                                    {
                                        relation: 'guideTalents',
                                        scope: {
                                            include: {
                                                relation: 'talent',
                                                scope: {
                                                    fields: {
                                                        name: true,
                                                        className: true
                                                    }
                                                }
                                            },
                                        }
                                    },
                                    {
                                        relation: 'votes',
                                        scope: {
                                            fields: {
                                                id: true,
                                                direction: true
                                            }
                                        }
                                    },
                                    {
                                        relation: 'slugs'
                                    }
                                ]
                            }
                        }).$promise.then(function (guides) {

                            _.each(guides, function(guide) {
                                guide.voteScore = Util.tally(guide.votes, 'direction');
                                guide.slug = Util.setSlug(guide);
                            });

                            return seriesCallback(undefined, guides, guideIds);
                        }).catch(function (err) {
                            return seriesCallback(err);
                        })
                    },
                    function (guides, guideIds, seriesCallback) {
                        Guide.count({
                            where: {
                                id: { inq: guideIds },
                                isPublic: true
                            },
                        }).$promise
                            .then(function (heroGuideCount) {
                            return seriesCallback(null, guides, heroGuideCount);
                        })
                            .catch(function (err) {
                            return seriesCallback(err);
                        });
                    }
                ], function(err, guides, count) {
                    //              console.log('err:', err);
                    //              console.log('guides:', guides);
                    //              console.log('count:', count);
                    if (err) {
                        return finalCallback(err);
                    }
                    return finalCallback(null, guides, count);
                })
            },
            getMapGuides: function (filters, isFeatured, search, limit, page, finalCallback) {
                var selectedMap = filters.map;

                if (_.isEmpty(selectedMap)) {
                    return;
                }

                var where = {
                    guideType: "map",
                    isPublic: true
                }

                if (isFeatured !== null) {
                    where.isFeatured = isFeatured
                }

                async.waterfall([
                    function (seriesCallback) {
                        Map.findOne({
                            filter: {
                                fields: {
                                    id: true
                                },
                                where: {
                                    id: filters.map.id,
                                },
                                include: [
                                    {
                                        relation: "guides",
                                        scope: {
                                            fields: ["id"],
                                            where: where
                                        }
                                    }
                                ]
                            }
                        }, function (maps) {
                            return seriesCallback(undefined, maps);
                        }, function (err) {
                            return finalCallback(err);
                        })
                    },
                    function (map, seriesCallback) {
                        var guides = map.guides;
                        var guideIds = _.map(guides, function(guide) { return guide.id })

                        Guide.find({
                            filter: {
                                limit: limit,
                                order: "createdDate DESC",
                                skip: ((limit * page) - limit),
                                where: {
                                    id: { inq: guideIds },
                                    isPublic: true
                                },
                                fields: {
                                    id: true,
                                    name: true,
                                    createdDate: true,
                                    voteScore: true,
                                    slug: true,
                                    guideType: true,
                                    authorId: true,
                                    public: true,
                                    premium: true
                                },
                                include: [
                                    {
                                        relation: "author",
                                        scope: {
                                            fields: ['username']
                                        }
                                    },
                                    {
                                        relation: "maps"
                                    },
                                    {
                                        relation: 'votes'
                                    },
                                    {
                                        relation: 'slugs'
                                    }
                                ]
                            }
                        })
                            .$promise
                            .then(function (guides) {

                            _.each(guides, function(guide) {
                                guide.voteScore = Util.tally(guide.votes, 'direction');
                                guide.slug = Util.setSlug(guide);
                            });

                            return seriesCallback(undefined, guides, guideIds);
                        })
                            .catch(function (err) {
                            return seriesCallback(err)
                        })
                    }, function (guides, guideIds, seriesCallback) {
                        Guide.count({
                            where: {
                                id: { inq: guideIds },
                                isPublic: true
                            },
                        }).$promise
                            .then(function (heroGuideCount) {
                            return seriesCallback(null, guides, heroGuideCount);
                        })
                            .catch(function (err) {
                            return seriesCallback(err);
                        });
                    }
                ], function (err, guides, count) {
                    if (err) return finalCallback(err);
                    return finalCallback(undefined, guides, count);
                });
            },
            getHeroMapGuides: function (filters, isFeatured, limit, page, finalCallback) {
                var selectedHeroes = filters.heroes;
                if (_.isEmpty(selectedHeroes)) {
                    return;
                }

                var where = {}

                if (isFeatured !== null) {
                    where.isFeatured = isFeatured
                }

                async.waterfall([
                    //get selected heroes
                    function (seriesCallback) {

                        var selectedHeroIds = _.map(selectedHeroes, function (hero) { return hero.id; });

                        Hero.find({
                            filter: {
                                fields: {
                                    id: true
                                },
                                where: { id : { inq: selectedHeroIds } },
                                include: [
                                    {
                                        relation: "guides",
                                        scope: {
                                            where: where,
                                            include: [
                                                {
                                                    relation: "maps",
                                                    scope: {
                                                        fields: {
                                                            className: true
                                                        }
                                                    }
                                                },
                                                {
                                                    relation: "guideHeroes",
                                                    scope: {
                                                        fields: {
                                                            id: true
                                                        }
                                                    }
                                                }
                                            ]
                                        }
                                    }
                                ]
                            }
                        }, function (heroes) {
                            return seriesCallback(undefined, heroes);
                        }, function (err) {
                            return seriesCallback(err);
                        })
                    },
                    //filter heroes
                    function (heroes, seriesCallback) {
                        //filter out guides by map className
                        // try {
                            var selectedGuides = [];
                            _.each(heroes, function (hero) {
                                var filteredGuides = _.filter(hero.guides, function (guide) {
                                    return _.find(guide.maps, function (map) {
                                        return (map.className === filters.map.className)
                                    })
                                });
                                selectedGuides.push(filteredGuides);
                            });

                            selectedGuides = _.flatten(selectedGuides);
                            var selectedGuideIds = _.map(selectedGuides, function(guide) { return guide.id })

                            return seriesCallback(undefined, selectedGuideIds);
                        // } catch (err) {
                        //     return seriesCallback(err);
                        // }
                    },
                    //populate heroes, talents
                    function (selectedGuideIds, seriesCallback) {
                        async.waterfall([
                            function (waterCallback) {
                                Guide.find({
                                    filter: {
                                        limit: limit,
                                        order: "createdDate DESC",
                                        where: {
                                            id: { inq: selectedGuideIds },
                                            isPublic: true
                                        },
                                        fields: {
                                            name: true,
                                            authorId: true,
                                            slug: true,
                                            voteScore: true,
                                            guideType: true,
                                            premium: true,
                                            id: true,
                                            talentTiers: true,
                                            createdDate: true
                                        },
                                        include: [
                                            {
                                                relation: "author",
                                                scope: {
                                                    fields: ['username']
                                                }
                                            },
                                            {
                                                relation: 'guideHeroes',
                                                scope: {
                                                    include: [
                                                        {
                                                            relation: 'talents'
                                                        },
                                                        {
                                                            relation: 'hero',
                                                            scope: {
                                                                include: (isFeatured !== null) ? false : ['talents'],
                                                                fields: ['name', 'className']
                                                            }
                                                        }
                                                    ]
                                                }
                                            },
                                            {
                                                relation: 'guideTalents',
                                                scope: {
                                                    include: {
                                                        relation: 'talent',
                                                        scope: {
                                                            fields: {
                                                                name: true,
                                                                className: true
                                                            }
                                                        }
                                                    },
                                                }
                                            },
                                            {
                                                relation: 'votes',
                                                scope: {
                                                    fields: {
                                                        id: true,
                                                        direction: true
                                                    }
                                                }
                                            },
                                            {
                                                relation: 'slugs'
                                            }
                                        ]
                                    }
                                }).$promise.then(function (guides) {

                                    _.each(guides, function(guide) {
                                        guide.voteScore = Util.tally(guide.votes, 'direction');
                                        guide.slug = Util.setSlug(guide);
                                    });

                                    return waterCallback(undefined, guides);
                                }).catch(function (err) {
                                    return waterCallback(err);
                                })
                            },
                            function (guides, waterCallback) {
                                Guide.count({
                                    where: {
                                        id: { inq: selectedGuideIds },
                                        isPublic: true
                                    },
                                }).$promise
                                    .then(function (heroGuideCount) {
                                    return seriesCallback(null, guides, heroGuideCount);
                                })
                                    .catch(function (err) {
                                    return waterCallback(err);
                                });
                            }
                        ]);
                    }
                ],
                                function (err, guides, count) {
                    if (err) {
                        console.log("Error:", err);
                    };
                    return finalCallback(err, guides, count);
                })
            }
        }
    }])
    .factory('HeroService', ['$http', '$q', function ($http, $q) {
        return {
            getHeroesList: function () {
                var d = $q.defer();
                $http.post('/hots/heroes/list', {}).success(function (data) {
                    d.resolve(data);
                });
                return d.promise;
            },
            getHeroes: function () {
                var d = $q.defer();
                $http.post('/hots/heroes', {}).success(function (data) {
                    d.resolve(data);
                });
                return d.promise;
            },
            getHero: function (_id) {
                var d = $q.defer();
                $http.post('/hots/hero', { _id: _id }).success(function (data) {
                    d.resolve(data);
                });
                return d.promise;
            },
            getHeroByClass: function (hero) {
                var d = $q.defer();
                $http.post('/hots/hero/class', { hero: hero }).success(function (data) {
                    d.resolve(data);
                });
                return d.promise;
            }
        };
    }])
    .factory('VoteService', ['$http', '$q', function ($http, $q) {
        return {
            voteArticle: function (article) {
                var d = $q.defer();
                $http.post('/api/article/vote', { _id: article._id }).success(function (data) {
                    d.resolve(data);
                });
                return d.promise;
            },
            voteSnapshot: function (direction, snapshot) {
                var d = $q.defer();
                $http.post('/api/snapshot/vote', { _id: snapshot._id, direction: direction }).success(function (data) {
                    d.resolve(data);
                });
                return d.promise;
            },
            voteDeck: function (direction, deck) {
                var d = $q.defer();
                $http.post('/api/deck/vote', { _id: deck._id, direction: direction }).success(function (data) {
                    d.resolve(data);
                });
                return d.promise;
            },
            voteGuide: function (direction, guide) {
                var d = $q.defer();
                $http.post('/api/hots/guide/vote', { _id: guide._id, direction: direction }).success(function (data) {
                    d.resolve(data);
                });
                return d.promise;
            },
            voteComment: function (direction, comment) {
                var d = $q.defer();
                $http.post('/api/comment/vote', { _id: comment._id, direction: direction }).success(function (data) {
                    d.resolve(data);
                });
                return d.promise;
            }
        };
    }])
    .factory('ForumService', ['$http', '$q', function ($http, $q) {
        return {
            getCategories: function () {
                var d = $q.defer();
                $http.post('/forum', {}).success(function (data) {
                    d.resolve(data);
                });
                return d.promise;
            },
            getThread: function (thread) {
                var d = $q.defer();
                $http.post('/forum/thread', { thread: thread }).success(function (data) {
                    d.resolve(data);
                });
                return d.promise;
            },
            getPost: function (thread, post) {
                var d = $q.defer();
                $http.post('/forum/post', { thread: thread, post: post }).success(function (data) {
                    d.resolve(data);
                });
                return d.promise;
            },
            addPost: function (thread, post) {
                return $http.post('/api/forum/post/add', { thread: thread, post: post });
            },
            addComment: function (post, comment) {
                return $http.post('/api/forum/post/comment/add', { post: post, comment: comment });
            }
        };
    }])
    .factory('ImgurService', ['$http', '$q', function ($http, $q) {
        return {
            upload: function (file) {
                var d = $q.defer(),
                    data = new FormData();

                data.append("file", file);

                $http.post('/upload', data).success(function (data) {
                    d.resolve(data);
                });
                return d.promise;
            }
        };
    }])
    .factory('BannerService', ['$http', '$q', function ($http, $q) {
        return {
            getBanners: function (bannerType) {
                var d = $q.defer(),
                    bannerType = bannerType || 'ts';

                $http.post('/banners', { bannerType: bannerType }).success(function (data) {
                    d.resolve(data);
                });
                return d.promise;
            }
        };
    }])
    .factory('TwitchService', ['$http', '$q', function($http, $q) {
        return {
            getStreams: function () {
                var d = $q.defer();
                $http.post('/twitchFeed', { limit: 50 }).success(function (data) {
                    d.resolve(data);
                });
                return d.promise;
            }
        };
    }])
    .factory('TwitterService', ['$http', '$q', function($http, $q) {
        return {
            getFeed: function () {
                var d = $q.defer();
                $http.post('/twitterFeed', { limit: 6 }).success(function (data) {
                    d.resolve(data);
                });
                return d.promise;
            }
        };
    }])
    .factory('ContactService', ['$http', '$q', function ($http, $q) {
        return {
            sendContact: function (contact) {
                return $http.post('/api/contact/send', { contact: contact });
            }
        };
    }])
    .factory('TeamService', ['$http', '$q', function ($http, $q) {
        return {

            getMembers: function (gm) {
                var d = $q.defer();
                $http.post('/team', {gm: gm}).success(function (data) {
                    d.resolve(data);
                });
                return d.promise;
            }
        };
    }])
    .factory('VodService', ['$http', '$q', function ($http, $q) {
        return {
            getLatestVod: function () {
                var d = $q.defer();
                $http.post('/vod').success(function (data) {
                    d.resolve(data);
                });
                return d.promise;
            }
        }
    }])
    .factory('EventService', [function () {

        var EVENT_LOGIN = "EVENT_LOGIN";
        var EVENT_LOGOUT = "EVENT_LOGOUT";

        var listeners = {};
        function registerListener(eventName, listener) {
            if(typeof eventName !== "string")
                throw new Error("event name must be a string");
            if(typeof listener !== "function")
                throw new Error("listener must be a function");

            if(!Array.isArray(listeners[eventName])) {
                listeners[eventName] = [];
            }

            listeners[eventName].push(listener);
        }

        function unregisterListener(eventName, listener) {
            if(typeof eventName !== "string")
                throw new Error("event name must be a string");
            if(typeof listener !== "function")
                throw new Error("listener must be a function");

            if(!Array.isArray(listeners[eventName])) {
                var index = listeners[eventName].indexOf(listener);
                if(index !== -1) {
                    listeners[eventName].splice(index, 1);
                }
            }
        }

        function emit(eventName, data) {
            var _listeners = listeners[eventName];
            if(Array.isArray(_listeners)) {
                for(var key in _listeners) {
                    _listeners[key](data);
                }
            }
        }

        return {
            EVENT_LOGIN: EVENT_LOGIN,
            EVENT_LOGOUT : EVENT_LOGOUT,
            registerListener : registerListener,
            unregisterListener : unregisterListener,
            emit : emit
        }
    }])
    .factory('markitupSettings', [
        function() {
            var factory, markset;
            markset = [
                //here goes your usual markItUp layout
            ];
            factory = {};
            factory.create = function(callback) {
                return {
                    afterInsert: callback,
                    previewParserPath: '',
                    markupSet: markset
                };
            };
            return factory;
        }
    ])
.factory('HearthstoneSnapshotBuilder', ['$state', '$upload', '$compile', '$rootScope', '$timeout', 'bootbox', 'User', 'Util', 'Hearthstone', 'AlertService', 'Snapshot', 'SnapshotAuthor', 'DeckTier', 'DeckMatchup', 'DeckTech', 'CardTech',
    function ($state, $upload, $compile, $rootScope, $timeout, bootbox, User, Util, Hearthstone, AlertService, Snapshot, SnapshotAuthor, DeckTier, DeckMatchup, DeckTech, CardTech) {
        var snapshot = {};
        var maxTrends = 12;
        var snapshotTypes = [
            { key: 'Standard', value: 'standard' },
            { key: 'Wild', value: 'wild' },
            { key: 'Legacy', value: 'legacy' },
        ];
        var hsClasses = [
            'druid',
            'hunter',
            'mage',
            'paladin',
            'priest',
            'rogue',
            'shaman',
            'warlock',
            'warrior'
        ];
        var defaultSnap = {
            snapNum: 1,
            snapshotType: 'standard',
            title: "",
            authors: [],
            slug: {
                url: "",
                linked: true,
            },
            content: {
                intro: "",
                thoughts: ""
            },
            matchups: [],
            tiers: [],
            photoNames: {
                large: "",
                medium: "",
                small: "",
                square: ""
            },
            votes: 0,
            isCommentable: true,
            isActive: false,
            loading: false,
            loaded: false,
            saving: false,
            tierShow: [],
            activeDeck: null,
            activeAuthor: null,
            currentChartTier: 1,
            currentChartDeck: null,
            currentMatchupDeck: [],
            chartTierRanges: []
        };
        var defaultAuthor = {
            id: null,
            user: undefined,
            description: "",
            expertClasses: []
        };
        var defaultTier = {
            tier: 1,
            decks: []
        };
        var defaultTierDeck = {
            name: "",
            description: "",
            weeklyNotes: "",
            deck: undefined,
            ranks: [0,0,0,0,0,0,0,0,0,0,0,0,0],
            deckTech: []
        };
        var defaultDeckMatch = {
            forDeck: undefined,
            againstDeck: undefined,
            forChance: 0,
            againstChance: 0
        };
        var defaultDeckTech = {
            title: "",
            cardTech: [],
            orderNum: 1
        };
        var defaultTechCards = {
            card: undefined,
            toss: false,
            both: false,
            orderNum: 1
        };

        snapshot.new = function (data) {
            // start with default snapshot
            var sb = angular.copy(defaultSnap);
            sb.deleted = {
                authors: [],
                deckTiers: [],
                deckTechs: [],
                cardTechs: [],
                matchups: []
            };
            sb.updated = {
                snapshot: false,
                authors: [],
                deckTiers: [],
                deckTechs: [],
                cardTechs: [],
                matchups: []
            };

            // init
            sb.init = function(data) {
                // if we have data, load it
                if (data) {
                    // load data
                    sb.load(data);
                    
                    // generate tier ranges for charts
                    sb.chartGenerateTierRanges();
                }
            };

            sb.load = function (data) {
                // set slug for snapshot
                sb.slug = Util.setSlug(data);
                
                // set slugs for decks
                data.deckTiers.forEach(function (deckTier) {
                    deckTier.deck.slug = Util.setSlug(deckTier.deck);
                });

                // vars
                sb.authors = data.authors;
                sb.content = data.content;
                sb.createdDate = data.createdDate;
                sb.matchups = data.deckMatchups;
                sb.id = data.id;
                sb.isActive = data.isActive;
                sb.photoNames = data.photoNames;
                sb.snapNum = data.snapNum;
                sb.snapshotType = data.snapshotType;
                sb.tiers = data.tiers;
                sb.title = data.title;
                sb.deckTiers = data.deckTiers;
                sb.tiers = sb.generateTiers(data.deckTiers);
                sb.isCommentable = data.isCommentable;
                
                // comments for frontend
                sb.comments = data.comments || [];
                sb.votes = data.votes || [];
                                
                sb.loaded = true;
            };

            // load latest snapshot and increment snapshot number / shift trends
            sb.loadPrevious = function (snapshotType) {
                // set loading
                sb.loading = true;
                
                // get latest snapshot
                Snapshot.findOne({
                    filter: {
                        where: {
                            snapshotType: snapshotType,
                            isActive: true
                        },
                        order: 'createdDate DESC',
                        include: [
                            {
                                relation: "authors",
                                scope: {
                                    include: {
                                        relation: "user",
                                        scope: {
                                            fields: ["username"]
                                        }
                                    }
                                }
                            },
                            {
                                relation: "deckTiers",
                                scope: {
                                    include: [
                                        {
                                            relation: "deck",
                                            scope: {
                                                fields: ["name", "playerClass"]
                                            }
                                        },
                                        {
                                            relation: "deckTech",
                                            scope: {
                                                include: {
                                                    relation: "cardTech",
                                                    scope: {
                                                        include: {
                                                            relation: "card",
                                                            scope: {
                                                                fields: ["name"]
                                                            }
                                                        }
                                                    }
                                                }
                                            }
                                        }
                                    ]
                                }
                            },
                            {
                                relation: "deckMatchups",
                                scope: {
                                    include: [
                                        {
                                            relation: "forDeck",
                                            scope: {
                                                fields: ["name"]
                                            }
                                        },
                                        {
                                            relation: "againstDeck",
                                            scope: {
                                                fields: ["name"]
                                            }
                                        }
                                    ]
                                }
                            },
                            {
                                relation: 'slugs',
                                scope: {
                                    fields: ['linked', 'slug']
                                }
                            }
                        ]
                    }
                })
                .$promise
                .then(function (data) {
                    console.log('loaded: ', data);
                    // strip ids from old data so new items get created
                    // snapshot
                    delete data.id;
                    
                    // authors
                    _.each(data.authors, function (author) {
                        delete author.snapshotId;
                        delete author.id;
                    });
                    
                    // deck matchups
                    _.each(data.deckMatchups, function (deckMatchup) {
                        delete deckMatchup.snapshotId;
                        delete deckMatchup.id;
                    });
                    
                    // deck tiers
                    _.each(data.deckTiers, function (deckTier) {
                        
                        // deck techs
                        _.each(deckTier.deckTech, function (deckTech) {
                            
                            // tech cards
                            _.each(deckTech.cardTech, function (cardTech) {
                                delete cardTech.deckTechId;
                                delete cardTech.id;
                            });
                            
                            delete deckTech.deckTierId;
                            delete deckTech.id;
                        });
                        
                        delete deckTier.snapshotId;
                        delete deckTier.id;
                    });
                    
                    // increase snapshot number
                    data.snapNum++;
                    
                    // shift deck ranks one week
                    for (var i = 0; i < data.deckTiers.length; i++) {
                        // remove last item
                        data.deckTiers[i].ranks.pop();
                        
                        // duplicate last week's rank to this week
                        data.deckTiers[i].ranks = [data.deckTiers[i].ranks[0]].concat(data.deckTiers[i].ranks);
                    }
                    
                    // load data
                    sb.load(data);
                    
                    // set loading
                    sb.loading = false;
                });
            };
            
            // generate tiers from deckTiers data
            sb.generateTiers = function (deckTiers) {
                var tiers = [];

                // sort decks
                deckTiers.sort(function(a,b) {
                    return (a.ranks[0] - b.ranks[0])
                });

                // tiers
                _.each(deckTiers, function (deck) {
                    if (tiers[deck.tier - 1] === undefined) {
                        tiers[deck.tier - 1] = {
                            tier: deck.tier,
                            decks: []
                        };
                    }

                    tiers[deck.tier - 1].decks.push(deck);
                });

                return tiers;
            };
            
            // toggle active
            sb.toggleActive = function () {
                sb.isActive = !sb.isActive;
                
                // flag snapshot as updated
                sb.snapshotUpdated();
            };
            
            // generate tier range for charts
            sb.chartGenerateTierRanges = function () {
                // loop through each tier
                _.each(sb.tiers, function (tier) {
                    var out = [],
                        highestRank = 0,
                        lowestRank = 0;

                    // find highest and lowest in tier
                    for (var i = 0; i < tier.decks.length; i++) {
                        var history = tier.decks[i].ranks;
                        for (var j = 0; j < history.length; j++) {
                            if (history[j] > highestRank && history[j] != 0) { highestRank = history[j]; }
                            if ((history[j] < lowestRank && history[j] != 0) || lowestRank == 0) { lowestRank = history[j]; }
                        }
                    }

                    // generate range
                    for (var i = lowestRank; i <= highestRank; i++) {
                        out.push(i);
                    }

                    // set chart tier range
                    sb.chartTierRanges[tier.tier] = out;
                });
            };
            
            // get tier range
            sb.getChartTierRange = function (tierNum) {
                return sb.chartTierRanges[tierNum];
            };
            
            // get current chart tier
            sb.getCurrentChartTier = function () {
                return sb.currentChartTier;
            };
            
            // set current chart tier
            sb.setCurrentChartTier = function (tierNum) {
                // don't update if the current tier is already tierNum
                if (sb.getCurrentChartTier() === tierNum) { return false; }
                
                // set tier
                sb.currentChartTier = tierNum;
                
                // unset current chart deck
                sb.currentChartDeck = null;
            };
            
            // get chart position x
            sb.getChartPositionX = function (index, padding) {
                return Math.round(100 - padding - ((100 - padding)/12*index) + (padding / 2), 2);
            };
            
            // get chart position y
            sb.getChartPositionY = function (tierNum, deckIndex, height, padding) {
                var size = sb.getChartTierRange(tierNum).length;
                return Math.round(((height - padding)/size*deckIndex) + padding, 2);
            };
            
            // get chart rank index
            sb.getChartRankIndex = function (tierNum, rank) {
                var range = sb.getChartTierRange(tierNum);
                return range.indexOf(rank);
            };

            // get chart next rank
            sb.getChartNextRank = function (deck, index) {
                return deck.ranks[index + 1];
            };

            // check if chart has next rank
            sb.hasChartNextRank = function (deck, index) {
                return (deck.ranks[index + 1]);
            };
            
            // get timeline for chart
            sb.getChartTimeline = function () {
                var out = [];
                for (var i = sb.snapNum; i > sb.snapNum - 13; i--) {
                    out.push(i);
                }
                return out;
            };
            
            // check if has current chart deck
            sb.hasCurrentChartDeck = function () {
                return (!!sb.getCurrentChartDeck());
            };
            
            // return current chart deck
            sb.getCurrentChartDeck = function () {
                return sb.currentChartDeck;
            };
            
            // toggle current chart deck
            sb.toggleCurrentChartDeck = function (deck) {
                if (sb.hasCurrentChartDeck() && sb.getCurrentChartDeck() === deck) {
                    sb.currentChartDeck = null;
                } else {
                    sb.currentChartDeck = deck;
                }
            };
            
            // get snapshot types
            sb.getSnapshotTypes = function () {
                return snapshotTypes;
            };
            
            // set slug
            sb.setSlug = function () {
                if (!sb.slug.linked) { return false; }
                sb.slug.url = "meta-snapshot-" + sb.snapNum + "-" + Util.slugify(sb.title);
            };

            // toggle if slug is linked to title
            sb.slugToggleLink = function () {
                sb.slug.linked = !sb.slug.linked;
                sb.setSlug();
                
                // flag snapshot as updated
                sb.snapshotUpdated();
            };
            
            // remove image
            sb.removeImage = function () {
                sb.photoNames.square = '';
                sb.photoNames.small = '';
                sb.photoNames.medium = '';
                sb.photoNames.large = '';
                
                // flag snapshot as updated
                sb.snapshotUpdated();
            };
            
            // toggle active
            sb.toggleActive = function () {
                sb.isActive = !sb.isActive;
                
                // flag snapshot as updated
                sb.snapshotUpdated();
            };
            
            // trends array for decks
            sb.getTrends = function () {
                return new Array(maxTrends);
            };
            
            // set active author
            sb.setActiveAuthor = function (author) {
                sb.activeAuthor = author;
            };
            
            // get snapshot author by id
            sb.getAuthorById = function (authorId) {
                for (var i = 0; i < sb.authors.length; i++) {
                    if (sb.authors[i].id === authorId) {
                        return sb.authors[i];
                    }
                }
                return false;
            };
            
            // add author
            sb.authorAdd = function (user) {
                var newAuthor = angular.copy(defaultAuthor);
                newAuthor.user = user;
                sb.authors.push(newAuthor);
            };

            // check if user is already an author on snapshot
            sb.authorExistsById = function (authorId) {
                for (var i = 0; i < sb.authors.length; i++) {
                    if (sb.authors[i].user.id === authorId) {
                        return true;
                    }
                }
                return false;
            };

            // delete author
            sb.authorDeleteById = function (authorId) {
                console.log(authorId);
                
                var index = -1;
                for (var i = 0; i < sb.authors.length; i++) {
                    if (sb.authors[i].user.id === authorId) {
                        index = i;
                        break;
                    }
                }

                if (index !== -1) {
                    // if existing item
                    if (sb.authors[index].id) {
                        // remove update flag
                        sb.removeUpdateFlag('authors', sb.authors[index].id);
                        // add delete flag
                        sb.deleted.authors.push(sb.authors[index].id);
                    }
                    
                    // make sure active author isn't deleted author
                    if (sb.activeAuthor && sb.activeAuthor.user.id === authorId) {
                        sb.activeAuthor = null;
                    };
                    
                    // delete author
                    sb.authors.splice(index, 1);
                }
            };
            
            // get hs classes
            sb.getHearthstoneClasses = function () {
                return hsClasses;
            };
            
            // toggle class for author
            sb.toggleAuthorClass = function (author, klass) {
                // check if class exists
                var index = author.expertClasses.indexOf(klass);
                if (index !== -1) {
                    author.expertClasses.splice(index, 1);
                } else {
                    author.expertClasses.push(klass);
                }
                
                // flag author as updated
                sb.authorUpdated(author);
            };
            
            // return if author has class
            sb.authorHasClass = function (author, klass) {
                var index = author.expertClasses.indexOf(klass);
                return (index !== -1);
            };
            
            // get tier
            sb.getTier = function (tierNum) {
                for (var i = 0; i < sb.tiers.length; i++) {
                    if (sb.tiers[i].tier === tierNum) {
                        return sb.tiers[i];
                    }
                }
                     
                return false;
            };
            
            // add tier
            sb.tierAdd = function () {
                var newTier = angular.copy(defaultTier);
                newTier.tier = sb.tiers.length + 1;
                sb.tiers.push(newTier);
            };

            // delete tier
            sb.tierDelete = function (tier) {
                var index = sb.tiers.indexOf(tier);
                if (index !== -1) {
                    sb.tierDeleteAllDecks(tier);
                    sb.tiers.splice(index, 1);
                    sb.tierUpdateNumbers();
                }
            };

            // update all tier nums
            sb.tierUpdateNumbers = function () {
                var tierNum = 1;
                var oldTier;
                var newTier;
                
                for (var i = 0; i < sb.tiers.length; i++) {
                    sb.tiers[i].tier = tierNum;

                    for (var j = 0; j < sb.tiers[i].decks.length; j++) {
                        oldTier = sb.tiers[i].decks[j].tier;
                        newTier = tierNum;
                        
                        // if tier moves from non matchups to matchups - add matchups for the deck
                        if (oldTier > 2 && newTier < 3) {
                            sb.matchupsAdd(sb.tiers[i].decks[j]);
                        }
                        
                        // set new tier for deck
                        sb.tiers[i].decks[j].tier = newTier;
                    }

                    tierNum++;
                }
            };

            // delete all decks in a tier
            sb.tierDeleteAllDecks = function (tier) {
                if (!tier || !tier.decks || !tier.decks.length) { return false; }
                for (var i = tier.decks.length; i >= 0; i--) {
                    sb.deckDelete(tier, tier.decks[i]);
                }
            };

            // get a tier deck by deck id
            sb.getTierDeckByDeckId = function (deckId) {
                for (var i = 0; i < sb.tiers.length; i++) {
                    for (var j = 0; j < sb.tiers[i].decks.length; j++) {
                        if (sb.tiers[i].decks[j].deck.id === deckId) {
                            return sb.tiers[i].decks[j];
                        }
                    }
                }

                return false;
            };
            
            // set active deck
            sb.setActiveDeck = function (deck) {
                sb.activeDeck = deck;
            };
            
            // add deck
            sb.deckAdd = function (tier, deckName, deck) {
                if (sb.getTierDeckByDeckId(deck.id)) { return false; }
                var newDeck = angular.copy(defaultTierDeck);
                newDeck.tier = tier.tier;
                newDeck.name = deckName;
                newDeck.deck = deck;
                tier.decks.push(newDeck);
                sb.decksUpdateCurrentRanks();
                if (tier.tier <= 2) {
                    sb.matchupsAdd(newDeck);
                    console.log(newDeck);
                }
            };
            
            // change the deck
            sb.deckChange = function (deckTier, newDeck) {
                var oldDeckId = deckTier.deck.id;
                var newDeckId = newDeck.id;
                var matchups = sb.getMatchupsByDeckId(oldDeckId);
                
                console.log('updating deck ', oldDeckId, ' to ', newDeckId);
                
                // update all matchups to new deck id
                for (var i = 0; i < matchups.length; i++) {
                    // swap out deck
                    if (matchups[i].forDeck.id === oldDeckId) {
                        matchups[i].forDeck = newDeck;
                        matchups[i].forDeck = newDeck;
                        matchups[i].forDeckId = newDeckId;
                    }
                    if (matchups[i].againstDeck.id === oldDeckId) {
                        matchups[i].againstDeck = newDeck;
                        matchups[i].againstDeckId = newDeckId;
                    }
                    
                    // mark matchup as updated
                    sb.matchupUpdated(matchups[i]);
                }
                
                // change deck
                deckTier.deck = newDeck;
                deckTier.deckId = newDeckId;
                
                // flag deck tier as updated
                sb.deckTierUpdated(deckTier);
            };
            
            // delete deck
            sb.deckDelete = function (tier, deck) {
                var index = tier.decks.indexOf(deck);
                if (index !== -1) {
                    // if existing item
                    if (deck.id) {
                        // remove update flag
                        sb.removeUpdateFlag('deckTiers', deck.id);
                        // flag deckTier for delete
                        sb.deleted.deckTiers.push(deck.id);
                    }
                                        
                    sb.deckDeleteAllTechs(deck);
                    sb.matchupsDelete(deck);
                    tier.decks.splice(index, 1);
                    sb.decksUpdateCurrentRanks();
                    
                    // make sure not to leave deleted deck active
                    if (sb.activeDeck === deck) {
                        sb.activeDeck = null;
                    }
                }
            };
            
            // get deckTier by Id
            sb.getDeckTierById = function (deckTierId) {
                for (var i = 0; i < sb.tiers.length; i++) {
                    for (var j = 0; j < sb.tiers[i].decks.length; j++) {
                        if (sb.tiers[i].decks[j].id === deckTierId) {
                            console.log(deckTierId, sb.tiers[i].decks[j]);
                            return sb.tiers[i].decks[j];
                        }
                    }
                }
                
                return false;
            };
            
            // update tiers for decks
            sb.decksUpdateTier = function () {
                var tierNum;

                for (var i = 0; i < sb.tiers.length; i++) {
                    tierNum = sb.tiers[i].tier;

                    for (var j = 0; j < sb.tiers[i].decks.length; j++) {
                        sb.tiers[i].decks[j].tier = tierNum;
                    }
                }
                
                // flag all decks as updated
                sb.allDeckTiersUpdated();
            };

            // update order for decks in tiers
            sb.decksUpdateOrder = function () {
                var orderNum;

                for (var i = 0; i < sb.tiers.length; i++) {
                    orderNum = 1;

                    for (var j = 0; j < sb.tiers[i].decks.length; j++) {
                        sb.tiers[i].decks[j].orderNum = orderNum;

                        orderNum++;
                    }
                }
                
                // flag all decks as updated
                sb.allDeckTiersUpdated();
            };

            // update current ranks for decks
            sb.decksUpdateCurrentRanks = function () {
                var rank = 1;
                for (var i = 0; i < sb.tiers.length; i++) {
                    for (var j = 0; j < sb.tiers[i].decks.length; j++) {
                        // update rank for deck
                        sb.tiers[i].decks[j].ranks[0] = rank;

                        // inc rank for next deck
                        rank++;
                    }
                }
                
                // flag all decks as updated
                sb.allDeckTiersUpdated();
            };

            // delete all deck techs in a deck
            sb.deckDeleteAllTechs = function (deck) {
                if (!deck || !deck.deckTech || !deck.deckTech.length) { return false; }
                for (var i = 0; i < deck.deckTech.length; i++) {
                    sb.deckTechDelete(deck, deck.deckTech[i]);
                }
            };
            
            // get deck tech by id
            sb.getDeckTechById = function (deckTechId) {
                for (var i = 0; i < sb.tiers.length; i++) {
                    for (var j = 0; j < sb.tiers[i].decks.length; i++) {
                        for (var k = 0; sb.tiers[i].decks[j].deckTech.length; k++) {
                            if (sb.tiers[i].decks[j].deckTech[k].id === deckTechId) {
                                return sb.tiers[i].decks[j].deckTech[k];
                            }
                        }
                    }
                }
                return false;
            };
            
            // add deck tech
            sb.deckTechAdd = function (deck) {
                var newDeckTech = angular.copy(defaultDeckTech);
                deck.deckTech.push(newDeckTech);
            };

            // delete deck tech
            sb.deckTechDelete = function (deck, deckTech) {
                var index = deck.deckTech.indexOf(deckTech);
                if (index !== -1) {
                    // if existing item
                    if (deckTech.id) {
                        // remove update flag
                        sb.removeUpdateFlag('deckTechs', deckTech.id);
                        // flag deckTech for delete
                        sb.deleted.deckTechs.push(deckTech.id);
                    }

                    // delete cardTechs from deckTech
                    sb.deckDeleteAllTechCards(deckTech);
                    // delete deckTech
                    deck.deckTech.splice(index, 1);
                }
            };

            // delete all deck tech cards in a deck tech
            sb.deckDeleteAllTechCards = function (deckTech) {
                if (!deckTech || !deckTech.cardTech || !deckTech.cardTech.length) { return false; }
                for (var i = 0; i < deckTech.cardTech.length; i++) {
                    sb.deckTechCardDeleteById(deckTech, deckTech.cardTech[i].card.id);
                }
            };
            
            // get deck tech card by id
            sb.getCardTechById = function (cardTechId) {
                console.log('get card by id: ', cardTechId);
                for (var i = 0; i < sb.tiers.length; i++) {
                    for (var j = 0; j < sb.tiers[i].decks.length; i++) {
                        for (var k = 0; sb.tiers[i].decks[j].deckTech.length; k++) {
                            for (var l = 0; l < sb.tiers[i].decks[j].deckTech[k].cardTech.length; l++) {
                                if (sb.tiers[i].decks[j].deckTech[k].cardTech[l].id === cardTechId) {
                                    console.log('found card: ', sb.tiers[i].decks[j].deckTech[k].cardTech[l]);
                                    return sb.tiers[i].decks[j].deckTech[k].cardTech[l];
                                }
                            }
                        }
                    }
                }
                return false;
            };
            
            // add deck tech card
            sb.deckTechCardAdd = function (deckTech, card) {
                if (sb.deckTechCardExistsById(deckTech, card.id)) { return false; }
                var newDeckTechCard = angular.copy(defaultTechCards);
                newDeckTechCard.card = card;
                deckTech.cardTech.push(newDeckTechCard);
            };

            // delete deck tech card
            sb.deckTechCardDeleteById = function (deckTech, cardId) {
                var index = -1;
                for (var i = 0; i < deckTech.cardTech.length; i++) {
                    if (deckTech.cardTech[i].card.id === cardId) {
                        index = i;
                        break;
                    }
                }
                if (index !== -1) {
                    // if existing item
                    if (deckTech.cardTech[index].id) {
                        // remove update flag
                        sb.removeUpdateFlag('cardTechs', deckTech.cardTech[index].id);
                        // flag cardTech for delete
                        sb.deleted.cardTechs.push(deckTech.cardTech[index].id);
                    }
                    
                    // remove cardTech
                    deckTech.cardTech.splice(index, 1);
                }
            };

            // check if card is in deck techs
            sb.deckTechCardExistsById = function (deckTech, cardId) {
                for (var i = 0; i < deckTech.cardTech.length; i++) {
                    if (deckTech.cardTech[i].card.id === cardId) {
                        return true;
                    }
                }
                return false;
            };

            // toggle deck tech card toss
            sb.deckTechCardToggleToss = function (card) {
                card.toss = !card.toss;
                
                // flag cardTech as updated
                sb.cardTechUpdated(card);
            };

            // toggle deck tech card both
            sb.deckTechCardToggleBoth = function (card) {
                card.both = !card.both;
                
                // flag cardTech as updated
                sb.cardTechUpdated(card);
            };

            // return decks that need matchups
            sb.matchupDecks = function () {
                var decks = [];
                var maxTiers = (sb.tiers.length > 2) ? 2 : sb.tiers.length;

                for (var i = 0; i < maxTiers; i++) {
                    for (var j = 0; j < sb.tiers[i].decks.length; j++) {
                        decks.push(sb.tiers[i].decks[j]);
                    }
                }

                return decks;
            };

            // order the matchups by deck ranks
            sb.matchupOrderBy = function (matchup, deck) {
                deck = deck || sb.activeDeck;
                
                if (!deck) { return 0; }
                
                return (matchup.forDeck.id === deck.id) ? sb.getTierDeckByDeckId(matchup.againstDeck.id).ranks[0] : sb.getTierDeckByDeckId(matchup.forDeck.id).ranks[0];
            };
            
            // verify the number of matchups to number of decks in first two tiers
            sb.validMatchups = function () {
                var n = sb.matchupDecks().length;
                return ((n / 2 * (2 + (n - 1))) === sb.matchups.length);
            };

            // get matchup by id
            sb.getMatchupById = function (matchupId) {
                for (var i = 0; i < sb.matchups.length; i++) {
                    if (sb.matchups[i].id === matchupId) {
                        return sb.matchups[i];
                    }
                }
                return false;
            };
            
            // add matchups to each deck for deck
            sb.matchupsAdd = function (deck) {
                var matchupDecks = sb.matchupDecks();

                for (var i = 0; i < matchupDecks.length; i++) {
                    var newMatchup = angular.copy(defaultDeckMatch);
                    newMatchup.forDeck = deck.deck;
                    newMatchup.againstDeck = matchupDecks[i].deck;
                    
                    if (deck.deck.id === matchupDecks[i].deck.id) {
                        newMatchup.forChance = 50;
                        newMatchup.againstChance = 50;
                    }
                    sb.matchups.push(newMatchup);
                    console.log(newMatchup);
                }
            };

            // delete matchups from each deck for deck
            sb.matchupsDelete = function (deck) {
                for (var i = sb.matchups.length - 1; i >= 0; i--) {
                    if (sb.matchups[i].forDeck.id === deck.deck.id || sb.matchups[i].againstDeck.id === deck.deck.id) {
                        // if existing item
                        if (sb.matchups[i].id) {
                            // remove update flag
                            sb.removeUpdateFlag('matchups', sb.matchups[i].id);
                            // flag matchup for delete
                            sb.deleted.matchups.push(sb.matchups[i].id);
                        }
                        
                        sb.matchups.splice(i, 1);
                    }
                }
            };

            // update for chance when updating against chance on a matchup
            sb.matchupChangeAgainstChance = function (matchup) {
                matchup.forChance = (100 - matchup.againstChance);
                
                // flag matchup for update
                if (matchup.id) {
                    sb.updated.matchups.push(matchup.id);
                }
            }

            // update against chance when updating for chance on a matchup
            sb.matchupChangeForChance = function (matchup) {
                matchup.againstChance = (100 - matchup.forChance);
                
                // flag matchup for update
                if (matchup.id) {
                    sb.updated.matchups.push(matchup.id);
                }
            }

            // get matchups by deck id
            sb.getMatchupsByDeckId = function (deckId) {
                var matchups = [];

                for (var i = 0; i < sb.matchups.length; i++) {
                    if (sb.matchups[i].forDeck.id === deckId || sb.matchups[i].againstDeck.id === deckId) {
                        matchups.push(sb.matchups[i]);
                    }
                }

                return matchups;
            };
            
            // get the opposing deck for a deck in a matchup
            sb.getMatchupOpposingDeck = function (deck, matchup) {
                return (deck.deck.id === matchup.forDeck.id) ? sb.getTierDeckByDeckId(matchup.againstDeck.id) : sb.getTierDeckByDeckId(matchup.forDeck.id);
            };
            
            // get the opposing chance for a deck in a matchup
            sb.getMatchupOpposingChance = function (deck, matchup) {
                return (deck.deck.id === matchup.forDeck.id) ? matchup.againstChance : matchup.forChance;
            };
            
            // get current matchup deck
            sb.getCurrentMatchupDeck = function (deck) {
                return sb.currentMatchupDeck[deck.id];
            };
            
            // set current matchup deck
            sb.setCurrentMatchupDeck = function (deck, matchup) {
                sb.currentMatchupDeck[deck.id] = sb.getMatchupOpposingDeck(deck, matchup);
            };
            
            // unset current matchup deck
            sb.unsetCurrentMatchupDeck = function (deck) {
                sb.currentMatchupDeck[deck.id] = null;
            };
            
            // check if current matchup deck exists
            sb.hasCurrentMatchupDeck = function (deck) {
                return (!!sb.currentMatchupDeck[deck.id]);
            };
            
            // photo upload
            sb.photoUpload = function ($files) {
                if (!$files.length) return false;
                var newScope = $rootScope.$new(true);
                newScope.uploading = 0;
                var box = bootbox.dialog({
                    message: $compile('<div class="progress progress-striped active" style="margin-bottom: 0px;"><div class="progress-bar" role="progressbar" aria-valuenow="{{uploading}}" aria-valuemin="0" aria-valuemax="100" style="width: {{uploading}}%;"><span class="sr-only">{{uploading}}% Complete</span></div></div>')(newScope),
                    closeButton: false,
                    animate: false
                });
                box.modal('show');
                for (var i = 0; i < $files.length; i++) {
                    var file = $files[i];
                    newScope.upload = $upload.upload({
                        url: '/api/images/uploadSnapshot',
                        method: 'POST',
                        file: file
                    }).progress(function(evt) {
                        newScope.uploading = parseInt(100.0 * evt.loaded / evt.total);
                    }).success(function(data, status, headers, config) {
                        sb.photoNames = {
                            large: data.large,
                            medium: data.medium,
                            small: data.small,
                            square: data.square
                        };
                        var URL = (tpl === './') ? cdn2 : tpl;
                        sb.snapshotImg = URL + data.path + data.small;
                        box.modal('hide');
                        
                        // mark snapshot as updated
                        sb.snapshotUpdated();
                    });
                }
            };

            // get snapshot image url
            sb.getImage = function () {
                var URL = (tpl === './') ? cdn2 : tpl;
                var imgPath = 'snapshots/';
                return (sb.photoNames && sb.photoNames.small === '') ?  URL + 'img/blank.png' : URL + imgPath + sb.photoNames.small;
            };

            // prompt for adding / removing authors
            sb.authorAddPrompt = function () {
                var newScope = $rootScope.$new(true);
                newScope.authorAdd = sb.authorAdd;
                newScope.authorExistsById = sb.authorExistsById;
                newScope.authorDeleteById = sb.authorDeleteById;

                var box = bootbox.dialog({
                    title: "Authors",
                    message: $compile('<div snapshot-add-author></div>')(newScope),
                    show: false,
                    className: 'modal-admin modal-admin-authors'
                });
                box.modal('show');
            };

            // prompt for author delete
            sb.authorDeletePrompt = function (author) {
                var box = bootbox.dialog({
                    title: "Remove Author?",
                    message: "Are you sure you want to remove the author <strong>" + author.user.username + "</strong>?",
                    buttons: {
                        confirm: {
                            label: "Delete",
                            className: "btn-danger",
                            callback: function () {
                                $timeout(function () {
                                    sb.authorDeleteById(author.user.id);
                                    box.modal('hide');
                                });
                            }
                        },
                        cancel: {
                            label: "Cancel",
                            className: "btn-default pull-left",
                            callback: function () {
                                box.modal('hide');
                            }
                        }
                    },
                    className: 'modal-admin modal-admin-remove',
                    show: false
                });
                box.modal('show');
            };

            // prompt for tier delete
            sb.tierDeletePrompt = function (tier) {
                var box = bootbox.dialog({
                    title: "Remove Tier?",
                    message: "Are you sure you want to remove the tier <strong>Tier " + tier.tier + "</strong>?",
                    buttons: {
                        confirm: {
                            label: "Delete",
                            className: "btn-danger",
                            callback: function () {
                                $timeout(function () {
                                    sb.tierDelete(tier);
                                    box.modal('hide');
                                });
                            }
                        },
                        cancel: {
                            label: "Cancel",
                            className: "btn-default pull-left",
                            callback: function () {
                                box.modal('hide');
                            }
                        }
                    },
                    className: 'modal-admin modal-admin-remove',
                    show: false
                });
                box.modal('show');
            };

            // prompt for adding a deck
            sb.deckAddPrompt = function (tier) {
                var newScope = $rootScope.$new(true);
                
                var box = bootbox.dialog({
                    title: "Decks",
                    message: $compile('<div snapshot-add-deck></div>')(newScope),
                    buttons: {
                        submit: {
                            label: 'Add Deck',
                            className: 'btn-success',
                            callback: function () {
                                if (!newScope.deck) { return false; }
                                
                                $timeout(function () {
                                    sb.deckAdd(tier, newScope.deck.name, newScope.deck);
                                });
                                
                                box.modal('hide');
                            }
                        },
                        cancel: {
                            label: 'Cancel',
                            className: 'btn-default pull-left',
                            callback: function () {
                                box.modal('hide');
                            }
                        }
                    },
                    show: false,
                    className: 'modal-admin modal-admin-decks modal-has-footer'
                });
                box.modal('show');
            };
            
            // prompt for changing a deck
            sb.deckChangePrompt = function (deck) {
                var newScope = $rootScope.$new(true);
                
                var box = bootbox.dialog({
                    title: "Decks",
                    message: $compile('<div snapshot-add-deck></div>')(newScope),
                    buttons: {
                        submit: {
                            label: 'Change Deck',
                            className: 'btn-success',
                            callback: function () {
                                if (!newScope.deck) { return false; }
                                
                                $timeout(function () {
                                    sb.deckChange(deck, newScope.deck);
                                });
                                
                                box.modal('hide');
                            }
                        },
                        cancel: {
                            label: 'Cancel',
                            className: 'btn-default pull-left',
                            callback: function () {
                                box.modal('hide');
                            }
                        }
                    },
                    show: false,
                    className: 'modal-admin modal-admin-decks modal-has-footer'
                });
                box.modal('show');
            };

            // prompt for deck delete
            sb.deckDeletePrompt = function (tier, deck) {
                var box = bootbox.dialog({
                    title: "Remove Deck?",
                    message: "Are you sure you want to remove the deck <strong>" + deck.name + "</strong>?",
                    buttons: {
                        confirm: {
                            label: "Delete",
                            className: "btn-danger",
                            callback: function () {
                                $timeout(function () {
                                    sb.deckDelete(tier, deck);
                                    box.modal('hide');
                                });
                            }
                        },
                        cancel: {
                            label: "Cancel",
                            className: "btn-default pull-left",
                            callback: function () {
                                box.modal('hide');
                            }
                        }
                    },
                    className: 'modal-admin modal-admin-remove',
                    show: false
                });
                box.modal('show');
            };

            // prompt for deck tech delete
            sb.deckTechDeletePrompt = function (deck, deckTech) {
                var box = bootbox.dialog({
                    title: "Remove Deck Tech?",
                    message: "Are you sure you want to remove the deck tech <strong>" + deckTech.title + "</strong>?",
                    buttons: {
                        confirm: {
                            label: "Delete",
                            className: "btn-danger",
                            callback: function () {
                                $timeout(function () {
                                    sb.deckTechDelete(deck, deckTech);
                                    box.modal('hide');
                                });
                            }
                        },
                        cancel: {
                            label: "Cancel",
                            className: "btn-default pull-left",
                            callback: function () {
                                box.modal('hide');
                            }
                        }
                    },
                    className: 'modal-admin modal-admin-remove',
                    show: false
                });
                box.modal('show');
            };

            // prompt for adding / removing cards from deck techs
            sb.deckTechCardAddPrompt = function (deckTech) {
                var newScope = $rootScope.$new(true);
                newScope.deckTech = deckTech;
                newScope.deckTechCardAdd = sb.deckTechCardAdd;
                newScope.deckTechCardExistsById = sb.deckTechCardExistsById;
                newScope.deckTechCardDeleteById = sb.deckTechCardDeleteById;

                var box = bootbox.dialog({
                    title: "Cards",
                    message: $compile('<div snapshot-add-card></div>')(newScope),
                    show: false,
                    className: 'modal-admin modal-admin-cards'
                });
                box.modal('show');
            };

            // prompt for deck tech card delete
            sb.deckTechCardDeletePrompt = function (deckTech, card) {
                var box = bootbox.dialog({
                    title: "Remove Card?",
                    message: "Are you sure you want to remove the card <strong>" + card.card.name + "</strong>?",
                    buttons: {
                        confirm: {
                            label: "Delete",
                            className: "btn-danger",
                            callback: function () {
                                $timeout(function () {
                                    sb.deckTechCardDeleteById(deckTech, card.card.id);
                                    box.modal('hide');
                                });
                            }
                        },
                        cancel: {
                            label: "Cancel",
                            className: "btn-default pull-left",
                            callback: function () {
                                box.modal('hide');
                            }
                        }
                    },
                    className: 'modal-admin modal-admin-remove',
                    show: false
                });
                box.modal('show');
            };
            
            // prompt for load previous
            sb.loadPreviousPrompt = function () {
                var box;
                var newScope = $rootScope.$new(true);
                newScope.snapshotTypes = sb.getSnapshotTypes;
                newScope.loadPrevious = function (snapshotType) {
                    sb.loadPrevious(snapshotType);
                    box.modal('hide');
                }
                
                box = bootbox.dialog({
                    title: "Load Previous Snapshot",
                    message: $compile('<div hs-snapshot-load-previous></div>')(newScope),
                    buttons: {
                        cancel: {
                            label: "Cancel",
                            className: "btn-default pull-left",
                            callback: function () {
                                box.modal('hide');
                            }
                        }
                    },
                    className: 'modal-admin',
                    show: false
                });
                box.modal('show');
            };

            // deck update after dnd ordering
            sb.deckUpdateDND = function (decks, index, deck) {
                var beforeInMatchups = (deck.tier === 1 || deck.tier === 2);
                var movedDeck;
                var afterInMatchups;

                // if dragging active deck, make sure to deactive it
                if (decks[index] === sb.activeDeck) {
                    sb.activeDeck = null;
                }
                
                // remove old position for deck
                decks.splice(index, 1);

                // update all decks
                sb.decksUpdateTier();
                sb.decksUpdateOrder();
                sb.decksUpdateCurrentRanks();
                
                // update matchups for deck if we need to
                movedDeck = sb.getTierDeckByDeckId(deck.deck.id);
                afterInMatchups = (movedDeck.tier === 1 || movedDeck.tier === 2);

                if (beforeInMatchups !== afterInMatchups) {
                    if (afterInMatchups) {
                        sb.matchupsAdd(movedDeck);
                    } else {
                        sb.matchupsDelete(movedDeck);
                    }
                }
            };
            
            // flag snapshot as updated
            sb.snapshotUpdated = function () {
                console.log('snapshot updated');
                
                // don't flag for update if new
                if (!sb.id) { return false; }
                
                // flag for update
                sb.updated.snapshot = true;
            };
            
            // flag author as updated
            sb.authorUpdated = function (author) {
                console.log('author: ', author);
                // don't flag for update if new
                if (!author.id) { return false; }
                
                // check if already flagged
                var index = sb.updated.authors.indexOf(author.id);
                if (index === -1) {
                    sb.updated.authors.push(author.id);
                    console.log('author update flagged: ', author.user.username);
                }
            };
            
            // flag all deckTiers as updated
            sb.allDeckTiersUpdated = function () {
                for (var i = 0; i < sb.tiers.length; i++) {
                    for (var j = 0; j < sb.tiers[i].decks.length; j++) {
                        sb.deckTierUpdated(sb.tiers[i].decks[j]);
                    }
                }
            };
            
            // flag deckTier as updated
            sb.deckTierUpdated = function (deckTier) {
                console.log('deckTier: ', deckTier);
                // don't flag for update if new
                if (!deckTier.id) { return false; }
                
                // check if already flagged
                var index = sb.updated.deckTiers.indexOf(deckTier.id);
                if (index === -1) {
                    sb.updated.deckTiers.push(deckTier.id);
                    console.log('deckTier update flagged: ', deckTier.name);
                }
            };
            
            // flag deckTech as updated
            sb.deckTechUpdated = function (deckTech) {
                console.log('deckTech: ', deckTech);
                // don't flag for update if new
                if (!deckTech.id) { return false; }
                
                // check if already flagged
                var index = sb.updated.deckTechs.indexOf(deckTech.id);
                if (index === -1) {
                    sb.updated.deckTechs.push(deckTech.id);
                    console.log('deckTech update flagged: ', deckTech.title);
                }
            };
            
            // flag cardTech as updated
            sb.cardTechUpdated = function (cardTech) {
                console.log('cardTech: ', cardTech);
                // don't flag for update if new
                if (!cardTech.id) { return false; }
                
                // check if already flagged
                var index = sb.updated.cardTechs.indexOf(cardTech.id);
                if (index === -1) {
                    sb.updated.cardTechs.push(cardTech.id);
                    console.log('cardTech update flagged: ', cardTech.card.name);
                }
            };
            
            // flag matchup as updated
            sb.matchupUpdated = function (matchup) {
                console.log('matchup: ', matchup);
                // don't flag for update if new
                if (!matchup.id) { return false; }
                
                // check if already flagged
                var index = sb.updated.matchups.indexOf(matchup.id);
                if (index === -1) {
                    sb.updated.matchups.push(matchup.id);
                    console.log('matchup update flagged: ', matchup.id);
                }
            };
            
            // remove the update flag for an item
            sb.removeUpdateFlag = function (type, itemId) {
                var updated = sb.updated[type];
                var index = updated.indexOf(itemId);
                if (index !== -1) {
                    updated.splice(index, 1);
                }
            };
            
            // check snapshot before save
            sb.saveCheck = function (callback) {
                console.log('save check');
                async.series([
                    // check snapshot
                    function (cb) {
                        console.log('check snapshot');
                        // check title
                        if (!sb.title || !sb.title.length) {
                            return cb("Snapshot doesn't have a title");
                        }
                        
                        // check url
                        if (!sb.slug || !sb.slug.url || !sb.slug.url.length) {
                            return cb("Snapshot doesn't have a url");
                        }
                        
                        // check type
                        if (!sb.snapshotType || !sb.snapshotType.length) {
                            return cb("Snapshot doesn't have a type");
                        }
                        
                        // check image
                        if (!sb.photoNames || !sb.photoNames.square || !sb.photoNames.square.length || !sb.photoNames.small || !sb.photoNames.small.length || !sb.photoNames.medium || !sb.photoNames.medium.length || !sb.photoNames.large || !sb.photoNames.large.length) {
                            return cb("Snapshot doesn't have an image");
                        }
                        
                        // check active
                        if (sb.isActive === undefined || (sb.isActive !== true && sb.isActive !== false)) {
                            return cb("Snapshot active field is set to an invalid value");
                        }
                        
                        // check intro
                        if (!sb.content || !sb.content.intro || !sb.content.intro.length) {
                            return cb("Snapshot does not have an introduction");
                        }
                        
                        // check thoughts
                        if (!sb.content || !sb.content.thoughts || !sb.content.thoughts.length) {
                            return cb("Snapshot does not have thoughts and observations");
                        }
                        
                        return cb();
                    },
                    // check authors
                    function (cb) {
                        console.log('check authors');
                        // check that at least 1 author exists
                        if (!sb.authors || !sb.authors.length) {
                            return cb("Snapshot doesn't have any authors");
                        }
                        
                        // check each author
                        for (var i = 0; i < sb.authors.length; i++) {
                            // check author expert classes
                            if (!sb.authors[i].expertClasses || !sb.authors[i].expertClasses.length) {
                                return cb("Author " + sb.authors[i].user.username + " has no expert class");
                            }
                            
                            // check description
                            if (!sb.authors[i].description || !sb.authors[i].description.length) {
                                return cb("Author " + sb.authors[i].user.username + " has no description");
                            }
                        }
                        
                        // TODO: verify all classes selected
                        // TODO: verify no duplicate classes used

                        return cb();
                    },
                    // check tiers / decks
                    function (cb) {
                        console.log('check tiers');
                        // make sure at least 1 tier
                        if (!sb.tiers || !sb.tiers.length) {
                            return cb("Snapshot doesn't have any tiers");
                        }
                        
                        // loop trough each tier
                        for (var tierInc = 0; tierInc < sb.tiers.length; tierInc++) {
                            // make sure at least 1 deck in tier
                            if (!sb.tiers[tierInc].decks || !sb.tiers[tierInc].decks.length) {
                                return cb("Tier " + sb.tiers[tierInc].tier + " doesn't have any decks");
                            }

                            // check each deck
                            for (var deckInc = 0; deckInc < sb.tiers[tierInc].length; deckInc++) {
                                // check deck name
                                if (!sb.tiers[tierInc].decks[deckInc].name || !sb.tiers[tierInc].decks[deckInc].name.length) {
                                    return cb("Deck at rank " + sb.tiers[tierInc].decks[deckInc].ranks[0] + " has no name");
                                }
                                
                                // check deck exists
                                if (!sb.tiers[tierInc].decks[deckInc].deck || !sb.tiers[tierInc].decks[deckInc].deck.id || !sb.tiers[tierInc].decks[deckInc].deck.id.length) {
                                    return cb("Deck " + sb.tiers[tierInc].decks[deckInc].name + " has no deck attached");
                                }
                                
                                // check description
                                if (!sb.tiers[tierInc].decks[deckInc].description || !sb.tiers[tierInc].decks[deckInc].description.length) {
                                    return cb("Deck " + sb.tiers[tierInc].decks[deckInc].name + " has no description");
                                }
                                
                                // check weekly notes
                                if (!sb.tiers[tierInc].decks[deckInc].weeklyNotes || !sb.tiers[tierInc].decks[deckInc].weeklyNotes.length) {
                                    return cb("Deck " + sb.tiers[tierInc].decks[deckInc].name + " has no weekly notes");
                                }
                                
                                // check weekly trends
                                if (!sb.tiers[tierInc].decks[deckInc].ranks || !sb.tiers[tierInc].decks[deckInc].ranks.length || (!sb.tiers[tierInc].decks[deckInc].ranks.length === (maxTrends + 1))) {
                                    return cb("Deck " + sb.tiers[tierInc].decks[deckInc].name + " has no weekly trends");
                                }
                                
                                // check each deck tech if any exist
                                for (var deckTechCnt = 0; deckTechCnt < sb.tiers[tierInc].decks[deckInc].deckTech.length; deckTechCnt++) {
                                    // check title
                                    if (!sb.tiers[tierInc].decks[deckInc].deckTech[deckTechCnt].title || !sb.tiers[tierInc].decks[deckInc].deckTech[deckTechCnt].title.length) {
                                        return cb("Deck " + sb.tiers[tierInc].decks[deckInc].name + " has a deck tech with no title");
                                    }
                                    
                                    // check that it has at least 1 card
                                    if (!sb.tiers[tierInc].decks[deckInc].deckTech[deckTechCnt].cards || !sb.tiers[tierInc].decks[deckInc].deckTech[deckTechCnt].cards.length) {
                                        return cb("Deck " + sb.tiers[tierInc].decks[deckInc].name + " has a deck tech with no cards");
                                    }
                                    
                                    // TODO: check that there are no class cards for different class than deck
                                }

                            }
                        }

                        return cb();
                    },
                    // verify matchups
                    function (cb) {
                        console.log('check matchups');
                        // check that matchups count matches number of decks
                        if (!sb.validMatchups()) {
                            return cb("FATAL ERROR: Number of matchups do not match number of decks");
                        }

                        return cb();
                    }
                ], function (err) {
                    return callback(err);
                });
            };
            
            // delete items on save
            sb.saveDelete = function (callback) {
                console.log('begin deleted: ', sb.deleted);
                async.series([
                    // delete card techs
                    function (cb) {
                        console.log('deleting card techs');
                        // skip if nothing to delete
                        if (!sb.deleted.cardTechs.length) { return cb(); }
                        
                        async.each(sb.deleted.cardTechs, function (cardTechId, eachCallback) {
                            CardTech.deleteById({ id: cardTechId })
                            .$promise
                            .then(function (data) {
                                console.log('deleted cardTech: ', cardTechId);
                                // reset deleted flags
                                var index = sb.deleted.cardTechs.indexOf(cardTechId);
                                if (index !== -1) {
                                    sb.deleted.cardTechs.splice(index, 1);
                                }
                                // next
                                return eachCallback();
                            })
                            .catch(function (response) {
                                return eachCallback(response);
                            });
                        }, function (err) {
                            if (err) {
                                console.log('delete cardTech error: ', err);
                            }
                            return cb(err);
                        });
                    },
                    // delete deck techs
                    function (cb) {
                        console.log('deleting deck techs');
                        // skip if nothing to delete
                        if (!sb.deleted.deckTechs.length) { return cb(); }
                        
                        async.each(sb.deleted.deckTechs, function (deckTechId, eachCallback) {
                            DeckTech.deleteById({ id: deckTechId })
                            .$promise
                            .then(function (data) {
                                console.log('deleted deckTech: ', deckTechId);
                                // reset deleted flags
                                var index = sb.deleted.deckTechs.indexOf(deckTechId);
                                if (index !== -1) {
                                    sb.deleted.deckTechs.splice(index, 1);
                                }
                                // next
                                return eachCallback();
                            })
                            .catch(function (response) {
                                return eachCallback(response);
                            });
                        }, function (err) {
                            if (err) {
                                console.log('delete deckTech error: ', err);
                            }
                            return cb(err);
                        });
                    },
                    // delete deck tiers
                    function (cb) {
                        console.log('deleting deck tiers');
                        // skip if nothing to delete
                        if (!sb.deleted.deckTiers.length) { return cb(); }
                        
                        async.each(sb.deleted.deckTiers, function (deckTierId, eachCallback) {
                            DeckTier.deleteById({ id: deckTierId })
                            .$promise
                            .then(function (data) {
                                console.log('deleted deckTier: ', deckTierId);
                                // reset deleted flags
                                var index = sb.deleted.deckTiers.indexOf(deckTierId);
                                if (index !== -1) {
                                    sb.deleted.deckTiers.splice(index, 1);
                                }
                                // next
                                return eachCallback();
                            })
                            .catch(function (response) {
                                return eachCallback(response);
                            });
                        }, function (err) {
                            if (err) {
                                console.log('delete deckTier error: ', err);
                            }
                            return cb(err);
                        });
                    },
                    // delete deck matchups
                    function (cb) {
                        console.log('deleting matchups');
                        // skip if nothing to delete
                        if (!sb.deleted.matchups.length) { return cb(); }
                        
                        async.each(sb.deleted.matchups, function (matchupId, eachCallback) {
                            DeckMatchup.deleteById({ id: matchupId })
                            .$promise
                            .then(function (data) {
                                console.log('deleted matchup: ', matchupId);
                                // reset deleted flags
                                var index = sb.deleted.matchups.indexOf(matchupId);
                                if (index !== -1) {
                                    sb.deleted.matchups.splice(index, 1);
                                }
                                // next
                                return eachCallback();
                            })
                            .catch(function (response) {
                                return eachCallback(response);
                            });
                        }, function (err) {
                            if (err) {
                                console.log('delete matchup error: ', err);
                            }
                            return cb(err);
                        });
                    },
                    // delete authors
                    function (cb) {
                        console.log('deleting authors');
                        // skip if nothing to delete
                        if (!sb.deleted.authors.length) { return cb(); }
                        
                        async.each(sb.deleted.authors, function (authorId, eachCallback) {
                            SnapshotAuthor.deleteById({ id: authorId })
                            .$promise
                            .then(function (data) {
                                console.log('deleted author: ', authorId);
                                // reset deleted flags
                                var index = sb.deleted.authors.indexOf(authorId);
                                if (index !== -1) {
                                    sb.deleted.authors.splice(index, 1);
                                }
                                // next
                                return eachCallback();
                            })
                            .catch(function (response) {
                                return eachCallback(response);
                            });
                        }, function (err) {
                            if (err) {
                                console.log('delete author error: ', err);
                            }
                            return cb(err);
                        });
                    }
                ], function (err) {
                    console.log('done deleting');
                    console.log('deleted: ', sb.deleted);
                    return callback();
                });
            };
            
            // update items on save
            sb.saveUpdate = function (callback) {
                console.log('begin updated: ', sb.updated);
                async.series([
                    // update card techs
                    function (cb) {
                        console.log('updating card techs');
                        // skip if nothing to update
                        if (!sb.updated.cardTechs.length) { return cb(); }
                        
                        async.each(sb.updated.cardTechs, function (cardTechId, eachCallback) {
                            var cardTech = sb.getCardTechById(cardTechId);
                            CardTech.update({
                                where: {
                                    id: cardTechId
                                }
                            }, {
                                both: cardTech.both || false,
                                toss: cardTech.toss || false,
                                cardId: cardTech.card.id
                            })
                            .$promise
                            .then(function (data) {
                                console.log('updated cardTech: ', cardTechId);
                                // reset updated flags
                                var index = sb.updated.cardTechs.indexOf(cardTechId);
                                if (index !== -1) {
                                    sb.updated.cardTechs.splice(index, 1);
                                }
                                // next
                                return eachCallback();
                            })
                            .catch(function (response) {
                                return eachCallback(response);
                            });
                        }, function (err) {
                            if (err) {
                                console.log('update cardTech error: ', err);
                            }
                            return cb(err);
                        });
                    },
                    // delete deck techs
                    function (cb) {
                        console.log('update deck techs');
                        // skip if nothing to update
                        if (!sb.updated.deckTechs.length) { return cb(); }
                        
                        async.each(sb.updated.deckTechs, function (deckTechId, eachCallback) {
                            var deckTech = sb.getDeckTechById(deckTechId);
                            DeckTech.update({
                                where: {
                                    id: deckTechId
                                }
                            }, {
                                title: deckTech.title
                            })
                            .$promise
                            .then(function (data) {
                                console.log('updated deckTech: ', deckTechId);
                                // reset updated flags
                                var index = sb.updated.deckTechs.indexOf(deckTechId);
                                if (index !== -1) {
                                    sb.updated.deckTechs.splice(index, 1);
                                }
                                // next
                                return eachCallback();
                            })
                            .catch(function (response) {
                                return eachCallback(response);
                            });
                        }, function (err) {
                            if (err) {
                                console.log('update deckTech error: ', err);
                            }
                            return cb(err);
                        });
                    },
                    // update deck tiers
                    function (cb) {
                        console.log('updating deck tiers');
                        // skip if nothing to update
                        if (!sb.updated.deckTiers.length) { return cb(); }
                        
                        async.each(sb.updated.deckTiers, function (deckTierId, eachCallback) {
                            var deckTier = sb.getDeckTierById(deckTierId);
                            DeckTier.update({
                                where: {
                                    id: deckTierId
                                }
                            }, {
                                name: deckTier.name,
                                description: deckTier.description,
                                weeklyNotes: deckTier.weeklyNotes,
                                deckId: deckTier.deck.id,
                                ranks: deckTier.ranks,
                                tier: deckTier.tier
                            })
                            .$promise
                            .then(function (data) {
                                console.log('updated deckTier: ', deckTierId);
                                // reset updated flags
                                var index = sb.updated.deckTiers.indexOf(deckTierId);
                                if (index !== -1) {
                                    sb.updated.deckTiers.splice(index, 1);
                                }
                                // next
                                return eachCallback();
                            })
                            .catch(function (response) {
                                return eachCallback(response);
                            });
                        }, function (err) {
                            if (err) {
                                console.log('update deckTier error: ', err);
                            }
                            return cb(err);
                        });
                    },
                    // update deck matchups
                    function (cb) {
                        console.log('updating matchups');
                        // skip if nothing to update
                        if (!sb.updated.matchups.length) { return cb(); }
                        
                        async.each(sb.updated.matchups, function (matchupId, eachCallback) {
                            var matchup = sb.getMatchupById(matchupId);
                            DeckMatchup.update({
                                where: {
                                    id: matchupId
                                }
                            }, {
                                forDeckId: matchup.forDeck.id,
                                againstDeckId: matchup.againstDeck.id,
                                forChance: matchup.forChance,
                                againstChance: matchup.againstChance
                            })
                            .$promise
                            .then(function (data) {
                                console.log('updated matchup: ', matchupId);
                                // reset updated flags
                                var index = sb.updated.matchups.indexOf(matchupId);
                                if (index !== -1) {
                                    sb.updated.matchups.splice(index, 1);
                                }
                                // next
                                return eachCallback();
                            })
                            .catch(function (response) {
                                return eachCallback(response);
                            });
                        }, function (err) {
                            if (err) {
                                console.log('update matchup error: ', err);
                            }
                            return cb(err);
                        });
                        
                    },
                    // update authors
                    function (cb) {
                        console.log('updating authors');
                        // skip if nothing to update
                        if (!sb.updated.authors.length) { return cb(); }
                        
                        async.each(sb.updated.authors, function (authorId, eachCallback) {
                            var author = sb.getAuthorById(authorId);
                            SnapshotAuthor.update({
                                where: {
                                    id: authorId
                                }
                            }, {
                                description: author.description,
                                expertClasses: author.expertClasses
                            })
                            .$promise
                            .then(function (data) {
                                console.log('updated author: ', authorId);
                                // reset updated flags
                                var index = sb.updated.authors.indexOf(authorId);
                                if (index !== -1) {
                                    sb.updated.authors.splice(index, 1);
                                }
                                // next
                                return eachCallback();
                            })
                            .catch(function (response) {
                                return eachCallback(response);
                            });
                        }, function (err) {
                            if (err) {
                                console.log('update author error: ', err);
                            }
                            return cb(err);
                        });
                    },
                    // update snapshot
                    function (cb) {
                        console.log('updating snapshot');
                        // skip if nothing to update
                        if (!sb.updated.snapshot || !sb.id) { return cb(); }
                        
                        Snapshot.update({
                            where: {
                                id: sb.id
                            }
                        }, {
                            snapNum: sb.snapNum,
                            snapshotType: sb.snapshotType,
                            title: sb.title,
                            slugOptions: {
                                slug: sb.slug.url,
                                linked: sb.slug.linked
                            },
                            content: sb.content,
                            photoNames: sb.photoNames,
                            isActive: sb.isActive
                        })
                        .$promise
                        .then(function (data) {
                            console.log('updated snapshot: ', sb.id);
                            // reset updated flags
                            sb.updated.snapshot = false;
                            // next
                            return cb();
                        })
                        .catch(function (response) {
                            console.log('update snapshot error: ', response);
                            return cb(response);
                        });
                    }
                ], function (err) {
                    console.log('done updating');
                    console.log('updated: ', sb.updated);
                    return callback();
                });
            };
            
            // create new items on save
            sb.saveCreate = function (callback) {
                async.waterfall([
                    // create snapshot
                    function (cb) {
                        if (sb.id) { return cb(null, sb.id); }
                        console.log('snapshot: ', {
                            snapNum: sb.snapNum,
                            title: sb.title,
                            snapshotType: sb.snapshotType,
                            slug: {
                                url: sb.slug.url,
                                linked: sb.slug.linked
                            },
                            content: {
                                intro: sb.content.intro,
                                thoughts: sb.content.thoughts
                            },
                            photoNames: {
                                square: sb.photoNames.square || '',
                                small: sb.photoNames.small || '',
                                medium: sb.photoNames.medium || '',
                                large: sb.photoNames.large || ''
                            },
                            isCommentable: sb.isCommentable,
                            isActive: sb.isActive
                        });
                        
                        Snapshot.create({
                            snapNum: sb.snapNum,
                            title: sb.title,
                            snapshotType: sb.snapshotType,
                            slugOptions: {
                                slug: sb.slug.url,
                                linked: sb.slug.linked
                            },
                            content: {
                                intro: sb.content.intro,
                                thoughts: sb.content.thoughts
                            },
                            photoNames: {
                                square: sb.photoNames.square || '',
                                small: sb.photoNames.small || '',
                                medium: sb.photoNames.medium || '',
                                large: sb.photoNames.large || ''
                            },
                            isCommentable: sb.isCommentable,
                            isActive: sb.isActive
                        })
                        .$promise
                        .then(function (data) {
                            sb.id = data.id;
                            return cb(null, data.id);
                        })
                        .catch(function (response) {
                            return cb(response);
                        });
                    },
                    // create authors
                    function (snapshotId, cb) {
                        console.log('creating authors');
                        async.each(sb.authors, function (author, eachCallback) {
                            // only create authors without ids
                            if (author.id) { return eachCallback(); }
                            // create new author
                            SnapshotAuthor.create({
                                description: author.description,
                                expertClasses: author.expertClasses,
                                snapshotId: snapshotId,
                                authorId: author.user.id
                            })
                            .$promise
                            .then(function (data) {
                                author.id = data.id;
                                return eachCallback();
                            })
                            .catch(function (response) {
                                return eachCallback(response);
                            });
                        }, function (err) {
                            if (err) { return cb(err); }
                            return cb(null, snapshotId);
                        });
                    },
                    // create deck tiers
                    function (snapshotId, cb) {
                        console.log('creating deck tiers');
                        async.each(sb.tiers, function (tier, eachTierCallback) {
                            async.each(tier.decks, function (deckTier, eachDeckCallback) {
                                // only create deck tiers without ids
                                if (deckTier.id) { return eachDeckCallback(); }
                                // create new deck tier
                                var newDeckTier = {
                                    description: deckTier.description,
                                    weeklyNotes: deckTier.weeklyNotes,
                                    name: deckTier.name,
                                    tier: deckTier.tier,
                                    deckId: deckTier.deck.id,
                                    snapshotId: snapshotId,
                                    ranks: deckTier.ranks
                                };
                                console.log('Created Deck Tier: ', newDeckTier);
                                DeckTier.create(newDeckTier)
                                .$promise
                                .then(function (data) {
                                    deckTier.id = data.id;
                                    return eachDeckCallback();
                                })
                                .catch(function (response) {
                                    return eachDeckCallback(response);
                                });
                            }, function (err) {
                                if (err) { return cb(err); }
                                return eachTierCallback();
                            });
                        }, function (err) {
                            if (err) { return cb(err); }
                            return cb(null, snapshotId);
                        });
                    },
                    // create deck techs
                    function (snapshotId, cb) {
                        console.log('creating deck techs');
                        async.each(sb.tiers, function (tier, eachTierCallback) {
                            async.each(tier.decks, function (deckTier, eachDeckTierCallback) {
                                async.each(deckTier.deckTech, function (deckTech, eachDeckTechCallback) {
                                    // only create deck techs without ids
                                    if (deckTech.id) { return eachDeckTechCallback(); }
                                    // create new deck tech
                                    var newDeckTech = {
                                        title: deckTech.title,
                                        deckId: deckTier.deck.id,
                                        deckTierId: deckTier.id
                                    };
                                    console.log('Created Deck Tech: ', newDeckTech);
                                    DeckTech.create(newDeckTech)
                                    .$promise
                                    .then(function (data) {
                                        deckTech.id = data.id;
                                        return eachDeckTechCallback();
                                    })
                                    .catch(function (response) {
                                        return eachDeckTechCallback(response);
                                    });
                                }, function (err) {
                                    if (err) { return cb(err); }
                                    return eachDeckTierCallback();
                                });
                            }, function (err) {
                                if (err) { return cb(err); }
                                return eachTierCallback();
                            });
                        }, function (err) {
                            if (err) { return cb(err); }
                            return cb(null, snapshotId);
                        });
                    },
                    // create deck tech cards
                    function (snapshotId, cb) {
                        console.log('creating deck tech cards');
                        async.each(sb.tiers, function (tier, eachTierCallback) {
                            async.each(tier.decks, function (deckTier, eachDeckTierCallback) {
                                async.each(deckTier.deckTech, function (deckTech, eachDeckTechCallback) {
                                    async.each(deckTech.cardTech, function (cardTech, eachCardTechCallback) {
                                        // only create deck techs without ids
                                        if (cardTech.id) { return eachCardTechCallback(); }
                                        // create new deck tech
                                        var newCardTech = {
                                            both: cardTech.both || false,
                                            toss: cardTech.toss || false,
                                            cardId: cardTech.card.id,
                                            deckTechId: deckTech.id
                                        };
                                        console.log('Created Card Tech: ', newCardTech);
                                        CardTech.create(newCardTech)
                                        .$promise
                                        .then(function (data) {
                                            cardTech.id = data.id;
                                            return eachCardTechCallback();
                                        })
                                        .catch(function (response) {
                                            return eachCardTechCallback(response);
                                        });
                                    }, function (err) {
                                        if (err) { return cb(err); }
                                        return eachDeckTechCallback();
                                    });
                                }, function (err) {
                                    if (err) { return cb(err); }
                                    return eachDeckTierCallback();
                                });
                            }, function (err) {
                                if (err) { return cb(err); }
                                return eachTierCallback();
                            });
                        }, function (err) {
                            if (err) { return cb(err); }
                            return cb(null, snapshotId);
                        });
                    },
                    // create matchups
                    function (snapshotId, cb) {
                        console.log('creating matchups');
                        async.each(sb.matchups, function (matchup, eachCallback) {
                            // only create matchups without ids
                            if (matchup.id) { return eachCallback(); }
                            // create new deck tier
                            DeckMatchup.create({
                                forChance: matchup.forChance,
                                againstChance: matchup.againstChance,
                                forDeckId: matchup.forDeck.id,
                                againstDeckId: matchup.againstDeck.id,
                                snapshotId: snapshotId
                            })
                            .$promise
                            .then(function (data) {
                                matchup.id = data.id;
                                return eachCallback();
                            })
                            .catch(function (response) {
                                return eachCallback(response);
                            });
                        }, function (err) {
                            if (err) { return cb(err); }
                            return cb(null, snapshotId);
                        });
                    }
                ], function (err) {
                    if (err) {
                        console.error('Save create error: ', err);
                        return callback(err);
                    }
                    console.log('done creating');
                    return callback();
                });
            };
            
            // save snapshot
            sb.save = function () {
                console.log('snapshot: ', sb);
                sb.saving = true;
                
                // reset errors
                AlertService.reset();
                
                async.waterfall([
                    sb.saveCheck,
                    sb.saveDelete,
                    sb.saveUpdate,
                    sb.saveCreate
                ], function (err) {
                    $timeout(function () {
                        sb.saving = false;
                    });
                    
                    if (err) {
                        if (typeof err === 'string') {
                            AlertService.setError({
                                msg: 'Snapshot Error',
                                errorList: [err],
                                show: true
                            });
                        } else {
                            return AlertService.setError({
                                msg: 'Snapshot Error',
                                lbErr: err,
                                show: true
                            });
                        }
                    } else {
                        $state.go('app.admin.hearthstone.snapshots.list');
                    }
                    
                    console.log('done saving');
                });
                
            };

            // run init
            sb.init(data);

            // return instance
            return sb;
        };

        // return service
        return snapshot;
    }
])
;
