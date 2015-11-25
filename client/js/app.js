'use strict';

var app = angular.module('app', [
    'lbServices',
    'angularFileUpload',
    'summernote',
    'angular-bootbox',
    'angularMoment',
    'angularPayments',
    'youtube-embed',
    'dndLists',
    'ngCookies',
    'ngStorage',
    'ngSanitize',
    'ui.router',
    'ui.load',
    'ui.jq',
    'ui.validate',
    'ui.date',
    'ui.gravatar',
    'app.controllers',
    'app.services',
    'app.filters',
    'app.directives',
    'app.animations',
    'app.redbull',
])
.run(
    ['$rootScope', '$state', '$stateParams', '$window', '$http', '$q', '$location', 'MetaService', '$cookies', "$localStorage", "LoginModalService", 'LoopBackAuth', 'User',
        function ($rootScope, $state, $stateParams, $window, $http, $q, $location, MetaService, $cookies, $localStorage, LoginModalService, LoopBackAuth, User) {
            $rootScope.$state = $state;
            $rootScope.$stateParams = $stateParams;
            $rootScope.metaservice = MetaService;
            $rootScope.LoginModalService = LoginModalService;

            // handle state changes
            $rootScope.$on("$stateChangeStart", function(event, toState, toParams, fromState, fromParams) {
                console.log(toState);
                //ngProgress.start();
                if (toState.redirectTo) {
                    event.preventDefault();
                    $state.go(toState.redirectTo, toParams);
                }
                if (toState.access && toState.access.noauth && User.isAuthenticated()) {
                    event.preventDefault();
                    $state.transitionTo('app.home');
                }
                if (toState.access && toState.access.auth && !User.isAuthenticated()) {
                    event.preventDefault();
                    $state.transitionTo('app.login', { redirect: $location.url() });
                }
//                if (toState.access && toState.access.admin && !AuthenticationService.isAdmin()) {
//                    //event.preventDefault();
//                    //$state.transitionTo('app.home');
//                }
                $window.scrollTo(0,0);
            });
            $rootScope.$on("$stateChangeSuccess", function(event, toState, toParams, fromState, fromParams) {
                $rootScope.metaservice.setStatusCode(200);
                //ngProgress.complete();
                if ($window.ga) {
                    $window.ga('send', 'pageview', $location.path());
                }

                // adsense refresh
                //if ($window.googletag && $window.googletag.pubads) {
                //    $window.googletag.pubads().refresh();
                //}

                // seo
                if (toState.seo) {
                    $rootScope.metaservice.set(toState.seo.title, toState.seo.description, toState.seo.keywords);
                }
                if (!toState.og) {
                    $rootScope.metaservice.setOg('https://tempoStorm.com' + toState.url);
                }
            });
            $rootScope.$on("$stateChangeError", function(event, toState, toParams, fromState, fromParams) {
                console.log("Event:", event);
                console.log("To State:", toState);
                console.log("From State", fromState);
                console.log('State change failed!');
//                $state.go('app.404');
            });

            var accessToken = getAuthCookie("access_token");
            var userId = getAuthCookie("userId");
            if (accessToken && userId) {
                $cookies.remove("access_token");
                $cookies.remove("userId");
                LoopBackAuth.setUser(accessToken, userId);
                LoopBackAuth.save();
            }

            // TODO: extend $cookies with this function
            function getAuthCookie(key) {
                var value = $cookies.get(key);
                if (typeof value == "undefined")
                    return undefined;

                var valueElements = value.split(":");
                var cleanCookie = valueElements[1];
                valueElements = cleanCookie.split(".");
                valueElements.splice(-1, 1);
                cleanCookie = valueElements.join(".");
                return cleanCookie;
            }

        }
    ]
)
.config(
    ['$locationProvider', '$stateProvider', '$urlRouterProvider', '$controllerProvider', '$compileProvider', '$filterProvider', '$provide', '$httpProvider', '$bootboxProvider', '$sceDelegateProvider', '$animateProvider',
    function ($locationProvider, $stateProvider, $urlRouterProvider, $controllerProvider, $compileProvider, $filterProvider, $provide, $httpProvider, $bootboxProvider, $sceDelegateProvider, $animateProvider) {

        app.controller = $controllerProvider.register;
        app.directive  = $compileProvider.directive;
        app.filter     = $filterProvider.register;
        app.factory    = $provide.factory;
        app.service    = $provide.service;
        app.constant   = $provide.constant;
        app.value      = $provide.value;
        
        Stripe.setPublishableKey('pk_test_zLldf4ECehJ7sJzqbkAx9VbV');
        
        $bootboxProvider.setDefaults({ locale: "en" });

        $locationProvider.html5Mode(true);
        $httpProvider.interceptors.push('AuthInterceptor');

        // cdn templates
        tpl = tpl || '';

        $sceDelegateProvider.resourceUrlWhitelist([
            'self',
            tpl + '**'
        ]);

        // ignore ng-animate on font awesome spin
        $animateProvider.classNameFilter(/^((?!(fa-spin)).)*$/);

//        $urlRouterProvider.otherwise('404');
        $stateProvider
            .state('app', {
                abstract: true,
                url: '/',
                views: {
                    root: {
                        templateUrl: tpl + 'views/frontend/index.html',
                        controller: 'RootCtrl'
                    }
                },
                resolve: {
                  // Load the current user data if we don't have it
                    currentUser: ['User', 'LoopBackAuth',
                        function(User, LoopBackAuth) {
                            if(User.isAuthenticated() && !LoopBackAuth.currentUserData) {
                              return User.getCurrent().$promise;
                            }
                        }
                    ]
                },
                onEnter: ['$cookies', '$state', function($cookies, $state) {
                    // look for redirect cookie
                    var redirectState = $cookies.get("redirectStateString");
                    if(redirectState) {
                        redirectState = JSON.parse(redirectState);
                        $cookies.remove("redirectStateString");
                        $state.go(redirectState.name, redirectState.params);
                    }
                }]
            })
            .state('app.404', {
                url: '404',
                views: {
                    content: {
                        templateUrl: tpl + 'views/frontend/404.html',
                        controller: '404Ctrl',
                    }
                },
                seo: { title: '404' }
            })
            .state('app.home', {
                url: '',
                views: {
                    content: {
                        templateUrl: tpl + 'views/frontend/home.html',
                        controller: 'HomeCtrl',
                        resolve: {
                            articles: ['Article', function (Article) {
                                var offset = 1,
                                    num = 6;

                                return Article.find({
                                    filter: {
                                        where: {
                                            isActive: true
                                        },
                                        fields: {
                                            content: false,
                                            votes: false
                                        },
                                        order: "createdDate DESC",
                                        skip: (offset * num) - num,
                                        limit: num
                                    }
                                }).$promise;
                            }],
                            articlesTotal: ['Article', function (Article) {
                                return Article.count().$promise;
                            }]
                        }
                    }
                },
                seo: { title: 'Home', description: 'TempoStorm home page.', keywords: '' }
            })
            .state('app.overwatch', {
                abstract: true,
                url: 'overwatch',
                views: {
                    content: {
                        templateUrl: tpl + 'views/frontend/overwatch.html'
                    }
                }
            })
            .state('app.overwatch.home', {
                url: '',
                views: {
                    overwatch: {
                        templateUrl: tpl + 'views/frontend/overwatch.home.html',
                        controller: 'OverwatchHomeCtrl',
                        resolve: {
                            articles: ['Article', function (Article) {
                                var perpage = 6;

                                return Article.find({
                                    filter: {
                                        where: {
                                            articleType: 'overwatch',
                                            isActive: true
                                        },
                                        fields: {
                                            content: false,
                                            votes: false
                                        },
                                        sort: 'createdDate DESC',
                                        limit: perpage
                                    }
                                }).$promise;
                            }],
                            heroes: ['OverwatchHero', function (OverwatchHero) {
                                return OverwatchHero.find({
                                    filter: {
                                        where: {
                                            isActive: true
                                        },
                                        fields: {
                                            heroName: true,
                                            className: true,
                                            orderNum: true
                                        },
                                        order: 'orderNum ASC'
                                    }
                                }).$promise;
                            }]
                        }
                    }
                },
                seo: { title: 'Overwatch', description: 'Tempo Storm is your top source for Blizzard Entertainment\'s Overwatch. Tournament news, strategy, and patch details.', keywords: 'blizzard overwatch' }
            })
            .state('app.overwatch.heroes', {
                abstract: true,
                url: '/heroes',
                views: {
                    overwatch: {
                        templateUrl: tpl + 'views/frontend/overwatch.heroes.html'
                    }
                }
            })
            .state('app.overwatch.heroes.redirect', {
                url: '',
                resolve: {
                    hero: ['OverwatchHero', function (OverwatchHero) {
                        return OverwatchHero.findOne({
                            filter: {
                                where: {
                                    isActive: true
                                },
                                fields: {
                                    className: true
                                },
                                sort: 'orderNum ASC'
                            }
                        }).$promise;
                    }],
                    redirect: ['$q', '$state', 'hero', function ($q, $state, hero) {
                        $state.go('app.overwatch.heroes.hero', { slug: hero.className });
                        return $q.reject();
                    }]
                }
            })
            .state('app.overwatch.heroes.hero', {
                url: '/:slug',
                views: {
                    'overwatch-heroes': {
                        templateUrl: tpl + 'views/frontend/overwatch.heroes.hero.html',
                        controller: 'OverwatchHeroCtrl',
                        resolve: {
                            heroes: ['OverwatchHero', function (OverwatchHero) {
                                return OverwatchHero.find({
                                    filter: {
                                        where: {
                                            isActive: true
                                        },
                                        fields: {
                                            heroName: true,
                                            className: true,
                                            orderNum: true
                                        },
                                        order: 'orderNum ASC'
                                    }
                                }).$promise;
                            }],
                            hero: ['$stateParams', 'OverwatchHero', function ($stateParams, OverwatchHero) {
                                var slug = $stateParams.slug;
                                return OverwatchHero.findOne({
                                    filter: {
                                        where: {
                                            className: slug,
                                            isActive: true
                                        },
                                        fields: {
                                            orderNum: false
                                        },
                                        include: {
                                            relation: 'overwatchAbilities',
                                            scope: {
                                                order: 'orderNum ASC'
                                            }
                                        }
                                    }
                                }).$promise;
                            }]
                        }
                    }
                }
            })
            .state('app.articles', {
                abstract: true,
                url: 'articles',
                views: {
                    content: {
                        templateUrl: tpl + 'views/frontend/articles.html'
                    }
                }
            })
            .state('app.articles.list', {
                url: '?s&p&t&f',
                views: {
                    articles: {
                        templateUrl: tpl + 'views/frontend/articles.list.html',
                        controller: 'ArticlesCtrl',
                        resolve: {
                            articles: ['$stateParams', '$q', 'Article', function ($stateParams, $q, Article) {
                                var articleType = $stateParams.t || 'all',
                                    filter = $stateParams.f || 'all',
                                    page = $stateParams.p || 1,
                                    perpage = 12,
                                    search = $stateParams.s || '';

                                return Article.find({
                                    filter: {
                                        where: {
                                            isActive: true
                                        },
                                        fields: {
                                            content: false,
                                            votes: false
                                        },
                                        order: "createdDate DESC",
                                        limit: perpage,
                                        skip: ((perpage*page)-perpage)
                                    }
                                })
                                .$promise
                                .then(function (articles) {
                                    articles.page = page;
                                    articles.perpage = perpage;
                                    return articles;
                                });

                            }],
                            articlesTotal: ['Article', function (Article) {
                                return Article.count({
                                    where: {
                                        isActive: true
                                    }
                                })
                                .$promise;
                            }]
                        }
                    }
                },
                seo: { title: 'Articles', description: 'TempoStorm articles to bring you the latest news.', keywords: '' },
                og: true
            })
            .state('app.articles.article', {
                url: '/:slug',
                views: {
                    articles: {
                        templateUrl: tpl + 'views/frontend/articles.article.html',
                        controller: 'ArticleCtrl',
                        resolve: {
                            article: ['$stateParams', 'Article', function ($stateParams, Article) {
                                var slug = $stateParams.slug;

                                return Article.findOne({
                                    filter: {
                                        where: {
                                            "slug.url": slug
                                        },
                                        include: [
                                            {
                                                relation: "author",
                                                scope: {
                                                    filter: [
                                                        "username",
                                                        "about",
                                                        "providerDescription",
                                                        "social"
                                                    ]
                                                }
                                            },
                                            {
                                                relation: "comments",
                                                scope: {
                                                    include: [
                                                        "author"
                                                    ]
                                                }
                                            },
                                            {
                                                relation: "relatedArticles",
                                                scope: {
                                                    fields: [
                                                        "title",
                                                        "isActive",
                                                        "photoNames",
                                                        "authorId",
                                                        "voteScore",
                                                        "articleType",
                                                        "slug"
                                                    ],
                                                    include: [
                                                        {
                                                            relation: "author",
                                                            scope: {
                                                                fields: [
                                                                    "username"
                                                                ]
                                                            }
                                                        }
                                                    ]
                                                }
                                            }
                                        ]
                                    }
                                }).$promise;
                            }]
                        }
                    }
                }
            })
            .state('app.hs', {
                abstract: true,
                url: 'hearthstone',
                views: {
                    content: {
                        templateUrl: tpl + 'views/frontend/hs.html'
                    }
                }
            })
            .state('app.decks', {
                url: 'decks?p&s&k&a&o',
                redirectTo: 'app.hs.decks.list'
            })
            .state('app.decks.deck', {
                url: '/:slug',
                redirectTo: 'app.hs.decks.deck'
            })
            .state('app.deckBuilder', {
                url: 'deck-builder',
                redirectTo: 'app.hs.deckBuilder.class'
            })
            .state('app.hs.home', {
                url: '',
                views: {
                    hs: {
                        templateUrl: tpl + 'views/frontend/hs.home.html',
                        controller: 'HearthstoneHomeCtrl',
                        resolve: {
                            dataArticles: ['Article', function (Article) {
                                var klass = 'all',
                                    page = 1,
                                    perpage = 6;
                                return Article.find({
                                  filter: {
                                    limit: 6,
                                    where: {
                                      articleType: ['hs']
                                    },
                                    fields: {
                                      content: false
                                    }
                                  }
                                }).$promise;
                            }],
                            dataDecksTempostorm: ['Deck', function (Deck) {
                                return Deck.find({
                                  filter: {
                                    limit: 10,
                                    where: {
                                      isFeatured: true
                                    },
                                    fields: {
                                      name: true,
                                      description: true,
                                      deckType: true,
                                      playerClass: true,
                                      heroName: true,
                                      premium: true,
                                      voteScore: true,
                                      authorId: true,
                                      slug: true
                                    },
                                    include: ['author']
                                  }
                                }).$promise;
                            }],
                            dataDecksCommunity: ['Deck', function (Deck) {
                                return Deck.find({
                                  filter: {
                                    limit: 10,
                                    where: {
                                      isFeatured: false
                                    },
                                    fields: {
                                      name: true,
                                      description: true,
                                      deckType: true,
                                      playerClass: true,
                                      heroName: true,
                                      premium: true,
                                      voteScore: true,
                                      authorId: true,
                                      slug: true
                                    },
                                    include: ['author']
                                  }
                                }).$promise;
                            }]
                        }
                    }
                },
                seo: { title: 'Hearthstone', description: 'TempoStorm Hearthstone featured and community decks.', keywords: '' },
                og: true
            })
            .state('app.hs.decks', {
                abstract: true,
                url: '/decks',
                views: {
                    hs: {
                        templateUrl: tpl + 'views/frontend/hs.decks.html'
                    }
                }
            })
            .state('app.hs.decks.list', {
                url: '?p&s&k&a&o',
                views: {
                    decks: {
                        templateUrl: tpl + 'views/frontend/hs.decks.list.html',
                        controller: 'DecksCtrl',
                        resolve: {
                            tempostormDecks: ['$stateParams', 'Deck', function ($stateParams, Deck) {
                                var klass = $stateParams.k || false,
                                    page = $stateParams.p || 1,
                                    perpage = 4,
                                    search = $stateParams.s || '',
                                    age = $stateParams.a || '',
                                    order = $stateParams.o || '';

                                return Deck.find({
                                    filter: {
                                        where: {
                                            isFeatured: true
                                        },
                                        fields: {
                                            name: true,
                                            description: true,
                                            slug: true,
                                            heroName: true,
                                            authorId: true,
                                            voteScore: true,
                                            playerClass: true,
                                            createdDate: true
                                        },
                                        include: ["author"],
                                        order: "createdDate DESC",
                                        skip: (page * perpage) - perpage,
                                        limit: perpage
                                    }
                                })
                                .$promise;

                            }],
                            tempostormCount: ['$stateParams', 'Deck', function ($stateParams, Deck) {
                                var search = $stateParams.s || '';

                                return Deck.count({
                                    where: {
                                        isFeatured: true,
                                    }
                                })
                                .$promise;

                            }],
                            communityDecks: ['$stateParams', 'Deck', function ($stateParams, Deck) {
                                var klass = $stateParams.k || false,
                                    page = $stateParams.p || 1,
                                    perpage = 12,
                                    search = $stateParams.s || '',
                                    age = $stateParams.a || '',
                                    order = $stateParams.o || '';

                                return Deck.find({
                                    filter: {
                                        where: {
                                            isFeatured: false
                                        },
                                        fields: {
                                            name: true,
                                            description: true,
                                            slug: true,
                                            heroName: true,
                                            authorId: true,
                                            voteScore: true,
                                            playerClass: true,
                                            dust: true,
                                            createdDate: true
                                        },
                                        include: ["author"],
                                        order: "createdDate DESC",
                                        skip: (page * perpage) - perpage,
                                        limit: perpage
                                    }
                                })
                                .$promise;
                            }],
                            communityCount: ['$stateParams', 'Deck', function ($stateParams, Deck) {
                                var search = $stateParams.s || '';

                                return Deck.count({
                                    where: {
                                        isFeatured: false,
                                    },
                                    include: ["comments"]
                                })
                                .$promise;
                            }]
                        }
                    }
                },
                seo: { title: 'Decks', description: 'Hearthstone decks created by the community and TempoStorm content providers.', keywords: '' }
            })
            .state('app.hs.decks.deck', {
                url: '/:slug',
                views: {
                    decks: {
                        templateUrl: tpl + 'views/frontend/hs.decks.deck.html',
                        controller: 'DeckCtrl',
                        resolve: {
                            isUserAdmin: ['User', function(User) {
                                if (User.isAuthenticated() === false) {
                                    return false;
                                } else {
                                    return User.isRole({
                                        roleName: '$admin'
                                    })
                                    .$promise
                                    .then(function (isAdmin) {
    //                                    console.log('isAdmin: ', isAdmin.isRole);
                                        return isAdmin.isRole;
                                    })
                                    .catch(function (err) {
                                        if (err) {
                                            console.log('resolve err: ', err);
                                        }
                                    });
                                }
                            }],
                            isUserContentProvider: ['User', function(User) {
                                if (User.isAuthenticated() === false) {
                                    return false;
                                } else {
                                    return User.isRole({
                                        roleName: '$contentProvider'
                                    })
                                    .$promise
                                    .then(function (isContentProvider) {
    //                                    console.log('isContentProvider: ', isContentProvider.isRole);
                                        return isContentProvider.isRole;
                                    })
                                    .catch(function (err) {
                                        if (err) {
                                            console.log('resolve err: ', err);
                                        }
                                    });
                                }
                            }],
                            isUserPremium: ['User', function(User) {
                                if (User.isAuthenticated() === false) {
                                    return false;
                                } else {
                                    return User.isRole({
                                        roleName: '$premium'
                                    })
                                    .$promise
                                    .then(function (isUserPremium) {
                                        return isPremium.isRole;
                                    })
                                    .catch(function (err) {
                                        console.log('resolve err: ', err);
                                    });
                                }
                            }],
                            deck: ['$stateParams', '$state', 'Deck', function ($stateParams, $state, Deck) {
                                var stateSlug = $stateParams.slug;
                                return Deck.findOne({
                                    filter: {
                                        where: {
                                            slug: stateSlug
                                        },
                                        fields: {
                                            id: true,
                                            createdDate: true,
                                            name: true,
                                            description: true,
                                            playerClass: true,
                                            premium: true,
                                            slug: true,
                                            dust: true,
                                            heroName: true,
                                            authorId: true,
                                            deckType: true,
                                            viewCount: true,
                                            isPublic: true,
                                            votes: true,
                                            voteScore: true,
                                            chapters: true,
                                            youtubeId: true,
                                            gameModeType: true,
                                            isActive: true
                                        },
                                        include: [
                                            {
                                                relation: "cards",
                                                scope: {
                                                    include: ['card']
                                                }
                                            },
                                            {
                                                relation: "comments",
                                                scope: {
                                                    incldue: ['author']
                                                }
                                            },
                                            {
                                                relation: 'author'
                                            },
                                            {
                                                relation: 'matchups'
                                            }
                                        ]
                                    }
                                })
                                .$promise
                                .then(function (deck) {
//                                    console.log('deck: ', deck);
                                    return deck;
                                })
                                .catch(function (err) {
                                    console.log('Deck.findOne err: ', err);
                                    $state.transitionTo('app.404');
                                });

                            }],
                            
                            deckWithMulligans: ['Mulligan', 'deck', function(Mulligan, deck) {
                                var deckID = deck.id;
//                                console.log('deckid: ', deck.id);
                                
                                return Mulligan.find({
                                    filter: {
                                        where: {
                                            deckId: deckID
                                        },
                                        include: [
                                            {
                                                relation: 'cardsWithCoin'
                                            },
                                            {
                                                relation: 'cardsWithoutCoin'
                                            }
                                        ]
                                    }
                                })
                                .$promise
                                .then(function (mulligans) {
//                                    console.log('mullies: ', mulligans);
                                    deck.mulligans = mulligans;
//                                    console.log('deck in resolve: ', deck);
                                    return deck;
                                })
                                .catch(function (err) {
                                    if (err) console.log('err: ', err);
                                });
                            }],
                            
                            resolveCheck: ['deckWithMulligans', 'deck', function(deckWithMulligans, deck) {
                                console.log('deck resolve: ', deckWithMulligans);
                                console.log('deck resolve2: ', deck);
                            }]
                        }
                    }
                }
            })
            .state('app.hs.deckBuilder', {
                abstract: true,
                url: '/deck-builder',
                views: {
                    hs: {
                        templateUrl: tpl + 'views/frontend/hs.deck-builder.html'
                    }
                }
            })
            .state('app.hs.deckBuilder.class', {
                url: '',
                views: {
                    deckBuilder: {
                        templateUrl: tpl + 'views/frontend/hs.deck-builder.class.html',
                        controller: 'DeckBuilderClassCtrl'
                    }
                },
                seo: { title: 'Deck Builder', description: 'Deck building tool for Hearthstone.', keywords: '' }
            })
            .state('app.hs.deckBuilder.build', {
                url: '/:playerClass',
                views: {
                    deckBuilder: {
                        templateUrl: tpl + 'views/frontend/hs.deck-builder.build.html',
                        controller: 'DeckBuilderCtrl',
                        resolve: {
                            isUserAdmin: ['User', function(User) {
                                if (User.isAuthenticated() === false) {
                                    return false;
                                } else {
                                    return User.isRole({
                                        roleName: '$admin'
                                    })
                                    .$promise
                                    .then(function (isAdmin) {
    //                                    console.log('isAdmin: ', isAdmin.isRole);
                                        return isAdmin.isRole;
                                    })
                                    .catch(function (err) {
                                        if (err) {
                                            console.log('resolve err: ', err);
                                        }
                                    });
                                }
                            }],
                            isUserContentProvider: ['User', function(User) {
                                if (User.isAuthenticated() === false) {
                                    return false;
                                } else {
                                    return User.isRole({
                                        roleName: '$contentProvider'
                                    })
                                    .$promise
                                    .then(function (isContentProvider) {
    //                                    console.log('isContentProvider: ', isContentProvider.isRole);
                                        return isContentProvider.isRole;
                                    })
                                    .catch(function (err) {
                                        if (err) {
                                            console.log('resolve err: ', err);
                                        }
                                    });
                                }
                            }],
                            classCardsList: ['$stateParams', 'Card', function ($stateParams, Card) {
                                var perpage = 15,
                                    playerClass = $stateParams.playerClass;

                                return Card.find({
                                    filter: {
                                        where: {
                                            playerClass: playerClass.slice(0,1).toUpperCase() + playerClass.substr(1),
                                            deckable: true
                                        },
                                        order: ["cost ASC", "cardType ASC", "name ASC"],
                                        limit: perpage,
                                    }
                                })
                                .$promise;
                            }],

                            neutralCardsList: ['Card', function (Card) {
                                return Card.find({
                                    filter: {
                                        where: {
                                            playerClass: 'Neutral',
                                            deckable: true
                                        },
                                        order: ["cost ASC", "cardType ASC", "name ASC"],
                                        limit: 15
                                    }
                                })
                                .$promise;
                            }],

                            classCardsCount: ['$stateParams', 'Card', function ($stateParams, Card) {
                                var playerClass = $stateParams.playerClass;

                                return Card.count({
                                    where: {
                                        playerClass: playerClass.slice(0,1).toUpperCase() + playerClass.substr(1)
                                    }
                                })
                                .$promise;
                            }],

                            neutralCardsCount: ['Card', function (Card) {
                                return Card.count({
                                    where: {
                                        playerClass: 'Neutral'
                                    }
                                })
                                .$promise;
                            }],

                            toStep: ['$stateParams', function ($stateParams) {
                                if ($stateParams.goTo) {
                                    return $stateParams.goTo;
                                }
                            }]
                        }
                    }
                }
            })
            .state('app.hs.deckBuilder.edit', {
                url: '/edit/:slug',
                views: {
                    deckBuilder: {
                        templateUrl: tpl + 'views/frontend/hs.deck-builder.edit.html',
                        controller: 'DeckEditCtrl',
                        resolve: {
                            isUserAdmin: ['User', function(User) {
                                if (User.isAuthenticated() === false) {
                                    return false;
                                } else {
                                    return User.isRole({
                                        roleName: '$admin'
                                    })
                                    .$promise
                                    .then(function (isAdmin) {
    //                                    console.log('isAdmin: ', isAdmin.isRole);
                                        return isAdmin.isRole;
                                    })
                                    .catch(function (err) {
                                        if (err) {
                                            console.log('resolve err: ', err);
                                        }
                                    });
                                }
                            }],
                            isUserContentProvider: ['User', function(User) {
                                if (User.isAuthenticated() === false) {
                                    return false;
                                } else {
                                    return User.isRole({
                                        roleName: '$contentProvider'
                                    })
                                    .$promise
                                    .then(function (isContentProvider) {
    //                                    console.log('isContentProvider: ', isContentProvider.isRole);
                                        return isContentProvider.isRole;
                                    })
                                    .catch(function (err) {
                                        if (err) {
                                            console.log('resolve err: ', err);
                                        }
                                    });
                                }
                            }],
                            
                            deckNoMulligans: ['$stateParams', 'Deck', function ($stateParams, Deck) {
                                var stateSlug = $stateParams.slug;
                                return Deck.findOne({
                                    filter: {
                                        where: {
                                            slug: stateSlug
                                        },
                                        fields: {
                                            id: true,
                                            createdDate: true,
                                            name: true,
                                            description: true,
                                            playerClass: true,
                                            premium: true,
                                            slug: true,
                                            dust: true,
                                            heroName: true,
                                            authorId: true,
                                            deckType: true,
                                            viewCount: true,
                                            isPublic: true,
                                            votes: true,
                                            voteScore: true,
                                            chapters: true,
                                            youtubeId: true,
                                            gameModeType: true,
                                            isActive: true
                                        },
                                        include: [
                                            {
                                                relation: "cards",
                                                scope: {
                                                    include: ['card']
                                                }
                                            },
                                            {
                                                relation: "comments",
                                                scope: {
                                                    incldue: ['author']
                                                }
                                            },
                                            {
                                                relation: 'author'
                                            },
                                            {
                                                relation: 'matchups'
                                            }
                                        ]
                                    }
                                })
                                .$promise
                                .then(function (deck) {
//                                    console.log('deck: ', deck);
                                    return deck;
                                });

                            }],
                            
                            deck: ['Mulligan', 'deckNoMulligans', function(Mulligan, deckNoMulligans) {
                                var deckID = deckNoMulligans.id;
//                                console.log('deckid: ', deck.id);
                                
                                return Mulligan.find({
                                    filter: {
                                        where: {
                                            deckId: deckID
                                        },
                                        include: [
                                            {
                                                relation: 'cardsWithCoin'
                                            },
                                            {
                                                relation: 'cardsWithoutCoin'
                                            }
                                        ]
                                    }
                                })
                                .$promise
                                .then(function (mulligans) {
//                                    console.log('mullies: ', mulligans);
                                    deckNoMulligans.mulligans = mulligans;
//                                    console.log('deck in resolve: ', deck);
                                    return deckNoMulligans;
                                })
                                .catch(function (err) {
                                    if (err) console.log('err: ', err);
                                });
                            }],
                                
                            classCardsList: ['$stateParams', 'deckNoMulligans', 'Card', function($stateParams, deckNoMulligans, Card) {
                                var perpage = 15,
                                    playerClass = deckNoMulligans.playerClass;

                                return Card.find({
                                    filter: {
                                        where: {
                                            playerClass: playerClass,
                                            deckable: true
                                        },
                                        order: ['cost ASC', 'cardType ASC', 'name ASC'],
                                        limit: perpage
                                    }
                                }).$promise;
                            }],

                            classCardsCount: ['$stateParams', 'deckNoMulligans', 'Card', function ($stateParams, deckNoMulligans, Card) {
                                var deckID = $stateParams.deckID;
                                return Card.count({
                                    where: {
                                        playerClass: deckNoMulligans.playerClass
                                    }
                                }).$promise;
                            }],

                            neutralCardsCount: ['Card', function (Card) {
                                return Card.count({
                                    where: {
                                        playerClass: 'Neutral'
                                    }
                                }).$promise;
                            }],

                            neutralCardsList: ['Card', function (Card) {
                                return Card.find({
                                    filter: {
                                        where: {
                                            playerClass: 'Neutral',
                                            deckable: true
                                        },
                                        order: ["cost ASC", "cardType ASC", "name ASC"],
                                        limit: 15
                                    }
                                }).$promise;
                            }],

                            toStep: ['$stateParams', function ($stateParams) {
                                if($stateParams.goTo) {
                                    return $stateParams.goTo;
                                }
                            }]
                        }
                    }
                },
                seo: { title: 'Deck Edit', description: 'Editing tool for hearthstone decks.', keywords: '' }
            })
            .state('app.hs.snapshot', {
                abstract: 'true',
                url: '/meta-snapshot',
                views: {
                    hs: {
                        templateUrl: tpl + 'views/frontend/hs.snapshots.html'
                    }
                }
            })
            .state('app.hs.snapshot.redirect', {
                url: '',
                resolve: {
//                    data: ['SnapshotService', '$q', function (SnapshotService, $q) {
//                        return SnapshotService.getLatest().then(function (result) {
//                            console.log(result);
//                            if (result.success === true) {
//                                return result;
//                            } else {
//                                return $q.reject('unable to find snapshot');
//                            }
//                        });
//                    }],
                    data: ['Snapshot', function (Snapshot) {
                        return Snapshot.findOne({
                            filter: {
                                order: "createdDate DESC"
                            }
                        }).$promise;
                    }],
//                    redirect: ['$q', '$state', 'data', function ($q, $state, data) {
//                        $state.go('app.snapshot.snapshot', { slug: data.snapshot[0].slug.url });
//                        return $q.reject();
//                    }]
                    redirect: ['$q', '$state', 'data', function ($q, $state, data) {
                        $state.go('app.hs.snapshot.snapshot', { slug: data.slug.url });
                        return $q.reject();
                    }]
                }
            })
            .state('app.hs.snapshot.snapshot', {
                url: '/:slug',
                views: {
                    snapshots: {
                        templateUrl: tpl + 'views/frontend/hs.snapshots.snapshot.html',
                        controller: 'SnapshotCtrl',
                        resolve: {
                            dataSnapshot: ['$stateParams', 'Snapshot', function ($stateParams, Snapshot) {
                                var slug = $stateParams.slug;
                                return Snapshot.findOne({
                                    filter: {
                                        where: {
                                            'slug.url': slug
                                        },
                                        fields: {
                                            id: true,
                                            authorId: true,
                                            deckId: true,
                                            active: true,
                                            snapNum: true,
                                            votes: true,
                                            voteScore: true,
                                            title: true,
                                            content: true,
                                            slug: true,
                                            photoNames: true,
                                            createdDate: true
                                        },
                                        include: [
                                            {
                                                relation: 'comments',
                                                scope: {
                                                    include: [
                                                        {
                                                            relation: 'author',
                                                            scope: {
                                                                fields: {
                                                                    id: true,
                                                                    username: true
                                                                }
                                                            }
                                                        }
                                                    ]
                                                }
                                            },
                                            {
                                                relation: 'deckMatchups',
                                                scope: {
                                                    include: [
                                                        {
                                                            relation: 'forDeck',
                                                            scope: {
                                                                fields: {
                                                                    id: true,
                                                                    playerClass: true
                                                                }
                                                            }
                                                        },
                                                        {
                                                            relation: 'againstDeck',
                                                            scope: {
                                                                fields: {
                                                                    id: true,
                                                                    playerClass: true
                                                                }
                                                            }
                                                        }
                                                    ]
                                                }
                                            },
                                            {
                                                relation: 'deckTiers',
                                                scope: {
                                                    include: [
                                                        {
                                                            relation: 'deck',
                                                            scope: {
                                                                fields: {
                                                                    id: true,
                                                                    playerClass: true,
                                                                    name: true,
                                                                    slug: true,
                                                                }
                                                            }
                                                        },
                                                        {
                                                            relation: 'deckTech',
                                                            scope: {
                                                                include: [
                                                                    {
                                                                        relation: 'cardTech',
                                                                        scope: {
                                                                            include: [
                                                                                {
                                                                                    relation: 'card'
                                                                                }
                                                                            ]
                                                                        }
                                                                    }
                                                                ]
                                                            }
                                                        }
                                                    ]
                                                }
                                            },
                                            {
                                                relation: 'authors',
                                                fields: {
                                                  description: true,
                                                  expertClasses: true,
                                                  id: true,
                                                  userId: true
                                                },
                                                scope: {
                                                    include: [
                                                        {
                                                            relation: 'user',
                                                            scope: {
                                                                fields: {
                                                                    id: true,
                                                                    social: true,
                                                                    username: true
                                                                }
                                                            }
                                                        }
                                                    ],
                                                }
                                            }
                                        ]
                                    }
                                }).$promise
                                .then(function (data) {
                                    console.log(data);
                                    return data;
                                });
                            }]
                        }
                    }
                }
            })
            .state('app.hots', {
                abstract: true,
                url: 'heroes-of-the-storm',
                views: {
                    content: {
                        templateUrl: tpl + 'views/frontend/hots.html'
                    }
                }
            })
            .state('app.hots.home', {
                url: '',
                views: {
                    hots: {
                        templateUrl: tpl + 'views/frontend/hots.home.html',
                        controller: 'HOTSHomeCtrl',
                        resolve: {

                            dataArticles: ['Article', function (Article) {
                              var filters = 'all',
                                  offset = 0,
                                  perpage = 6;

                              return Article.find({
                                filter: {
                                  limit: 6,
                                  where: {
                                    articleType: ['hots']
                                  },
                                  fields: {
                                    content: false
                                  }
                                }
                              }).$promise;
                            }],

                            dataGuidesCommunity: ['Guide', function (Guide) {
                              return Guide.find({
                                filter: {
                                  limit: 10,
                                    order: "createdDate DESC",
                                  where: {
                                    isFeatured: false,
                                      isPublic: true
                                  },
                                  fields: {
                                    name: true,
                                    voteScore: true,
                                    authorId: true,
                                    createdDate: true,
                                    premium: true,
                                    guideType: true,
                                    id: true,
                                    talentTiers: true,
                                    slug: true
                                  },
                                  include: [
                                        {
                                            relation: 'author'
                                        },
                                        {
                                            relation: 'heroes',
                                            scope: {
                                                include: ['talents']
                                            }
                                        },
                                        {
                                            relation: 'maps',
                                            scope: {
                                                fields: {
                                                    name: true,
                                                    className: true
                                                }
                                            }
                                        }
                                    ]
                                }
                              }).$promise;
                            }],

                            communityTalentDict: ['dataGuidesCommunity', function (dataGuidesCommunity) {
                                var dict = {};
                                for (var i = 0; i < dataGuidesCommunity.length; i++) {
                                    for (var k = 0; k < dataGuidesCommunity[i].heroes.length; k++) {
                                        for (var l = 0; l < dataGuidesCommunity[i].heroes[k].talents.length; l++) {
                                            var temp = dataGuidesCommunity[i].heroes[k].talents[l].id;
                                            dict[temp] = dataGuidesCommunity[i].heroes[k].talents[l];
                                        }
                                    }
                                }
                                return dict;
                            }],

                            dataGuidesFeatured: ['Guide', function (Guide) {
                              return Guide.find({
                                filter: {
                                  limit: 10,
                                    order: "createdDate DESC",
                                  where: {
                                    isFeatured: true,
                                      isPublic: true
                                  },
                                  fields: {
                                    name: true,
                                    voteScore: true,
                                    authorId: true,
                                    createdDate: true,
                                    premium: true,
                                    guideType: true,
                                    id: true,
                                    talentTiers: true,
                                    slug: true
                                  },
                                  include: [
                                        {
                                            relation: 'author'
                                        },
                                        {
                                            relation: 'heroes',
                                            scope: {
                                                include: ['talents']
                                            }
                                        },
                                        {
                                            relation: 'maps'
                                        }
                                    ]
                                }
                              }).$promise;
                            }],

                            featuredTalentDict: ['dataGuidesFeatured', function (dataGuidesFeatured) {
                                var dict = {};
                                for (var i = 0; i < dataGuidesFeatured.length; i++) {
                                    for (var k = 0; k < dataGuidesFeatured[i].heroes.length; k++) {
                                        for (var l = 0; l < dataGuidesFeatured[i].heroes[k].talents.length; l++) {
                                            var temp = dataGuidesFeatured[i].heroes[k].talents[l].id;
                                            dict[temp] = dataGuidesFeatured[i].heroes[k].talents[l];
                                        }
                                    }
                                }
                                return dict;
                            }],

                            dataHeroes: ['Hero', function (Hero) {
                              return Hero.find({
                                  filter: {
                                      order: "name ASC"
                                  }
                              }).$promise;
                            }],

                            dataMaps: ['Map', function (Map) {
                              return Map.find({}).$promise;
                            }]
                        }
                    }
                },
                seo: { title: 'Heroes of the Storm', description: 'TempoStorm Heroes of the Storm home.', keywords: '' }
            })
            .state('app.hots.guides', {
                abstract: true,
                url: '/guides',
                views: {
                    hots: {
                        templateUrl: tpl + 'views/frontend/hots.guides.html'
                    }
                }
            })
            .state('app.hots.guides.list', {
                url: '?p&s&t&h&m&a&o',
                views: {
                    guides: {
                        templateUrl: tpl + 'views/frontend/hots.guides.list.html',
                        controller: 'HOTSGuidesListCtrl',
                        resolve: {
                            dataCommunityGuides: ['$stateParams', 'Guide', function ($stateParams, Guide) {
                              return Guide.find({
                                filter: {
                                  limit: 10,
                                  order: 'createdDate DESC',
                                  fields: {
                                    authorId: true,
                                    name: true,
                                    voteScore: true,
                                    createdDate: true,
                                    premium: true,
                                    guideType: true,
                                    id: true,
                                    description: true,
                                    talentTiers: true,
                                    slug: true
                                  },
                                  where: {
                                    isFeatured: false,
                                      isPublic: true
                                  },
                                  include: [
                                    {
                                      relation: 'author'
                                    },
                                    {
                                      relation: 'heroes',
                                      scope: {
                                        include: ['talents']
                                      }
                                    },
                                    {
                                      relation: 'maps'
                                    }
                                  ]
                                }
                              }).$promise;
                            }],
                            communityGuideCount: ['Guide', function(Guide) {
                                return Guide.count({
                                    where: {
                                        featured: false
                                    }
                                }).$promise;
                            }],
                            communityTalents: ['dataCommunityGuides', function (dataCommunityGuides) {
                              var talents = {};
                              for(var i = 0; i < dataCommunityGuides.length; i++) {
                                for(var j = 0; j < dataCommunityGuides[i].heroes.length; j++) {
                                  for(var k = 0; k < dataCommunityGuides[i].heroes[j].talents.length; k++) {
                                    talents[dataCommunityGuides[i].heroes[j].talents[k].id] = dataCommunityGuides[i].heroes[j].talents[k];
                                  }
                                }
                              }
                              return talents;
                            }],
                            dataTopGuide: ['$stateParams', 'Guide', function ($stateParams, Guide) {
                              var guideType = $stateParams.t || 'all',
                                    filters = $stateParams.h || false,
                                    order = $stateParams.o || 'high';

                              return Guide.find({
                                filter: {
                                  order: 'votesCount DESC',
                                  limit: 1,
                                  where: {
                                      guideType: "hero"
                                  },
                                  fields: {
                                    authorId: true,
                                    name: true,
                                    voteScore: true,
                                    createdDate: true,
                                    premium: true,
                                    guideType: true,
                                    id: true,
                                    description: true,
                                    talentTiers: true,
                                    slug: true
                                  },
                                  include: [
                                    {
                                      relation: 'author'
                                    },
                                    {
                                      relation: 'heroes',
                                      scope: {
                                        include: ['talents']
                                      }
                                    },
                                    {
                                      relation: 'maps'
                                    }
                                  ]
                                }
                              }).$promise.then(function (guides) {
                                  return guides;
                              }).catch(function(err) {
                                  console.log("error", err);
                              });
                            }],
                            topGuideTalents: ['dataTopGuide', function (dataTopGuide) {
                            var talents = {};
                            for(var i = 0; i < dataTopGuide.length; i++) {
                                for(var j = 0; j < dataTopGuide[i].heroes.length; j++) {
                                    for(var k = 0; k < dataTopGuide[i].heroes[j].talents.length; k++) {
                                        talents[dataTopGuide[i].heroes[j].talents[k].id] = dataTopGuide[i].heroes[j].talents[k];
                                    }
                                }
                            }
                            return talents;
                            }],
                            dataTempostormGuides: ['Guide', function (Guide) {
                              return Guide.find({
                                filter: {
                                  order: 'createdDate ASC',
                                  limit: 4,
                                  fields: {
                                    authorId: true,
                                    name: true,
                                    voteScore: true,
                                    createdDate: true,
                                    premium: true,
                                    guideType: true,
                                    id: true,
                                    description: true,
                                    talentTiers: true,
                                    slug: true
                                  },
                                  where: {
                                    isFeatured: true
                                  },
                                  include: [
                                    {
                                      relation: 'author'
                                    },
                                    {
                                      relation: 'heroes',
                                      scope: {
                                        include: ['talents']
                                      }
                                    },
                                    {
                                      relation: 'maps'
                                    }
                                  ]
                                }
                              })
                              .$promise;
                            }],
                            tempostormGuideCount: ['Guide', function(Guide) {
                                return Guide.count({
                                    where: {
                                        featured: true
                                    }
                                }).$promise;
                            }],
                            tempostormTalents: ['dataTempostormGuides', function (dataTempostormGuides) {
                              var talents = {};
                              for(var i = 0; i < dataTempostormGuides.length; i++) {
                                for(var j = 0; j < dataTempostormGuides[i].heroes.length; j++) {
                                  for(var k = 0; k < dataTempostormGuides[i].heroes[j].talents.length; k++) {
                                    talents[dataTempostormGuides[i].heroes[j].talents[k].id] = dataTempostormGuides[i].heroes[j].talents[k];
                                  }
                                }
                              }
                              return talents;
                            }],
                            dataHeroes: ['Hero', function (Hero) {
                              return Hero.find({
                                  filter: {
                                      order: "name ASC"
                                  }
                              }).$promise;
                            }],
                            dataMaps: ['Map', function (Map) {
                              return Map.find({}).$promise;
                            }]
                        }
                    }
                },
                seo: { title: 'Guides', description: 'Guides for Heroes of the Storm.', keywords: '' }
            })
            .state('app.hots.guides.guide', {
                url: '/:slug',
                views: {
                    guides: {
                        templateUrl: tpl + 'views/frontend/hots.guides.guide.html',
                        controller: 'HOTSGuideCtrl',
                        resolve: {
                            guide: ['$stateParams', 'Guide', function ($stateParams, Guide) {
                                var slug = $stateParams.slug;
                                console.log('slug: ', slug);
                                return Guide.findOne({
                                    filter: {
                                        where: {
                                            slug: slug
                                        },
                                        include: [
                                            {
                                                relation: "author"
                                            },
                                            {
                                                relation: "heroes",
                                                scope: {
                                                    include: ["talents"]
                                                }
                                            },
                                            {
                                                relation: "maps"
                                            },
                                            {
                                                relation: "comments",
                                                scope: {
                                                    include: [
                                                        "author"
                                                    ]
                                                }
                                            }
                                        ]
                                    }
                                }).$promise.then(function (data) {
                                    console.log(data);
                                    return data;
                                })
                                .catch(function (err) {
                                    console.log('err: ', err);
                                });
                            }],
                            guideTalents: ['guide', function (guide) {
                                var talents = {};
                                console.log('guide: ', guide);
                                if (guide.guideType === "hero") {
                                    for (var i = 0; i < guide.heroes.length; i++) {
                                        for (var j = 0; j < guide.heroes[i].talents.length; j++) {
                                            talents[guide.heroes[i].talents[j].id] = guide.heroes[i].talents[j]
                                        }
                                    }
                                }
                                return talents;
                            }],
                            heroes: ['Hero', function(Hero) {

                                return Hero.find({

                                })
                                .$promise

                            }],
                            maps: ['Map', function(Map) {

                                return Map.find({

                                })
                                .$promise;
                            }]
                        }
                    }
                },
                og: true
            })
            .state('app.hots.guideBuilder', {
                abstract: true,
                url: '/guide-builder',
                views: {
                    hots: {
                        templateUrl: tpl + 'views/frontend/hots.guideBuilder.html'
                    }
                }

            })
            .state('app.hots.guideBuilder.step1', {
                url: '',
                views: {
                    guideBuilder: {
                        templateUrl: tpl + 'views/frontend/hots.guideBuilder.step1.html'
                    }
                },
                seo: { title: 'Guide Builder', description: 'Heroes of the Storm guide builder.', keywords: '' }
            })
            .state('app.hots.guideBuilder.hero', {
                url: '/hero',
                views: {
                    guideBuilder: {
                        templateUrl: tpl + 'views/frontend/hots.guideBuilder.hero.html',
                        controller: 'HOTSGuideBuilderHeroCtrl',
                        resolve: {
                            dataHeroes: ['Hero', function (Hero) {
                                return Hero.find({
                                    filter: {
                                        include: ['talents']
                                    }
                                }).$promise;
                            }],
                            dataMaps: ['Map', function (Map) {
                                return Map.find({}).$promise;
                            }]
                        }
                    }
                },
                seo: { title: 'Guide Builder', description: 'Heroes of the Storm guide builder.', keywords: '' }
            })
            .state('app.hots.guideBuilder.map', {
                url: '/map',
                views: {
                    guideBuilder: {
                        templateUrl: tpl + 'views/frontend/hots.guideBuilder.map.html',
                        controller: 'HOTSGuideBuilderMapCtrl',
                        resolve: {
                            dataHeroes: ['Hero', function (Hero) {
                                return Hero.find({}).$promise;
                            }],
                            dataMaps: ['Map', function (Map) {
                                return Map.find({}).$promise;
                            }]
                        }
                    }
                },
                seo: { title: 'Guide Builder', description: 'Heroes of the Storm guide builder.', keywords: '' }
            })
            .state('app.hots.guideBuilder.edit', {
                abstract: true,
                url: '/edit/:slug',
                views: {
                    guideBuilder: {
                        templateUrl: tpl + 'views/frontend/hots.guideBuilder.edit.html'
                    }
                },
                access: { auth: true }
            })
            .state('app.hots.guideBuilder.edit.step1', {
                url: '',
                views: {
                    edit: {
                        templateUrl: tpl + 'views/frontend/hots.guideBuilder.edit.step1.html',
                        controller: 'HOTSGuideBuilderEditStep1Ctrl',
                        resolve: {
                            dataGuide: ['$stateParams', 'HOTSGuideService', function ($stateParams, HOTSGuideService) {
                                var slug = $stateParams.slug;
                                return HOTSGuideService.guideEdit(slug);
                            }]
                        }
                    }
                },
                seo: { title: 'Guide Builder', description: 'Heroes of the Storm guide builder.', keywords: '' },
                access: { auth: true }
            })
            .state('app.hots.guideBuilder.edit.hero', {
                url: '/hero',
                views: {
                    edit: {
                        templateUrl: tpl + 'views/frontend/hots.guideBuilder.edit.hero.html',
                        controller: 'HOTSGuideBuilderEditHeroCtrl',
                        resolve: {
                            dataGuide: ['$stateParams', 'HOTSGuideService', function ($stateParams, HOTSGuideService) {
                                var slug = $stateParams.slug;
                                return HOTSGuideService.guideEdit(slug);
                            }],
                            dataHeroes: ['HeroService', function (HeroService) {
                                return HeroService.getHeroes();
                            }],
                            dataMaps: ['HOTSGuideService', function (HOTSGuideService) {
                                return HOTSGuideService.getMaps();
                            }]
                        }
                    }
                },
                seo: { title: 'Guide Builder', description: 'Heroes of the Storm guide builder.', keywords: '' },
                access: { auth: true }
            })
            .state('app.hots.guideBuilder.edit.map', {
                url: '/map',
                views: {
                    edit: {
                        templateUrl: tpl + 'views/frontend/hots.guideBuilder.edit.map.html',
                        controller: 'HOTSGuideBuilderEditMapCtrl',
                        resolve: {
                            dataGuide: ['$stateParams', 'HOTSGuideService', function ($stateParams, HOTSGuideService) {
                                var slug = $stateParams.slug;
                                return HOTSGuideService.guideEdit(slug);
                            }],
                            dataHeroes: ['HeroService', function (HeroService) {
                                return HeroService.getHeroes();
                            }],
                            dataMaps: ['HOTSGuideService', function (HOTSGuideService) {
                                return HOTSGuideService.getMaps();
                            }]
                        }
                    }
                },
                seo: { title: 'Guide Builder', description: 'Heroes of the Storm guide builder.', keywords: '' },
                access: { auth: true }
            })
            .state('app.hots.talentCalculator', {
                abstract: true,
                url: '/talent-calculator',
                views: {
                    hots: {
                        templateUrl: tpl + 'views/frontend/hots.talentCalculator.html',
                        controller: 'HOTSTalentCalculatorCtrl',
                        resolve: {
                            heroes: ['Hero', function (Hero) {
                                return Hero.find({
                                    filter: {
                                        order: "name DESC",
                                        fields: {
                                            className: true,
                                            description: true,
                                            heroType: true,
                                            name: true,
                                            role: true,
                                            title: true,
                                            universe: true
                                        }
                                    }
                                })
                                .$promise;
                            }]
                        }
                    }
                }
            })
            .state('app.hots.talentCalculator.redirect', {
                url: '',
                resolve: {
                    dataHeroesList: ['Hero', '$q', function (Hero, $q) {
                        return Hero.find({
                            filter: {
                                fields: {
                                    className: true
                                }
                            }
                        }).$promise;
                    }],
                    redirect: ['$q', '$state', 'dataHeroesList', function ($q, $state, dataHeroesList) {
                        $state.go('app.hots.talentCalculator.hero', { hero: dataHeroesList[0].className });
                        return $q.reject();
                    }]
                },
                seo: { title: 'Talent Calculator', description: 'Talent Calculator for Heroes of the Storm', keywords: '' }
            })
            .state('app.hots.talentCalculator.hero', {
                url: '/:hero',
                views: {
                    calc: {
                        templateUrl: tpl + 'views/frontend/hots.talentCalculator.hero.html',
                        controller: 'HOTSTalentCalculatorHeroCtrl',
                        resolve: {
                            hero: ['$stateParams', '$q', 'Hero', '$filter', '$state', function ($stateParams, $q, Hero, $filter, $state) {
                                var hero = $stateParams.hero;
                                return Hero.findOne({
                                    filter: {
                                        where: {
                                            className: hero
                                        },
                                        include: [
                                            {
                                                relation: 'talents',
                                                scope: {
                                                    order: "orderNum ASC"
                                                }
                                            }
                                        ]
                                    }
                                })
                                .$promise
                                .then(function (hero) {
                                    console.log(hero);
                                    return hero;
                                })
                                .catch(function(err) {
                                    console.log(err.status, err.data.error.code, "REDIRECTING");
                                    $state.go('app.hots.talentCalculator.redirect')
                                });
                            }]
                        }
                    }
                },
                seo: { title: 'Talent Calculator', description: 'Talent Calculator for Heroes of the Storm', keywords: '' }
            })
            .state('app.forum', {
                abstract: true,
                url: 'forum',
                views: {
                    content: {
                        templateUrl: tpl + 'views/frontend/forum.html'
                    }
                }
            })
            .state('app.forum.home', {
                url: '',
                views: {
                    forum: {
                        templateUrl: tpl + 'views/frontend/forum.home.html',
                        controller: 'ForumCategoryCtrl',
                        resolve: {
                            forumCategories: ['$q', 'ForumCategory', 'ForumThread', function($q, ForumCategory, ForumThread) {
                                var d = $q.defer();
                                ForumCategory.find({
                                    where: {
                                        isActive: true
                                    },
                                    fields: {
                                        id: true,
                                        title: true
                                    }
                                }).$promise
                                .then(function (categories) {
                                    async.forEach(categories, function (category, eachCategoryCallback) {
                                        ForumCategory.forumThreads({
                                            id: category.id,
                                            filter: {
                                                where: {
                                                    isActive: true
                                                },
                                                fields: {
                                                    id: true,
                                                    title: true,
                                                    description: true,
                                                    slug: true
                                                },
                                                order: 'orderNum ASC'
                                            }
                                        }).$promise.then(function (threads) {
                                            category.forumThreads = threads;
                                            
                                            async.forEach(threads, function (thread, eachThreadCallback) {
                                                ForumThread.forumPosts({
                                                    id: thread.id,
                                                    filter: {
                                                        fields: {
                                                            title: true,
                                                            slug: true,
                                                            authorId: true
                                                        },
                                                        include: {
                                                            relation: 'author',
                                                            scope: {
                                                                fields: {
                                                                    username: true,
                                                                    email: true
                                                                }
                                                            }
                                                        },
                                                        order: 'createdDate DESC',
                                                        limit: 1
                                                    }
                                                }).$promise.then(function (posts) {
                                                    thread.forumPosts = posts;
                                                    ForumThread.forumPosts.count({ id: thread.id }).$promise
                                                    .then(function (results) {
                                                        thread.forumPostsCount = results.count;
                                                        return eachThreadCallback();
                                                    });
                                                });
                                            }, function () {
                                                return eachCategoryCallback();
                                            });
                                        });
                                    }, function () {
                                        console.log(categories);
                                        d.resolve(categories);
                                    });
                                });
                                return d.promise;
                            }]
                        }
                    }
                },
                seo: { title: 'Forum', description: '', keywords: '' }
            })
            .state('app.forum.threads', {
                url: '/:thread',
                views: {
                    forum: {
                        templateUrl: tpl + 'views/frontend/forum.threads.html',
                        controller: 'ForumThreadCtrl',
                        resolve: {
                            forumPostCount: ['$q', '$stateParams', 'ForumThread', function($q, $stateParams, ForumThread) {
                                var slug = $stateParams.thread,
                                    d = $q.defer();
                                
                                ForumThread.findOne({
                                    filter: {
                                        where: {
                                            'slug.url': slug,
                                            isActive: true
                                        }
                                    }
                                }).$promise
                                .then(function (thread) {
                                    ForumThread.forumPosts.count({
                                        id: thread.id
                                    }).$promise
                                    .then(function (count){
                                        d.resolve(count);
                                    })
                                    .catch(function () {
                                        $q.reject();
                                    });
                                })
                                .catch(function () {
                                    $q.reject();
                                });
                                
                                return d.promise;
                            }],
                            forumThread: ['$q', '$stateParams', 'ForumThread', 'ForumPost', function($q, $stateParams, ForumThread, ForumPost) {
                                var slug = $stateParams.thread,
                                    d = $q.defer();
                                
                                ForumThread.findOne({
                                    filter: {
                                        where: {
                                            'slug.url': slug,
                                            isActive: true
                                        },
                                        fields: {
                                            id: true,
                                            slug: true,
                                            title: true
                                        },
                                        include: {
                                            relation: 'forumPosts',
                                            scope: {
                                                fields: ['id', 'slug', 'title', 'authorId', 'viewCount', 'createdDate'],
                                                include: {
                                                    relation: 'author',
                                                    scope: {
                                                        fields: ['email', 'username']
                                                    }
                                                },
                                                order: "createdDate DESC",
                                                offset: 0,
                                                limit: 20
                                            }
                                        }
                                    }
                                }).$promise
                                .then(function (thread) {
                                    
                                    async.each(thread.forumPosts, function (post, eachCallback) {
                                        ForumPost.comments.count({
                                            id: post.id
                                        }).$promise
                                        .then(function (count) {
                                            post.commentCount = count.count;
                                            return eachCallback();
                                        })
                                        .catch(function () {
                                            $q.reject();
                                        });
                                    }, function () {
                                        return d.resolve(thread);
                                    });
                                    
                                })
                                .catch(function () {
                                    $q.reject();
                                });
                                
                                return d.promise;
                            }]
                        }
                    }
                },
                og: true
            })
            .state('app.forum.add', {
                url: '/:thread/add',
                views: {
                    forum: {
                        templateUrl: tpl + 'views/frontend/forum.add.html',
                        controller: 'ForumAddCtrl',
                        resolve: {
                            thread: ['$stateParams', 'ForumThread', function($stateParams, ForumThread) {
                                var thread = $stateParams.thread;
                                return ForumThread.findOne({
                                    filter: {
                                        where: {
                                            'slug.url': thread,
                                            isActive: true
                                        },
                                        fields: {
                                            id: true,
                                            slug: true,
                                            title: true
                                        }
                                    }
                                }).$promise;
                            }]
                        }
                    }
                }
            })
            .state('app.forum.post', {
                url: '/:thread/:post',
                views: {
                    forum: {
                        templateUrl: tpl + 'views/frontend/forum.post.html',
                        controller: 'ForumPostCtrl',
                        resolve: {
                            forumPost: ['$stateParams', 'ForumPost', function($stateParams, ForumPost) {
                                var thread = $stateParams.thread,
                                    post = $stateParams.post;
                                return ForumPost.findOne({
                                    filter: {
                                        where: {
                                            'slug.url': post
                                        },
                                        include: [
                                            {
                                                relation: 'forumThread',
                                                scope: {
                                                    where: {
                                                        'slug.url': thread
                                                    }
                                                }
                                            },
                                            {
                                                relation: 'comments',
                                                scope: {
                                                    include: ['author']
                                                }
                                            },
                                            {
                                                relation: 'author'
                                            }
                                        ]
                                    }
                                }).$promise;
                            }]
                        }
                    }
                },
                og: true
            })
            .state('app.teams', {
                url: 'teams',
                views: {
                    content: {
                        controller: 'TeamCtrl',
                        templateUrl: tpl + 'views/frontend/teams.html',
                        resolve: {
                            hsTeam: ['TeamMember', function (TeamMember) {
                                return TeamMember.find({
                                    filter: {
                                        where: {
                                            game: 'hs',
                                            isActive: true
                                        },
                                        order: 'orderNum ASC'
                                    }
                                }).$promise;
                            }],
                            hotsTeam: ['TeamMember', function (TeamMember) {
                                return TeamMember.find({
                                    filter: {
                                        where: {
                                            game: 'hots',
                                            isActive: true
                                        },
                                        order: 'orderNum ASC'
                                    }
                                }).$promise;
                            }],
                            wowTeam: ['TeamMember', function (TeamMember) {
                                return TeamMember.find({
                                    filter: {
                                        where: {
                                            game: 'wow',
                                            isActive: true
                                        },
                                        order: 'orderNum ASC'
                                    }
                                }).$promise;
                            }],
                            fifaTeam: ['TeamMember', function (TeamMember) {
                                return TeamMember.find({
                                    filter: {
                                        where: {
                                            game: 'fifa',
                                            isActive: true
                                        },
                                        order: 'orderNum ASC'
                                    }
                                }).$promise;
                            }],
                            fgcTeam: ['TeamMember', function (TeamMember) {
                                return TeamMember.find({
                                    filter: {
                                        where: {
                                            game: 'fgc',
                                            isActive: true
                                        },
                                        order: 'orderNum ASC'
                                    }
                                }).$promise;
                            }]
                        }
                    }
                },
                seo: { title: 'Teams', description: 'Teams on Tempostorm', keywords: '' }
            })
            .state('app.polls', {
                url: 'vote',
                views: {
                    content: {
                        templateUrl: tpl + 'views/frontend/polls.html',
                        controller: 'PollsCtrl',
                        resolve: {
                          dataPollsMain: ['Poll', function (Poll) {
                            return Poll.find({
                                filter: {
                                    where: {
                                        view: 'main'
                                    }
                                }
                            }).$promise;
                          }],
                          dataPollsSide: ['Poll', function (Poll) {
                            return Poll.find({
                                filter: {
                                    where: {
                                        view: 'side'
                                    }
                                }
                            }).$promise;
                          }]
                        }
                    }
                },
                seo: { title: 'Vote', description: 'Vote on TempoStorm', keywords: '' }
            })
            .state('app.sponsors', {
                url: 'sponsors',
                views: {
                    content: {
                        templateUrl: tpl + 'views/frontend/sponsors.html'
                    }
                },
                seo: { title: 'Sponsors', description: 'TempoStorm sponsor page.', keywords: '' }
            })
            .state('app.premium', {
                url: 'premium',
                views: {
                    content: {
                        templateUrl: tpl + 'views/frontend/premium.html',
                        controller: 'PremiumCtrl'
                    }
                },
                seo: { title: 'Get Premium', description: 'Get Premium with TempoStorm', keywords: '' }
            })
            .state('app.terms', {
                url: 'terms',
                views: {
                    content: {
                        templateUrl: tpl + 'views/frontend/terms.html'
                    }
                },
                seo: { title: 'Terms and Conditions', description: 'TempoStorm Terms and Conditions', keywords: '' }
            })
            .state('app.privacy', {
                url: 'privacy',
                views: {
                    content: {
                        templateUrl: tpl + 'views/frontend/privacy.html'
                    }
                },
                seo: { title: 'Privacy Policy', description: 'TempoStorm Privacy Policy', keywords: '' }
            })
            .state('app.login', {
                url: 'login?redirect',
                views: {
                    content: {
                        templateUrl: tpl + 'views/frontend/login.html',
                    }
                },
                access: { noauth: true },
                seo: { title: 'Login', description: 'Login to TempoStorm', keywords: '' }
            })
            .state('app.signup', {
                url: 'signup',
                views: {
                    content: {
                        templateUrl: tpl + 'views/frontend/signup.html',
                    }
                },
                access: { noauth: true },
                seo: { title: 'Sign up', description: 'Sign up for TempoStorm.', keywords: '' }
            })
            .state('app.verify', {
                url: 'verify?email&code',
                views: {
                    content: {
                        templateUrl: tpl + 'views/frontend/verify.html',
                        controller: 'UserVerifyCtrl',
                    }
                },
                access: { noauth: true },
                seo: { title: 'Verify your Email', description: '', keywords: '' }
            })
            .state('app.forgotPassword', {
                url: 'forgot-password',
                views: {
                    content: {
                        templateUrl: tpl + 'views/frontend/forgot-password.html',
                    }
                },
                access: { noauth: true },
                seo: { title: 'Forgot your Password?', description: 'Recover your Password.', keywords: '' }
            })
            .state('app.resetPassword', {
                url: 'forgot-password/reset?userId&access_token',
                views: {
                    content: {
                        templateUrl: tpl + 'views/frontend/reset-password.html',
                        controller: 'UserResetPasswordCtrl'
                    }
                },
                access: { noauth: true },
                seo: { title: 'Reset your Password', description: '', keywords: '' }
            })
            .state('app.profile', {
                abstract: true,
                url: 'user/:username',
                resolve: {
                    userProfile: ['$stateParams', 'User', function ($stateParams, User) {
                      var username = $stateParams.username;
                        console.log("what");
                      return User.find({
                        filter: {
                            where: {
                                username: username
                            }
                        }
                      })
                      .$promise
                      .then(function (data) {
                          console.log(data);
                          return data[0];
                      });
                    }]
                },
                views: {
                    content: {
                        controller: 'ProfileCtrl',
                        templateUrl: tpl + 'views/frontend/profile.html',
                        resolve: {
                            profile: ['userProfile', function (userProfile) {
                                return userProfile;
                            }],
                            postCount: ['userProfile', 'ForumPost', function (userProfile, ForumPost) {
                                return ForumPost.count({
                                    where: {
                                        and: [
                                            {
                                                authorId: userProfile.id
                                            }
                                        ]
                                    }
                                }).$promise;
                            }],
                            deckCount: ['userProfile', 'Deck', function (userProfile, Deck) {
                                return Deck.count({
                                    where: {
                                        and: [
                                            {
                                                authorId: userProfile.id
                                            }
                                        ]
                                    }
                                }).$promise;
                            }],
                            guideCount: ['userProfile', 'Guide', function (userProfile, Guide) {
                                return Guide.count({
                                    where: {
                                        and: [
                                            {
                                                authorId: userProfile.id
                                            }
                                        ]
                                    }
                                }).$promise;
                            }]
                        }
                    }
                }
            })
            .state('app.profile.activity', {
                url: '',
                views: {
                    profile: {
                        templateUrl: tpl + 'views/frontend/profile.activity.html',
                        controller: 'ProfileActivityCtrl',
                        resolve: {
                            activities: ['userProfile', 'Activity', function (userProfile, Activity) {
                                console.log("o-o-o-o-okay", userProfile.id);
                                return Activity.find({
                                    filter: {
                                        order: "createdDate DESC",
                                        limit: 3,
                                        where: {
                                            authorId: userProfile.id
                                        },
                                        include: [
                                            {
                                                relation: 'article'
                                            },
                                            {
                                                relation: 'deck'
                                            },
                                            {
                                                relation: 'guide'
                                            }
                                        ]
                                    }
                                })
                                .$promise;
                            }],
                            activityCount: ['userProfile', 'Activity', function (userProfile, Activity) {
                                return Activity.count({
                                    where: {
                                        authorId: userProfile.id
                                    }
                                }).$promise;
                            }]
                        }
                    }
                }
            })
            .state('app.profile.articles', {
                url: '/articles',
                views: {
                    profile: {
                        templateUrl: tpl + 'views/frontend/profile.articles.html',
                        controller: 'ProfileArticlesCtrl',
                        resolve: {
                            articles: ['userProfile', 'Article', function (userProfile, Article) {
                                console.log(userProfile);
                                return Article.find({
                                    filter: {
                                        where: {
                                            authorId: userProfile.id
                                        }
                                    }
                                })
                                .$promise;
                            }]
                        }
                    }
                }
            })
            .state('app.profile.decks', {
                url: '/decks',
                views: {
                    profile: {
                        templateUrl: tpl + 'views/frontend/profile.decks.html',
                        controller: 'ProfileDecksCtrl',
                        resolve: {
                            decks: ['User', 'userProfile', 'Deck', 'AuthenticationService', function (User, userProfile, Deck, AuthenticationService) {
                                return Deck.find({
                                    filter: {
                                        where: {
                                            authorId: userProfile.id
                                        },
                                        include: [
                                            {
                                                relation: 'author'
                                            }
                                        ]
                                    }
                                })
                                .$promise;
                            }]
                        }
                    }
                }
            })
            .state('app.profile.guides', {
                url: '/guides',
                views: {
                    profile: {
                        templateUrl: tpl + 'views/frontend/profile.guides.html',
                        controller: 'ProfileGuidesCtrl',
                        resolve: {
                            guides: ['userProfile', 'Guide', 'AuthenticationService', 'User', function (userProfile, Guide, AuthenticationService, User) {
                                return Guide.find({
                                    filter: {
                                        where: {
                                            authorId: userProfile.id
                                        },
                                        include: [
                                            {
                                                relation: 'author'
                                            }
                                        ]
                                    }
                                })
                            }]
                        }
                    }
                }
            })
            .state('app.profile.posts', {
                url: '/posts',
                views: {
                    profile: {
                        templateUrl: tpl + 'views/frontend/profile.posts.html',
                        controller: 'ProfilePostsCtrl',
                        resolve: {
                            dataPosts: ['$stateParams', 'ProfileService', function ($stateParams, ProfileService) {
                                var username = $stateParams.username;
                                return ProfileService.getProfile(username);
                            }]
                        }
                    }
                }
            })
            .state('app.profile.edit', {
                url: '/edit',
                abstract: true,
                views: {
                    profile: {
                        templateUrl: tpl + 'views/frontend/profile.edit.html',
                        controller: 'ProfileEditCtrl',
                        resolve: {
                            user: ['$stateParams', 'User', function ($stateParams, User) {
                                return User.findOne({
                                    filter: {
                                        where: {
                                            username: $stateParams.username
                                        }
                                    }
                                })
                                .$promise;
                            }],
                            isLinked: ['User', function (User) {
                                var obj = {};
                                
                                async.series([
                                    function (seriesCb) {
                                        User.isLinked({
                                            provider: 'twitch'
                                        })
                                        .$promise
                                        .then(function (data) {
                                            obj.twitch = data.isLinked;
                                        });
                                        
                                        return seriesCb();
                                    },
                                    function (seriesCb) {
                                        User.isLinked({
                                            provider: 'bnet'
                                        })
                                        .$promise
                                        .then(function (data) {
                                            obj.bnet = data.isLinked;
                                        });
                                        
                                        return seriesCb();
                                    }
                                ]);
                                
                                return obj;
                            }]
                        }
                    }
                },
                access: { auth: true },
            })
            .state('app.profile.edit.basic', {
                url: '',
                views: {
                    editProfile: {
                        templateUrl: tpl + 'views/frontend/profile.edit.basic.html'
                    }
                }
            })
            .state('app.profile.edit.connect', {
                url: '/connect',
                views: {
                    editProfile: {
                        templateUrl: tpl + 'views/frontend/profile.edit.connect.html'
                    }
                }
            })
            .state('app.profile.edit.social', {
                url: '/social',
                views: {
                    editProfile: {
                        templateUrl: tpl + 'views/frontend/profile.edit.social.html'
                    }
                }
            })
            .state('app.profile.edit.premium', {
                url: '/premium',
                views: {
                    editProfile: {
                        templateUrl: tpl + 'views/frontend/profile.edit.premium.html'
                    }
                }
            })
            .state('app.profile.changeEmail', {
                url: '/email-change-confirm?code',
                views: {
                    profile: {
                        templateUrl: tpl + 'views/frontend/blank.html',
                        controller: 'ProfileEmailChangeCtrl',
                        resolve: {
                            data: ['$stateParams', 'ProfileService', function ($stateParams, ProfileService) {
                                var code = $stateParams.code || false;
                                return ProfileService.changeEmail(code);
                            }]
                        }
                    }
                },
                access: { auth: true },
                seo: { title: 'Change my Email', description: '', keywords: '' }
            })
            .state('app.profile.updateEmail', {
                url: '/email-verify?code',
                views: {
                    profile: {
                        templateUrl: tpl + 'views/frontend/blank.html',
                        controller: 'ProfileEmailConfirmCtrl',
                        resolve: {
                            data: ['$stateParams', 'ProfileService', function ($stateParams, ProfileService) {
                                var code = $stateParams.code || false;
                                return ProfileService.updateEmail(code);
                            }]
                        }
                    }
                },
                access: { auth: true }
            })
            .state('app.profile.subscription', {
                url: '/subscription?plan',
                views: {
                    profile: {
                        templateUrl: tpl + 'views/frontend/profile.subscription.html',
                        controller: 'ProfileSubscriptionCtrl',
                        resolve: {
                            dataProfileEdit: ['$stateParams', 'ProfileService', function ($stateParams, ProfileService) {
                                var username = $stateParams.username;
                                return ProfileService.getUserProfile(username);
                            }]
                        }
                    }
                },
                access: { auth: true },
                seo: { title: 'My Subscription', description: '', keywords: '' }
            })
            .state('app.admin', {
                abstract: true,
                url: 'admin',
                views: {
                    content: {
                        templateUrl: tpl + 'views/admin/index.html',
                        resolve: {
                            admin: ['User', function (User) {
                                return true;
                            }]
                        }
                    }
                },
                access: { auth: true, admin: true }

            })
            .state('app.admin.dashboard', {
                url: '',
                views: {
                    admin: {
                        templateUrl: tpl + 'views/admin/dashboard.html'
                    }
                },
                access: { auth: true, admin: true },
                seo: { title: 'Admin', description: '', keywords: '' }
            })
            .state('app.admin.articles', {
                abstract: true,
                url: '/articles',
                views: {
                    admin: {
                        templateUrl: tpl + 'views/admin/articles.html'
                    }
                },
                access: { auth: true, admin: true },
                seo: { title: 'Admin', description: '', keywords: '' }
            })
            .state('app.admin.articles.list', {
                url: '',
                views: {
                    articles: {
                        templateUrl: tpl + 'views/admin/articles.list.html',
                        controller: 'AdminArticleListCtrl',
                        resolve: {
                            paginationParams: [function() {
                                return {
                                    page: 1,
                                    perpage: 50,
                                    options: {
                                        filter: {
                                            limit: 50,
                                            order: 'createdDate DESC',
                                            fields: ['id', 'title', 'createdDate']
                                        }
                                    }
                                };
                            }],
                            articlesCount: ['Article', function (Article) {
                                return Article.count({}).$promise;
                            }],
                            articles: ['Article', 'paginationParams', function (Article, paginationParams) {
                                var options = {
                                        filter: {
                                            limit: paginationParams.perpage,
                                            order: "createdDate DESC",
                                            fields: paginationParams.options.filter.fields
                                        }
                                    };

                                return Article.find(options)
                                .$promise
                                .then(function (data) {
                                    return data;
                                });
                            }]
                        }
                    }
                },
                access: { auth: true, admin: true },
                seo: { title: 'Admin', description: '', keywords: '' }
            })
            .state('app.admin.articles.add', {
                url: '/add',
                views: {
                    articles: {
                        templateUrl: tpl + 'views/admin/articles.add.html',
                        controller: 'AdminArticleAddCtrl',
                        resolve: {
                            heroes: ['Hero', function (Hero) {
                                return Hero.find({
                                    filter: {
                                        order: "name"
                                    }
                                })
                                .$promise;
                            }]
//                            dataDecks: ['AdminDeckService', function (AdminDeckService) {
//                                return AdminDeckService.getDecks(1, 10, '');
//                            }],
//                            dataGuides: ['AdminHOTSGuideService', function (AdminHOTSGuideService) {
//                                return AdminHOTSGuideService.getGuides(1, 10, '');
//                            }],
//                            dataArticles: ['AdminArticleService', function (AdminArticleService) {
//                                return AdminArticleService.getArticles(1, 10, '');
//                            }],
//                            dataProviders: ['AdminUserService', function (AdminUserService) {
//                                return AdminUserService.getProviders();
//                            }],
//                            dataHeroes: ['AdminHeroService', function (AdminHeroService) {
//                                return AdminHeroService.getAllHeroes();
//                            }]
                        }
                    }
                },
                access: { auth: true, admin: true },
                seo: { title: 'Admin', description: '', keywords: '' }
            })
            .state('app.admin.articles.edit', {
                url: '/edit/:articleID',
                views: {
                    articles: {
                        templateUrl: tpl + 'views/admin/articles.edit.html',
                        controller: 'AdminArticleEditCtrl',
                        resolve: {
                            article: ['$stateParams', 'Article', function ($stateParams, Article) {
                                var articleID = $stateParams.articleID;
                                console.log(articleID);
                                return Article.findOne({
                                    filter: {
                                        where: {
                                            id: articleID
                                        },
                                        include: [
                                            {
                                                relation: "guide"
                                            },
                                            {
                                                relation: "deck"
                                            },
                                            {
                                                relation: "author"
                                            },
                                            {
                                                relation: "relatedArticles"
                                            }
                                        ]
                                    }
                                })
                                .$promise
                                .then(function (data) {
                                    data.related = data.relatedArticles;
                                    return data;
                                });
                            }],
                            heroes: ['Hero', function (Hero) {
                                return Hero.find({
                                    filter: {
                                        order: "name"
                                    }
                                })
                                .$promise;
                            }]
//                            dataDecks: ['AdminDeckService', function (AdminDeckService) {
//                                var page = 1,
//                                    perpage = 10,
//                                    search = '';
//                                return AdminDeckService.getDecks(page, perpage, search);
//                            }],
//                            dataGuides: ['AdminHOTSGuideService', function (AdminHOTSGuideService) {
//                                return AdminHOTSGuideService.getAllGuides();
//                            }],
//                            dataArticles: ['AdminArticleService', function (AdminArticleService) {
//                                return AdminArticleService.getAllArticles();
//                            }],
//                            dataProviders: ['AdminUserService', function (AdminUserService) {
//                                return AdminUserService.getProviders();
//                            }],
//                            dataHeroes: ['AdminHeroService', function (AdminHeroService) {
//                                return AdminHeroService.getAllHeroes();
//                            }]
                        }
                    }
                },
                access: { auth: true, admin: true },
                seo: { title: 'Admin', description: '', keywords: '' }
            })
            .state('app.admin.hearthstone', {
                abstract: true,
                url: '/hs',
                views: {
                    admin: {
                        templateUrl: tpl + 'views/admin/hearthstone.html'
                    }
                },
                access: { auth: true, admin: true },
                seo: { title: 'Admin', description: '', keywords: '' }
            })
            .state('app.admin.hearthstone.decks', {
                abstract: true,
                url: '/decks',
                views: {
                    hearthstone: {
                        templateUrl: tpl + 'views/admin/decks.html'
                    }
                },
                access: { auth: true, admin: true },
                seo: { title: 'Admin', description: '', keywords: '' }
            })
            .state('app.admin.hearthstone.decks.list', {
                url: '',
                views: {
                    decks: {
                        templateUrl: tpl + 'views/admin/decks.list.html',
                        controller: 'AdminDeckListCtrl',
                        resolve: {
                            paginationParams: [function() {
                                return {
                                    page: 1,
                                    perpage: 50,
                                    search: '',
                                    options: {
                                        filter: {
                                            fields: ["id", "name", "playerClass", "description"]
                                        }
                                    }
                                };
                            }],

                            decksCount: ['Deck', function(Deck) {
                                return Deck.count({}).$promise;
                            }],

                            decks: ['Deck', 'paginationParams', function (Deck, paginationParams) {
                                var page = paginationParams.page,
                                    perpage = paginationParams.perpage,
                                    search = paginationParams.search;

                                return Deck.find({
                                    filter: {
                                        limit: paginationParams.perpage,
                                        skip: (page*perpage) - perpage,
                                        order: "createdDate DESC",
                                        fields: paginationParams.options.filter.fields,
                                        include: [
                                            {
                                                relation: 'mulligans'
                                            }
                                        ]
                                    }
                                })
                                .$promise;
                            }]
                        }
                    }
                },
                access: { auth: true, admin: true },
                seo: { title: 'Admin', description: '', keywords: '' }
            })
            .state('app.admin.hearthstone.decks.add', {
                url: '/add',
                views: {
                    decks: {
                        templateUrl: tpl + 'views/admin/decks.add.class.html',
                        controller: 'AdminDeckBuilderClassCtrl'
                    }
                },
                access: { auth: true, admin: true },
                seo: { title: 'Admin', description: '', keywords: '' }
            })
            .state('app.admin.hearthstone.decks.addBuild', {
                url: '/add/:playerClass',
                views: {
                    decks: {
                        templateUrl: tpl + 'views/admin/decks.add.build.html',
                        controller: 'AdminDeckAddCtrl',
                        resolve: {
                            
                            classCardsList: ['$stateParams', 'deck', 'Card', function($stateParams, deck, Card) {
                                    var playerClass = $stateParams.playerClass;

                                return Card.find({
                                    filter: {
                                        where: {
                                            playerClass: playerClass,
                                            deckable: true
                                        },
                                        order: ['cost ASC', 'cardType ASC', 'name ASC'],
                                        limit: 15
                                    }
                                }).$promise;
                            }],

                            classCardsCount: ['$stateParams', 'deck', 'Card', function ($stateParams, deck, Card) {
                                var playerClass = $stateParams.playerClass;
                                return Card.count({
                                    where: {
                                        playerClass: playerClass
                                    }
                                }).$promise;
                            }],

                            neutralCardsCount: ['Card', function (Card) {
                                return Card.count({
                                    where: {
                                        playerClass: 'Neutral'
                                    }
                                }).$promise;
                            }],

                            neutralCardsList: ['Card', function (Card) {
                                return Card.find({
                                    filter: {
                                        where: {
                                            playerClass: 'Neutral',
                                            deckable: true
                                        },
                                        order: ["cost ASC", "cardType ASC", "name ASC"],
                                        limit: 15
                                    }
                                }).$promise;
                            }],
                        }
                    }
                },
                access: { auth: true, admin: true },
                seo: { title: 'Admin', description: '', keywords: '' }
            })
            .state('app.admin.hearthstone.decks.edit', {
                url: '/edit/:deckID',
                views: {
                    decks: {
                        templateUrl: tpl + 'views/admin/decks.edit.html',
                        controller: 'AdminDeckEditCtrl',
                        resolve: {
                            isUserAdmin: ['User', function(User) {
                                if (User.isAuthenticated() === false) {
                                    return false;
                                } else {
                                    return User.isRole({
                                        roleName: '$admin'
                                    })
                                    .$promise
                                    .then(function (isAdmin) {
    //                                    console.log('isAdmin: ', isAdmin.isRole);
                                        return isAdmin.isRole;
                                    })
                                    .catch(function (err) {
                                        if (err) {
                                            console.log('resolve err: ', err);
                                        }
                                    });
                                }
                            }],
                            isUserContentProvider: ['User', function(User) {
                                if (User.isAuthenticated() === false) {
                                    return false;
                                } else {
                                    return User.isRole({
                                        roleName: '$contentProvider'
                                    })
                                    .$promise
                                    .then(function (isContentProvider) {
    //                                    console.log('isContentProvider: ', isContentProvider.isRole);
                                        return isContentProvider.isRole;
                                    })
                                    .catch(function (err) {
                                        if (err) {
                                            console.log('resolve err: ', err);
                                        }
                                    });
                                }
                            }],
                            resolveParams: [function() {
                                return {
                                    page: 1,
                                    perpage: 15,
                                    options: {
                                        filter: {
                                            fields: {
                                                id: true,
                                                createdDate: true,
                                                name: true,
                                                description: true,
                                                playerClass: true,
                                                premium: true,
                                                slug: true,
                                                dust: true,
                                                heroName: true,
                                                authorId: true,
                                                viewCount: true,
                                                isPublic: true,
                                                chapters: true,
                                                deckType: true,
                                                gameModeType: true,
                                                youtubeId: true
                                            },
                                            include: [
                                                {
                                                    relation: 'cards',
                                                    scope: {
                                                        include: 'card'
                                                    }
                                                },
                                                {
                                                    relation: 'matchups'
                                                }
                                            ]
                                        }
                                    }
                                };
                            }],
                            
                            mulligans: ['Mulligan', '$stateParams', function(Mulligan, $stateParams) {
                                var deckID = $stateParams.deckID;
                                
                                return Mulligan.find({
                                    filter: {
                                        where: {
                                            deckId: deckID
                                        },
                                        include: [
                                            {
                                                relation: 'cardsWithCoin',
                                            },
                                            {
                                                relation: 'cardsWithoutCoin'
                                            }
                                        ]
                                    }
                                }).$promise
                                .then(function (data) {
//                                    console.log('mulligan data: ', data);
                                    return data;
                                })
                                .catch(function (err) {
                                    if (err) console.log('err: ', err);
                                });
                            }],
            
                            deck: ['$stateParams', 'mulligans', 'resolveParams', 'Deck', function ($stateParams, mulligans, resolveParams, Deck) {
                                var deckID = $stateParams.deckID;
                                return Deck.findById({
                                    id: deckID,
                                    filter: resolveParams.options.filter
                                })
                                .$promise
                                .then(function (data) {
                                    data.mulligans = mulligans;
//                                    console.log('mulligans resolve: ', mulligans);
//                                    data.isUserContentProvider = isUserContentProvider;
                                    return data;
                                })
                                .catch(function(err) {
                                    console.log('err: ', err);
                                });
                            }],
                                
                            classCardsList: ['$stateParams', 'deck', 'Card', function($stateParams, deck, Card) {
                                var perpage = 15,
                                    playerClass = deck.playerClass;

                                return Card.find({
                                    filter: {
                                        where: {
                                            playerClass: playerClass,
                                            deckable: true
                                        },
                                        order: ['cost ASC', 'cardType ASC', 'name ASC'],
                                        limit: perpage
                                    }
                                }).$promise;
                            }],

                            classCardsCount: ['$stateParams', 'deck', 'Card', function ($stateParams, deck, Card) {
                                var deckID = $stateParams.deckID;
                                return Card.count({
                                    where: {
                                        playerClass: deck.playerClass
                                    }
                                }).$promise;
                            }],

                            neutralCardsCount: ['Card', function (Card) {
                                return Card.count({
                                    where: {
                                        playerClass: 'Neutral'
                                    }
                                }).$promise;
                            }],

                            neutralCardsList: ['Card', function (Card) {
                                return Card.find({
                                    filter: {
                                        where: {
                                            playerClass: 'Neutral',
                                            deckable: true
                                        },
                                        order: ["cost ASC", "cardType ASC", "name ASC"],
                                        limit: 15
                                    }
                                }).$promise;
                            }],

                            toStep: ['$stateParams', function ($stateParams) {
                                if($stateParams.goTo) {
                                    return $stateParams.goTo;
                                }
                            }]

                        }
                    }
                },
                access: { auth: true, admin: true },
                seo: { title: 'Admin', description: '', keywords: '' }
            })
            .state('app.admin.hearthstone.cards', {
                abstract: true,
                url: '/cards',
                views: {
                    hearthstone: {
                        templateUrl: tpl + 'views/admin/cards.html'
                    }
                },
                access: { auth: true, admin: true }
            })
            .state('app.admin.hearthstone.cards.list', {
                url: '',
                views: {
                    cards: {
                        templateUrl: tpl + 'views/admin/cards.list.html',
                        controller: 'AdminCardListCtrl',
                        resolve: {
                            cards: ['Card', function (Card) {
                                return Card.find({
                                    filter: {
                                        limit: 50,
                                        page: 1,
                                        order: "name ASC",
                                        fields: [
                                            "name",
                                            "rarity",
                                            "playerClass",
                                            "cardType",
                                            "expansion"
                                        ]
                                    }
                                });
                            }]
                        }
                    }
                },
                access: { auth: true, admin: true },
                seo: { title: 'Admin', description: '', keywords: '' }
            })
            .state('app.admin.hearthstone.cards.add', {
                url: '/add',
                views: {
                    cards: {
                        templateUrl: tpl + 'views/admin/cards.add.html',
                        controller: 'AdminCardAddCtrl'
                    }
                },
                access: { auth: true, admin: true },
                seo: { title: 'Admin', description: '', keywords: '' }
            })
            .state('app.admin.hearthstone.cards.edit', {
                url: '/edit/:cardID',
                views: {
                    cards: {
                        templateUrl: tpl + 'views/admin/cards.edit.html',
                        controller: 'AdminCardEditCtrl',
                        resolve: {
                            data: ['$stateParams', 'AdminCardService', function ($stateParams, AdminCardService) {
                                var cardID = $stateParams.cardID;
                                return AdminCardService.getCard(cardID);
                            }]
                        }
                    }
                },
                access: { auth: true, admin: true },
                seo: { title: 'Admin', description: '', keywords: '' }
            })
            .state('app.admin.hots', {
                abstract: true,
                url: '/hots',
                views: {
                    admin: {
                        templateUrl: tpl + 'views/admin/hots.html'
                    }
                },
                access: { auth: true, admin: true },
                seo: { title: 'Admin', description: '', keywords: '' }
            })
            .state('app.admin.hots.heroes', {
                abstract: true,
                url: '/heroes',
                views: {
                    hots: {
                        templateUrl: tpl + 'views/admin/hots.heroes.html'
                    }
                },
                access: { auth: true, admin: true }
            })
            .state('app.admin.hots.heroes.list', {
                url: '',
                views: {
                    heroes: {
                        templateUrl: tpl + 'views/admin/hots.heroes.list.html',
                        controller: 'AdminHeroListCtrl',
                        resolve: {
                            data: ['AdminHeroService', function (AdminHeroService) {
                                var page = 1,
                                    perpage = 50,
                                    search = '';
                                return AdminHeroService.getHeroes(page, perpage, search);
                            }]
                        }
                    }
                },
                access: { auth: true, admin: true },
                seo: { title: 'Admin', description: '', keywords: '' }
            })
            .state('app.admin.hots.heroes.add', {
                url: '/add',
                views: {
                    heroes: {
                        templateUrl: tpl + 'views/admin/hots.heroes.add.html',
                        controller: 'AdminHeroAddCtrl'
                    }
                },
                access: { auth: true, admin: true },
                seo: { title: 'Admin', description: '', keywords: '' }
            })
            .state('app.admin.hots.heroes.edit', {
                url: '/edit/:heroID',
                views: {
                    heroes: {
                        templateUrl: tpl + 'views/admin/hots.heroes.edit.html',
                        controller: 'AdminHeroEditCtrl',
                        resolve: {
                            data: ['$stateParams', 'AdminHeroService', function ($stateParams, AdminHeroService) {
                                var heroID = $stateParams.heroID;
                                return AdminHeroService.getHero(heroID);
                            }]
                        }
                    }
                },
                access: { auth: true, admin: true },
                seo: { title: 'Admin', description: '', keywords: '' }
            })
            .state('app.admin.hots.maps', {
                abstract: true,
                url: '/maps',
                views: {
                    hots: {
                        templateUrl: tpl + 'views/admin/hots.maps.html'
                    }
                },
                access: { auth: true, admin: true },
                seo: { title: 'Admin', description: '', keywords: '' }
            })
            .state('app.admin.hots.maps.list', {
                url: '',
                views: {
                    maps: {
                        templateUrl: tpl + 'views/admin/hots.maps.list.html',
                        controller: 'AdminMapsListCtrl',
                        resolve: {
                            data: ['AdminMapService', function (AdminMapService) {
                                var page = 1,
                                    perpage = 50,
                                    search = '';
                                return AdminMapService.getMaps(page, perpage, search);
                            }]
                        }
                    }
                },
                access: { auth: true, admin: true },
                seo: { title: 'Admin', description: '', keywords: '' }
            })
            .state('app.admin.hots.maps.add', {
                url: '/add',
                views: {
                    maps: {
                        templateUrl: tpl + 'views/admin/hots.maps.add.html',
                        controller: 'AdminMapAddCtrl'
                    }
                },
                access: { auth: true, admin: true },
                seo: { title: 'Admin', description: '', keywords: '' }
            })
            .state('app.admin.hots.maps.edit', {
                url: '/edit/:mapID',
                views: {
                    maps: {
                        templateUrl: tpl + 'views/admin/hots.maps.edit.html',
                        controller: 'AdminMapEditCtrl',
                        resolve: {
                            data: ['$stateParams', 'AdminMapService', function ($stateParams, AdminMapService) {
                                var mapID = $stateParams.mapID;
                                return AdminMapService.getMap(mapID);
                            }]
                        }
                    }
                },
                access: { auth: true, admin: true },
                seo: { title: 'Admin', description: '', keywords: '' }
            })
            .state('app.admin.hots.guides', {
                abstract: true,
                url: '/guides',
                views: {
                    hots: {
                        templateUrl: tpl + 'views/admin/hots.guides.html'
                    }
                },
                access: { auth: true, admin: true },
                seo: { title: 'Admin', description: '', keywords: '' }
            })
            .state('app.admin.hots.guides.list', {
                url: '',
                views: {
                    guides: {
                        templateUrl: tpl + 'views/admin/hots.guides.list.html',
                        controller: 'AdminHOTSGuideListCtrl',
                        resolve: {
                            data: ['AdminHOTSGuideService', function (AdminHOTSGuideService) {
                                var page = 1,
                                    perpage = 50,
                                    search = '';
                                return AdminHOTSGuideService.getGuides(page, perpage, search);
                            }]
                        }
                    }
                },
                access: { auth: true, admin: true },
                seo: { title: 'Admin', description: '', keywords: '' }
            })
            .state('app.admin.hots.guides.add', {
                abstract: true,
                url: '/add',
                views: {
                    guides: {
                        templateUrl: tpl + 'views/admin/hots.guides.add.html'
                    }
                },
                access: { auth: true, admin: true },
                seo: { title: 'Admin', description: '', keywords: '' }
            })
            .state('app.admin.hots.guides.add.step1', {
                url: '',
                views: {
                    add: {
                        templateUrl: tpl + 'views/admin/hots.guides.add.step1.html'
                    }
                },
                access: { auth: true, admin: true },
                seo: { title: 'Admin', description: '', keywords: '' }
            })
            .state('app.admin.hots.guides.add.hero', {
                url: '/hero',
                views: {
                    add: {
                        templateUrl: tpl + 'views/admin/hots.guides.add.hero.html',
                        controller: 'AdminHOTSGuideAddHeroCtrl',
                        resolve: {
                            dataHeroes: ['AdminHeroService', function (AdminHeroService) {
                                return AdminHeroService.getAllHeroes();
                            }],
                            dataMaps: ['AdminMapService', function (AdminMapService) {
                                return AdminMapService.getAllMaps();
                            }]
                        }
                    }
                },
                access: { auth: true, admin: true },
                seo: { title: 'Admin', description: '', keywords: '' }
            })
            .state('app.admin.hots.guides.add.map', {
                url: '/map',
                views: {
                    add: {
                        templateUrl: tpl + 'views/admin/hots.guides.add.map.html',
                        controller: 'AdminHOTSGuideAddMapCtrl',
                        resolve: {
                            dataHeroes: ['AdminHeroService', function (AdminHeroService) {
                                return AdminHeroService.getAllHeroes();
                            }],
                            dataMaps: ['AdminMapService', function (AdminMapService) {
                                return AdminMapService.getAllMaps();
                            }]
                        }
                    }
                },
                access: { auth: true, admin: true },
                seo: { title: 'Admin', description: '', keywords: '' }
            })
            .state('app.admin.hots.guides.edit', {
                abstract: true,
                url: '/edit',
                views: {
                    guides: {
                        templateUrl: tpl + 'views/admin/hots.guides.edit.html'
                    }
                },
                access: { auth: true, admin: true },
                seo: { title: 'Admin', description: '', keywords: '' }
            })
            .state('app.admin.hots.guides.edit.step1', {
                url: '/:guideID',
                views: {
                    edit: {
                        templateUrl: tpl + 'views/admin/hots.guides.edit.step1.html',
                        controller: 'AdminHOTSGuideEditStep1Ctrl',
                        resolve: {
                            dataGuide: ['$stateParams', 'AdminHOTSGuideService', function ($stateParams, AdminHOTSGuideService) {
                                var guideID = $stateParams.guideID;
                                return AdminHOTSGuideService.getGuide(guideID);
                            }]
                        }
                    }
                },
                access: { auth: true, admin: true },
                seo: { title: 'Admin', description: '', keywords: '' }
            })
            .state('app.admin.hots.guides.edit.hero', {
                url: '/:guideID/hero',
                views: {
                    edit: {
                        templateUrl: tpl + 'views/admin/hots.guides.edit.hero.html',
                        controller: 'AdminHOTSGuideEditHeroCtrl',
                        resolve: {
                            dataGuide: ['$stateParams', 'AdminHOTSGuideService', function ($stateParams, AdminHOTSGuideService) {
                                var guideID = $stateParams.guideID;
                                return AdminHOTSGuideService.getGuide(guideID);
                            }],
                            dataHeroes: ['AdminHeroService', function (AdminHeroService) {
                                return AdminHeroService.getAllHeroes();
                            }],
                            dataMaps: ['AdminMapService', function (AdminMapService) {
                                return AdminMapService.getAllMaps();
                            }]
                        }
                    }
                },
                access: { auth: true, admin: true },
                seo: { title: 'Admin', description: '', keywords: '' }
            })
            .state('app.admin.hots.guides.edit.map', {
                url: '/:guideID/map',
                views: {
                    edit: {
                        templateUrl: tpl + 'views/admin/hots.guides.edit.map.html',
                        controller: 'AdminHOTSGuideEditMapCtrl',
                        resolve: {
                            dataGuide: ['$stateParams', 'AdminHOTSGuideService', function ($stateParams, AdminHOTSGuideService) {
                                var guideID = $stateParams.guideID;
                                return AdminHOTSGuideService.getGuide(guideID);
                            }],
                            dataHeroes: ['AdminHeroService', function (AdminHeroService) {
                                return AdminHeroService.getAllHeroes();
                            }],
                            dataMaps: ['AdminMapService', function (AdminMapService) {
                                return AdminMapService.getAllMaps();
                            }]
                        }
                    }
                },
                access: { auth: true, admin: true },
                seo: { title: 'Admin', description: '', keywords: '' }
            })
            .state('app.admin.forum', {
                abstract: true,
                url: '/forum',
                views: {
                    admin: {
                        templateUrl: tpl + 'views/admin/forum.html'
                    }
                },
                access: { auth: true, admin: true }
            })
            .state('app.admin.forum.structure', {
                abstract: true,
                url: '/structure',
                views: {
                    forum: {
                        templateUrl: tpl + 'views/admin/forum.structure.html'
                    }
                },
                access: { auth: true, admin: true },
                seo: { title: 'Admin', description: '', keywords: '' }
            })
            .state('app.admin.forum.structure.list', {
                url: '',
                views: {
                    categories: {
                        templateUrl: tpl + 'views/admin/forum.structure.list.html',
                        controller: 'AdminForumStructureListCtrl',
                        resolve: {
                            data: ['AdminForumService', function (AdminForumService) {
                                return AdminForumService.getCategories();
                            }]
                        }
                    }
                },
                access: { auth: true, admin: true },
                seo: { title: 'Admin', description: '', keywords: '' }
            })
            .state('app.admin.forum.structure.categoryAdd', {
                url: '/category/add',
                views: {
                    categories: {
                        templateUrl: tpl + 'views/admin/forum.categories.add.html',
                        controller: 'AdminForumCategoryAddCtrl'
                    }
                },
                access: { auth: true, admin: true },
                seo: { title: 'Admin', description: '', keywords: '' }
            })
            .state('app.admin.forum.structure.categoryEdit', {
                url: '/category/edit/:categoryID',
                views: {
                    categories: {
                        templateUrl: tpl + 'views/admin/forum.categories.edit.html',
                        controller: 'AdminForumCategoryEditCtrl',
                        resolve: {
                            data: ['$stateParams', 'AdminForumService', function ($stateParams, AdminForumService) {
                                var categoryID = $stateParams.categoryID;
                                return AdminForumService.getCategory(categoryID);
                            }]
                        }
                    }
                },
                access: { auth: true, admin: true },
                seo: { title: 'Admin', description: '', keywords: '' }
            })
            .state('app.admin.forum.structure.threadAdd', {
                url: '/thread/add',
                views: {
                    categories: {
                        templateUrl: tpl + 'views/admin/forum.threads.add.html',
                        controller: 'AdminForumThreadAddCtrl',
                        resolve: {
                            data: ['AdminForumService', function (AdminForumService) {
                                return AdminForumService.getCategories();
                            }]
                        }
                    }
                },
                access: { auth: true, admin: true },
                seo: { title: 'Admin', description: '', keywords: '' }
            })
            .state('app.admin.forum.structure.threadEdit', {
                url: '/thread/edit/:threadID',
                views: {
                    categories: {
                        templateUrl: tpl + 'views/admin/forum.threads.edit.html',
                        controller: 'AdminForumThreadEditCtrl',
                        resolve: {
                            dataCategories: ['AdminForumService', function (AdminForumService) {
                                return AdminForumService.getCategories();
                            }],
                            dataThread: ['$stateParams', 'AdminForumService', function ($stateParams, AdminForumService) {
                                var threadID = $stateParams.threadID;
                                return AdminForumService.getThread(threadID);
                            }]
                        }
                    }
                },
                access: { auth: true, admin: true },
                seo: { title: 'Admin', description: '', keywords: '' }
            })
            .state('app.admin.forum.management', {
                url: '/management',
                views: {
                    admin: {
                        templateUrl: tpl + 'views/admin/forum.management.html'
                    }
                },
                access: { auth: true, admin: true },
                seo: { title: 'Admin', description: '', keywords: '' }
            })
            .state('app.admin.users', {
                abstract: true,
                url: '/users',
                views: {
                    admin: {
                        templateUrl: tpl + 'views/admin/users.html'
                    }
                },
                access: { auth: true, admin: true },
                seo: { title: 'Admin', description: '', keywords: '' }
            })
            .state('app.admin.users.list', {
                url: '',
                views: {
                    users: {
                        templateUrl: tpl + 'views/admin/users.list.html',
                        controller: 'AdminUserListCtrl',
                        resolve: {
                            paginationParams: [function() {
                                return {
                                    page: 1,
                                    perpage: 50,
                                    search: '',
                                    options: {
                                        filter: {
                                            limit: 50
                                        }
                                    }
                                };
                            }],
//                            data: ['AdminUserService', function (AdminUserService) {
//                                var page = 1,
//                                    perpage = 50,
//                                    search = '';
//                                return AdminUserService.getUsers(page, perpage, search);
//                            }]
                            users: ['User', 'paginationParams', function(User, paginationParams) {
                                return User.find(paginationParams.options).$promise;
                            }]
                        }
                    }
                },
                access: { auth: true, admin: true },
                seo: { title: 'Admin', description: '', keywords: '' }
            })
            .state('app.admin.users.add', {
                url: '/add',
                views: {
                    users: {
                        templateUrl: tpl + 'views/admin/users.add.html',
                        controller: 'AdminUserAddCtrl'
                    }
                },
                access: { auth: true, admin: true },
                seo: { title: 'Admin', description: '', keywords: '' }
            })
            .state('app.admin.users.edit', {
                url: '/edit/:userID',
                views: {
                    users: {
                        templateUrl: tpl + 'views/admin/users.edit.html',
                        controller: 'AdminUserEditCtrl',
                        resolve: {
                            data: ['$stateParams', 'AdminUserService', function ($stateParams, AdminUserService) {
                                var userID = $stateParams.userID;
                                return AdminUserService.getUser(userID);
                            }]
                        }
                    }
                },
                access: { auth: true, admin: true },
                seo: { title: 'Admin', description: '', keywords: '' }
            })
            .state('app.admin.banners', {
                abstract: true,
                url: '/banners',
                views: {
                    admin: {
                        templateUrl: tpl + 'views/admin/banners.html'
                    }
                },
                access: { auth: true, admin: true },
                seo: { title: 'Admin', description: '', keywords: '' }
            })
            .state('app.admin.banners.list', {
                url: '',
                views: {
                    banners: {
                        templateUrl: tpl + 'views/admin/banners.list.html',
                        controller: 'AdminBannerListCtrl',
                        resolve: {
                            data: ['AdminBannerService', function(AdminBannerService) {
                                return AdminBannerService.getBanners();
                            }]
                        }
                    }
                },
                access: { auth: true, admin: true },
                seo: { title: 'Admin', description: '', keywords: '' }
            })
            .state('app.admin.banners.add', {
                url: '/add',
                views: {
                    banners: {
                        templateUrl: tpl + 'views/admin/banners.add.html',
                        controller: 'AdminBannerAddCtrl'
                    }
                },
                access: { auth: true, admin: true },
                seo: { title: 'Admin', description: '', keywords: '' }
            })
            .state('app.admin.banners.edit', {
                url: '/edit/:bannerID',
                views: {
                    banners: {
                        templateUrl: tpl + 'views/admin/banners.edit.html',
                        controller: 'AdminBannerEditCtrl',
                        resolve: {
                            data: ['$stateParams', 'AdminBannerService', function ($stateParams, AdminBannerService) {
                                var bannerID = $stateParams.bannerID;
                                return AdminBannerService.getBanner(bannerID);
                            }]
                        }
                    }
                },
                access: { auth: true, admin: true },
                seo: { title: 'Admin', description: '', keywords: '' }
            })
            .state('app.admin.polls', {
                abstract: true,
                url: '/polls',
                views: {
                    admin: {
                        templateUrl: tpl + 'views/admin/polls.html'
                    }
                },
                access: { auth: true, admin: true },
                seo: { title: 'Admin', description: '', keywords: '' }
            })
            .state('app.admin.polls.list', {
                url: '',
                views: {
                    polls: {
                        templateUrl: tpl + 'views/admin/polls.list.html',
                        controller: 'AdminPollListCtrl',
                        resolve: {
                            data: ['AdminPollService', function (AdminPollService) {
                                var page = 1,
                                    perpage = 50,
                                    search = '';
                                return AdminPollService.getPolls(page, perpage, search);
                            }]
                        }
                    }
                },
                access: { auth: true, admin: true },
                seo: { title: 'Admin', description: '', keywords: '' }
            })
            .state('app.admin.polls.add', {
                url: '/add',
                views: {
                    polls: {
                        templateUrl: tpl + 'views/admin/polls.add.html',
                        controller: 'AdminPollAddCtrl'
                    }
                },
                access: { auth: true, admin: true },
                seo: { title: 'Admin', description: '', keywords: '' }
            })
            .state('app.admin.polls.edit', {
                url: '/edit/:pollID',
                views: {
                    polls: {
                        templateUrl: tpl + 'views/admin/polls.edit.html',
                        controller: 'AdminPollEditCtrl',
                        resolve: {
                            data: ['$stateParams', 'AdminPollService', function($stateParams, AdminPollService){
                                var pollID = $stateParams.pollID;
                                return AdminPollService.getPoll(pollID);
                            }]
                        }
                    }
                },
                access: { auth: true, admin: true },
                seo: { title: 'Admin', description: '', keywords: '' }
            })
            .state('app.admin.snapshots', {
                abstract: true,
                url: '/snapshots',
                views: {
                    admin: {
                        templateUrl: tpl + 'views/admin/snapshots.html'
                    }
                },
                access: { auth: true, admin: true },
                seo: { title: 'Admin', description: '', keywords: '' }
            })
            .state('app.admin.snapshots.list', {
                url: '',
                views: {
                    snapshots: {
                        templateUrl: tpl + 'views/admin/snapshots.list.html',
                        controller: 'AdminSnapshotListCtrl',
                        resolve: {
                            paginationParams: [function() {
                                return {
                                    page: 1,
                                    perpage: 50,
                                    options: {
                                        filter: {
                                            limit: 50,
                                            order: 'createdDate DESC',
                                            fields: ['id', 'title', 'createdDate']
                                        }
                                    }
                                };
                            }],
                            snapshotsCount: ['Snapshot', function (Snapshot) {
                                return Snapshot.count({}).$promise;
                            }],
                            snapshots: ['Snapshot', 'paginationParams', function (Snapshot, paginationParams) {
                                return Snapshot.find(
                                    paginationParams.options
                                ).$promise;
                            }]
                        }
                    }
                },
                access: { auth: true, admin: true },
                seo: { title: 'Admin', description: '', keywords: '' }
            })
            .state('app.admin.snapshots.add', {
                url: '/add',
                views: {
                    snapshots: {
                        templateUrl: tpl + 'views/admin/snapshots.add.html',
                        controller: 'AdminSnapshotAddCtrl',
                        resolve: {
                            dataPrevious: ['Snapshot', function (Snapshot) {
                                return Snapshot.findOne({
                                    filter: {
                                        limit: 1,
                                        order: "createdDate ASC",
                                        fields: {
//                                            tiers: false
                                        },
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
                                                                fields: ["name"]
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
                                            }
                                        ]
                                    }
                                })
                                .$promise
                                .then(function (snapshot) {
                                    //BUILD TIERS//
                                    snapshot.tiers = [];
                                    _.each(snapshot.deckTiers, function (deck) {
                                        if (snapshot.tiers[deck.tier-1] === undefined) {
                                            snapshot.tiers[deck.tier-1] = { decks: [], tier: deck.tier }; 
                                        }
                                        
                                        snapshot.tiers[deck.tier-1].decks.push(deck);
                                    });
                                    snapshot.tiers = _.filter(snapshot.tiers, function (tier) { return tier; });
                                    
                                    var deckNum = 0;
                                    _.each(snapshot.tiers, function (tier, tIndex) {
                                        tier.tier = tIndex+1
                                        _.each(tier.decks, function(deck, dIndex) {
                                            deck.tier = tIndex+1;
                                            deck.ranks[0] = ++deckNum;
                                        })
                                    })
                                    //BUILD TIERS//

                                    //BUILD MATCHES//
                                    snapshot.matches = snapshot.deckMatchups;

                                    return snapshot;
                                });
                            }]
                        }
                    }
                },
                access: {auth: true, admin: true},
                seo: { title: 'Admin', description: '', keywords: '' }
            })
            .state('app.admin.snapshots.edit', {
                url: '/:snapshotID',
                views: {
                    snapshots: {
                        templateUrl: tpl + 'views/admin/snapshots.edit.html',
                        controller: 'AdminSnapshotEditCtrl',
                        resolve: {
//                            data: ['$stateParams', 'AdminSnapshotService', function ($stateParams, AdminSnapshotService) {
//                                var snapshotID = $stateParams.snapshotID;
//                                return AdminSnapshotService.getSnapshot(snapshotID);
//                            }]
                            snapshot: ['$stateParams', 'Snapshot', function($stateParams, Snapshot) {
                                var snapshotID = $stateParams.snapshotID;
                                return Snapshot.findOne({
                                    filter: {
                                        where: {
                                            id: snapshotID
                                        },
                                        fields: {
//                                            tiers: false
                                        },
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
                                                                fields: ["name"]
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
                                            }
                                        ]
                                    }
                                })
                                .$promise
                                .then(function (snapshot) {
                                    console.log("resolve snapshot:", snapshot);
                                    
                                    snapshot.deckTiers.sort(function(a,b) { return (a.ranks[0] - b.ranks[0]) });
                                    
                                    //BUILD TIERS//
                                    snapshot.tiers = [];
                                    console.log("post resolve snapshot:", snapshot);
                                    _.each(snapshot.deckTiers, function (deck) {
                                        if (snapshot.tiers[deck.tier-1] === undefined) {
                                            snapshot.tiers[deck.tier-1] = { decks: [], tier: deck.tier }; 
                                        }

                                        snapshot.tiers[deck.tier-1].decks.push(deck);
                                    });
                                    snapshot.tiers = _.filter(snapshot.tiers, function (tier) { return tier; });
                                    
                                    var deckNum = 0;
                                    _.each(snapshot.tiers, function (tier, tIndex) {
                                        tier.tier = tIndex+1
                                        _.each(tier.decks, function(deck, dIndex) {
                                            deck.tier = tIndex+1;
                                            deck.ranks[0] = ++deckNum;
                                        })
                                    })
                                    //BUILD TIERS//

                                    //BUILD MATCHES//
                                    snapshot.matches = snapshot.deckMatchups;

                                    return snapshot;
                                });
                            }]
                        }
                    }
                },
                access: {auth: true, admin: true},
                seo: { title: 'Admin', description: '', keywords: '' }
            })
            .state('app.admin.teams', {
                abstract: true,
                url: '/team',
                views: {
                    admin: {
                        templateUrl: tpl + 'views/admin/teams.html'
                    }
                }
            })
            .state('app.admin.teams.list', {
                url: '',
                views: {
                    teamMembers: {
                        templateUrl: tpl + 'views/admin/teams.list.html',
                        controller: 'AdminTeamListCtrl',
                        resolve: {
                            data: ['AdminTeamService', function (AdminTeamService) {
                                return AdminTeamService.getMembers();
                            }]
                        }
                    }
                }
            })
            .state('app.admin.teams.add', {
                url: '/add',
                views: {
                    teamMembers: {
                        templateUrl: tpl + 'views/admin/teams.add.html',
                        controller: 'AdminTeamAddCtrl'
                    }
                }
            })
            .state('app.admin.teams.edit', {
                url: '/:memberID',
                views: {
                    teamMembers: {
                        templateUrl: tpl + 'views/admin/teams.edit.html',
                        controller: 'AdminTeamEditCtrl',
                        resolve: {
                            data: ['$stateParams', 'AdminTeamService', function ($stateParams, AdminTeamService) {
                                var memberID = $stateParams.memberID;
                                return AdminTeamService.getMember(memberID);
                            }]
                        }
                    }
                }
            })
            .state('app.admin.subscriptions', {
                url: '/subscriptions',
                views: {
                    admin: {
                        templateUrl: tpl + 'views/admin/subscriptions.html'
                    }
                },
                access: { auth: true, admin: true },
                seo: { title: 'Admin', description: '', keywords: '' }
            })
            .state('app.admin.vod', {
                abstract: true,
                url: '/vod',
                views: {
                    admin: {
                        templateUrl: tpl + 'views/admin/vod.html'
                    }
                },
                access: { auth: true, admin: true },
                seo: { title: 'Admin', description: '', keywords: '' }
            })
            .state('app.admin.vod.list', {
                url: '',
                views: {
                    vod: {
                        templateUrl: tpl + 'views/admin/vod.list.html',
                        controller: 'AdminVodListCtrl',
                        resolve: {
                            paginationParams: [function() {
                                var perpage = 12;
                                return {
                                    page: 1,
                                    perpage: perpage,
                                    options: {
                                        filter: {
                                            limit: perpage,
                                            order: 'createdDate DESC',
                                            fields: ['id', 'subtitle', 'createdDate', 'youtubeId', 'youtubeVars', 'displayDate']
                                        }
                                    }
                                };
                            }],
                            vodsCount: ['Vod', function (Vod) {
                                return Vod.count({}).$promise;
                            }],
                            vods: ['Vod', 'paginationParams', function(Vod, paginationParams) {
                                var options = {
                                    filter: {
                                        limit: paginationParams.perpage,
                                        order: "createdDate DESC",
                                        fields: paginationParams.options.filter.fields
                                    }
                                };

                                return Vod.find(options).$promise;
                            }]
                        }
                    }
                },
                access: { auth: true, admin: true },
                seo: { title: 'Admin', description: '', keywords: '' }
            })
            .state('app.admin.vod.add', {
                url: '/add',
                views: {
                    vod: {
                        templateUrl: tpl + 'views/admin/vod.add.html',
                        controller: 'AdminVodAddCtrl'
                    }
                }
            })
            .state('app.admin.vod.edit', {
                url: '/:id',
                views: {
                    vod: {
                        templateUrl: tpl + 'views/admin/vod.edit.html',
                        controller: 'AdminVodEditCtrl',
                        resolve: {
                            vod: ['$stateParams', 'Vod', function ($stateParams, Vod) {
                                var id = $stateParams.id;
                                return Vod.findById({ id: id }, function(data) {
                                    return data;
                                }, function(err) {
                                    if(err) console.log('error: ',err);
                                });
                            }]
                        }
                    }
                }
            })
            .state('app.admin.streams', {
                url: '/streams',
                views: {
                    admin: {
                        templateUrl: tpl + 'views/admin/streams.html'
                    }
                },
                access: { auth: true, admin: true },
                seo: { title: 'Admin', description: '', keywords: '' }
            })
            .state('app.contact', {
                url: 'contact',
                views: {
                    content: {
                        templateUrl: tpl + 'views/frontend/contact.html',
                        controller: 'ContactCtrl'
                    }
                },
                seo: { title: 'Contact Us', description: 'Contact Page', keywords: '' }
            })
            .state('app.admin.overwatch', {
                abstract: true,
                url: '/overwatch',
                views: {
                    admin: {
                        templateUrl: tpl + 'views/admin/overwatch.html'
                    }
                },
                access: { auth: true, admin: true },
                seo: { title: 'Admin', description: '', keywords: '' }
            })
            .state('app.admin.overwatch.heroes', {
                abstract: true,
                url: '/heroes',
                views: {
                    overwatch: {
                        templateUrl: tpl + 'views/admin/overwatch.heroes.html'
                    }
                },
                access: { auth: true, admin: true }
            })
            .state('app.admin.overwatch.heroes.list', {
                url: '',
                views: {
                    heroes: {
                        templateUrl: tpl + 'views/admin/overwatch.heroes.list.html',
                        controller: 'AdminOverwatchHeroListCtrl',
                        resolve: {
                            heroes: ['OverwatchHero', function (OverwatchHero) {
                                return OverwatchHero.find({
                                    filter: {
                                        order: "orderNum ASC"
                                    }
                                }).$promise;
                            }]
                        }
                    }
                },
                access: { auth: true, admin: true },
                seo: { title: 'Admin', description: '', keywords: '' }
            })
            .state('app.admin.overwatch.heroes.add', {
                url: '/add',
                views: {
                    heroes: {
                        templateUrl: tpl + 'views/admin/overwatch.heroes.add.html',
                        controller: 'AdminOverwatchHeroAddCtrl'
                    }
                },
                access: { auth: true, admin: true },
                seo: { title: 'Admin', description: '', keywords: '' }
            })
            .state('app.admin.overwatch.heroes.edit', {
                url: '/edit/:heroID',
                views: {
                    heroes: {
                        templateUrl: tpl + 'views/admin/overwatch.heroes.edit.html',
                        controller: 'AdminOverwatchHeroEditCtrl',
                        resolve: {
                            hero: ['$stateParams', 'OverwatchHero', function ($stateParams, OverwatchHero) {
                                var heroID = $stateParams.heroID;

                                return OverwatchHero.findOne({
                                    filter: {
                                        where: {
                                            id: heroID
                                        },
                                        include: {
                                            relation: 'overwatchAbilities',
                                            scope: {
                                                order: "orderNum ASC"
                                            }
                                        }
                                    }
                                }).$promise;
                            }]
                        }
                    }
                },
                access: { auth: true, admin: true },
                seo: { title: 'Admin', description: '', keywords: '' }
            });
    }]
);

angular.module('ui.gravatar').config([
  'gravatarServiceProvider', function(gravatarServiceProvider) {
    gravatarServiceProvider.defaults = {
      size: 200,
      "default": 'https://s3-us-west-2.amazonaws.com/ts-node2/img/profile.jpg'  // Mystery man as default for missing avatars
    };

    // Use https endpoint
    gravatarServiceProvider.secure = true;
  }
]);
