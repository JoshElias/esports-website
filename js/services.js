'use strict';

angular.module('app.services', [])
.factory('AuthenticationService', function() {
    var loggedIn = false,
        admin = false;

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
        }
    }
})
.factory('UserService', function($http) {
    return {
        login: function (email, password) {
            return $http.post('/login', {email: email, password: password});
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
            username = '';
            profileImg = '';
        }
    }
})
.factory('ArticleService', function ($http, $q) {
    return {
        getArticles: function (klass, page, perpage) {
            var d = $q.defer(),
                page = page || 1,
                perpage = perpage || 20;
            $http.post('/articles', { klass: klass, page: page, perpage: perpage }).success(function (data) {
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
})
.factory('ProfileService', function ($http, $q) {
    return {
        getProfile: function (username) {
            var d = $q.defer();
            $http.post('/profile/' + username, {}).success(function (data) {
                d.resolve(data);
            });
            return d.promise;
        },
        getActivity: function (username, page, perpage) {
            var d = $q.defer(),
                page = page || 1,
                perpage = perpage || 20;
            $http.post('/profile/' + username + '/activity', { page: page, perpage: perpage }).success(function (data) {
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
        }
    };
})
.factory('TokenInterceptor', function ($q, $window) {
    return {
        request: function (config) {
            config.headers = config.headers || {};
            if ($window.sessionStorage.token) {
                config.headers.Authorization = 'Bearer ' + $window.sessionStorage.token;
            }
            return config;
        },
 
        response: function (response) {
            return response || $q.when(response);
        }
    };
})
.factory('AdminCardService', function ($http, $q) {
    return {
        getCards: function () {
            var d = $q.defer();
            $http.post('/api/admin/cards', {}).success(function (data) {
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
})
.factory('AlertService', function () {
    var success = {},
        error = {},
        alert = false;
    return {
        getSuccess: function () {
            return success;
        },
        setSuccess: function (value) {
            success = value;
            alert = true;
        },
        getError: function () {
            return error;
        },
        setError: function (value) {
            error = value;
            alert = true;
        },
        reset: function () {
            success = {};
            error = {};
            alert = false;
        },
        hasAlert: function () {
            return alert;
        }
    }
})
.factory('AdminArticleService', function ($http, $q) {
    return {
        getAllArticles: function () {
            var d = $q.defer();
            $http.post('/api/admin/articles/all', {}).success(function (data) {
                d.resolve(data);
            });
            return d.promise;
        },
        getArticles: function () {
            var d = $q.defer();
            $http.post('/api/admin/articles', {}).success(function (data) {
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
        }
    }
})
.factory('AdminDeckService', function ($http, $q) {
    return {
        getAllDecks: function () {
            var d = $q.defer();
            $http.post('/api/admin/decks/all', {}).success(function (data) {
                d.resolve(data);
            });
            return d.promise;
        },
        getDecks: function (page, perpage) {
            var d = $q.defer();
            $http.post('/api/admin/decks', { page: page, perpage: perpage }).success(function (data) {
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
})
.factory('AdminUserService', function ($http, $q) {
    return {
        getAdmins: function () {
            var d = $q.defer();
            $http.post('/api/admin/users/admins', {}).success(function (data) {
                d.resolve(data);
            });
            return d.promise;
        },
        getUsers: function (page, perpage) {
            var d = $q.defer();
            $http.post('/api/admin/users', { page: page, perpage: perpage }).success(function (data) {
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
})
.factory('AdminForumService', function ($http, $q) {
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
})
.service('Pagination', function () {
    
    var pagination = {};
    
    pagination.new = function (perpage) {
        
        perpage = perpage || 50;
        
        var paginate = {
            page: 1,
            perpage: perpage
        };

        paginate.results = function () {
            return 0;
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

        paginate.setPage = function (page) {
            paginate.page = page;
        };
        
        return paginate;
    }
    
    return pagination;
})
.factory('Util', function () {
    return {
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
        }
    }
})
.factory('Hearthstone', function () {
    var hs = {};
    
    hs.types = ['Minion', 'Spell', 'Weapon'];
    hs.rarities = ['Basic', 'Common', 'Rare', 'Epic', 'Legendary'];
    hs.races = ['', 'Beast', 'Demon', 'Dragon', 'Murloc', 'Pirate', 'Totem', 'Mech'];
    hs.classes = ['Neutral', 'Druid', 'Hunter', 'Mage', 'Paladin', 'Priest', 'Rogue', 'Shaman', 'Warlock', 'Warrior'];
    hs.mechanics = ['Battlecry', 'Charge', 'Choose One', 'Combo', 'Deathrattle', 'Divine Shield', 'Enrage', 'Freeze', 'Overload', 'Secret', 'Silence', 'Spell Damage', 'Stealth', 'Summon', 'Taunt', 'Windfury'];
    hs.deckTypes = ['None', 'Aggro', 'Control', 'Midrange', 'Combo', 'Theory Craft'];
    hs.expansions = ['Basic', 'Naxxramas', 'Goblins Vs. Gnomes'];
    
    return hs;
})
.factory('DeckBuilder', function ($sce, $http, $q) {

    var deckBuilder = {};

    deckBuilder.new = function (playerClass, data) {
        data = data || {};
        
        var d = new Date();
        d.setMonth(d.getMonth() + 1);
        
        var db = {
            _id: data._id || null,
            name: data.name || '',
            description: data.description || '',
            deckType: data.deckType || 'None',
            contentEarly: data.contentEarly || '',
            contentMid: data.contentMid || '',
            contentLate: data.contentLate || '',
            cards: data.cards || [],
            playerClass: playerClass,
            arena: data.arena || false,
            mulligans: data.mulligans || [{
                    klass: 'Mage',
                    withCoin: {
                        cards: [],
                        instructions: ''
                    },
                    withoutCoin: {
                        cards: [],
                        instructions: ''
                    }
                },{
                    klass: 'Shaman',
                    withCoin: {
                        cards: [],
                        instructions: ''
                    },
                    withoutCoin: {
                        cards: [],
                        instructions: ''
                    }
                },{
                    klass: 'Warrior',
                    withCoin: {
                        cards: [],
                        instructions: ''
                    },
                    withoutCoin: {
                        cards: [],
                        instructions: ''
                    }
                },{
                    klass: 'Rogue',
                    withCoin: {
                        cards: [],
                        instructions: ''
                    },
                    withoutCoin: {
                        cards: [],
                        instructions: ''
                    }
                },{
                    klass: 'Paladin',
                    withCoin: {
                        cards: [],
                        instructions: ''
                    },
                    withoutCoin: {
                        cards: [],
                        instructions: ''
                    }
                },{
                    klass: 'Priest',
                    withCoin: {
                        cards: [],
                        instructions: ''
                    },
                    withoutCoin: {
                        cards: [],
                        instructions: ''
                    }
                },{
                    klass: 'Warlock',
                    withCoin: {
                        cards: [],
                        instructions: ''
                    },
                    withoutCoin: {
                        cards: [],
                        instructions: ''
                    }
                },{
                    klass: 'Hunter',
                    withCoin: {
                        cards: [],
                        instructions: ''
                    },
                    withoutCoin: {
                        cards: [],
                        instructions: ''
                    }
                },{
                    klass: 'Druid',
                    withCoin: {
                        cards: [],
                        instructions: ''
                    },
                    withoutCoin: {
                        cards: [],
                        instructions: ''
                    }
            }],
            against: data.against || {
                strong: [{
                        klass: 'Mage',
                        isStrong: false
                    },{
                        klass: 'Shaman',
                        isStrong: false
                    },{
                        klass: 'Warrior',
                        isStrong: false
                    },{
                        klass: 'Rogue',
                        isStrong: false
                    },{
                        klass: 'Paladin',
                        isStrong: false
                    },{
                        klass: 'Priest',
                        isStrong: false
                    },{
                        klass: 'Warlock',
                        isStrong: false
                    },{
                        klass: 'Hunter',
                        isStrong: false
                    },{
                        klass: 'Druid',
                        isStrong: false
                }],
                weak: [{
                        klass: 'Mage',
                        isWeak: false
                    },{
                        klass: 'Shaman',
                        isWeak: false
                    },{
                        klass: 'Warrior',
                        isWeak: false
                    },{
                        klass: 'Rogue',
                        isWeak: false
                    },{
                        klass: 'Paladin',
                        isWeak: false
                    },{
                        klass: 'Priest',
                        isWeak: false
                    },{
                        klass: 'Warlock',
                        isWeak: false
                    },{
                        klass: 'Hunter',
                        isWeak: false
                    },{
                        klass: 'Druid',
                        isWeak: false
                }],
                instructions: ''
            },
            video: data.video || '',
            premium: data.premium || {
                isPremium: false,
                expiryDate: d
            },
            public: data.public || 'true'
        };
        
        db.validVideo = function () {
            var r = /^(?:https?:\/\/)?(?:www\.)?(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))((\w|-){11})(?:\S+)?$/;
            return (db.video.length) ? db.video.match(r) : true;
        };
        
        db.isStrong = function (strong) {
            return strong.isStrong;
        }

        db.isWeak = function (weak) {
            return weak.isWeak;
        }
        
        db.toggleStrong = function (strong) {
            strong.isStrong = !strong.isStrong;
        }
        
        db.toggleWeak = function (weak) {
            weak.isWeak = !weak.isWeak;
        }
        
        db.inMulligan = function (mulligan, withCoin, card) {
            var c = (withCoin) ? mulligan.withCoin.cards : mulligan.withoutCoin.cards;
            // check if card already exists
            for (var i = 0; i < c.length; i++) {
                if (c[i]._id === card._id) {
                    return true;
                }
            }
            return false;
        }
        
        db.toggleMulligan = function (mulligan, withCoin, card) {
            var c = (withCoin) ? mulligan.withCoin.cards : mulligan.withoutCoin.cards,
                exists = false,
                index = -1;
            
            // check if card already exists
            for (var i = 0; i < c.length; i++) {
                if (c[i]._id === card._id) {
                    exists = true;
                    index = i;
                    break;
                }
            }
            
            if (exists) {
                c.splice(index, 1);
            } else {
                if (c.length < 6) {
                    c.push(card);
                }
            }
        }
        
        db.getContent = function () {
            return $sce.trustAsHtml(db.content);
        }

        db.isAddable = function (card) {
            var exists = false,
                index = -1,
                isLegendary = (card.rarity === 'Legendary') ? true : false;

            // check if card already exists
            for (var i = 0; i < db.cards.length; i++) {
                if (db.cards[i]._id === card._id) {
                    exists = true;
                    index = i;
                    break;
                }
            }

            if (exists) {
                return (!isLegendary && (db.cards[index].qty === 1 || db.arena));
            } else {
                return true;
            }
        }

        // add card
        db.addCard = function (card) {
            var exists = false,
                index = -1,
                isLegendary = (card.rarity === 'Legendary') ? true : false;

            // check if card already exists
            for (var i = 0; i < db.cards.length; i++) {
                if (db.cards[i]._id === card._id) {
                    exists = true;
                    index = i;
                    break;
                }
            }

            // add card
            if (exists) {
                // increase qty by one
                if (!isLegendary && (db.cards[index].qty === 1 || db.arena)) {
                    db.cards[index].qty = db.cards[index].qty + 1;
                }
            } else {
                // add new card
                db.cards.push({
                    _id: card._id,
                    cost: card.cost,
                    name: card.name,
                    dust: card.dust,
                    photos: {
                        small: card.photos.small,
                        large: card.photos.large
                    },
                    legendary: isLegendary,
                    qty: 1
                });
                // sort deck
                db.sortDeck();
            }
        };

        db.sortDeck = function () {
            function dynamicSort(property) { 
                return function (a, b) {
                    if (a[property] < b[property]) return -1;
                    if (a[property] > b[property]) return 1;
                    return 0;
                }
            }

            function dynamicSortMultiple() {
                var props = arguments;
                return function (a, b) {
                    var i = 0,
                        result = 0;

                    while(result === 0 && i < props.length) {
                        result = dynamicSort(props[i])(a, b);
                        i++;
                    }
                    return result;
                }
            }

            db.cards.sort(dynamicSortMultiple('cost', 'name'));
        };

        db.removeCardFromDeck = function (card) {
            for (var i = 0; i < db.cards.length; i++) {
                if (card._id == db.cards[i]._id) {
                    if (db.cards[i].qty > 1) {
                        db.cards[i].qty = db.cards[i].qty - 1;
                    } else {
                        var index = db.cards.indexOf(db.cards[i]);
                        db.cards.splice(index, 1);
                    }
                }
            }
        };
        
        db.removeCard = function (card) {
            if (card.qty > 1) {
                card.qty = card.qty - 1;
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

            return Math.ceil(db.manaCount(mana) / big * 98);
        };

        db.manaCount = function (mana) {
            var cnt = 0;
            for (var i = 0; i < db.cards.length; i++) {
                if (db.cards[i].cost === mana || (mana === 7 && db.cards[i].cost >= 7)) {
                    cnt += db.cards[i].qty;
                }
            }
            return cnt;
        };

        db.getSize = function () {
            var size = 0;
            for (var i = 0; i <= 7; i++) {
                size += db.manaCount(i);
            }
            return size;
        };

        db.getDust = function () {
            var dust = 0;
            for (var i = 0; i < db.cards.length; i++) {
                dust += db.cards[i].qty * db.cards[i].dust;
            }
            return dust;
        };

        db.validDeck = function () {
            // 30 cards in deck
            if (db.getSize() !== 30) {
                return false;
            }

            // make sure not more than 2 of same cards in non-arena deck
            if (!db.arena) {
                for (var i = 0; i < db.cards.length; i++) {
                    if (db.cards[i].qty > 2) {
                        return false;
                    }
                }
            }

            return true;
        };

        return db;
    }

    deckBuilder.loadCards = function (playerClass) {
        var d = $q.defer();
        $http.post('/deckbuilder', { playerClass: playerClass }).success(function (data) {
            d.resolve(data);
        });
        return d.promise;
    }

    deckBuilder.saveDeck = function (deck) {
        return $http.post('/api/deck/add', {
            name: deck.name,
            deckType: deck.deckType,
            description: deck.description,
            contentEarly: deck.contentEarly,
            contentMid: deck.contentMid,
            contentLate: deck.contentLate,
            cards: deck.cards,
            playerClass: deck.playerClass,
            arena: deck.arena,
            mulligans: deck.mulligans,
            against: deck.against,
            video: deck.video,
            public: deck.public
        });
    }
    
    deckBuilder.updateDeck = function (deck) {
        return $http.post('/api/deck/update', {
            _id: deck._id,
            name: deck.name,
            deckType: deck.deckType,
            description: deck.description,
            contentEarly: deck.contentEarly,
            contentMid: deck.contentMid,
            contentLate: deck.contentLate,
            cards: deck.cards,
            playerClass: deck.playerClass,
            arena: deck.arena,
            mulligans: deck.mulligans,
            against: deck.against,
            video: deck.video,
            public: deck.public
        });
    }

    return deckBuilder;
})
.factory('DeckService', function ($http, $q) {
    return {
        getDecks: function (klass, page, perpage) {
            klass = klass || 'all';
            page = page || 1;
            perpage = perpage || 24;
            
            var d = $q.defer();
            $http.post('/decks', { klass: klass, page: page, perpage: perpage }).success(function (data) {
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
})
.factory('VoteService', function ($http, $q) {
    return {
        voteArticle: function (direction, article) {
            var d = $q.defer();
            $http.post('/api/article/vote', { _id: article._id, direction: direction }).success(function (data) {
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
        voteComment: function (direction, comment) {
            var d = $q.defer();
            $http.post('/api/comment/vote', { _id: comment._id, direction: direction }).success(function (data) {
                d.resolve(data);
            });
            return d.promise;
        }
    };
})
.factory('ForumService', function ($http, $q) {
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
})
.factory('ImgurService', function ($http, $q) {
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
})
;