'use strict';

angular.module('app.animations', ['ngAnimate'])
.animation('.slide-animation', function () {
        return {
            addClass: function (element, className, done) {
                var scope = element.scope();

                if (className == 'active') {
                    element.addClass('active');
                    
                    var startPoint = element.parent().width();
                    if(scope.banner.direction !== 'right') {
                        startPoint = -startPoint;
                    }
                    
                    element.css({ left: startPoint });
                    element.find('.banner-panel').css({ left: startPoint });
                    
                    TweenMax.to(element, 1, { left: 0, ease: Power2.easeInOut }, done);
                    TweenMax.to(element.find('.banner-panel'), 1.2, { left: '0px', ease: Back.easeOut });
                }
                else {
                    done();
                }
            },
            beforeRemoveClass: function (element, className, done) {
                var scope = element.scope();

                if (className == 'active') {
                    var endPoint = element.parent().width();
                    if(scope.banner.direction === 'right') {
                        endPoint = -endPoint;
                    }
                    
                    TweenMax.to(element, 1, { left: endPoint, ease: Power2.easeInOut }, done);
                    TweenMax.to(element.find('.banner-panel'), 1.2, { left: endPoint, ease: Back.easeOut });
                }
                else {
                    done();
                }
            }
        };
    });;'use strict';

var app = angular.module('app', [
    'angularFileUpload',
    'summernote',
    'angular-bootbox',
    'angularMoment',
    'angularPayments',
    'youtube-embed',
    'dndLists',
    /*'ngAnimate',*/
    'ngCookies',
    'ngStorage',
    'ngSanitize',
    'ngProgress',
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
    'app.animations'
])
.run(
    ['$rootScope', '$state', '$stateParams', '$window', '$http', '$q', 'AuthenticationService', 'UserService', '$location', 'ngProgress', 'MetaService', '$cookies', "$localStorage", "LoginModalService",
        function ($rootScope, $state, $stateParams, $window, $http, $q, AuthenticationService, UserService, $location, ngProgress, MetaService, $cookies, $localStorage, LoginModalService) {
            $rootScope.$state = $state;
            $rootScope.$stateParams = $stateParams;
            $rootScope.metaservice = MetaService;
            $rootScope.UserService = UserService;
            $rootScope.LoginModalService = LoginModalService;
            
            // handle state changes
            $rootScope.$on("$stateChangeStart", function(event, toState, toParams, fromState, fromParams) {
                //ngProgress.start();
                if (toState.redirectTo) {
                    event.preventDefault();
                    $state.go(toState.redirectTo, toParams);
                }
                if (toState.access && toState.access.noauth && $window.sessionStorage.token && AuthenticationService.isLogged()) {
                    event.preventDefault();
                    $state.transitionTo('app.home');
                }
                if (toState.access && toState.access.auth && !$window.sessionStorage.token && !AuthenticationService.isLogged()) {
                    event.preventDefault();
                    $state.transitionTo('app.login');
                }
                if (toState.access && toState.access.admin && !AuthenticationService.isAdmin()) {
                    //event.preventDefault();
                    //$state.transitionTo('app.home');
                }
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
                $state.transitionTo('app.404');
            });
        }
    ]
)
.config(
    ['$locationProvider', '$stateProvider', '$urlRouterProvider', '$controllerProvider', '$compileProvider', '$filterProvider', '$provide', '$httpProvider', '$bootboxProvider', '$sceDelegateProvider', 
    function ($locationProvider, $stateProvider, $urlRouterProvider, $controllerProvider, $compileProvider, $filterProvider, $provide, $httpProvider, $bootboxProvider, $sceDelegateProvider) {
        
        app.controller = $controllerProvider.register;
        app.directive  = $compileProvider.directive;
        app.filter     = $filterProvider.register;
        app.factory    = $provide.factory;
        app.service    = $provide.service;
        app.constant   = $provide.constant;
        app.value      = $provide.value;
        
        $bootboxProvider.setDefaults({ locale: "en" });
        
        $locationProvider.html5Mode(true);
        $httpProvider.interceptors.push('TokenInterceptor');
        
        // cdn templates
        tpl = tpl || '';
        
        $sceDelegateProvider.resourceUrlWhitelist([
            'self',
            tpl + '**'
        ]);
        
        $urlRouterProvider.otherwise('404');
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
                    User: ['$window', '$cookies', '$state', '$q', 'AuthenticationService', 'SubscriptionService', 'UserService', function($window, $cookies, $state, $q, AuthenticationService, SubscriptionService, UserService) {
                        var token = $cookies.get("token");
                        if (token) {
                            $window.sessionStorage.token = token;
                            //delete $cookies.token;
                        }
                        if ($window.sessionStorage.token && !AuthenticationService.isLogged()) {
                            var d = $q.defer();
                            UserService.verify().success(function (data) {
                                AuthenticationService.setLogged(true);
                                AuthenticationService.setAdmin(data.isAdmin);
                                AuthenticationService.setProvider(data.isProvider);
                                
                                SubscriptionService.setSubscribed(data.subscription.isSubscribed);
                                SubscriptionService.setTsPlan(data.subscription.plan);
                                SubscriptionService.setExpiry(data.subscription.expiry);
                                
                                $window.sessionStorage.userID = data.userID;
                                $window.sessionStorage.username = data.username;
                                $window.sessionStorage.email = data.email;
                                d.resolve();
                            }).error(function (err) {
                                delete $window.sessionStorage.userID;
                                delete $window.sessionStorage.username;
                                delete $window.sessionStorage.token;
                                delete $window.sessionStorage.email;
                                //delete $localStorage.settings.token;
                                $cookies.remove("token");
                                //$state.transitionTo('app.login');
                                $q.reject();
                            });
                            return d.promise;
                        }
                    }]
                }
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
                            dataArticles: ['ArticleService', function (ArticleService) {
                                var klass = 'all',
                                    offset = 0,
                                    num = 6;
                                return ArticleService.getArticles('all', klass, offset, num);
                            }]
                        }
                    }
                },
                seo: { title: 'Home', description: 'TempoStorm home page.', keywords: '' }
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
                            data: ['$stateParams', 'ArticleService', function ($stateParams, ArticleService) {
                                var articleType = $stateParams.t || 'all',
                                    filter = $stateParams.f || 'all',
                                    page = $stateParams.p || 1,
                                    perpage = 12,
                                    search = $stateParams.s || '';
                                
                                return ArticleService.getArticles(articleType, filter, ((perpage*page)-perpage), perpage, search);
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
                            data: ['$stateParams', '$q', 'ArticleService', function ($stateParams, $q, ArticleService) {
                                var slug = $stateParams.slug;
                                return ArticleService.getArticle(slug).then(function (result) {
                                    if (result.success === true) {
                                        return result;
                                    } else {
                                        return $q.reject('Unable to find article');
                                    }
                                 });
                            }]
                        }
                    }
                }
            })
            .state('app.snapshot', {
                abstract: 'true',
                url: 'hearthstone/meta-snapshot',
                views: {
                    content: {
                        templateUrl: tpl + 'views/frontend/snapshots.html'
                    }
                }
            })
            .state('app.snapshot.redirect', {
                url: '',
                resolve: {
                    data: ['SnapshotService', '$q', function (SnapshotService, $q) {
                        return SnapshotService.getLatest().then(function (result) {
                            if (result.success === true) {
                                return result;
                            } else {
                                return $q.reject('unable to find snapshot');
                            }
                        });
                    }],
                    redirect: ['$q', '$state', 'data', function ($q, $state, data) {
                        $state.go('app.snapshot.snapshot', { slug: data.snapshot[0].slug.url });
                        return $q.reject();
                    }]
                }
            })    
            .state('app.snapshot.snapshot', {
                url: '/:slug',
                views: {
                    snapshots: {
                        templateUrl: tpl + 'views/frontend/snapshots.snapshot.html',
                        controller: 'SnapshotCtrl',
                        resolve: {
                            data: ['$stateParams', '$q', 'SnapshotService', function ($stateParams, $q, SnapshotService) {
                                var slug = $stateParams.slug;
                                return SnapshotService.getSnapshot(slug).then(function (result) {
                                    if(result.success === true) {
                                        return result.snapshot;
                                    } else {
                                        return $q.reject('Unable to find snapshot');
                                    }
                                });
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
                            dataArticles: ['ArticleService', function (ArticleService) {
                                var klass = 'all',
                                    page = 1,
                                    perpage = 6;
                                return ArticleService.getArticles('hs', klass, page, perpage);
                            }],
                            dataDecksTempostorm: ['DeckService', function (DeckService) {
                                return DeckService.getDecksFeatured(false, 1, 10);
                            }],
                            dataDecksCommunity: ['DeckService', function (DeckService) {
                                return DeckService.getDecksCommunity(false, 1, 10);
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
                            dataDecksTempostorm: ['$stateParams', 'DeckService', function ($stateParams, DeckService) {
                                var klass = $stateParams.k || false,
                                    page = $stateParams.p || 1,
                                    perpage = 4,
                                    search = $stateParams.s || '',
                                    age = $stateParams.a || '',
                                    order = $stateParams.o || '';
                                
                                return DeckService.getDecksFeatured(klass, page, perpage, search, age, order);
                            }],
                            dataDecksCommunity: ['$stateParams', 'DeckService', function ($stateParams, DeckService) {
                                var klass = $stateParams.k || false,
                                    page = $stateParams.p || 1,
                                    perpage = 12,
                                    search = $stateParams.s || '',
                                    age = $stateParams.a || '',
                                    order = $stateParams.o || '';
                                
                                return DeckService.getDecksCommunity(klass, page, perpage, search);
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
                            data: ['$stateParams', 'DeckService', function ($stateParams, DeckService) {
                                var slug = $stateParams.slug;
                                return DeckService.getDeck(slug).then(function (result) {
                                    if (result.success === true) {
                                        return result;
                                    } else {
                                        return $q.reject('unable to find deck');
                                    }
                                 });
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
                            data: ['$stateParams', 'DeckBuilder', function ($stateParams, DeckBuilder) {
                                var playerClass = $stateParams.playerClass,
                                    page = 1,
                                    perpage = 15,
                                    mechanics = [],
                                    mana = 'all',
                                    search = "";
                                
                                return DeckBuilder.loadCards(page, perpage, search, mechanics, mana, playerClass);
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
                            data: ['$stateParams', 'DeckService', function ($stateParams, DeckService) {
                                var slug = $stateParams.slug;
                                return DeckService.deckEdit(slug);
                            }]
                        }
                    }
                },
                seo: { title: 'Deck Edit', description: 'Editing tool for hearthstone decks.', keywords: '' }
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
                            dataArticles: ['ArticleService', function (ArticleService) {
                                var filters = 'all',
                                    offset = 0,
                                    perpage = 6;
                                return ArticleService.getArticles('hots', filters, offset, perpage);
                            }],
                            dataGuidesCommunity: ['HOTSGuideService', function (HOTSGuideService) {
                                return HOTSGuideService.getGuidesCommunity();
                            }],
                            dataGuidesFeatured: ['HOTSGuideService', function (HOTSGuideService) {
                                return HOTSGuideService.getGuidesFeatured();
                            }],
                            dataHeroes: ['HeroService', function (HeroService) {
                                return HeroService.getHeroesList();
                            }],
                            dataMaps: ['HOTSGuideService', function (HOTSGuideService) {
                                return HOTSGuideService.getMaps();
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
                            dataCommunityGuides: ['$stateParams', 'HOTSGuideService', function ($stateParams, HOTSGuideService) {
                                return HOTSGuideService.getGuidesCommunity(false, 0, 10, false, false);
                            }],
                            dataTopGuide: ['$stateParams', 'HOTSGuideService', function ($stateParams, HOTSGuideService) {
                                var guideType = $stateParams.t || 'all',
                                    filters = $stateParams.h || false,
                                    order = $stateParams.o || 'high';
                                
                                return HOTSGuideService.getGuides('hero', filters, 1, 1, '', '', order);
                            }],
                            dataTempostormGuides: ['HOTSGuideService', function (HOTSGuideService) {
                                return HOTSGuideService.getGuidesFeatured(false, 0, 4);
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
                seo: { title: 'Guides', description: 'Guides for Heroes of the Storm.', keywords: '' }
            })
            .state('app.hots.guides.guide', {
                url: '/:slug',
                views: {
                    guides: {
                        templateUrl: tpl + 'views/frontend/hots.guides.guide.html',
                        controller: 'HOTSGuideCtrl',
                        resolve: {
                            data: ['$stateParams', 'HOTSGuideService', function ($stateParams, HOTSGuideService) {
                                var slug = $stateParams.slug;
                                return HOTSGuideService.getGuide(slug).then(function (result) {
                                    if (result.success === true) {
                                        return result;
                                    } else {
                                        return $q.reject('Unable to find guide');
                                    }
                                 });
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
                            dataHeroes: ['HeroService', function (HeroService) {
                                return HeroService.getHeroes();
                            }],
                            dataMaps: ['HOTSGuideService', function (HOTSGuideService) {
                                return HOTSGuideService.getMaps();
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
                            dataHeroes: ['HeroService', function (HeroService) {
                                return HeroService.getHeroes();
                            }],
                            dataMaps: ['HOTSGuideService', function (HOTSGuideService) {
                                return HOTSGuideService.getMaps();
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
                            dataHeroesList: ['HeroService', function (HeroService) {
                                return HeroService.getHeroesList();
                            }]
                        }
                    }
                }
            })
            .state('app.hots.talentCalculator.redirect', {
                url: '',
                resolve: {
                    dataHeroesList: ['HeroService', '$q', function (HeroService, $q) {
                        return HeroService.getHeroesList().then(function (result) {
                            if (result.success === true) {
                                return result;
                            } else {
                                return $q.reject('unable to find hero');
                            }
                        });
                    }],
                    redirect: ['$q', '$state', 'dataHeroesList', function ($q, $state, dataHeroesList) {
                        $state.go('app.hots.talentCalculator.hero', { hero: dataHeroesList.heroes[0].className });
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
                            dataHero: ['$stateParams', '$q', 'HeroService', function ($stateParams, $q, HeroService) {
                                var hero = $stateParams.hero;
                                return HeroService.getHeroByClass(hero).then(function (result) {
                                    if (result.success === true) {
                                        return result;
                                    } else {
                                        return $q.reject('unable to find hero');
                                    }
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
                            data: ['ForumService', '$q', function (ForumService, $q) {
                                return ForumService.getCategories().then(function (result) {
                                    if (result.success === true) {
                                        return result;
                                    } else {
                                        return $q.reject('unable to find catagory');
                                    }
                                 });;
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
                            data: ['$stateParams', 'ForumService', '$q', function ($stateParams, ForumService, $q) {
                                var thread = $stateParams.thread;
                                return ForumService.getThread(thread).then(function (result) {
                                    if (result.success === true) {
                                        return result;
                                    } else {
                                        return $q.reject('unable to find thread');
                                    }
                                 });;
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
                            data: ['$stateParams', 'ForumService', function ($stateParams, ForumService) {
                                var thread = $stateParams.thread;
                                return ForumService.getThread(thread);
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
                            data: ['$stateParams', 'ForumService', '$q', function ($stateParams, ForumService, $q) {
                                var thread = $stateParams.thread,
                                    post = $stateParams.post;
                                return ForumService.getPost(thread, post).then(function (result) {
                                    if (result.success === true) {
                                        return result;
                                    } else {
                                        return $q.reject('unable to find post');
                                    }
                                 });;
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
                            data: ['TeamService', '$q', function (TeamService, $q) {
                                return TeamService.getMembers().then(function (result) {
                                    if (result.success === true) {
                                        return result;
                                    } else {
                                        return $q.reject('Unable to find members');
                                    }
                                });
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
                            dataPollsMain: ['PollService', function(PollService) {
                                return PollService.getPolls('main');
                            }],
                            dataPollsSide: ['PollService', function(PollService) {
                                return PollService.getPolls('side');
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
                url: 'login',
                views: {
                    content: {
                        templateUrl: tpl + 'views/frontend/login.html',
                        controller: 'UserCtrl',
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
                        controller: 'UserCtrl',
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
                        controller: 'UserCtrl'
                    }
                },
                access: { noauth: true },
                seo: { title: 'Forgot your Password?', description: 'Recover your Password.', keywords: '' }
            })
            .state('app.resetPassword', {
                url: 'forgot-password/reset?email&code',
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
                views: {
                    content: {
                        templateUrl: tpl + 'views/frontend/profile.html',
                        controller: 'ProfileCtrl',
                        resolve: {
                            dataProfile: ['$stateParams', 'ProfileService', function ($stateParams, ProfileService) {
                                var username = $stateParams.username;
                                return ProfileService.getProfile(username).then(function (result) {
                                    if (result.success === true) {
                                        return result;
                                    } else {
                                        return $q.reject('Unable to find profile');
                                    }
                                 });
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
                            dataActivity: ['$stateParams', 'ProfileService', function ($stateParams, ProfileService) {
                                var username = $stateParams.username;
                                return ProfileService.getActivity(username);
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
                            dataArticles: ['$stateParams', 'ProfileService', function ($stateParams, ProfileService) {
                                var username = $stateParams.username;
                                return ProfileService.getArticles(username);
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
                            dataDecks: ['User', '$stateParams', 'ProfileService', 'AuthenticationService', function (User, $stateParams, ProfileService, AuthenticationService) {
                                var username = $stateParams.username;
                                if (AuthenticationService.isLogged()) {
                                    return ProfileService.getDecksLoggedIn(username);
                                } else {
                                    return ProfileService.getDecks(username);
                                }
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
                            dataGuides: ['$stateParams', 'ProfileService', 'AuthenticationService', 'User', function ($stateParams, ProfileService, AuthenticationService, User) {
                                var username = $stateParams.username;
                                if (AuthenticationService.isLogged()) {
                                    return ProfileService.getGuidesLoggedIn(username);
                                } else {
                                    return ProfileService.getGuides(username);
                                }
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
                views: {
                    profile: {
                        templateUrl: tpl + 'views/frontend/profile.edit.html',
                        controller: 'ProfileEditCtrl',
                        resolve: {
                            dataProfileEdit: ['$stateParams', 'ProfileService', function ($stateParams, ProfileService) {
                                var username = $stateParams.username;
                                return ProfileService.getUserProfile(username);
                            }]
                        }
                    }
                },
                access: { auth: true },
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
                            data: ['AdminArticleService', function (AdminArticleService) {
                                var page = 1,
                                    perpage = 50,
                                    search = '';
                                return AdminArticleService.getArticles(page, perpage, search);
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
                            dataDecks: ['AdminDeckService', function (AdminDeckService) {
                                return AdminDeckService.getDecks(1, 10, '');
                            }],
                            dataGuides: ['AdminHOTSGuideService', function (AdminHOTSGuideService) {
                                return AdminHOTSGuideService.getGuides(1, 10, '');
                            }],
                            dataArticles: ['AdminArticleService', function (AdminArticleService) {
                                return AdminArticleService.getArticles(1, 10, '');
                            }],
                            dataProviders: ['AdminUserService', function (AdminUserService) {
                                return AdminUserService.getProviders();
                            }],
                            dataHeroes: ['AdminHeroService', function (AdminHeroService) {
                                return AdminHeroService.getAllHeroes();
                            }]
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
                            data: ['$stateParams', 'AdminArticleService', function ($stateParams, AdminArticleService) {
                                var articleID = $stateParams.articleID;
                                return AdminArticleService.getArticle(articleID);
                            }],
                            dataDecks: ['AdminDeckService', function (AdminDeckService) {
                                var page = 1,
                                    perpage = 10,
                                    search = '';
                                return AdminDeckService.getDecks(page, perpage, search);
                            }],
                            dataGuides: ['AdminHOTSGuideService', function (AdminHOTSGuideService) {
                                return AdminHOTSGuideService.getAllGuides();
                            }],
                            dataArticles: ['AdminArticleService', function (AdminArticleService) {
                                return AdminArticleService.getAllArticles();
                            }],
                            dataProviders: ['AdminUserService', function (AdminUserService) {
                                return AdminUserService.getProviders();
                            }],
                            dataHeroes: ['AdminHeroService', function (AdminHeroService) {
                                return AdminHeroService.getAllHeroes();
                            }]
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
                            data: ['AdminDeckService', function (AdminDeckService) {
                                var page = 1,
                                    perpage = 50,
                                    search = '';
                                return AdminDeckService.getDecks(page, perpage, search);
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
                            data: ['$stateParams', 'DeckBuilder', function ($stateParams, DeckBuilder) {
                                var page = 1,
                                    perpage = 15, 
                                    search = "",
                                    mechanics = [],
                                    mana = 'all',
                                    playerClass = $stateParams.playerClass;
                                
                                return DeckBuilder.loadCards(page, perpage, search, mechanics, mana, playerClass);
                            }]
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
                            data: ['$stateParams', 'AdminDeckService', function ($stateParams, AdminDeckService) {
                                var deckID = $stateParams.deckID;
                                return AdminDeckService.getDeck(deckID);
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
                            data: ['AdminCardService', function (AdminCardService) {
                                return AdminCardService.getCards();
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
                            data: ['AdminUserService', function (AdminUserService) {
                                var page = 1,
                                    perpage = 50,
                                    search = '';
                                return AdminUserService.getUsers(page, perpage, search);
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
                            data: ['AdminSnapshotService', function (AdminSnapshotService) {
                                var page = 1,
                                    perpage = 50,
                                    search = '';
                                return AdminSnapshotService.getSnapshots(page, perpage, search);
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
                            dataPrevious: ['AdminSnapshotService', function (AdminSnapshotService){
                                return AdminSnapshotService.getLatest();
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
                            data: ['$stateParams', 'AdminSnapshotService', function ($stateParams, AdminSnapshotService) {
                                var snapshotID = $stateParams.snapshotID;
                                return AdminSnapshotService.getSnapshot(snapshotID);
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
                            data: ['AdminVodService', function (AdminVodService) {
                                return AdminVodService.getVods();
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
                            data: ['$stateParams', 'AdminVodService', function ($stateParams, AdminVodService) {
                                var id = $stateParams.id;
                                return AdminVodService.getVod(id);
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
;'use strict';

angular.module('app.controllers', ['ngCookies'])
  .controller('AppCtrl', ['$scope', '$localStorage', '$cookies', '$window', '$location', 'SubscriptionService', 'AuthenticationService', 'UserService', '$rootScope',
    function($scope, $localStorage, $cookies, $window, $location, SubscriptionService, AuthenticationService, UserService, $rootScope) {
      var isIE = !!navigator.userAgent.match(/MSIE/i);
      isIE && angular.element($window.document.body).addClass('ie');
      isSmartDevice( $window ) && angular.element($window.document.body).addClass('smart');

      // config
      $scope.app = {
        name: 'TempoStorm',
        version: '0.0.1',
        copyright: new Date().getFullYear(),
        cdn: (tpl && tpl.length) ? tpl : './',
        settings: {
            token: $cookies.token || null,
            deck: null,
            show: {
                deck: null,
                article: null,
                decks: null
            },
            secondaryPortrait: []
        },
        user: {
            getUserEmail: function () {
                return $window.sessionStorage.email || false;
            },
            getUserID: function () {
                return $window.sessionStorage.userID;
            },
            getUsername: function () {
                return $window.sessionStorage.username;
            },
            isSubscribed: function () {
                return SubscriptionService.isSubscribed();
            },
            getSubscription: function () {
                return SubscriptionService.getSubscription();
            },
            isAdmin: AuthenticationService.isAdmin,
            isProvider: AuthenticationService.isProvider,
            isLogged: AuthenticationService.isLogged,
            logout: function () {
                if (AuthenticationService.isLogged()) {
                    AuthenticationService.setLogged(false);
                    AuthenticationService.setAdmin(false);
                    AuthenticationService.setProvider(false);
                    
                    SubscriptionService.setSubscribed(false);
                    SubscriptionService.setTsPlan(false);
                    SubscriptionService.setExpiry(false);
                    
                    delete $window.sessionStorage.userID;
                    delete $window.sessionStorage.username;
                    delete $window.sessionStorage.token;
                    delete $window.sessionStorage.email;
                    $scope.app.settings.token = null;
                    delete $cookies.token;
                }
//                return $location.path("/login");
            }
        }
      };
        
      $rootScope.app = $scope.app;
        
      // save settings to local storage
      if ( angular.isDefined($localStorage.settings) ) {
        $scope.app.settings = $localStorage.settings;
        
        // show
        if (!$scope.app.settings.show) {
            $scope.app.settings.show = {
                deck: null,
                article: null,
                decks: null
            }
        }
        if (!$scope.app.settings.show.deck) {
            $scope.app.settings.show.deck = null;
        }
        if (!$scope.app.settings.show.article) {
            $scope.app.settings.show.article = null;
        }
        if (!$scope.app.settings.show.decks) {
            $scope.app.settings.show.decks = null;
        }
        
      } else {
        $localStorage.settings = $scope.app.settings;
      }
      $scope.$watch('app.settings', function(){ 
          $localStorage.settings = $scope.app.settings;
      }, true);

      function isSmartDevice( $window )
      {
          // Adapted from http://www.detectmobilebrowsers.com
          var ua = $window['navigator']['userAgent'] || $window['navigator']['vendor'] || $window['opera'];
          // Checks for iOs, Android, Blackberry, Opera Mini, and Windows mobile devices
          return (/iPhone|iPod|iPad|Silk|Android|BlackBerry|Opera Mini|IEMobile/).test(ua);
      }

}])
.controller('RootCtrl', ['$scope', 'LoginModalService', function ($scope, LoginModalService) {
    $scope.loginModal = function (state) {
        LoginModalService.showModal(state);
    }
}])
.controller('404Ctrl', ['$scope', 'MetaService', function($scope, MetaService) {
    MetaService.setStatusCode(404);
}])
.controller('UserCtrl', ['$scope', '$location', '$window', '$state', '$cookies', 'UserService', 'AuthenticationService', 'AlertService', 'SubscriptionService', 
    function ($scope, $location, $window, $state, $cookies, UserService, AuthenticationService, AlertService, SubscriptionService) {
        
        $scope.remember;
        $scope.loginInfo = {
            email: "",
            password: ""
        };
        $scope.verify = {
            email: "",
            code: ""
        }

        var cookMail = $cookies.rememberEmail;
        var cookPass = $cookies.rememberPassword;

        if (cookMail != undefined && cookPass != undefined) {
            $scope.remember = true;
            $scope.loginInfo.email = cookMail;
            $scope.loginInfo.password = cookPass;
        }
        
        // grab alerts
        if (AlertService.hasAlert()) {
            $scope.success = AlertService.getSuccess();
            AlertService.reset();
        }
        
        // user controller
        $scope.login = function login(email, password) {
            if (email !== undefined && password !== undefined) {
                UserService.login(email, password).success(function(data) {
                    AuthenticationService.setLogged(true);
                    AuthenticationService.setAdmin(data.isAdmin);
                    AuthenticationService.setProvider(data.isProvider);
                    
                    SubscriptionService.setSubscribed(data.subscription.isSubscribed);
                    SubscriptionService.setTsPlan(data.subscription.plan);
                    SubscriptionService.setExpiry(data.subscription.expiry);
                    
                    $window.sessionStorage.userID = data.userID;
                    $window.sessionStorage.username = data.username;
                    $window.sessionStorage.email = data.email;
                    $scope.app.settings.token = $window.sessionStorage.token = data.token;
                    $location.path("/");
                }).error(function(status, data) {
                    $scope.showError = true;
                });
            }
        }
    }
])
.controller('UserVerifyCtrl', ['$scope', '$location', '$window', '$state', '$stateParams', 'UserService', 'AuthenticationService', 'SubscriptionService', 
    function ($scope, $location, $window, $state, $stateParams, UserService, AuthenticationService, SubscriptionService) {
        $scope.verify = {
            email: $stateParams.email || '',
            code: $stateParams.code || ''
        };
        
        $scope.verifyEmail = function () {
             UserService.verifyEmail($scope.verify.email, $scope.verify.code).success(function (data) {
                if (!data.success) {
                    $scope.errors = data.errors;
                    $scope.showError = true;
                } else {
                    AuthenticationService.setLogged(true);
                    AuthenticationService.setAdmin(data.isAdmin);
                    AuthenticationService.setProvider(data.isProvider);
                    
                    SubscriptionService.setSubscribed(data.subscription.isSubscribed);
                    SubscriptionService.setTsPlan(data.subscription.plan);
                    SubscriptionService.setExpiry(data.subscription.expiry);
                    
                    $window.sessionStorage.userID = data.userID;
                    $window.sessionStorage.username = data.username;
                    $window.sessionStorage.email = data.email;
                    $scope.app.settings.token = $window.sessionStorage.token = data.token;
                    $state.transitionTo('app.home', {});
                }
            });
        };
        
        // post form if preloaded
        if ($scope.verify.email !== undefined && $scope.verify.email.length && $scope.verify.code !== undefined && $scope.verify.code.length) {
            $scope.verifyEmail();
        }
        
    }
])
.controller('UserResetPasswordCtrl', ['$scope', '$state', '$stateParams', 'UserService', 'AlertService', 
    function ($scope, $state, $stateParams, UserService, AlertService) {
        $scope.reset = {
            email: $stateParams.email || '',
            code: $stateParams.code || '',
            password: '',
            cpassword: ''
        };
        
        $scope.resetPassword = function () {
             UserService.resetPassword($scope.reset.email, $scope.reset.code, $scope.reset.password, $scope.reset.cpassword).success(function (data) {
                if (!data.success) {
                    $scope.errors = data.errors;
                    $scope.showError = true;
                } else {
                    AlertService.setSuccess({ show: true, msg: 'Your password has been reset successfully.' });
                    $state.transitionTo('app.login', {});
                }
            });
        };
    }
])
.controller('HomeCtrl', ['$scope', '$sce', 'dataArticles', 'ArticleService', 
    function ($scope, $sce, dataArticles, ArticleService) {
        // data
        $scope.articles = {
            loading: false,
            viewable: function () {
                switch ($scope.app.bootstrapWidth) {
                    case 'xs':
                        return 1;
                    case 'sm':
                        return 3;
                    case 'md':
                        return 4;
                    case 'lg':
                    case 'default':
                        return 6;
                }
            },
            perpage: function () {
                switch ($scope.app.bootstrapWidth) {
                    case 'xs':
                        return 1;
                    case 'sm':
                        return 3;
                    case 'md':
                        return 4;
                    case 'lg':
                    case 'default':
                        return 6;
                }
            },
            offset: 0,
            total: dataArticles.total,
            data: dataArticles.articles
        };
                
        // articles
        $scope.getArticleDesc = function (desc, limit) {
            var words = desc.split(' ');
            return (words.length > limit) ? words.slice(0, limit).join(' ') + '...' : words.join(' ');
        };
        
        $scope.isArticleActive = function (index) {
            //if ($scope.articles.offset == 0 && index == 0) { return true; }
            //if ($scope.articles.viewable() == 1 && index == $scope.articles.offset) { return true; } 
            //if ($scope.viewable() == 6) {
            //    if (index >= ($scope.articles.offset + 1) && index <= ($scope.articles.offset + $scope.articles.viewable() - 2)) { return true; }
            //}
            return true;
        };
        
        $scope.canArticlePrev = function () {
            return ($scope.articles.offset > 0);
        };
        
        $scope.canArticleNext = function () {
            return ($scope.articles.data.length < $scope.articles.total);
        };
        
        $scope.prevArticles = function () {
            $scope.articles.offset = ($scope.articles.offset - $scope.articles.perpage() >= 0) ? $scope.articles.offset - $scope.articles.perpage() : 0;
        };
        
        $scope.nextArticles = function () {
            if ($scope.articles.offset + $scope.articles.viewable() + $scope.articles.perpage() <= $scope.articles.data.length) {
                $scope.articles.offset += $scope.articles.perpage();
            } else {
                var num = ($scope.articles.data.length + $scope.articles.perpage() <= $scope.articles.total) ? $scope.articles.perpage() : $scope.articles.total - $scope.articles.data.length;
                if (num > 0) {
                    $scope.articles.loading = 'next';
                    
                    ArticleService.getArticles('all', 'all', $scope.articles.data.length, num).then(function (data) {
                        $scope.articles.data = $scope.articles.data.concat(data.articles);
                        $scope.articles.offset += num;
                        $scope.articles.loading = false;
                    });
                }
            }
        };
    }
])
.controller('HearthstoneHomeCtrl', ['$scope', '$timeout', 'dataArticles', 'dataDecksCommunity', 'dataDecksTempostorm', 'ArticleService', 'DeckService', 'Hearthstone',
    function ($scope, $timeout, dataArticles, dataDecksCommunity, dataDecksTempostorm, ArticleService, DeckService, Hearthstone) {
        // data
        $scope.articles = dataArticles.articles;
        $scope.tempostormDecks = dataDecksTempostorm.decks;
        $scope.communityDecks = dataDecksCommunity.decks;
        $scope.classes = angular.copy(Hearthstone.classes).splice(1, 9);
        
        // filters
        $scope.filters = {
            classes: [],
            search: ''
        };
        
        var initializing = true;
        $scope.$watch(function(){ return $scope.filters; }, function (value) {
            if (initializing) {
                $timeout(function () {
                    initializing = false;
                });
            } else {
                updateArticles(0, 6);
                updateTempostormDecks(1, 10);
                updateCommunityDecks(1, 10);
            }
        }, true);
        
        function updateArticles (offset, perpage) {
            ArticleService.getArticles('hs', $scope.filters.classes, offset, perpage).then(function (data) {
                $timeout(function () {
                    $scope.articles = data.articles;
                });
            });
        }
        
        // update decks
        function updateTempostormDecks (page, perpage) {
            DeckService.getDecksFeatured($scope.filters.classes, page, perpage, $scope.filters.search).then(function (data) {
                $timeout(function () {
                    $scope.tempostormDecks = data.decks;
                });
            });
        }
        
        function updateCommunityDecks (page, perpage) {
            DeckService.getDecksCommunity($scope.filters.classes, page, perpage, $scope.filters.search).then(function (data) {
                $timeout(function () {
                    $scope.communityDecks = data.decks;
                });
            });
        }
        
        //is premium
        $scope.isPremium = function (guide) {
            if (!guide.premium.isPremium) { return false; }
            var now = new Date().getTime(),
                expiry = new Date(guide.premium.expiryDate).getTime();
            if (expiry > now) {
                return true;
            } else {
                return false;
            }
        }
    }
])
.controller('PremiumCtrl', ['$scope', '$state', '$window', '$compile', 'bootbox', 'UserService', 'LoginModalService',
    function ($scope, $state, $window, $compile, bootbox, UserService, LoginModalService) {
        var box,
            callback;
        
        // get premium
        $scope.getPremium = function (plan) {
            if ($scope.app.user.isLogged()) {
                if (!$scope.app.user.isSubscribed()) {
                    $state.transitionTo('app.profile.subscription', { username: $scope.app.user.getUsername(), plan: plan });
                }
            } else {
                LoginModalService.showModal('login', function () {
                    $scope.getPremium(plan);
                });
            }
        }
        
        // login for modal
        $scope.login = function login(email, password) {
            if (email !== undefined && password !== undefined) {
                UserService.login(email, password).success(function(data) {
                    AuthenticationService.setLogged(true);
                    AuthenticationService.setAdmin(data.isAdmin);
                    AuthenticationService.setProvider(data.isProvider);
                    
                    SubscriptionService.setSubscribed(data.subscription.isSubscribed);
                    SubscriptionService.setTsPlan(data.subscription.plan);
                    SubscriptionService.setExpiry(data.subscription.expiry);
                    
                    $window.sessionStorage.userID = data.userID;
                    $window.sessionStorage.username = data.username;
                    $window.sessionStorage.email = data.email;
                    $scope.app.settings.token = $window.sessionStorage.token = data.token;
                    box.modal('hide');
                    callback();
                }).error(function() {
                    $scope.showError = true;
                });
            }
        }
    }
])
.controller('ProfileCtrl', ['$scope', 'dataProfile', 'MetaService', 'HOTSGuideService',
    function ($scope, dataProfile, MetaService, HOTSGuideService) {
        $scope.user = dataProfile.user;
        $scope.postCount = dataProfile.postCount;
        $scope.deckCount = dataProfile.deckCount;
        $scope.guideCount = dataProfile.guideCount;
        $scope.activities = dataProfile.activities;
        

        function isMyProfile() {
            if($scope.app.user.getUsername() == $scope.user.username) {
                return 'My Profile';
            } else {
                return '@' + $scope.user.username + ' - Profile';
            }
        }
        $scope.metaservice = MetaService;
        $scope.metaservice.set(isMyProfile());
        
        
        
//        $scope.socialExists = function () {
//            if (!$scope.user.social) { return false; }
//            return ($scope.user.social.twitter && $scope.user.social.twitter.length) || 
//            ($scope.user.social.facebook && $scope.user.social.facebook.length) || 
//            ($scope.user.social.twitch && $scope.user.social.twitch.length) || 
//            ($scope.user.social.instagram && $scope.user.social.instagram.length) || 
//            ($scope.user.social.youtube && $scope.user.social.youtube.length);
//        };
    }
])
.controller('ProfileEditCtrl', ['$scope', '$state', 'ProfileService', 'AlertService', 'dataProfileEdit',  
    function ($scope, $state, ProfileService, AlertService, dataProfileEdit) {
        $scope.profile = dataProfileEdit.user;
        
        // grab alerts
        if (AlertService.hasAlert()) {
            $scope.success = AlertService.getSuccess();
            AlertService.reset();
        }
        
        $scope.editProfile = function () {
            ProfileService.updateProfile($scope.profile).success(function (data) {
                if (!data.success) {
                    console.log(data.error);
                } else {
                    var msg = 'Your profile has been updated successfully.';
                    if ($scope.profile.changeEmail) {
                        msg += ' Email address changes must be verified by email before they will take effect.';
                    }
                    AlertService.setSuccess({ show: true, msg: msg });
                    $state.go($state.current, { username: $scope.profile.username }, {reload: true});
                }
            });
        };
    }
])
.controller('ProfileEmailChangeCtrl', ['$scope', '$state', '$stateParams', 'AlertService', 'data', 
    function ($scope, $state, $stateParams, AlertService, data) {
        if (data.success) {
            AlertService.setSuccess({ show: true, msg: 'An email has been sent to the new address. Please confirm your new email before changes take effect.' });
        }
        return $state.transitionTo('app.profile.edit', { username: $stateParams.username });
    }
])
.controller('ProfileEmailConfirmCtrl', ['$scope', '$state', '$stateParams', 'AlertService', 'data', 
    function ($scope, $state, $stateParams, AlertService, data) {
        if (data.success) {
            AlertService.setSuccess({ show: true, msg: 'Your email address has been updated successfully.' });
        }
        return $state.transitionTo('app.profile.edit', { username: $stateParams.username });
    }
])
.controller('ProfileSubscriptionCtrl', ['$scope', '$stateParams', 'SubscriptionService', 'dataProfileEdit',  
    function ($scope, $stateParams, SubscriptionService, dataProfileEdit) {
        $scope.loading = false;
        $scope.profile = dataProfileEdit.user;
        $scope.error = '';
        $scope.success = '';
        
        if ($scope.profile.subscription.isSubscribed) {
            $scope.plan = dataProfileEdit.user.subscription.plan || 'tempostorm_semi';
        } else {
            var plan;
            switch ($stateParams.plan) {
                case 'monthly':
                    plan = 'tempostorm_monthly';
                    break;
                case 'quarterly':
                    plan = 'tempostorm_quarterly';
                    break;
                case 'semi':
                default:
                    plan = 'tempostorm_semi';
                    break;
            }
            $scope.plan = plan;
        }
        
        $scope.isLoading = function () {
            return $scope.loading;
        }
        
        $scope.setLoading = function (bool) {
            $scope.loading = bool;
        }
        
        $scope.setSuccess = function (s) {
            $scope.error = '';
            $scope.success = s;
        }
        
        $scope.setError = function (s) {
            $scope.success = '';
            $scope.error = s;
        }
        
        $scope.setErrorCode = function (c) {
            $scope.error = 'An error has occured. Code: ' + c + ': ' + $scope.getError(c);
        }
        
        $scope.getError = function (c) {
            switch (c) {
                case 400 : return 'Missing a required parameter.'; break;
                case 401 : return 'No valid API key provided.'; break;
                case 402 : return 'Parameters were valid but request failed. Check your information and please try again.'; break;
                case 404 : return 'The requested item doesn\'t exist!'; break;
                case 500 || 502 || 503 || 504 : return 'Something went wrong on Stripe\'s end.'; break;

            }
        }
        
        $scope.getExpiryDate = function () {
            var expiryISO = $scope.profile.subscription.expiryDate;
            if (!expiryISO) { return false; }
            
            var now = new Date().getTime(),
                expiryTS = new Date(expiryISO).getTime();

            return (expiryTS > now) ? expiryTS : false;
        };
        
        $scope.isSubscribed = function () {
            return $scope.profile.subscription.isSubscribed;
        }
        
        $scope.subscribe = function (code, result) {
            $scope.setLoading(true);
            if (result.error) {
                $scope.setErrorCode(code);
                $scope.setLoading(false);
            } else {
                SubscriptionService.setPlan($scope.plan, result.id).success(function (data) {
                    if (data.success) {
                        SubscriptionService.setSubscribed(true);
                        SubscriptionService.setTsPlan(data.plan);
                        
                        $scope.profile.subscription.isSubscribed = true;
                        $scope.profile.subscription.plan = data.plan;
                        
                        $scope.number = '';
                        $scope.cvc = '';
                        $scope.expiry = '';
                        $scope.error =  '';
                        $scope.setSuccess('We have successfully processed your payment. Thank you for subscribing with TempoStorm.com!');
                    } else {
                        $scope.setError( 'An unknown error has occured.' );
                        $scope.setLoading(false);
                    }
                });
            }
        };
        
        $scope.updateCard = function (code, result) {
            if (result.error) {
                console.log(result);
            } else {
                SubscriptionService.setCard(result.id).success(function (data) {
                    if (!data.success) {
                        console.log('error');
                    } else {
                        $scope.profile.subscription.last4 = data.subscription.last4;
                        $scope.cardPlaceholder = 'xxxx xxxx xxxx ' + data.subscription.last4;
                        $scope.number = '';
                        $scope.cvc = '';
                        $scope.expiry = '';
                    }
                });
            }
        }

        $scope.updatePlan = function () {
            SubscriptionService.setPlan($scope.plan).success(function (data) {
                if (data.success) {
                    SubscriptionService.setTsPlan(data.plan);
                    $scope.profile.subscription.plan = data.plan;
                    $scope.plan = data.plan;
                }
            });
        }

        $scope.cancel = function () {
            SubscriptionService.cancel().success(function (data) {
                if (data.success) {
                    SubscriptionService.setSubscribed(false);
                    SubscriptionService.setExpiry(data.subscription.expiryDate);
                    
                    $scope.profile.subscription.isSubscribed = false;
                    $scope.profile.subscription.expiryDate = data.subscription.expiryDate;
                }
            });
        }

    }
])
.controller('ProfileActivityCtrl', ['$scope', '$sce', 'dataActivity', 'ProfileService', 'HOTSGuideService', 'DeckService',
    function ($scope, $sce, dataActivity, ProfileService, HOTSGuideService, DeckService) {
        $scope.activities = dataActivity.activities;
        $scope.total = dataActivity.total;
        $scope.filterActivities = ['comments','articles','decks','guides','forumposts'];
        
        $scope.getActivityType = function (activity) {
            switch (activity.activityType) {
                case 'articleComment':
                case 'deckComment':
                case 'forumComment':
                case 'guideComment':
                case 'snapshotComment':
                    return 'comments'; break;
                case 'createArticle':
                    return 'articles'; break;
                case 'createDeck':
                    return 'decks'; break;
                case 'createGuide':
                    return 'guides'; break;
                case 'forumPost':
                    return 'forumposts'; break;
            }
        }
        
        $scope.isFiltered = function(type) {
            for (var i = 0; i < $scope.filterActivities.length; i++) {
                if ($scope.filterActivities[i] == type) {
                    return true;
                }
            }
            return false;
        }
        
        $scope.toggleFilter = function (filter) {
            for (var i = 0; i < $scope.filterActivities.length; i++) {
                console.log($scope.filterActivities[i], filter);
                if (filter == $scope.filterActivities[i]) {
                    $scope.filterActivities.splice(i,1);
                    return;
                }
            }
            $scope.filterActivities.push(filter);
        }
        
        $scope.activities.forEach(function (activity) {
            activity.getActivity = function () {
                return $sce.trustAsHtml(activity.activity);
            };
        });
        
        $scope.loadActivities = function () {
            ProfileService.getActivity($scope.user.username, $scope.activities.length).then(function (data) {
                $scope.activities = $scope.activities.concat(data.activities);
            });
        }
        
        // delete guide
        $scope.deleteGuide = function deleteGuide(activity) {
            var box = bootbox.dialog({
                title: 'Delete guide: ' + activity.guide.name + '?',
                message: 'Are you sure you want to delete <strong>' + activity.guide.name + '</strong>? All the data will be permanently deleted!',
                buttons: {
                    delete: {
                        label: 'Delete',
                        className: 'btn-danger',
                        callback: function () {
                            HOTSGuideService.guideDelete(activity.guide._id).success(function (data) {
                                if (data.success) {
                                    activity.exists = false;
                                    $scope.success = {
                                        show: true,
                                        msg: 'guide "' + activity.guide.name + '" deleted successfully.'
                                    };
                                }
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
                }
            });
            box.modal('show');
        }
        
        $scope.deleteDeck = function deleteDeck(activity) {
            var box = bootbox.dialog({
                title: 'Delete deck: ' + activity.deck.name + '?',
                message: 'Are you sure you want to delete <strong>' + activity.deck.name + '</strong>? All the data will be permanently deleted!',
                buttons: {
                    delete: {
                        label: 'Delete',
                        className: 'btn-danger',
                        callback: function () {
                            DeckService.deckDelete(activity.deck._id).success(function (data) {
                                if (data.success) {
                                    activity.exists = false;
                                    $scope.success = {
                                        show: true,
                                        msg: 'deck "' + activity.deck.name + '" deleted successfully.'
                                    };
                                }
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
                }
            });
            box.modal('show');
        }
    }
])
.controller('ProfileArticlesCtrl', ['$scope', 'dataArticles',  
    function ($scope, dataArticles) {
        $scope.articles = dataArticles.articles;
    }
])
.controller('ProfileDecksCtrl', ['$scope', '$state', 'bootbox', 'DeckService', 'dataDecks',  
    function ($scope, $state, bootbox, DeckService, dataDecks) {
        $scope.decks = dataDecks.decks;
        
        //is premium
        $scope.isPremium = function (guide) {
            if (!guide.premium.isPremium) { return false; }
            var now = new Date().getTime(),
                expiry = new Date(guide.premium.expiryDate).getTime();
            if (expiry > now) {
                return true;
            } else {
                return false;
            }
        }
        
        $scope.deckEdit = function ($event, deck) {
            if ($event.stopPropagation) $event.stopPropagation();
            if ($event.preventDefault) $event.preventDefault();
            $event.cancelBubble = true;
            $event.returnValue = false;
            
            $state.transitionTo('app.hs.deckBuilder.edit', { slug: deck.slug });
        };
        
        // delete deck
        $scope.deckDelete = function deleteDeck($event, deck) {
            if ($event.stopPropagation) $event.stopPropagation();
            if ($event.preventDefault) $event.preventDefault();
            $event.cancelBubble = true;
            $event.returnValue = false;
            
            var box = bootbox.dialog({
                title: 'Delete deck: ' + deck.name + '?',
                message: 'Are you sure you want to delete the deck <strong>' + deck.name + '</strong>?',
                buttons: {
                    delete: {
                        label: 'Delete',
                        className: 'btn-danger',
                        callback: function () {
                            DeckService.deckDelete(deck._id).success(function (data) {
                                if (data.success) {
                                    var index = $scope.decks.indexOf(deck);
                                    if (index !== -1) {
                                        $scope.decks.splice(index, 1);
                                    }
                                    $scope.success = {
                                        show: true,
                                        msg: 'Deck "' + deck.name + '" deleted successfully.'
                                    };
                                }
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
                }
            });
            box.modal('show');
        }
    }
])
.controller('ProfileGuidesCtrl', ['$scope', '$state', 'bootbox', 'HOTSGuideService', 'dataGuides',  
    function ($scope, $state, bootbox, HOTSGuideService, dataGuides) {
        $scope.guides = dataGuides.guides;
        
        // guides
        $scope.getGuideCurrentHero = function (guide) {
            return (guide.currentHero) ? guide.currentHero : guide.heroes[0];
        };
        
        $scope.getGuideClass = function (guide) {
            return (guide.guideType == 'hero') ? $scope.getGuideCurrentHero(guide).hero.className : guide.maps[0].className;
        };
        
        $scope.guidePrevHero = function ($event, guide) {
            $event.preventDefault();
            $event.stopPropagation();
            
            var currentHero = $scope.getGuideCurrentHero(guide),
                index = 0;
            
            // get index of current hero
            for (var i = 0; i < guide.heroes.length; i++) {
                if (currentHero.hero._id == guide.heroes[i].hero._id) {
                    index = i;
                    break;
                }
            }
            
            guide.currentHero = (index == 0) ? guide.heroes[guide.heroes.length - 1] : guide.heroes[index - 1];
        };

        $scope.guideNextHero = function ($event, guide) {
            $event.preventDefault();
            $event.stopPropagation();
            
            var currentHero = $scope.getGuideCurrentHero(guide),
                index = 0;
            
            // get index of current hero
            for (var i = 0; i < guide.heroes.length; i++) {
                if (currentHero.hero._id == guide.heroes[i].hero._id) {
                    index = i;
                    break;
                }
            }
            
            guide.currentHero = (index == guide.heroes.length - 1) ? guide.heroes[0] : guide.heroes[index + 1];
        };
        
        $scope.getTalents = function (hero, tier) {
            var out = [];
            
            for (var i = 0; i < hero.hero.talents.length; i++) {
                if (hero.hero.talents[i].tier === tier) {
                    out.push(hero.hero.talents[i]);
                }
            }
            
            return out;
        };
        
        $scope.selectedTalent = function (hero, tier, talent) {
            return (hero.talents['tier' + tier]._id == talent._id);
        };
        
        $scope.getTalent = function (hero, tier) {
            for (var i = 0; i < hero.hero.talents.length; i++) {
                if (hero.talents['tier' + tier] == hero.hero.talents[i]._id) {
                    return hero.hero.talents[i];
                }
            }
            return false;
        };
        
        //is premium
        $scope.isPremium = function (guide) {
            if (!guide.premium.isPremium) { return false; }
            var now = new Date().getTime(),
                expiry = new Date(guide.premium.expiryDate).getTime();
            if (expiry > now) {
                return true;
            } else {
                return false;
            }
        }
        
        $scope.guideEdit = function ($event, guide) {
            if ($event.stopPropagation) $event.stopPropagation();
            if ($event.preventDefault) $event.preventDefault();
            $event.cancelBubble = true;
            $event.returnValue = false;
            
            if (guide.guideType == 'hero') {
                $state.transitionTo('app.hots.guideBuilder.edit.hero', { slug: guide.slug });
            } else {
                $state.transitionTo('app.hots.guideBuilder.edit.map', { slug: guide.slug });
            }
        };
        
        $scope.guideDelete = function deleteGuide($event, guide) {
            if ($event.stopPropagation) $event.stopPropagation();
            if ($event.preventDefault) $event.preventDefault();
            $event.cancelBubble = true;
            $event.returnValue = false;

            var box = bootbox.dialog({
                title: 'Delete guide: ' + guide.name + '?',
                message: 'Are you sure you want to delete the guide <strong>' + guide.name + '</strong>?',
                buttons: {
                    delete: {
                        label: 'Delete',
                        className: 'btn-danger',
                        callback: function () {
                            HOTSGuideService.guideDelete(guide._id).success(function (data) {
                                if (data.success) {
                                    var index = $scope.guides.indexOf(guide);
                                    if (index !== -1) {
                                        $scope.guides.splice(index, 1);
                                    }
                                    $scope.success = {
                                        show: true,
                                        msg: 'guide "' + guide.name + '" deleted successfully.'
                                    };
                                }
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
                }
            });
            box.modal('show');
        };
    }
])
.controller('ProfilePostsCtrl', ['$scope', 'dataPosts',  
    function ($scope, dataPosts) {
        $scope.posts = dataPosts.activity;
    }
])
.controller('AdminCardAddCtrl', ['$scope', '$window', '$stateParams', '$upload', '$compile', 'bootbox', 'Util', 'Hearthstone', 'AdminCardService',
    function ($scope, $window, $stateParams, $upload, $compile, bootbox, Util, Hearthstone, AdminCardService) {
        var defaultCard = {
            id: '',
            name: '',
            cost: '',
            cardType: Hearthstone.types[0],
            rarity: Hearthstone.rarities[0],
            race: Hearthstone.races[0],
            playerClass: Hearthstone.classes[0],
            expansion: Hearthstone.expansions[0],
            text: '',
            mechanics: [],
            flavor: '',
            artist: '',
            attack: '',
            health: '',
            durabiltiy: '',
            dust: '',
            photos: {
                small: '',
                medium: '',
                large: ''
            },
            deckable: true,
            active: true
        };
        
        $scope.cardImg = $scope.deckImg = $scope.app.cdn + 'img/blank.png';
        
        // load card
        $scope.card = angular.copy(defaultCard);
        
        // HS options
        $scope.cardTypes = Util.toSelect(Hearthstone.types);
        $scope.cardRarities = Util.toSelect(Hearthstone.rarities);
        $scope.cardRaces = Util.toSelect(Hearthstone.races);
        $scope.cardClasses = Util.toSelect(Hearthstone.classes);
        $scope.cardMechanics = Util.toSelect(Hearthstone.mechanics);
        $scope.cardExpansions = Util.toSelect(Hearthstone.expansions);
        
        $scope.cardActive = $scope.cardDeckable = [
            { name: 'Yes', value: true },
            { name: 'No', value: false }
        ];
        
        // card upload
        $scope.cardUpload = function ($files) {
            if (!$files.length) return false;
            var box = bootbox.dialog({
                message: $compile('<div class="progress progress-striped active" style="margin-bottom: 0px;"><div class="progress-bar" role="progressbar" aria-valuenow="{{uploading}}" aria-valuemin="0" aria-valuemax="100" style="width: {{uploading}}%;"><span class="sr-only">{{uploading}}% Complete</span></div></div>')($scope),
                closeButton: false,
                animate: false
            });
            $scope.uploading = 0;
            box.modal('show');
            for (var i = 0; i < $files.length; i++) {
                var file = $files[i];
                $scope.upload = $upload.upload({
                    url: '/api/admin/upload/card',
                    method: 'POST',
                    file: file
                }).progress(function(evt) {
                    $scope.uploading = parseInt(100.0 * evt.loaded / evt.total);
                }).success(function(data, status, headers, config) {
                    $scope.card.photos.medium = data.medium;
                    $scope.card.photos.large = data.large;
                    $scope.cardImg = $scope.app.cdn + data.path + data.large;
                    box.modal('hide');
                });
            }
        };
        
        // deck upload
        $scope.deckUpload = function ($files) {
            if (!$files.length) return false;
            var box = bootbox.dialog({
                message: $compile('<div class="progress progress-striped active" style="margin-bottom: 0px;"><div class="progress-bar" role="progressbar" aria-valuenow="{{uploading}}" aria-valuemin="0" aria-valuemax="100" style="width: {{uploading}}%;"><span class="sr-only">{{uploading}}% Complete</span></div></div>')($scope),
                closeButton: false,
                animate: false
            });
            $scope.uploading = 0;
            box.modal('show');
            for (var i = 0; i < $files.length; i++) {
                var file = $files[i];
                $scope.upload = $upload.upload({
                    url: '/api/admin/upload/deck',
                    method: 'POST',
                    file: file
                }).progress(function(evt) {
                    $scope.uploading = parseInt(100.0 * evt.loaded / evt.total);
                }).success(function(data, status, headers, config) {
                    $scope.card.photos.small = data.small;
                    $scope.deckImg = $scope.app.cdn + data.path + data.small;
                    box.modal('hide');
                });
            }
        };
        
        // add card
        $scope.addCard = function addCard() {
            $scope.showError = false;
            $scope.showSuccess = false;

            AdminCardService.addCard($scope.card).success(function (data) {
                if (!data.success) {
                    $scope.errors = data.errors;
                    $scope.showError = true;
                } else {
                    $scope.showError = false;
                    $scope.card = angular.copy(defaultCard);
                    $scope.form.$setPristine();
                    $scope.showSuccess = true;
                }
                $window.scrollTo(0,0);
            });
        };
    }
])
.controller('AdminCardEditCtrl', ['$location', '$scope', '$window', '$state', '$upload', '$compile', 'bootbox', 'Util', 'Hearthstone', 'AdminCardService', 'AlertService', 'data', 
    function ($location, $scope, $window, $state, $upload, $compile, bootbox, Util, Hearthstone, AdminCardService, AlertService, data) {
        // no card, go back to list
        if (!data || !data.success) { return $location.path('/admin/cards'); }
        
        // load card
        $scope.card = data.card;
        
        // HS options
        $scope.cardTypes = Util.toSelect(Hearthstone.types);
        $scope.cardRarities = Util.toSelect(Hearthstone.rarities);
        $scope.cardRaces = Util.toSelect(Hearthstone.races);
        $scope.cardClasses = Util.toSelect(Hearthstone.classes);
        $scope.cardMechanics = Util.toSelect(Hearthstone.mechanics);
        $scope.cardExpansions = Util.toSelect(Hearthstone.expansions);
        
        $scope.cardActive = $scope.cardDeckable = [
            { name: 'Yes', value: true },
            { name: 'No', value: false }
        ];
        
        $scope.cardImg = ($scope.card.photos.large.length) ? $scope.app.cdn + 'cards/' + $scope.card.photos.large : $scope.app.cdn + 'img/blank.png';
        $scope.deckImg = ($scope.card.photos.small.length) ? $scope.app.cdn + 'cards/' + $scope.card.photos.small : $scope.app.cdn + 'img/blank.png';
        
        // card upload
        $scope.cardUpload = function ($files) {
            if (!$files.length) return false;
            var box = bootbox.dialog({
                message: $compile('<div class="progress progress-striped active" style="margin-bottom: 0px;"><div class="progress-bar" role="progressbar" aria-valuenow="{{uploading}}" aria-valuemin="0" aria-valuemax="100" style="width: {{uploading}}%;"><span class="sr-only">{{uploading}}% Complete</span></div></div>')($scope),
                closeButton: false,
                animate: false
            });
            $scope.uploading = 0;
            box.modal('show');
            for (var i = 0; i < $files.length; i++) {
                var file = $files[i];
                $scope.upload = $upload.upload({
                    url: '/api/admin/upload/card',
                    method: 'POST',
                    file: file
                }).progress(function(evt) {
                    $scope.uploading = parseInt(100.0 * evt.loaded / evt.total);
                }).success(function(data, status, headers, config) {
                    $scope.card.photos.medium = data.medium;
                    $scope.card.photos.large = data.large;
                    $scope.cardImg = $scope.app.cdn + data.path + data.large;
                    box.modal('hide');
                });
            }
        };
        
        // deck upload
        $scope.deckUpload = function ($files) {
            if (!$files.length) return false;
            var box = bootbox.dialog({
                message: $compile('<div class="progress progress-striped active" style="margin-bottom: 0px;"><div class="progress-bar" role="progressbar" aria-valuenow="{{uploading}}" aria-valuemin="0" aria-valuemax="100" style="width: {{uploading}}%;"><span class="sr-only">{{uploading}}% Complete</span></div></div>')($scope),
                closeButton: false,
                animate: false
            });
            $scope.uploading = 0;
            box.modal('show');
            for (var i = 0; i < $files.length; i++) {
                var file = $files[i];
                $scope.upload = $upload.upload({
                    url: '/api/admin/upload/deck',
                    method: 'POST',
                    file: file
                }).progress(function(evt) {
                    $scope.uploading = parseInt(100.0 * evt.loaded / evt.total);
                }).success(function(data, status, headers, config) {
                    $scope.card.photos.small = data.small;
                    $scope.deckImg = $scope.app.cdn + data.path + data.small;
                    box.modal('hide');
                });
            }
        };
        
        // edit card
        $scope.editCard = function editCard() {
            $scope.showError = false;
            $scope.showSuccess = false;
            
            AdminCardService.editCard($scope.card).success(function (data) {
                if (!data.success) {
                    $scope.errors = data.errors;
                    $scope.showError = true;
                    $window.scrollTo(0,0);
                } else {
                    AlertService.setSuccess({ show: true, msg: $scope.card.name + ' has been updated successfully.' });
                    $state.go('app.admin.hearthstone.cards.list');
                }
            });
        }
    }
])
.controller('AdminCardListCtrl', ['$scope', 'bootbox', 'Util', 'Hearthstone', 'AdminCardService', 'AlertService', 'Pagination', 'data', 
    function ($scope, bootbox, Util, Hearthstone, AdminCardService, AlertService, Pagination, data) {
        
        // grab alerts
        if (AlertService.hasAlert()) {
            $scope.success = AlertService.getSuccess();
            AlertService.reset();
        }
        
        // load cards
        $scope.cards = data.cards;
        
        // filters
        $scope.expansions = [{ name: 'All Expansions', value: ''}].concat(Util.toSelect(Hearthstone.expansions));
        $scope.classes = [{ name: 'All Classes', value: ''}].concat(Util.toSelect(Hearthstone.classes));
        $scope.types = [{ name: 'All Types', value: ''}].concat(Util.toSelect(Hearthstone.types));
        $scope.rarities = [{ name: 'All Rarities', value: ''}].concat(Util.toSelect(Hearthstone.rarities));
        
        // default filters
        $scope.filterExpansion = $scope.filterClass = $scope.filterType = $scope.filterRarity = '';
        
        // page flipping
        $scope.pagination = Pagination.new();
        $scope.pagination.results = function () {
            return ($scope.filtered) ? $scope.filtered.length : $scope.cards.length;
        };
        
        // delete card
        $scope.deleteCard = function deleteCard(card) {
            var box = bootbox.dialog({
                title: 'Delete card: ' + card.name + '?',
                message: 'Are you sure you want to delete the card <strong>' + card.name + '</strong>?',
                buttons: {
                    delete: {
                        label: 'Delete',
                        className: 'btn-danger',
                        callback: function () {
                            AdminCardService.deleteCard(card._id).then(function (data) {
                                if (data.success) {
                                    var index = $scope.cards.indexOf(card);
                                    if (index !== -1) {
                                        $scope.cards.splice(index, 1);
                                    }
                                    $scope.success = {
                                        show: true,
                                        msg: card.name + ' deleted successfully.'
                                    };
                                }
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
                }
            });
            box.modal('show');
        }
        
    }
])
.controller('AdminArticleAddCtrl', ['$scope', '$state', '$window', '$upload', '$compile', 'bootbox', 'Hearthstone', 'Util', 'AlertService', 'AdminArticleService', 'AdminDeckService', 'AdminHOTSGuideService', 'dataGuides', 'dataArticles', 'dataProviders', 'dataHeroes', 'dataDecks', 
    function ($scope, $state, $window, $upload, $compile, bootbox, Hearthstone, Util, AlertService, AdminArticleService, AdminDeckService, AdminHOTSGuideService, dataGuides, dataArticles, dataProviders, dataHeroes, dataDecks) {
        // default article
        var d = new Date();
        d.setMonth(d.getMonth()+1);
        
        var defaultArticle = {
            author: $scope.app.user.getUserID(),
            title : '',
            slug: {
                url: '',
                linked: true
            },
            description: '',
            content: '',
            photos: {
                large: '',
                medium: '',
                small: '',
                square: ''
            },
            deck: undefined,
            guide: undefined,
            related: [],
            classTags: [],
            theme: 'none',
            featured: false,
            premium: {
                isPremium: false,
                expiryDate: d
            },
            articleType: [],
            active: true
        },
        deckID,
        itemAddBox;
        
        $scope.search = '';
        
        
        //search functions
        function escapeStr( str ) {
            return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        }
        
        
        //search functions
        $scope.getDecks = function () {
            AdminDeckService.getDecks(1, 10, escapeStr($scope.search)).then(function (data) {
                $scope.decks = data.decks;
            });
        } 

        $scope.getArticles = function () {
            AdminArticleService.getArticles(1, 10, escapeStr($scope.search)).then(function (data) {
                $scope.articles = data.articles;
            });
        }

        $scope.getGuides = function () {
            AdminHOTSGuideService.getGuides(1, 10, escapeStr($scope.search)).then(function (data) {
                $scope.guides = data.guides;
            });
        }
        //!search functions
        
        //open the modal to choose what item to add
        $scope.addItemArticle = function () {
            itemAddBox = bootbox.dialog({
                message: $compile('<div article-item-add></div>')($scope),
                closeButton: true,
                animate: true,
                onEscape: function () { //We want to clear the search results when we close the bootbox
                    $scope.search = '';
                    $scope.getDecks();
                    $scope.getGuides();
                }
            });
            itemAddBox.modal('show');
            itemAddBox.on('hidden.bs.modal', function () { //We want to clear the search results when we close the bootbox
                $scope.search = '';
                $scope.getArticles();
            });
        }
        
        $scope.closeBox = function () {
            itemAddBox.modal('hide');
        }; 

        //change the article item
        $scope.modifyItem = function (item) {
            switch ($scope.article.articleType.toString()) {
                case 'hs': $scope.article.deck = item; break;
                case 'hots': $scope.article.guide = item; break;
            }
            $scope.search = '';
            itemAddBox.modal('hide');
        }
        
        
        
        //this is for the related article modal
        $scope.addRelatedArticle = function () {
            itemAddBox = bootbox.dialog({
                message: $compile('<div article-related-add></div>')($scope),
                closeButton: false,
                animate: true,
            });
            itemAddBox.modal('show');
            itemAddBox.on('hidden.bs.modal', function () { //We want to clear the search results when we close the bootbox
                $scope.search = '';
                $scope.getArticles();
            });
        }
        
        $scope.isRelated = function (a) {
            for (var i = 0; i < $scope.article.related.length; i++) {
                if (a._id == $scope.article.related[i]._id) {
                    return true;
                }
            }
            return false;
        }
        
        $scope.modifyRelated = function (a) {
            if ($scope.isRelated(a)) {
                $scope.removeRelatedArticle(a);
                return;
            }
            $scope.article.related.push(a);
        }
        
        $scope.removeRelatedArticle = function (a) {
            for (var i = 0; i < $scope.article.related.length; i++) {
                if (a._id === $scope.article.related[i]._id) {
                    $scope.article.related.splice(i, 1);
                }
            }
        }
        
        // load article
        $scope.article = angular.copy(defaultArticle);
        
        // load decks
        $scope.decks = dataDecks.decks;

        // load guides
        $scope.guides = [{_id: undefined, name: 'No Guide'}].concat(dataGuides.guides);
        
        // load articles
        $scope.articles = dataArticles.articles;
        
        // load providers
        $scope.providers = dataProviders.users;
        
        $scope.setSlug = function () {
            if (!$scope.article.slug.linked) { return false; }
            $scope.article.slug.url = Util.slugify($scope.article.title);
        };
        
        $scope.toggleSlugLink = function () {
            $scope.article.slug.linked = !$scope.article.slug.linked;
            $scope.setSlug();
        };
        
        // tags
        $scope.hasTags = function () {
            var type = $scope.article.articleType,
                isHS = (type.indexOf('hs') !== -1) ? true : false,
                isHOTS = (type.indexOf('hots') !== -1) ? true : false;
            
            return ((isHS && !isHOTS) || (isHOTS && !isHS));
        }
        
        $scope.getTags = function () {
            var type = $scope.article.articleType,
                isHS = (type.indexOf('hs') !== -1) ? true : false,
                isHOTS = (type.indexOf('hots') !== -1) ? true : false;
            
            if (isHS && !isHOTS) {
                return ['Druid', 'Hunter', 'Mage', 'Paladin', 'Priest', 'Rogue', 'Shaman', 'Warlock', 'Warrior'];
            }
            if (isHOTS && !isHS) {
                var out = [];
                for (var i = 0; i < dataHeroes.heroes.length; i++) {
                    out.push(dataHeroes.heroes[i].name);
                }
                return out;
            }
        };
        
        // article types
        $scope.articleTypes = AdminArticleService.articleTypes();
        
        // select options
        $scope.articleFeatured =
        $scope.articlePremium =
        $scope.articleActive = [
            { name: 'Yes', value: true },
            { name: 'No', value: false }
        ];
        
        $scope.articleTheme = [
            { name: 'None', value: 'none' },
            { name: 'Overcast', value: 'overcast' }
        ];
        
        // date picker options
        $scope.dateOptions = {};
        
        // summernote options
        $scope.options = {
          disableDragAndDrop: true,
          height: 300,
          fontNames: ['Open Sans Regular', 'Open Sans Bold'],
          defaultFontName: 'Open Sans Regular',
          toolbar: [
            ['style', ['bold', 'italic', 'underline', 'strikethrough', 'clear']],
            ['fontname', ['fontname']],
            ['fontsize', ['fontsize']],
            ['color', ['color']],
            ['para', ['ul', 'ol', 'paragraph']],
            ['table', ['table']],
            ['insert', ['link', 'picture', 'video']],
            ['format', ['hr']],
            ['misc', ['undo', 'redo', 'codeview']]
          ]
        };
        
        // photo upload
        $scope.photoUpload = function ($files) {
            if (!$files.length) return false;
            var box = bootbox.dialog({
                message: $compile('<div class="progress progress-striped active" style="margin-bottom: 0px;"><div class="progress-bar" role="progressbar" aria-valuenow="{{uploading}}" aria-valuemin="0" aria-valuemax="100" style="width: {{uploading}}%;"><span class="sr-only">{{uploading}}% Complete</span></div></div>')($scope),
                closeButton: false,
                animate: false
            });
            $scope.uploading = 0;
            box.modal('show');
            for (var i = 0; i < $files.length; i++) {
                var file = $files[i];
                $scope.upload = $upload.upload({
                    url: '/api/admin/upload/article',
                    method: 'POST',
                    file: file
                }).progress(function(evt) {
                    $scope.uploading = parseInt(100.0 * evt.loaded / evt.total);
                }).success(function(data, status, headers, config) {
                    $scope.article.photos = {
                        large: data.large,
                        medium: data.medium,
                        small: data.small,
                        square: data.square
                    };
                    $scope.cardImg = $scope.app.cdn + data.path + data.small;
                    box.modal('hide');
                });
            }
        };
        
        
        $scope.getImage = function () {
            $scope.imgPath = 'articles/';
            if (!$scope.article) { return 'img/blank.png'; }
            return ($scope.article.photos && $scope.article.photos.small === '') ?  $scope.app.cdn + 'img/blank.png' : $scope.app.cdn + $scope.imgPath + $scope.article.photos.small;
        };
        
        
        $scope.addArticle = function () {
            $scope.showError = false;
            AdminArticleService.addArticle($scope.article).success(function (data) {
                if (!data.success) {
                    $scope.errors = data.errors;
                    $scope.showError = true;
                    $window.scrollTo(0,0);
                } else {
                    AlertService.setSuccess({ show: true, msg: $scope.article.title + ' has been added successfully.' });
                    $state.go('app.admin.articles.list');
                }
            });
        };
    }
])
.controller('AdminArticleEditCtrl', ['$scope', '$state', '$window', '$upload', '$compile', '$filter', 'bootbox', 'Hearthstone', 'Util', 'AlertService', 'AdminArticleService', 'AdminDeckService', 'AdminHOTSGuideService', 'data', 'dataDecks', 'dataGuides', 'dataArticles', 'dataProviders', 'dataHeroes',  
    function ($scope, $state, $window, $upload, $compile, $filter, bootbox, Hearthstone, Util, AlertService, AdminArticleService, AdminDeckService, AdminHOTSGuideService, data, dataDecks, dataGuides, dataArticles, dataProviders, dataHeroes) {
        var itemAddBox,
            deckID;
        
        // load article
        $scope.article = data.article;
        
        // load decks
        $scope.decks = [{_id: undefined, name: 'No deck'}].concat(dataDecks.decks);

        // load guides
        $scope.guides = [{_id: undefined, name: 'No Guide'}].concat(dataGuides.guides);       
        
        // load articles
        $scope.articles = dataArticles.articles;

        // load providers
        $scope.providers = dataProviders.users;
        
        $scope.search = '';

        //search functions
        function escapeStr( str ) {
            return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        }
        
        
        //search functions
        $scope.getDecks = function () {
            AdminDeckService.getDecks(1, 10, escapeStr($scope.search)).then(function (data) {
                $scope.decks = data.decks;
            });
        } 

        $scope.getArticles = function () {
            AdminArticleService.getArticles(1, 10, escapeStr($scope.search)).then(function (data) {
                $scope.articles = data.articles;
            });
        }

        $scope.getGuides = function () {
            AdminHOTSGuideService.getGuides(1, 10, escapeStr($scope.search)).then(function (data) {
                $scope.guides = data.guides;
            });
        }
        //!search functions
        
        //open the modal to choose what item to add
        $scope.addItemArticle = function () {
            itemAddBox = bootbox.dialog({
                message: $compile('<div article-item-add></div>')($scope),
                closeButton: true,
                animate: true,
                onEscape: function () { //We want to clear the search results when we close the bootbox
                    $scope.search = '';
                    $scope.getDecks();
                    $scope.getGuides();
                }
            });
            itemAddBox.modal('show');
            itemAddBox.on('hidden.bs.modal', function () { //We want to clear the search results when we close the bootbox
                $scope.search = '';
                $scope.getArticles();
            });
        }

        //change the article item
        $scope.modifyItem = function (item) {
            switch ($scope.article.articleType.toString()) {
                case 'hs': $scope.article.deck = item; break;
                case 'hots': $scope.article.guide = item; break;
            }
            $scope.search = '';
            itemAddBox.modal('hide');
        }
        
        
        
        //this is for the related article modal
        $scope.addRelatedArticle = function () {
            itemAddBox = bootbox.dialog({
                message: $compile('<div article-related-add></div>')($scope),
                closeButton: false,
                animate: true,
            });
            itemAddBox.modal('show');
            itemAddBox.on('hidden.bs.modal', function () { //We want to clear the search results when we close the bootbox
                $scope.search = '';
                $scope.getArticles();
            });
        }
        
        $scope.isRelated = function (a) {
            for (var i = 0; i < $scope.article.related.length; i++) {
                if (a._id == $scope.article.related[i]._id) {
                    return true;
                }
            }
            return false;
        }
        
        $scope.modifyRelated = function (a) {
            if ($scope.isRelated(a)) {
                $scope.removeRelatedArticle(a);
                return;
            }
            $scope.article.related.push(a);
        }
        
        $scope.removeRelatedArticle = function (a) {
            for (var i = 0; i < $scope.article.related.length; i++) {
                if (a._id === $scope.article.related[i]._id) {
                    $scope.article.related.splice(i, 1);
                }
            }
        }
        
        $scope.closeBox = function () {
            itemAddBox.modal('hide');
        }; 
        
        $scope.setSlug = function () {
            if (!$scope.article.slug.linked) { return false; }
            $scope.article.slug.url = Util.slugify($scope.article.title);
        };
        
        $scope.toggleSlugLink = function () {
            $scope.article.slug.linked = !$scope.article.slug.linked;
            $scope.setSlug();
        };
        
        
        // photo
        $scope.cardImg = ($scope.article.photos.small && $scope.article.photos.small.length) ? $scope.app.cdn + 'articles/' + $scope.article.photos.small : $scope.app.cdn + 'img/blank.png';
        
        // tags
        $scope.hasTags = function () {
            var type = $scope.article.articleType,
                isHS = (type.indexOf('hs') !== -1) ? true : false,
                isHOTS = (type.indexOf('hots') !== -1) ? true : false;
            
            return ((isHS && !isHOTS) || (isHOTS && !isHS));
        }
        
        $scope.getTags = function () {
            var type = $scope.article.articleType,
                isHS = (type.indexOf('hs') !== -1) ? true : false,
                isHOTS = (type.indexOf('hots') !== -1) ? true : false;
            
            if (isHS && !isHOTS) {
                return ['Druid', 'Hunter', 'Mage', 'Paladin', 'Priest', 'Rogue', 'Shaman', 'Warlock', 'Warrior'];
            }
            if (isHOTS && !isHS) {
                var out = [];
                for (var i = 0; i < dataHeroes.heroes.length; i++) {
                    out.push(dataHeroes.heroes[i].name);
                }
                return out;
            }
        };
        
        // article types
        $scope.articleTypes = AdminArticleService.articleTypes();
        
        // select options
        $scope.articleFeatured =
        $scope.articlePremium =
        $scope.articleActive = [
            { name: 'Yes', value: true },
            { name: 'No', value: false }
        ];
        
        $scope.articleTheme = [
            { name: 'None', value: 'none' },
            { name: 'Overcast', value: 'overcast' }
        ];
        
        // make date object
        $scope.article.premium.expiryDate = new Date($scope.article.premium.expiryDate);
        
        // date picker options
        $scope.dateOptions = {};
        
        // summernote options
        $scope.options = {
          disableDragAndDrop: true,
          height: 300,
          fontNames: ['Open Sans Regular', 'Open Sans Bold'],
          defaultFontName: 'Open Sans Regular',
          toolbar: [
            ['style', ['bold', 'italic', 'underline', 'strikethrough', 'clear']],
            ['fontname', ['fontname']],
            ['fontsize', ['fontsize']],
            ['color', ['color']],
            ['para', ['ul', 'ol', 'paragraph']],
            ['table', ['table']],
            ['insert', ['link', 'picture', 'video']],
            ['format', ['hr']],
            ['misc', ['undo', 'redo', 'codeview']]
          ]
        };
        
        // photo upload
        $scope.photoUpload = function ($files) {
            if (!$files.length) return false;
            var box = bootbox.dialog({
                message: $compile('<div class="progress progress-striped active" style="margin-bottom: 0px;"><div class="progress-bar" role="progressbar" aria-valuenow="{{uploading}}" aria-valuemin="0" aria-valuemax="100" style="width: {{uploading}}%;"><span class="sr-only">{{uploading}}% Complete</span></div></div>')($scope),
                closeButton: false,
                animate: false
            });
            $scope.uploading = 0;
            box.modal('show');
            for (var i = 0; i < $files.length; i++) {
                var file = $files[i];
                $scope.upload = $upload.upload({
                    url: '/api/admin/upload/article',
                    method: 'POST',
                    file: file
                }).progress(function(evt) {
                    $scope.uploading = parseInt(100.0 * evt.loaded / evt.total);
                }).success(function(data, status, headers, config) {
                    $scope.article.photos = {
                        large: data.large,
                        medium: data.medium,
                        small: data.small,
                        square: data.square
                    };
                    $scope.cardImg = $scope.app.cdn + data.path + data.small;
                    box.modal('hide');
                });
            }
        };
        
        $scope.getImage = function () {
            $scope.imgPath = 'articles/';
            if (!$scope.article) { return 'img/blank.png'; }
            return ($scope.article.photos && $scope.article.photos.small === '') ?  $scope.app.cdn + 'img/blank.png' : $scope.app.cdn + $scope.imgPath + $scope.article.photos.small;
        };
        
        $scope.editArticle = function () {
            $scope.showError = false;
            AdminArticleService.editArticle($scope.article).success(function (data) {
                if (!data.success) {
                    $scope.errors = data.errors;
                    $scope.showError = true;
                    $window.scrollTo(0,0);
                } else {
                    AlertService.setSuccess({ show: true, msg: $scope.article.title + ' has been updated successfully.' });
                    $state.go('app.admin.articles.list');
                }
            });
        };
        
        $scope.getNames = function () {
            AdminArticleService.getNames($scope.article).success(function (data) {
                if (!data.success) { console.log(data); }
                else {
                    var content = '';
                    for (var i = 0; i < data.names.length; i++) {
                        content = content + data.names[i] + '<br>';
                    }
                    
                    var box = bootbox.dialog({
                        message: content,
                        animate: false
                    });
                    box.modal('show');
                }
            });
        };
    }
])
.controller('AdminArticleListCtrl', ['$scope', 'AdminArticleService', 'AlertService', 'Pagination', 'data',
    function ($scope, AdminArticleService, AlertService, Pagination, data) {
        
        // grab alerts
        if (AlertService.hasAlert()) {
            $scope.success = AlertService.getSuccess();
            AlertService.reset();
        }
        
        // load articles
        $scope.articles = data.articles;
        $scope.page = data.page;
        $scope.perpage = data.perpage;
        $scope.total = data.total;
        $scope.search = data.search;
        
        $scope.getArticles = function () {
            AdminArticleService.getArticles($scope.page, $scope.perpage, $scope.search).then(function (data) {
                $scope.articles = data.articles;
                $scope.page = data.page;
                $scope.total = data.total;
            });
        }
        
        $scope.searchArticles = function () {
            $scope.page = 1;
            $scope.getArticles();
        }
        
        // pagination
        $scope.pagination = {
            page: function () {
                return $scope.page;
            },
            perpage: function () {
                return $scope.perpage;
            },
            results: function () {
                return $scope.total;
            },
            setPage: function (page) {
                $scope.page = page;
                $scope.getArticles();
            },
            pagesArray: function () {
                var pages = [],
                    start = 1,
                    end = this.totalPages();
                
                if (this.totalPages() > 5) {
                    if (this.page() < 3) {
                        start = 1;
                        end = start + 4;
                    } else if (this.page() > this.totalPages() - 2) {
                        end = this.totalPages();
                        start = end - 4;
                    } else {
                        start = this.page() - 2;
                        end = this.page() + 2;
                    }
                    
                }
                
                for (var i = start; i <= end; i++) {
                    pages.push(i);
                }
                
                return pages;
            },
            isPage: function (page) {
                return (page === this.page());
            },
            totalPages: function (page) {
                return (this.results() > 0) ? Math.ceil(this.results() / this.perpage()) : 0;
            },
            from: function () {
                return (this.page() * this.perpage()) - this.perpage() + 1;
            },
            to: function () {
                return ((this.page() * this.perpage()) > this.results()) ? this.results() : this.page() * this.perpage();
            }
        };
        
        // delete article
        $scope.deleteArticle = function deleteArticle(article) {
            var box = bootbox.dialog({
                title: 'Delete article: ' + article.title + '?',
                message: 'Are you sure you want to delete the article <strong>' + article.title + '</strong>?',
                buttons: {
                    delete: {
                        label: 'Delete',
                        className: 'btn-danger',
                        callback: function () {
                            AdminArticleService.deleteArticle(article._id).then(function (data) {
                                if (data.success) {
                                    var index = $scope.articles.indexOf(article);
                                    if (index !== -1) {
                                        $scope.articles.splice(index, 1);
                                    }
                                    $scope.success = {
                                        show: true,
                                        msg: article.title + ' deleted successfully.'
                                    };
                                }
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
                }
            });
            box.modal('show');
        }
        
    }
])
.controller('AdminSnapshotListCtrl', [ '$scope', 'data', 'AdminSnapshotService', 'AlertService',
    function ($scope, data, AdminSnapshotService, AlertService) {
        
                // grab alerts
        if (AlertService.hasAlert()) {
            $scope.success = AlertService.getSuccess();
            AlertService.reset();
        }
        
        // load articles
        $scope.snapshots = data.snapshots;
        $scope.page = data.page;
        $scope.perpage = data.perpage;
        $scope.total = data.total;
        $scope.search = data.search;
        
        $scope.getSnapshots = function () {
            AdminSnapshotService.getSnapshots($scope.page, $scope.perpage, $scope.search).then(function (data) {
                $scope.snapshots = data.snapshots;
                $scope.page = data.page;
                $scope.total = data.total;
            });
        }
        
        $scope.searchSnapshots = function () {
            $scope.page = 1;
            $scope.getSnapshots();
        }
        
        // pagination
        $scope.pagination = {
            page: function () {
                return $scope.page;
            },
            perpage: function () {
                return $scope.perpage;
            },
            results: function () {
                return $scope.total;
            },
            setPage: function (page) {
                $scope.page = page;
                $scope.getSnapshots();
            },
            pagesArray: function () {
                var pages = [],
                    start = 1,
                    end = this.totalPages();
                
                if (this.totalPages() > 5) {
                    if (this.page() < 3) {
                        start = 1;
                        end = start + 4;
                    } else if (this.page() > this.totalPages() - 2) {
                        end = this.totalPages();
                        start = end - 4;
                    } else {
                        start = this.page() - 2;
                        end = this.page() + 2;
                    }
                    
                }
                
                for (var i = start; i <= end; i++) {
                    pages.push(i);
                }
                
                return pages;
            },
            isPage: function (page) {
                return (page === this.page());
            },
            totalPages: function (page) {
                return (this.results() > 0) ? Math.ceil(this.results() / this.perpage()) : 0;
            },
            from: function () {
                return (this.page() * this.perpage()) - this.perpage() + 1;
            },
            to: function () {
                return ((this.page() * this.perpage()) > this.results()) ? this.results() : this.page() * this.perpage();
            }
        };
        
        // delete article
        $scope.deleteSnapshot = function deleteSnapshot(snapshot) {
            var box = bootbox.dialog({
                title: 'Delete Meta Snapshot: ' + snapshot.title + '?',
                message: 'Are you sure you want to delete the Meta Snapshot <strong>' + snapshot.title + '</strong>?',
                buttons: {
                    delete: {
                        label: 'Delete',
                        className: 'btn-danger',
                        callback: function () {
                            AdminSnapshotService.deleteSnapshot(snapshot._id).then(function (data) {
                                if (data.success) {
                                    var index = $scope.snapshots.indexOf(snapshot);
                                    if (index !== -1) {
                                        $scope.snapshots.splice(index, 1);
                                    }
                                    $scope.success = {
                                        show: true,
                                        msg: snapshot.title + ' deleted successfully.'
                                    };
                                }
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
                }
            });
            box.modal('show');
        }
        
        
    }
])
.controller('AdminSnapshotEditCtrl', ['$scope', '$compile', '$timeout', '$state', '$window', '$upload', 'data', 'AlertService', 'Util', 'bootbox', 'AdminDeckService', 'AdminSnapshotService', 'AdminUserService', 'AdminCardService',
    function ($scope, $compile, $timeout, $state, $window, $upload, data, AlertService, Util, bootbox, AdminDeckService, AdminSnapshotService, AdminUserService, AdminCardService) {
        
        
        var deckBootBox = undefined,
            authorBootBox = undefined,
            cardBootBox = undefined,
            defaultTier = {
                tier : 1,
                decks : []
            },
            defaultTierDeck = {
                name: "",
                explanation : "",
                weeklyNotes : "",
                deck : undefined,
                rank : {
                    current : 1,
                    last : [ 0,0,0,0,0,0,0,0,0,0,0,0 ]
                },
                tech : []
            },
            defaultAuthor = {
                user: undefined, 
                description: "",
                klass: []
            },
            defaultDeckMatch = {
                for : undefined,
                against : undefined,
                forChance : 0,
                againstChance : 0
            },
            defaultDeckTech = {
                title : "",
                cards : [],
                orderNum : 1
            },
            defaultTechCards = {
                card : undefined,
                toss : false,
                orderNum : 1
            };

        $scope.snapshot = data.snapshot;
        $scope.search = "";
        $scope.decks = [];
        $scope.matches = populateMatches();
        $scope.matching = false;
        $scope.selectedDecks = [];
        $scope.removedDecks = [];
        
        // photo upload
        $scope.photoUpload = function ($files) {
            if (!$files.length) return false;
            var box = bootbox.dialog({
                message: $compile('<div class="progress progress-striped active" style="margin-bottom: 0px;"><div class="progress-bar" role="progressbar" aria-valuenow="{{uploading}}" aria-valuemin="0" aria-valuemax="100" style="width: {{uploading}}%;"><span class="sr-only">{{uploading}}% Complete</span></div></div>')($scope),
                closeButton: false,
                animate: false
            });
            $scope.uploading = 0;
            box.modal('show');
            for (var i = 0; i < $files.length; i++) {
                var file = $files[i];
                $scope.upload = $upload.upload({
                    url: '/api/admin/upload/snapshot',
                    method: 'POST',
                    file: file
                }).progress(function(evt) {
                    $scope.uploading = parseInt(100.0 * evt.loaded / evt.total);
                }).success(function(data, status, headers, config) {
                    $scope.snapshot.photos = {
                        large: data.large,
                        medium: data.medium,
                        small: data.small,
                        square: data.square
                    };
                    $scope.cardImg = $scope.app.cdn + data.path + data.small;
                    box.modal('hide');
                });
            }
        }
        
        $scope.getImage = function () {
            $scope.imgPath = 'snapshots/';
            if (!$scope.snapshot) { return '/img/blank.png'; }
            return ($scope.snapshot.photos && $scope.snapshot.photos.small === '') ?  $scope.app.cdn + '/img/blank.png' : $scope.app.cdn + $scope.imgPath + $scope.snapshot.photos.small;
        };
        
        function populateMatches () {
            var out = [],
                tierLength = $scope.snapshot.tiers.length,
                maxTierLength = (tierLength > 2) ? 2 : tierLength;
            
            for (var i = 0; i < maxTierLength; i++) {
                for (var j = 0; j < $scope.snapshot.tiers[i].decks.length; j++) {
                    out.push($scope.snapshot.tiers[i].decks[j]);
                }
            }
            return out;
        }
        
        $scope.updateDND = function (list, index, d) {
            list.splice(index, 1);
            for (var i = 0; i < list.length; i++) {
                list[i].orderNum = i + 1;
            }
            updateMatchesDND(d);
            
            doUpdateMatches(function () {
                $scope.selectedDecks = [];
                $scope.removedDecks = [];
                $scope.deckRanks();
            }, false);
        }
        
        function updateMatchesDND (d) {
            var tierLength = $scope.snapshot.tiers.length;
            var maxTierLength = (tierLength > 2) ? 2 : tierLength;
            
            for (var i = 0; i < maxTierLength; i++) {
                for (var j = 0; j < $scope.snapshot.tiers[i].decks.length; j++) {
                    if ($scope.snapshot.tiers[i].decks[j].deck._id == d.deck._id) {
                        for (var k = 0; k < $scope.snapshot.matches.length; k++) {
                            if ($scope.snapshot.matches[k].for._id == d.deck._id || $scope.snapshot.matches[k].against._id == d.deck._id) {
                                return;
                            }
                        }
                        $scope.selectedDecks.push(d);
                        $scope.tier = $scope.snapshot.tiers[i].tier;
                        return;
                    }
                }
            }
            removeMatch(d.deck);
        }
        
        
        function escapeStr( str ) {
            return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        }
        
        /* GET METHODS */
            function getDecks (callback) {
                AdminDeckService.getDecks(1, 10, escapeStr($scope.search)).then(function (data) {
                    $timeout(function () {
                        callback(data);
                    });
                });
            }

            function getProviders (callback) {
                AdminUserService.getProviders(1, 10, escapeStr($scope.search)).then(function (data) {
                    $timeout(function () {
                        callback(data);
                    });
                });
            }
        
            function getCards (callback) {
                AdminCardService.getDeckableCards().then(function (data) {
                    $timeout(function () {
                        callback(data);
                    })
                });
            }
        /* GET METHODS */
        
        
        /* BOOTBOX METHODS */
            $scope.openAddBox = function (type, tier, deck, tech) {
                $scope.tier = tier;
                $scope.deck = deck;
                $scope.tech = tech;
                
                switch (type) {
                    case 'author' : //this is to display data in the bootbox for authors
                        getProviders(function (data) {
                            $scope.authorData = data.users;
                            authorBox(data, type);
                        });
                    break;
                        
                    case 'deck' : //this is to display data in the bootbox for decks
                        getDecks(function (data) {
                            $scope.deckData = data.decks;
                            $scope.tierAbsolute = (tier-1);
                            deckBox(data, type);
                        });
                    break;
                        
                    case 'card' :
                        getCards(function (data) {
                            $scope.cardData = data.cards;
                            cardBox(data, type);
                        }); 
                    break;
                        
                    default : console.log('That does not exist!'); break;
                }
            }

            ///////////////////////////////////////
            function deckBox (data, type) {
                deckBootBox = bootbox.dialog({
                    message: $compile('<div snapshot-add-deck></div>')($scope),
                    animate: true,
                    closeButton: false
                });
                deckBootBox.modal('show');
            }
        
            function authorBox () {
                authorBootBox = bootbox.dialog({
                    message: $compile('<div snapshot-add-author></div>')($scope),
                    animate: true,
                    closeButton: false
                });
                authorBootBox.modal('show');
            }
        
            function cardBox(data, type) {
                $scope.type = type;
                cardBootBox = bootbox.dialog({
                    message: $compile('<div snapshot-add-card></div>')($scope),
                    animate: true,
                    closeButton: false
                });
                cardBootBox.modal('show');
            }
        
            $scope.closeCardBox = function () {
                cardBox.modal('hide');
                cardBox = undefined;
            }
        
            $scope.closeBox = function () {
                bootbox.hideAll();
                $scope.search = "";
            }
            
            $scope.closeDeckBox = function () {
                doUpdateMatches(function () {
                    bootbox.hideAll();
                    $scope.deckRanks();
                    $scope.search = "";
                    $scope.selectedDecks = [];
                    $scope.removedDecks = [];
                }, true);
            }
        /* BOOTBOX METHODS */
        
        /* URL METHOD */    
        
            $scope.setSlug = function () {
                if (!$scope.snapshot.slug.linked) { return false; }
                $scope.snapshot.slug.url = "meta-snapshot-" + $scope.snapshot.snapNum + "-" + Util.slugify($scope.snapshot.title);
            };

            $scope.toggleSlugLink = function () {
                $scope.snapshot.slug.linked = !$scope.snapshot.slug.linked;
                $scope.setSlug();
            };
            
        /* !URL METHOD */    
            
        /* AUTHOR METHODS */
            $scope.isAuthor = function (a) {
                for (var i = 0; i < $scope.snapshot.authors.length; i++) {
                    if (a._id == $scope.snapshot.authors[i].user._id) {
                        return true;
                    }
                }
                return false;
            }
            
            $scope.addAuthor = function (a) {
                if ($scope.isAuthor(a)) {
                    $scope.removeAuthor(a);
                    return;
                }
                var dauthor = angular.copy(defaultAuthor);
                dauthor.user = a;
                $scope.snapshot.authors.push(dauthor);
            }
            
            $scope.removeAuthor = function (a) {
                for (var i = 0; i < $scope.snapshot.authors.length; i++) {
                    if (a._id === $scope.snapshot.authors[i].user._id) {
                        $scope.snapshot.authors.splice(i, 1);
                    }
                }
            }
        /* AUTHOR METHODS */

            
        /* TIERS METHODS */
            $scope.addTier = function () {
                var newTier = angular.copy(defaultTier);
                newTier.tier = $scope.snapshot.tiers.length + 1;
                $scope.snapshot.tiers.push(newTier);
            }
            
            $scope.removePrompt = function (t) {
                var alertBox = bootbox.confirm("Are you sure you want to remove tier " + t.tier + "? All the deck data for this tier will be lost!", function (result) {
                    if (result) {
                        $scope.$apply(function () {
                            $scope.removeTier(t);
                        });
                    }
                });
            }
            
            $scope.removeTier = function (t) {
                for (var j = 0; j < t.decks.length; j++) {
                    $scope.removedDecks.push(t.decks[j].deck);
                }
                for (var i = 0; i < $scope.snapshot.tiers.length; i++) {
                    if (t.tier === $scope.snapshot.tiers[i].tier) {
                        $scope.snapshot.tiers.splice(i, 1);
                        for(var j = 0; j < $scope.snapshot.tiers.length; j++) {
                            $scope.snapshot.tiers[j].tier = (j + 1);
                        }
                    }
                }
                doUpdateMatches(function () {
                    $scope.deckRanks
                }, true);
            }
            ///////////////////////////////////////////////////////////////////////////////////
            $scope.deckRanks = function () {
                var curRank = 1;
                for (var i = 0; i < $scope.snapshot.tiers.length; i++) {
                    for (var j = 0; j < $scope.snapshot.tiers[i].decks.length; j++) {
                        $scope.snapshot.tiers[i].decks[j].rank.current = curRank++;
                    }
                }
            }
            
            $scope.changeAgainstChance = function (match) {
                match.forChance = (100 - match.againstChance);
            }
            
            $scope.changeForChance = function (match) {
                match.againstChance = (100 - match.forChance);
            }
            
            function doUpdateMatches (callback, addDecksToTier) {
                var tiers = $scope.snapshot.tiers,
                    tierLength = tiers.length,
                    maxTierLength = (tierLength > 2) ? 2 : tierLength;
                for (var i = 0; i < $scope.selectedDecks.length; i++) {
                    if ($scope.tier < 3) {
                        $scope.matches.push($scope.selectedDecks[i]);
                        for (var j = 0; j < $scope.matches.length; j++) {
                            $scope.snapshot.matches.push({
                                'for': $scope.selectedDecks[i].deck,
                                'against': $scope.matches[j].deck,
                                'forChance': ($scope.selectedDecks[i].deck._id === $scope.matches[j].deck._id) ? 50 : 0,
                                'againstChance': ($scope.selectedDecks[i].deck._id === $scope.matches[j].deck._id) ? 50 : 0
                            });
                        }
                    }
                    if (addDecksToTier) {
                        $scope.snapshot.tiers[$scope.tier-1].decks.push($scope.selectedDecks[i]);
                    }
                }
                for (var j = 0; j < $scope.removedDecks.length; j++) {
                    $scope.removeDeck($scope.removedDecks[j]);
                }
                
                return callback();
            }
        
            $scope.getMatches = function (deckID) {
                var matches = $scope.snapshot.matches,
                    out = [];
                
                for (var i = 0; i < matches.length; i++) {
                    if (deckID == matches[i].for._id || deckID == matches[i].against._id) {
                        out.push(matches[i]);
                    }
                }
                return out;
            }
            
            function trimDeck (deck) {                
                deck.deck = {
                    _id: deck.deck._id,
                    name: deck.deck.name
                }
                return deck;
            }

            $scope.addDeck = function (sel) {
                var tiers = $scope.snapshot.tiers,
                    decks = $scope.selectedDecks,
                    tierDeck = angular.copy(defaultTierDeck);
                
                if (!$scope.isDeck(sel) && !$scope.isSelected(sel)) {
                    for (var l = 0; l < $scope.removedDecks.length; l++) {
                        if (sel._id == $scope.removedDecks[l]._id) {
                            $scope.removedDecks.splice(l,1);
                        }
                    }
                    tierDeck.deck = sel;
                    decks.push(trimDeck(tierDeck));
                } else {
                    for(var i = 0; i < $scope.selectedDecks.length; i++) {
                        if (sel._id == $scope.selectedDecks[i].deck._id) {
                            $scope.selectedDecks.splice(i,1);
                        }
                    }
                    for(var k = 0; k < $scope.matches.length; k++) {
                        if (sel._id == $scope.matches[k].deck._id) {
                            $scope.matches.splice(k,1);
                        }
                    }
                    $scope.removeDeck(sel);
                }
                $scope.deckRanks();
            }
            
            $scope.isDeck = function (d) {
                for (var j = 0; j < $scope.matches.length; j++) {
                    if (d._id == $scope.matches[j].deck._id) {
                        return 'true';
                    }
                }
                return false;
            }
            
            $scope.isSelected = function (d) {
                for (var j = 0; j < $scope.selectedDecks.length; j++) {
                    if (d._id == $scope.selectedDecks[j].deck._id) {
                        return true;
                    }
                }
                return false;
            }
            
            $scope.removeDeckPrompt = function (d) {
                var alertBox = bootbox.confirm("Are you sure you want to remove deck " + d.name + "? All the data for this deck will be lost!", function (result) {
                    if (result) {
                        $scope.$apply(function () {
                            $scope.removeDeck(d);
                        });
                    }
                });
            }
            
            $scope.removeDeck = function (d) {
                for (var i = 0; i < $scope.snapshot.tiers.length; i++) {
                    for (var k = 0; k < $scope.snapshot.tiers[i].decks.length; k++) {
                        if (d._id == $scope.snapshot.tiers[i].decks[k].deck._id) {
                            $scope.snapshot.tiers[i].decks.splice(k, 1);
                            k--;
                        }
                    }
                    removeMatch(d);
                }
                $scope.deckRanks();
            }
            
            function removeMatch(d) {
                for (var j = 0; j < $scope.snapshot.matches.length; j++) {
                    if (d._id == $scope.snapshot.matches[j].for._id || d._id == $scope.snapshot.matches[j].against._id) {
                        $scope.snapshot.matches.splice(j,1);
                        j--;
                    }
                }
                
                for (var l = 0; l < $scope.matches.length; l++) {
                    if (d._id == $scope.matches[l].deck._id) {
                        $scope.matches.splice(l,1);
                        l--;
                    }
                }
            }
            
            $scope.searchDecks = function (s) {
                $scope.search = s;
                getDecks(function (data) {
                    $scope.deckData = data.decks;
                });
            }
            
            //////////////////////////////////////////////////////////////////////
            
            $scope.addCard = function (c, t) {
                var tech = $scope.tech,
                    deck = $scope.deck,
                    tier = $scope.tier,
                    techCard = angular.copy(defaultTechCards);
                techCard.toss = t;
                techCard.card = c;
                
                
                for (var i = 0; i < $scope.snapshot.tiers.length; i++) {
                    for (var k = 0; k < $scope.snapshot.tiers[i].decks.length; k++) {
                        for (var j = 0; j < $scope.snapshot.tiers[i].decks[k].tech.length; j++) {
                            if (tech.orderNum == $scope.snapshot.tiers[i].decks[k].tech[j].orderNum) {
                                if (!$scope.isCard(c)) {
                                    techCard.orderNum = $scope.snapshot.tiers[i].decks[k].tech[j].cards.length;
                                    $scope.snapshot.tiers[i].decks[k].tech[j].cards.push(techCard);
                                } 
                            }
                        }
                    }
                }
            }
            
            $scope.isCard = function (c) {
                var tech = $scope.tech;
                if (tech) {
                    for (var i = 0; i < tech.cards.length; i++) {
                        if (c._id == tech.cards[i]._id) {
                            return true;
                        }
                    }
                    return false;
                }
            }
            
            $scope.addTech = function (d, t) {
                var deckTech = angular.copy(defaultDeckTech);
                var curNum = 0;
                
                for (var i = 0; i < $scope.snapshot.tiers.length; i++) {
                    for (var k = 0; k < $scope.snapshot.tiers[i].decks.length; k++) {
                        if (d.rank.current == $scope.snapshot.tiers[i].decks[k].rank.current) {
                            $scope.snapshot.tiers[i].decks[k].tech.push(deckTech);
                        }
                        for (var j = 0; j < $scope.snapshot.tiers[i].decks[k].tech.length; j++) {
                            $scope.snapshot.tiers[i].decks[k].tech[j].orderNum = ++curNum;
                        }
                    }
                }
            }
            
            $scope.removeTech = function (t) {
                for (var i = 0; i < $scope.snapshot.tiers.length; i++) {
                    for (var k = 0; k < $scope.snapshot.tiers[i].decks.length; k++) {
                        for (var j = 0; j < $scope.snapshot.tiers[i].decks[k].tech.length; j++) {
                            if (t.orderNum == $scope.snapshot.tiers[i].decks[k].tech[j].orderNum) {
                                $scope.snapshot.tiers[i].decks[k].tech.splice(j, 1);
                                return;
                            }
                        }
                    }
                }
            }
            
            $scope.removeTechCard = function (tech, c) {
                for (var card in tech.cards) {
                    if (c._id == tech.cards[card]._id) {
                        tech.cards.splice(card,1);
                        break;
                    }
                }
            }
            
            $scope.setBoth = function (c) {
                if (!c.both) {
                    c.both = true;
                } else {
                    c.both = false;
                }
            }
            
        $scope.trendsLength = 12;
        $scope.trends = function(num) {
            return new Array(num);
        }
        /* TIERS METHODS */

        $scope.editSnapshot = function () {
            $scope.showError = false;
            AdminSnapshotService.editSnapshot($scope.snapshot).success(function (data) {
                if (!data.success) {
                    $scope.errors = data.errors;
                    $scope.showError = true;
                    $window.scrollTo(0,0);
                } else {
                    AlertService.setSuccess({ show: true, msg: $scope.snapshot.title + ' has been edited successfully.' });
                    $state.go('app.admin.snapshots.list');
                }
            });
        };
    }
])
.controller('AdminSnapshotAddCtrl', ['$scope', '$compile', '$timeout', '$upload', 'dataPrevious', '$state', '$window', 'AlertService', 'Util', 'bootbox', 'AdminDeckService', 'AdminSnapshotService', 'AdminUserService', 'AdminCardService',
    function ($scope, $compile, $timeout, $upload, dataPrevious, $state, $window, AlertService, Util, bootbox, AdminDeckService, AdminSnapshotService, AdminUserService, AdminCardService) {
        
        var deckBootBox = undefined,
            authorBootBox = undefined,
            cardBootBox = undefined,
            defaultSnap = {
                snapNum : 1,
                title : "",
                authors : [],
                slug : {
                    url : "",
                    linked : true,
                },
                content : {
                    intro : "",
                    thoughts : ""
                },
                matches : [],
                tiers: [],
                photos: {
                    large: "",
                    medium: "",
                    small: "",
                    square: ""
                },
                votes: 0,
                active : false
            },
            defaultAuthor = {
                user: undefined, 
                description: "",
                klass: []
            },
            defaultTier = {
                tier : 1,
                decks : []
            },
            defaultTierDeck = {
                name: "",
                explanation : "",
                weeklyNotes : "",
                deck : undefined,
                rank : {
                    current : 1,
                    last : [0,0,0,0,0,0,0,0,0,0,0,0]
                },
                tech : []
            },
            defaultDeckMatch = {
                for : undefined,
                against : undefined,
                forChance : 0,
                againstChance : 0
            },
            defaultDeckTech = {
                title : "",
                cards : [],
                orderNum : 1
            },
            defaultTechCards = {
                card : undefined,
                toss : false,
                both : false,
                orderNum : 1
            };

        $scope.snapshot = angular.copy(defaultSnap);
        $scope.search = "";
        $scope.decks = [];
        $scope.matches = [];
        $scope.matching = false;
        $scope.selectedDecks = [];
        $scope.removedDecks = [];
        $scope.lockDND = true;
        $scope.loaded = false;
        
        $scope.updateDND = function (list, index, d) {
            list.splice(index, 1);
            for (var i = 0; i < list.length; i++) {
                list[i].orderNum = i + 1;
            }
            updateMatchesDND(d)
            doUpdateMatches(function () {
                $scope.selectedDecks = [];
                $scope.removedDecks = [];
                $scope.deckRanks();
            }, false);
        };
        
        function updateMatchesDND (d) {
            var tierLength = $scope.snapshot.tiers.length;
            var maxTierLength = (tierLength > 2) ? 2 : tierLength;
            
            for (var i = 0; i < maxTierLength; i++) {
                for (var j = 0; j < $scope.snapshot.tiers[i].decks.length; j++) {
                    if ($scope.snapshot.tiers[i].decks[j].deck._id == d.deck._id) {
                        for (var k = 0; k < $scope.snapshot.matches.length; k++) {
                            if ($scope.snapshot.matches[k].for._id == d.deck._id || $scope.snapshot.matches[k].against._id == d.deck._id) {
                                return;
                            }
                        }
                        $scope.selectedDecks.push(d);
                        $scope.tier = $scope.snapshot.tiers[i].tier;
                        return;
                    }
                }
            }
            removeMatch(d.deck);
        }
        
        // photo upload
        $scope.photoUpload = function ($files) {
            if (!$files.length) return false;
            var box = bootbox.dialog({
                message: $compile('<div class="progress progress-striped active" style="margin-bottom: 0px;"><div class="progress-bar" role="progressbar" aria-valuenow="{{uploading}}" aria-valuemin="0" aria-valuemax="100" style="width: {{uploading}}%;"><span class="sr-only">{{uploading}}% Complete</span></div></div>')($scope),
                closeButton: false,
                animate: false
            });
            $scope.uploading = 0;
            box.modal('show');
            for (var i = 0; i < $files.length; i++) {
                var file = $files[i];
                $scope.upload = $upload.upload({
                    url: '/api/admin/upload/snapshot',
                    method: 'POST',
                    file: file
                }).progress(function(evt) {
                    $scope.uploading = parseInt(100.0 * evt.loaded / evt.total);
                }).success(function(data, status, headers, config) {
                    $scope.snapshot.photos = {
                        large: data.large,
                        medium: data.medium,
                        small: data.small,
                        square: data.square
                    };
                    $scope.cardImg = $scope.app.cdn + data.path + data.small;
                    box.modal('hide');
                });
            }
        };
        
        $scope.getImage = function () {
            $scope.imgPath = '/snapshots/';
            if (!$scope.snapshot) { return '/img/blank.png'; }
            return ($scope.snapshot.photos && $scope.snapshot.photos.small === '') ?  $scope.app.cdn + '/img/blank.png' : $scope.app.cdn + $scope.imgPath + $scope.snapshot.photos.small;
        };
        
        function escapeStr( str ) {
            return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        }
                
        /* GET METHODS */
            function getDecks (callback) {
                AdminDeckService.getDecks(1, 10, escapeStr($scope.search)).then(function (data) {
                    $timeout(function () {
                        callback(data);
                    });
                });
            }

            function getProviders (callback) {
                AdminUserService.getProviders(1, 10, escapeStr($scope.search)).then(function (data) {
                    $timeout(function () {
                        callback(data);
                    });
                });
            }
        
            function getCards (callback) {
                AdminCardService.getDeckableCards().then(function (data) {
                    $timeout(function () {
                        callback(data);
                    })
                });
            }
        /* GET METHODS */
        
        
        /* BOOTBOX METHODS */
            $scope.openAddBox = function (type, tier, deck, tech) {
                $scope.tier = tier;
                $scope.deck = deck;
                $scope.tech = tech;
                
                switch (type) {
                    case 'author' : //this is to display data in the bootbox for authors
                        getProviders(function (data) {
                            $scope.authorData = data.users;
                            authorBox(data, type);
                        });
                    break;
                        
                    case 'deck' : //this is to display data in the bootbox for decks
                        getDecks(function (data) {
                            $scope.deckData = data.decks;
                            $scope.tierAbsolute = (tier-1);
                            deckBox(data, type);
                        });
                    break;
                        
                    case 'card' :
                        getCards(function (data) {
                            $scope.cardData = data.cards;
                            cardBox(data, type);
                        }); 
                    break;
                        
                    default : console.log('That does not exist!'); break;
                }
            }

            ///////////////////////////////////////
            function deckBox (data, type) {
                deckBootBox = bootbox.dialog({
                    message: $compile('<div snapshot-add-deck></div>')($scope),
                    animate: true,
                    closeButton: false
                });
                deckBootBox.modal('show');
            }
        
            function authorBox () {
                authorBootBox = bootbox.dialog({
                    message: $compile('<div snapshot-add-author></div>')($scope),
                    animate: true,
                    closeButton: false
                });
                authorBootBox.modal('show');
            }
        
            function cardBox(data, type) {
                $scope.type = type;
                cardBootBox = bootbox.dialog({
                    message: $compile('<div snapshot-add-card></div>')($scope),
                    animate: true,
                    closeButton: false
                });
                cardBootBox.modal('show');
            }
        
            $scope.closeCardBox = function () {
                cardBox.modal('hide');
                cardBox = undefined;
            }
        
            $scope.closeBox = function () {
                bootbox.hideAll();
                $scope.search = "";
            }
            
            $scope.closeDeckBox = function () {
                doUpdateMatches(function () {
                    bootbox.hideAll();
                    $scope.deckRanks();
                    $scope.search = "";
                    $scope.selectedDecks = [];
                    $scope.removedDecks = [];
                }, true);
            }
        /* BOOTBOX METHODS */
        
        /* URL METHOD */    
        
            $scope.setSlug = function () {
                if (!$scope.snapshot.slug.linked) { return false; }
                $scope.snapshot.slug.url = "meta-snapshot-" + $scope.snapshot.snapNum + "-" + Util.slugify($scope.snapshot.title);
            };

            $scope.toggleSlugLink = function () {
                $scope.snapshot.slug.linked = !$scope.snapshot.slug.linked;
                $scope.setSlug();
            };
            
        /* !URL METHOD */    
            
        /* AUTHOR METHODS */
            $scope.isAuthor = function (a) {
                for (var i = 0; i < $scope.snapshot.authors.length; i++) {
                    if (a._id == $scope.snapshot.authors[i].user._id) {
                        return true;
                    }
                }
                return false;
            }
            
            $scope.addAuthor = function (a) {
                if ($scope.isAuthor(a)) {
                    $scope.removeAuthor(a);
                    return;
                }
                var dauthor = angular.copy(defaultAuthor);
                dauthor.user = a;
                $scope.snapshot.authors.push(dauthor);
            }
            
            $scope.removeAuthor = function (a) {
                for (var i = 0; i < $scope.snapshot.authors.length; i++) {
                    if (a._id === $scope.snapshot.authors[i].user._id) {
                        $scope.snapshot.authors.splice(i, 1);
                    }
                }
            }
        /* AUTHOR METHODS */

            
        /* TIERS METHODS */
            $scope.addTier = function () {
                var newTier = angular.copy(defaultTier);
                newTier.tier = $scope.snapshot.tiers.length + 1;
                $scope.snapshot.tiers.push(newTier);
            }
            
            $scope.removePrompt = function (t) {
                var alertBox = bootbox.confirm("Are you sure you want to remove tier " + t.tier + "? All the deck data for this tier will be lost!", function (result) {
                    if (result) {
                        $scope.$apply(function () {
                            $scope.removeTier(t);
                        });
                    }
                });
            }
            
            $scope.removeTier = function (t) {
                for (var j = 0; j < t.decks.length; j++) {
                    $scope.removedDecks.push(t.decks[j].deck);
                }
                for (var i = 0; i < $scope.snapshot.tiers.length; i++) {
                    if (t.tier === $scope.snapshot.tiers[i].tier) {
                        $scope.snapshot.tiers.splice(i, 1);
                        for(var j = 0; j < $scope.snapshot.tiers.length; j++) {
                            $scope.snapshot.tiers[j].tier = (j + 1);
                        }
                    }
                }
                doUpdateMatches(function () {
                    $scope.deckRanks
                }, true);
            }
            ///////////////////////////////////////////////////////////////////////////////////
            $scope.deckRanks = function () {
                var curRank = 1;
                for (var i = 0; i < $scope.snapshot.tiers.length; i++) {
                    for (var j = 0; j < $scope.snapshot.tiers[i].decks.length; j++) {
                        $scope.snapshot.tiers[i].decks[j].rank.current = curRank++;
                    }
                }
            }
            
            $scope.changeAgainstChance = function (match) {
                match.forChance = (100 - match.againstChance);
            }
            
            $scope.changeForChance = function (match) {
                match.againstChance = (100 - match.forChance);
            }
            
            function doUpdateMatches (callback, addDecksToTier) {
                var tiers = $scope.snapshot.tiers,
                    tierLength = tiers.length,
                    maxTierLength = (tierLength > 2) ? 2 : tierLength;
                
                for (var i = 0; i < $scope.selectedDecks.length; i++) {
                    if ($scope.tier < 3) {
                        $scope.matches.push($scope.selectedDecks[i]);
                        for (var j = 0; j < $scope.matches.length; j++) {
                            $scope.snapshot.matches.push({
                                'for': $scope.selectedDecks[i].deck,
                                'against': $scope.matches[j].deck,
                                'forChance': ($scope.selectedDecks[i].deck._id === $scope.matches[j].deck._id) ? 50 : 0,
                                'againstChance': ($scope.selectedDecks[i].deck._id === $scope.matches[j].deck._id) ? 50 : 0
                            });
                        }
                    }
                    if (addDecksToTier) {
                        $scope.snapshot.tiers[$scope.tier-1].decks.push($scope.selectedDecks[i]);
                    }
                }
                for (var j = 0; j < $scope.removedDecks.length; j++) {
                    $scope.removeDeck($scope.removedDecks[j]);
                }
                
                return callback();
            }
            
            $scope.getMatches = function (deckID) {
                var matches = $scope.snapshot.matches,
                    out = [];
                
                for (var i = 0; i < matches.length; i++) {
                    if (deckID == matches[i].for._id || deckID == matches[i].against._id) {
                        out.push(matches[i]);
                    }
                }
                return out;
            }
            
            function trimDeck (deck) {                
                deck.deck = {
                    _id: deck.deck._id,
                    name: deck.deck.name
                }
                return deck;
            }

            $scope.addDeck = function (sel) {
                var tiers = $scope.snapshot.tiers,
                    decks = $scope.selectedDecks,
                    tierDeck = angular.copy(defaultTierDeck);
                    tierDeck.name = sel.name;
                if (!$scope.isDeck(sel) && !$scope.isSelected(sel)) {
                    for (var l = 0; l < $scope.removedDecks.length; l++) {
                        if (sel._id == $scope.removedDecks[l]._id) {
                            $scope.removedDecks.splice(l,1);
                        }
                    }
                    tierDeck.deck = sel;
                    decks.push(trimDeck(tierDeck));
                } else {
                    for(var i = 0; i < $scope.selectedDecks.length; i++) {
                        if (sel._id == $scope.selectedDecks[i].deck._id) {
                            $scope.selectedDecks.splice(i,1);
                        }
                    }
                    for(var k = 0; k < $scope.matches.length; k++) {
                        if (sel._id == $scope.matches[k].deck._id) {
                            $scope.matches.splice(k,1);
                        }
                    }
                    $scope.removeDeck(sel);
                }
                $scope.deckRanks();
            }
            
            $scope.isDeck = function (d) {
                for (var j = 0; j < $scope.matches.length; j++) {
                    if (d._id == $scope.matches[j].deck._id) {
                        return 'true';
                    }
                }
                for (var i = 2; i < $scope.snapshot.tiers.length; i++) {
                    for (var j = 0; j < $scope.snapshot.tiers[i].decks.length; j++) {
                        if (d._id == $scope.snapshot.tiers[i].decks[j].deck._id) {
                            return true;
                        }
                    }
                }
                return false;
            }
            
            $scope.isSelected = function (d) {
                for (var j = 0; j < $scope.selectedDecks.length; j++) {
                    if (d._id == $scope.selectedDecks[j].deck._id) {
                        return true;
                    }
                }
                return false;
            }
            
            $scope.removeDeckPrompt = function (d) {
                var alertBox = bootbox.confirm("Are you sure you want to remove deck " + d.name + "? All the data for this deck will be lost!", function (result) {
                    if (result) {
                        $scope.$apply(function () {
                            $scope.removeDeck(d);
                        });
                    }
                });
            }
            
            $scope.removeDeck = function (d) {
                for (var i = 0; i < $scope.snapshot.tiers.length; i++) {
                    for (var k = 0; k < $scope.snapshot.tiers[i].decks.length; k++) {
                        if (d._id == $scope.snapshot.tiers[i].decks[k].deck._id) {
                            $scope.snapshot.tiers[i].decks.splice(k, 1);
                            k--;
                        }
                    }
                    removeMatch(d);
                }
                $scope.deckRanks();
            }
            
            function removeMatch(d) {
                for (var j = 0; j < $scope.snapshot.matches.length; j++) {
                    if (d._id == $scope.snapshot.matches[j].for._id || d._id == $scope.snapshot.matches[j].against._id) {
                        $scope.snapshot.matches.splice(j,1);
                        j--;
                    }
                }
                
                for (var l = 0; l < $scope.matches.length; l++) {
                    if (d._id == $scope.matches[l].deck._id) {
                        $scope.matches.splice(l,1);
                        l--;
                    }
                }
            }
            
            $scope.searchDecks = function (s) {
                $scope.search = s;
                getDecks(function (data) {
                    $scope.deckData = data.decks;
                });
            }
            
            //////////////////////////////////////////////////////////////////////
            
            $scope.addCard = function (c, t) {
                var tech = $scope.tech,
                    deck = $scope.deck,
                    tier = $scope.tier,
                    techCard = angular.copy(defaultTechCards);
                techCard.toss = t;
                techCard.card = c;
                
                
                for (var i = 0; i < $scope.snapshot.tiers.length; i++) {
                    for (var k = 0; k < $scope.snapshot.tiers[i].decks.length; k++) {
                        for (var j = 0; j < $scope.snapshot.tiers[i].decks[k].tech.length; j++) {
                            if (tech.orderNum == $scope.snapshot.tiers[i].decks[k].tech[j].orderNum) {
                                if (!$scope.isCard(c)) {
                                    techCard.orderNum = $scope.snapshot.tiers[i].decks[k].tech[j].cards.length;
                                    $scope.snapshot.tiers[i].decks[k].tech[j].cards.push(techCard);
                                } 
                            }
                        }
                    }
                }
            }
            
            $scope.isCard = function (c) {
                var tech = $scope.tech;
                if (tech) {
                    for (var i = 0; i < tech.cards.length; i++) {
                        if (c._id == tech.cards[i]._id) {
                            return true;
                        }
                    }
                    return false;
                }
            }
            
            $scope.addTech = function (d, t) {
                var deckTech = angular.copy(defaultDeckTech);
                var curNum = 0;
                
                for (var i = 0; i < $scope.snapshot.tiers.length; i++) {
                    for (var k = 0; k < $scope.snapshot.tiers[i].decks.length; k++) {
                        if (d.rank.current == $scope.snapshot.tiers[i].decks[k].rank.current) {
                            $scope.snapshot.tiers[i].decks[k].tech.push(deckTech);
                        }
                        for (var j = 0; j < $scope.snapshot.tiers[i].decks[k].tech.length; j++) {
                            $scope.snapshot.tiers[i].decks[k].tech[j].orderNum = ++curNum;
                        }
                    }
                }
            }
            
            $scope.removeTech = function (t) {
                for (var i = 0; i < $scope.snapshot.tiers.length; i++) {
                    for (var k = 0; k < $scope.snapshot.tiers[i].decks.length; k++) {
                        for (var j = 0; j < $scope.snapshot.tiers[i].decks[k].tech.length; j++) {
                            if (t.orderNum == $scope.snapshot.tiers[i].decks[k].tech[j].orderNum) {
                                $scope.snapshot.tiers[i].decks[k].tech.splice(j, 1);
                                return;
                            }
                        }
                    }
                }
            }
            
            $scope.removeTechCard = function (tech, c) {
                for (var card in tech.cards) {
                    if (c._id == tech.cards[card]._id) {
                        tech.cards.splice(card,1);
                        break;
                    }
                }
            }
            
            $scope.setBoth = function (c) {
                if (!c.both) {
                    c.both = true;
                } else {
                    c.both = false;
                }
            }
            
            
        $scope.trendsLength = 12;
        $scope.trends = function(num) {
            return new Array(num);
        }
        /* TIERS METHODS */
            
    
        $scope.loadLatest = function () {
            AdminSnapshotService.getLatest().then(function (data) {
                if (!data.success) {
                    $scope.errors = data.errors;
                    $scope.showError = true;
                } else {
                    $scope.loaded = true;
                    $scope.snapshot = data.snapshot;
                    $scope.snapshot.comments = [];
                    $scope.snapshot.snapNum++;
                    $scope.matches = [];
                    for (var i = 0; i < $scope.snapshot.tiers.length; i++) {
                        for (var k = 0; k < $scope.snapshot.tiers[i].decks.length; k++) {
                            if (i < 2) {
                                $scope.matches.push(data.snapshot.tiers[i].decks[k]);
                            }
                            $scope.snapshot.tiers[i].decks[k].rank.last.splice(0,0,data.snapshot.tiers[i].decks[k].rank.current);
                            if ($scope.snapshot.tiers[i].decks[k].rank.last.length > 12) {
                                $scope.snapshot.tiers[i].decks[k].rank.last.pop();
                            }
                        }
                    }
                    $scope.deckRanks();
                    $scope.setSlug();
                }
            });
        }
        
        
        $scope.addSnapshot = function () {
            $scope.showError = false;
            AdminSnapshotService.addSnapshot($scope.snapshot).success(function (data) {
                if (!data.success) {
                    $scope.errors = data.errors;
                    $scope.showError = true;
                    $window.scrollTo(0,0);
                } else {
                    AlertService.setSuccess({ show: true, msg: $scope.snapshot.title + ' has been added successfully.' });
                    $state.go('app.admin.snapshots.list');
                }
            });
        };
    }
])
.controller('AdminTeamListCtrl', ['$scope', 'data', 'AdminTeamService', 'AlertService',
    function ($scope, data, AdminTeamService, AlertService) {
        
        $scope.members = data.members;
        $scope.hsMembers = data.hsMembers;
        $scope.hotsMembers = data.hotsMembers;
        $scope.wowMembers = data.wowMembers;
        $scope.fifaMembers = data.fifaMembers;
        $scope.fgcMembers = data.fgcMembers;
        
        
        // grab alerts
        if (AlertService.hasAlert()) {
            $scope.success = AlertService.getSuccess();
            AlertService.reset();
        }
        
        $scope.updateDND = function (list, index) {
            list.splice(index, 1);
            for (var i = 0; i < list.length; i++) {
                list[i].orderNum = i + 1;
            }
            AdminTeamService.updateOrder(list);
        };
        
        // delete member
        $scope.deleteMember = function deleteMember(member, arr) {
            var box = bootbox.dialog({
                title: 'Delete member: ' + member.screenName + ' - ' + member.fullName + '?',
                message: 'Are you sure you want to delete the member <strong>' + member.screenName + ' - ' + member.fullName + '</strong>?',
                buttons: {
                    delete: {
                        label: 'Delete',
                        className: 'btn-danger',
                        callback: function () {
                            AdminTeamService.deleteMember(member._id).then(function (data) {
                                if (data.success) {
                                    var index = arr.indexOf(member);
                                    if (index !== -1) {
                                        arr.splice(index, 1);
                                    }
                                    $scope.success = {
                                        show: true,
                                        msg: member.screenName + ' - ' + member.fullName + ' deleted successfully.'
                                    };
                                }
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
                }
            });
            box.modal('show');
        }
    }
])
.controller('TeamCtrl', ['$scope', '$compile', '$timeout', '$location', '$anchorScroll', '$sce', 'data',
    function ($scope, $compile, $timeout, $location, $anchorScroll, $sce, data) {
        $scope.members = data.members;
        
        $scope.hsMembers = data.hsMembers;
        $scope.hotsMembers = data.hotsMembers;
        $scope.wowMembers = data.wowMembers;
        $scope.fgcMembers = data.fgcMembers;
        $scope.fifaMembers = data.fifaMembers;
        
        if ($location.hash()) {
            $timeout(function () {
                $anchorScroll();
            });
        }
        
        for(var i = 0; i < $scope.members.length; i++) {
            $scope.members[i].description = $scope.members[i].description.replace(/(?:\r\n|\r|\n)/g, '<br />');
        }
        
        $scope.openLink = function ($event, link) {
            $event.stopPropagation();
            window.open(link, '_blank');
        }
        
        $scope.getTitle = function (i) {
            for (var j = 0; j < i.length && i[j] != "-"; j++) {}
            i = i.slice(0,j);
            return i;
        }
        
        $scope.getDescription = function (i) {
            var temp = i,
                magicNumber = 180;
            
            if(i.length > magicNumber) {
                if (i[magicNumber] != " ") {
                    for (var j = 0; i[magicNumber+j] != " "; j++) {} 
                    i = temp.slice(0,magicNumber+j);
                } else {
                    i = temp.slice(0,magicNumber);
                }
                i = i + "...";
            }
            return $sce.trustAsHtml(i);
        }
        
        $scope.showMember = function (member) {
            $scope.member = member;
            
            var box = bootbox.dialog({
                title: member.screenName,
                className: 'member-modal',
                message: $compile('<button type="button" class="bootbox-close-button close" data-dismiss="modal" aria-hidden="true">×</button><img class="responsive" src="{{app.cdn}}team/{{member.photo}}" /><div class="wrapper-md content-wrapper "><h1 class="m-b-xs">{{member.screenName}}</h1><span class="btn-team-wrapper-modal"><a href="#" target="_blank" ng-click="openLink($event, \'https://twitter.com/\' + member.social.twitter)" ng-if="member.social.twitter" class="m-r-xs btn-team"><div class="btn-team-inner"><i class="fa fa-twitter"></i></div></a><a href="#" target="_blank" ng-click="openLink($event, \'https://twitch.tv/\' + member.social.twitch)" ng-if="member.social.twitch" class="m-r-xs btn-team"><div class="btn-team-inner"><i class="fa fa-twitch"></i></div></a><a href="#" target="_blank" ng-click="openLink($event, \'https://youtube.com/\' + member.social.youtube)" ng-if="member.social.youtube" class="m-r-xs btn-team"><div class="btn-team-inner"><i class="fa fa-youtube"></i></div></a><a href="#" target="_blank" ng-click="openLink($event, \'https://facebook.com/\' + member.social.facebook)" ng-if="member.social.facebook" class="m-r-xs btn-team"><div class="btn-team-inner"><i class="fa fa-facebook"></i></div></a><a href="#" target="_blank" ng-click="openLink($event, \'https://instagram.com/\' + member.social.instagram)" ng-if="member.social.instagram" class="m-r-xs btn-team"><div class="btn-team-inner"><i class="fa fa-instagram"></i></div></a></span><h3>{{member.fullName}}</h3><p>{{member.description}}</p></div>')($scope)
            });
        }
        
//        for (var i = 0; i < $scope.members.length; i++) {
//            var str = $scope.members[i].description;
//            str.replace(/(?:\r\n|\r|\n)/g, '<br />');
//            $scope.members[i].description = str;
//        }
    }
])
.controller('AdminTeamAddCtrl', ['$scope', '$state', '$window', '$upload', '$compile', 'AdminTeamService', 'AlertService',
    function ($scope, $state, $window, $upload, $compile, AdminTeamService, AlertService) {
    
        var defaultMember = {
            game: '',
            screenName: '',
            fullName: '',
            description: '',
            social: {
                twitter: '',
                twitch: '',
                youtube: '',
                facebook: '',
                instagram: '',
                esea: ''
            },
            photo: '',
            active: true
        }
        
        $scope.member = angular.copy(defaultMember);
        
        // photo upload
        $scope.photoUpload = function ($files) {
            if (!$files.length) return false;
            var box = bootbox.dialog({
                message: $compile('<div class="progress progress-striped active" style="margin-bottom: 0px;"><div class="progress-bar" role="progressbar" aria-valuenow="{{uploading}}" aria-valuemin="0" aria-valuemax="100" style="width: {{uploading}}%;"><span class="sr-only">{{uploading}}% Complete</span></div></div>')($scope),
                closeButton: false,
                animate: false
            });
            $scope.uploading = 0;
            box.modal('show');
            for (var i = 0; i < $files.length; i++) {
                var file = $files[i];
                $scope.upload = $upload.upload({
                    url: '/api/admin/upload/team',
                    method: 'POST',
                    file: file
                }).progress(function(evt) {
                    $scope.uploading = parseInt(100.0 * evt.loaded / evt.total);
                }).success(function(data, status, headers, config) {
                    $scope.member.photo = data.photo;
                    $scope.cardImg = $scope.app.cdn + data.path + data.photo;
                    box.modal('hide');
                });
            }
        };
        
        $scope.getImage = function () {
            $scope.imgPath = '/team/';
            if (!$scope.member) { return '/img/blank.png'; }
            return ($scope.member.photo && $scope.member.photo === '') ?  $scope.app.cdn + '/img/blank.png' : $scope.app.cdn + $scope.imgPath + $scope.member.photo;
        };
        
        // save member
        $scope.saveMember = function () {
            AdminTeamService.addMember($scope.member).then(function (data) {
                if (!data.success) {
                    $scope.errors = data.errors;
                    $scope.showError = true;
                    $window.scrollTo(0,0);
                } else {
                    AlertService.setSuccess({ show: true, msg: $scope.member.screenName + ' - ' + $scope.member.fullName + ' has been added successfully.' });
                    $state.go('app.admin.teams.list');
                }
            });
        };
    }
])
.controller('AdminTeamEditCtrl', ['$scope', '$state', '$window', '$compile', '$upload', 'data', 'AdminTeamService', 'AlertService',
    function ($scope, $state, $window, $compile, $upload, data, AdminTeamService, AlertService) {
        
        $scope.member = data.member;
        
        // photo upload
        $scope.photoUpload = function ($files) {
            if (!$files.length) return false;
            var box = bootbox.dialog({
                message: $compile('<div class="progress progress-striped active" style="margin-bottom: 0px;"><div class="progress-bar" role="progressbar" aria-valuenow="{{uploading}}" aria-valuemin="0" aria-valuemax="100" style="width: {{uploading}}%;"><span class="sr-only">{{uploading}}% Complete</span></div></div>')($scope),
                closeButton: false,
                animate: false
            });
            $scope.uploading = 0;
            box.modal('show');
            for (var i = 0; i < $files.length; i++) {
                var file = $files[i];
                $scope.upload = $upload.upload({
                    url: '/api/admin/upload/team',
                    method: 'POST',
                    file: file
                }).progress(function(evt) {
                    $scope.uploading = parseInt(100.0 * evt.loaded / evt.total);
                }).success(function(data, status, headers, config) {
                    $scope.member.photo = data.photo;
                    $scope.cardImg = $scope.app.cdn + data.path + data.photo;
                    box.modal('hide');
                });
            }
        };
        
        $scope.getImage = function () {
            $scope.imgPath = '/team/';
            if (!$scope.team) { return '/img/blank.png'; }
            return ($scope.snapshot.photo && $scope.snapshot.photo === '') ?  $scope.app.cdn + '/img/blank.png' : $scope.app.cdn + $scope.imgPath + $scope.snapshot.photo;
        };
        
        // save member
        $scope.saveMember = function () {
            AdminTeamService.editMember($scope.member).then(function (data) {
                if (!data.success) {
                    $scope.errors = data.errors;
                    $scope.showError = true;
                    $window.scrollTo(0,0);
                } else {
                    AlertService.setSuccess({ show: true, msg: $scope.member.screenName + ' - ' + $scope.member.fullName + ' has been added successfully.' });
                    $state.go('app.admin.teams.list');
                }
            });
        };
    }
])
.controller('AdminVodListCtrl', ['$scope', 'data', 'AdminVodService',
    function ($scope, data, AdminVodService) {
        $scope.vods = data.vods;
        
        $scope.getDate = function (d) {
            d = new Date(d);
            return d;
        }
        
        $scope.convertMonth = function (d) {
            switch (d) {
                case 0 : return "January"; break;
                case 1 : return "February"; break;
                case 2 : return "March"; break;
                case 3 : return "April"; break;
                case 4 : return "May"; break;
                case 5 : return "June"; break;
                case 6 : return "July"; break;
                case 7 : return "August"; break;
                case 8 : return "September"; break;
                case 9 : return "October"; break;
                case 10 : return "November"; break;
                case 11 : return "December"; break;
            }
        }
        
        // delete deck
        $scope.deleteVod = function deleteVos(vod) {
            var box = bootbox.dialog({
                title: 'Delete VOD: ' + vod.date + '?',
                message: 'Are you sure you want to delete the VOD <strong>' + vod.date + '</strong>?',
                buttons: {
                    delete: {
                        label: 'Delete',
                        className: 'btn-danger',
                        callback: function () {
                            AdminVodService.vodRemove(vod._id).then(function (data) {
                                if (data.success) {
                                    var index = $scope.vods.indexOf(vod);
                                    if (index !== -1) {
                                        $scope.vods.splice(index, 1);
                                    }
                                    $scope.success = {
                                        show: true,
                                        msg: vod.date + ' deleted successfully.'
                                    };
                                }
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
                }
            });
            box.modal('show');
        }
    }
])
.controller('AdminVodAddCtrl', ['$scope', '$window', '$state', 'AdminVodService', 'AlertService',
    function ($scope, $window, $state, AdminVodService, AlertService) {
        
        var defaultVod = {
                date: {},
                url: '',
                subTitle: '',
                vars: {
                    list: ''
                }
            };
        
        $scope.isPlaylist = true;
        $scope.vod = angular.copy(defaultVod);
        
        // save VOD
        $scope.saveVod = function () {
            AdminVodService.vodAdd($scope.vod).then(function (data) {
                if (!data.success) {
                    $scope.errors = data.errors;
                    $scope.showError = true;
                } else {
                    AlertService.setSuccess({ show: true, msg: 'Video of the Day has been added successfully.' });
                    $scope.showSuccess = true;
                    $scope.vod = angular.copy(defaultVod);
                    $scope.playlist = {
                        vars: {
                            list: ''
                        }
                    }
                    $state.go('app.admin.vod.add');
                }
                $window.scrollTo(0,0);
            });
        };
        
    }
])
.controller('AdminVodEditCtrl', ['$scope', '$state', '$window', 'data', 'AdminVodService', 'AlertService',
    function ($scope, $state, $window, data, AdminVodService, AlertService) {
        data.vod.date = Date.parse(data.vod.date);
        $scope.vod = data.vod;
        $scope.isPlaylist = ($scope.vod.url != "") ? false : true;
        
        // save VOD
        $scope.saveVod = function () {
            AdminVodService.vodEdit($scope.vod).then(function (data) {
                if (!data.success) {
                    $scope.errors = data.errors;
                    $scope.showError = true;
                } else {
                    AlertService.setSuccess({ show: true, msg: 'Video of the Day has been edited successfully.' });
                    $scope.showSuccess = true;
                    $state.go('app.admin.vod.add');
                }
                $window.scrollTo(0,0);
            });
        };
    }
])
.controller('AdminDeckListCtrl', ['$scope', 'AdminDeckService', 'AlertService', 'Pagination', 'data', 
    function ($scope, AdminDeckService, AlertService, Pagination, data) {
        // grab alerts
        if (AlertService.hasAlert()) {
            $scope.success = AlertService.getSuccess();
            AlertService.reset();
        }
        
        // load decks
        $scope.decks = data.decks;
        $scope.page = data.page;
        $scope.perpage = data.perpage;
        $scope.total = data.total;
        $scope.search = data.search;
        
        $scope.getDecks = function () {
            AdminDeckService.getDecks($scope.page, $scope.perpage, $scope.search).then(function (data) {
                $scope.decks = data.decks;
                $scope.page = data.page;
                $scope.total = data.total;
            });
        }
        
        $scope.searchDecks = function () {
            $scope.page = 1;
            $scope.getDecks();
        }
        
        // pagination
        $scope.pagination = {
            page: function () {
                return $scope.page;
            },
            perpage: function () {
                return $scope.perpage;
            },
            results: function () {
                return $scope.total;
            },
            setPage: function (page) {
                $scope.page = page;
                $scope.getDecks();
            },
            pagesArray: function () {
                var pages = [],
                    start = 1,
                    end = this.totalPages();
                
                if (this.totalPages() > 5) {
                    if (this.page() < 3) {
                        start = 1;
                        end = start + 4;
                    } else if (this.page() > this.totalPages() - 2) {
                        end = this.totalPages();
                        start = end - 4;
                    } else {
                        start = this.page() - 2;
                        end = this.page() + 2;
                    }
                    
                }
                
                for (var i = start; i <= end; i++) {
                    pages.push(i);
                }
                
                return pages;
            },
            isPage: function (page) {
                return (page === this.page());
            },
            totalPages: function (page) {
                return (this.results() > 0) ? Math.ceil(this.results() / this.perpage()) : 0;
            },
            from: function () {
                return (this.page() * this.perpage()) - this.perpage() + 1;
            },
            to: function () {
                return ((this.page() * this.perpage()) > this.results()) ? this.results() : this.page() * this.perpage();
            }
        };
        
        // delete deck
        $scope.deleteDeck = function deleteDeck(deck) {
            var box = bootbox.dialog({
                title: 'Delete deck: ' + deck.name + '?',
                message: 'Are you sure you want to delete the deck <strong>' + deck.name + '</strong>?',
                buttons: {
                    delete: {
                        label: 'Delete',
                        className: 'btn-danger',
                        callback: function () {
                            AdminDeckService.deleteDeck(deck._id).then(function (data) {
                                if (data.success) {
                                    var index = $scope.decks.indexOf(deck);
                                    if (index !== -1) {
                                        $scope.decks.splice(index, 1);
                                    }
                                    $scope.success = {
                                        show: true,
                                        msg: deck.name + ' deleted successfully.'
                                    };
                                }
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
                }
            });
            box.modal('show');
        }
    }
])
.controller('AdminDeckBuilderClassCtrl', ['$scope', function ($scope) {
    if ($scope.app.settings.secondaryPortrait == undefined || $scope.app.settings.secondaryPortrait.length == 0) {
        $scope.app.settings.secondaryPortrait = [0,0,0,0,0,0,0,0,0];
    }
    var portraitSettings = $scope.app.settings.secondaryPortrait;

    $scope.heroNames = Hearthstone.heroNames;
    $scope.klass = false;
    $scope.heroes = [
        { class: 'druid', hasSecondary: Hearthstone.heroNames.Druid.length > 1, secondary: portraitSettings[0] },
        { class: 'hunter', hasSecondary: Hearthstone.heroNames.Hunter.length > 1, secondary: portraitSettings[1] },
        { class: 'mage', hasSecondary: Hearthstone.heroNames.Mage.length > 1, secondary: portraitSettings[2] },
        { class: 'paladin', hasSecondary: Hearthstone.heroNames.Paladin.length > 1, secondary: portraitSettings[3] },
        { class: 'priest', hasSecondary: Hearthstone.heroNames.Priest.length > 1, secondary: portraitSettings[4] },
        { class: 'rogue', hasSecondary: Hearthstone.heroNames.Rogue.length > 1, secondary: portraitSettings[5] },
        { class: 'shaman', hasSecondary: Hearthstone.heroNames.Shaman.length > 1, secondary: portraitSettings[6] },
        { class: 'warlock', hasSecondary: Hearthstone.heroNames.Warlock.length > 1, secondary: portraitSettings[7] },
        { class: 'warrior', hasSecondary: Hearthstone.heroNames.Warrior.length > 1, secondary: portraitSettings[8] }
    ];
    
    //return the upper case name of the hero based on index
    function getClass (index) {
        return $scope.heroes[index].class[0].toUpperCase() + $scope.heroes[index].class.slice(1);
    }
     
    //increment the hero name selector and if at the end of hero name list, return 0
    function calc (index) {
        if(portraitSettings[index] == (Hearthstone.heroNames[getClass(index)].length - 1)) {
            return 0;
        } else {
            return ++portraitSettings[index];
        }
    }
    
    //get the hero name based on the index of portraitSettings' index
    $scope.getName = function (index, caps) {
        if (caps) {
            return Hearthstone.heroNames[getClass(index)][portraitSettings[index]];
        } else {
            var name = Hearthstone.heroNames[getClass(index)][portraitSettings[index]]
            return name[0].toLowerCase() + name.slice(1);
        }
    }
    
    //update the hero selection on button press
    $scope.updateHero = function (index) {
        var numb = calc(index);
        portraitSettings[index] = numb;
        $scope.app.settings.secondaryPortrait[index] = numb;
    }

    //
    for (var i = 0; i < $scope.app.settings.secondaryPortrait.length; i++) {
        if ($scope.getName(i, true) == undefined || $scope.getName(i, true) == '') {
            $scope.app.settings.secondaryPortrait[i] = 0;
            portraitSettings[i] = 0;
        }
    }
}])
.controller('AdminDeckAddCtrl', ['$state', '$scope', '$compile', '$q', '$timeout', '$window', 'AjaxPagination', 'Hearthstone', 'DeckBuilder', 'ImgurService', 'AlertService', 'AdminDeckService', 'data', 
    function ($state, $scope, $compile, $q, $timeout, $window, AjaxPagination, Hearthstone, DeckBuilder, ImgurService, AlertService, AdminDeckService, data) {
        // redirect back to class pick if no data
        if (!data || !data.success) { $state.transitionTo('app.hs.deckBuilder.class'); return false; }
        
        // set default tab page
        $scope.step = 1;
        $scope.showManaCurve = false;
        $scope.classes = angular.copy(Hearthstone.classes).splice(1, 9);
        
        $scope.getDust = function (cards) {
            var dust = 0;
            for (var i = 0; i < cards.length; i++) {
                dust += (cards[i].qty < 2) ? cards[i].dust : (cards[i].dust*2);
            }
            return dust
        }
        
        $scope.isSecondary = function (klass) {
            switch(klass) {
                case 'druid': return $scope.app.settings.secondaryPortrait[0]; break;
                case 'hunter': return $scope.app.settings.secondaryPortrait[1]; break;
                case 'mage': return $scope.app.settings.secondaryPortrait[2]; break;
                case 'paladin': return $scope.app.settings.secondaryPortrait[3]; break;
                case 'priest': return $scope.app.settings.secondaryPortrait[4]; break;
                case 'rogue': return $scope.app.settings.secondaryPortrait[5]; break;
                case 'shaman': return $scope.app.settings.secondaryPortrait[6]; break;
                case 'warlock': return $scope.app.settings.secondaryPortrait[7]; break;
                case 'warrior': return $scope.app.settings.secondaryPortrait[8]; break;
            }
        }
        
        $scope.getName = function () {
            return Hearthstone.heroNames[$scope.deck.playerClass][$scope.isSecondary($scope.deck.playerClass.toLowerCase())];
        }
        
        // steps
        $scope.stepDesc = {
            1: 'Select the cards for your deck.',
            2: 'Select which cards to mulligan for.',
            3: 'Provide a description for how to play your deck.',
            4: 'Select how your deck preforms against other classes.',
            5: 'Provide a synopsis and title for your deck.'            
        };
        
        $scope.type = 1;
        $scope.basic = false;
        
        $scope.prevStep = function () {
            if ($scope.step > 1) $scope.step = $scope.step - 1;
        }
        $scope.nextStep = function () {
            if ($scope.step < 5) $scope.step = $scope.step + 1;
        }
        
        // summernote options
        $scope.options = {
          disableDragAndDrop: true,
          height: 100,
          toolbar: [
            ['style', ['style']],
            ['style', ['bold', 'italic', 'underline', 'strikethrough', 'clear']],
            ['color', ['color']],
            ['para', ['ul', 'ol', 'paragraph']],
            ['table', ['table']],
            ['insert', ['link', 'picture', 'video']],
            ['format', ['hr']],
            ['misc', ['undo', 'redo']]
          ]
        };

        // load cards
        var classCards = true;
        
        $scope.isClassCards = function () {
            return classCards;
        }
        
        $scope.className = data.className;
        $scope.cards = data.cards;
        $scope.cards.current = $scope.cards.class;
        
        $scope.search = function() {
            updateCards(1, 15, $scope.filters.search, $scope.filters.mechanics, $scope.filters.mana);
        }
        
        function updateCards (page, perpage, search, mechanics, mana, callback) {
            $scope.fetching = true;
            DeckBuilder.loadCards(page, perpage, search, mechanics, mana, $scope.className.toLowerCase()).then(function (data) {
                $scope.classPagination.total = ($scope.isClassCards()) ? data.classTotal : data.neutralTotal;
                $scope.classPagination.page = page;
                $scope.neutralPagination.total = ($scope.isClassCards()) ? data.classTotal : data.neutralTotal;
                $scope.neutralPagination.page = page;
                $timeout(function () {
                    $scope.cards.current = ($scope.isClassCards()) ? data.cards.class : data.cards.neutral;
                    $scope.fetching = false;
                    if (callback) {
                        return callback(data);
                    }
                });
            });
        }
        
        // page flipping
        $scope.classPagination = AjaxPagination.new(15, data.classTotal,
            function (page, perpage) {
                var d = $q.defer();

                updateCards(page, perpage, $scope.filters.search, $scope.filters.mechanics, $scope.filters.mana, function (data) {
                    d.resolve(data.classTotal);
                });

                return d.promise;
            }
        );
        
        $scope.neutralPagination = AjaxPagination.new(15, data.neutralTotal,
            function (page, perpage) {
                var d = $q.defer();
                updateCards(page, perpage, $scope.filters.search, $scope.filters.mechanics, $scope.filters.mana, function (data) {
                    d.resolve(data.neutralTotal);
                });
                return d.promise;
            }
        );
        
        // filters
        $scope.filters = {
            search: '',
            mechanics: [],
            mana: 'all'
        };
        
        $scope.setClassCards = function (b) {
            classCards = b;
            updateCards(1, 15, $scope.filters.search, $scope.filters.mechanics, $scope.filters.mana);
        }
        
        $scope.mechanics = Hearthstone.mechanics;
        $scope.inMechanics = function (mechanic) {
            return ($scope.filters.mechanics.indexOf(mechanic) >= 0);
        }
        $scope.toggleMechanic = function (mechanic) {
            updateCards(1,15,$scope.filters.search, $scope.filters.mechanics, $scope.filters.mana);
            var index = $scope.filters.mechanics.indexOf(mechanic);
            if (index === -1) {
                $scope.filters.mechanics.push(mechanic);
            } else {
                $scope.filters.mechanics.splice(index, 1);
            }
        }
        
        // filter by mechanics
        $scope.filters.byMechanics = function () {
            return function (item) {
                if (!$scope.filters.mechanics.length) { return true; }
                var matched = 0;
                for (var i = 0; i < item['mechanics'].length; i++) {
                    if ($scope.inMechanics(item['mechanics'][i])) matched++;
                }
                return (matched === $scope.filters.mechanics.length);
            }
        }
        
        // filter by mana
        $scope.doFilterByMana = function (m) {
            $scope.filters.mana = m;
            updateCards(1, 15, $scope.filters.search, $scope.filters.mechanics, $scope.filters.mana)
        }
        
        $scope.filters.byMana = function () {
            return function (item) {
                switch ($scope.filters.mana) {
                    case 'all':
                        return true;
                    case 0:
                    case 1:
                    case 2:
                    case 3:
                    case 4:
                    case 5:
                    case 6:
                        return (item['cost'] === $scope.filters.mana);
                    case '7+':
                        return (item['cost'] >= 7);
                }
            }
        };
        
        $scope.getManaCost = function () {
            switch ($scope.filters.mana) {
                case 'all':
                    return 'All';
                case 0:
                case 1:
                case 2:
                case 3:
                case 4:
                case 5:
                case 6:
                case '7+':
                    return $scope.filters.mana;
            }
        }
        
        // deck
        $scope.deckTypes = Hearthstone.deckTypes;
        
        //$scope.deck = DeckBuilder.new(data.className);
        $scope.deck = ($scope.app.settings.deck && $scope.app.settings.deck !== null && data.className === $scope.app.settings.deck.playerClass) ? DeckBuilder.new(data.className, $scope.app.settings.deck) : DeckBuilder.new(data.className);
        $scope.$watch('deck', function(){
            $scope.app.settings.deck = {
                name: $scope.deck.name,
                deckType: $scope.deck.deckType,
                description: $scope.deck.description,
                chapters: $scope.deck.chapters,
                cards: $scope.deck.cards,
                matches: $scope.deck.matches,
                playerClass: $scope.deck.playerClass,
                type: $scope.deck.type,
                basic: $scope.deck.basic,
                mulligans: $scope.deck.mulligans,
                video: $scope.deck.video,
                public: $scope.deck.public
            };
        }, true);
        
        // current mulligan
        $scope.currentMulligan = $scope.deck.getMulligan($scope.classes[2]);
        
        $scope.setMulligan = function (mulligan) {
            $scope.currentMulligan = mulligan;
        };
        
        $scope.isMulliganSet = function (mulligan) {
            return (mulligan.withCoin.cards.length || mulligan.withCoin.instructions.length || mulligan.withoutCoin.cards.length || mulligan.withoutCoin.instructions.length);
        };
        
        //chapters
        var defaultChapter = {
            title: '',
            content: ''
        };
        
        $scope.deck.chapters = [
            defaultChapter
        ]
        
        $scope.newChapter = function () {
            var m = angular.copy(defaultChapter);
            $scope.deck.chapters.push(m);
        }
        
        $scope.removeChapter = function (index) {
            $scope.deck.chapters.splice(index,1);
        }
        
        //match-ups
        var defaultMatchUp = {
            deckName: '',
            klass: '',
            match: 0
        };
        
        $scope.deck.matches = [];
        
        $scope.newMatch = function (klass) {
            var m = angular.copy(defaultMatchUp);
            m.klass = klass;
            $scope.deck.matches.push(m);
        }
        
        $scope.removeMatch = function (index) {
            $scope.deck.matches.splice(index,1);
        }
        
        // premium
        $scope.premiumTypes = [
            { text: 'No', value: false },
            { text: 'Yes', value: true }
        ];
        
        $scope.isPremium = function () {
            var premium = $scope.deck.premium.isPremium;
            for (var i = 0; i < $scope.premiumTypes.length; i++) {
                if ($scope.premiumTypes[i].value === premium) {
                    return $scope.premiumTypes[i].text;
                }
            }
        }
        
        $scope.getMulliganCards = function (coin) {
            if (!$scope.currentMulligan) { return false; }
            var m = $scope.currentMulligan;
            return (coin) ? m.withCoin.cards : m.withoutCoin.cards;
        };
        
        $scope.cardLeft = function ($index, coin) {
            return (80 / ($scope.getMulliganCards(coin).length)) * $index;
        };
        
        // featured
        $scope.featuredTypes = [
            { text: 'No', value: false },
            { text: 'Yes', value: true }
        ];
        
        $scope.isFeatured = function () {
            var featured = $scope.deck.featured;
            for (var i = 0; i < $scope.featuredTypes.length; i++) {
                if ($scope.featuredTypes[i].value === featured) {
                    return $scope.featuredTypes[i].text;
                }
            }
        }
        
        // save deck
        var box;
        $scope.saveDeck = function () {
            if (!$scope.deck.validDeck() || !$scope.deck.validVideo()) { return false; }
            if (!$scope.app.user.isLogged()) {
                LoginModalService.showModal('login');
            } else {
                $scope.deck.heroName = $scope.getName();
                DeckBuilder.saveDeck($scope.deck).success(function (data) {
                    if (data.success) {
                        $scope.app.settings.deck = null;
                        $state.transitionTo('app.hs.decks.deck', { slug: data.slug });
                    } else {
                        $scope.errors = data.errors;
                        $scope.showError = true;
                        $window.scrollTo(0,0);
                    }
                });
            }
        };
    }
])
.controller('AdminDeckEditCtrl', ['$state', '$q', '$scope', '$compile', '$timeout', '$window', 'AjaxPagination', 'Hearthstone', 'DeckBuilder', 'ImgurService', 'AlertService', 'AdminDeckService', 'data', 
    function ($state, $q, $scope, $compile, $timeout, $window, AjaxPagination, Hearthstone, DeckBuilder, ImgurService, AlertService, AdminDeckService, data) {
          // redirect back to class pick if no data
        if (!data || !data.success) { $state.transitionTo('app.hs.deckBuilder.class'); return false; }
        
        // set default tab page
        $scope.step = 1;
        $scope.showManaCurve = false;
        $scope.classes = angular.copy(Hearthstone.classes).splice(1, 9);
        
        // steps
        $scope.stepDesc = {
            1: 'Select the cards for your deck.',
            2: 'Select which cards to mulligan for.',
            3: 'Provide a description for how to play your deck.',
            4: 'Select how your deck preforms against other classes.',
            5: 'Provide a synopsis and title for your deck.'            
        };
        
        $scope.isSecondary = function (klass) {
            switch(klass) {
                case 'druid': return $scope.app.settings.secondaryPortrait[0]; break;
                case 'hunter': return $scope.app.settings.secondaryPortrait[1]; break;
                case 'mage': return $scope.app.settings.secondaryPortrait[2]; break;
                case 'paladin': return $scope.app.settings.secondaryPortrait[3]; break;
                case 'priest': return $scope.app.settings.secondaryPortrait[4]; break;
                case 'rogue': return $scope.app.settings.secondaryPortrait[5]; break;
                case 'shaman': return $scope.app.settings.secondaryPortrait[6]; break;
                case 'warlock': return $scope.app.settings.secondaryPortrait[7]; break;
                case 'warrior': return $scope.app.settings.secondaryPortrait[8]; break;
            }
        }
        
        console.log(data);
        
        $scope.getDust = function (cards) {
            var dust = 0;
            for (var i = 0; i < cards.length; i++) {
                dust += cards[i].dust * cards[i].qty;
            }
            return dust
        }
        
        $scope.prevStep = function () {
            if ($scope.step > 1) $scope.step = $scope.step - 1;
        }
        $scope.nextStep = function () {
            if ($scope.step < 5) $scope.step = $scope.step + 1;
        }
        
        // summernote options
        $scope.options = {
          disableDragAndDrop: true,
          height: 100,
          toolbar: [
            ['style', ['style']],
            ['style', ['bold', 'italic', 'underline', 'strikethrough', 'clear']],
            ['color', ['color']],
            ['para', ['ul', 'ol', 'paragraph']],
            ['table', ['table']],
            ['insert', ['link', 'picture', 'video']],
            ['format', ['hr']],
            ['misc', ['undo', 'redo']]
          ]
        };

        // load cards
        var classCards = true;
        
        $scope.isClassCards = function () {
            return classCards;
        }
        
        $scope.setClassCards = function (b) {
            updateCards(1, 15, $scope.filters.search, $scope.filters.mechanics, $scope.filters.mana);
            $timeout(function () {
                classCards = b;
            });
        }
        
        $scope.className = data.deck.playerClass;
        $scope.cards = {};
//        $scope.cards.current = $scope.cards.class;
        
        $scope.search = function() {
            updateCards(1, 15, $scope.filters.search, $scope.filters.mechanics, $scope.filters.mana);
        }
        
        function updateCards (page, perpage, search, mechanics, mana, callback) {
            DeckBuilder.loadCards(page, perpage, search, mechanics, mana, $scope.className.toLowerCase()).then(function (data) {
                $scope.classPagination.total = ($scope.isClassCards()) ? data.classTotal : data.neutralTotal;
                $scope.classPagination.page = page;
                $scope.neutralPagination.total = ($scope.isClassCards()) ? data.classTotal : data.neutralTotal;
                $scope.neutralPagination.page = page;
                $timeout(function () {
                    $scope.cards.current = ($scope.isClassCards()) ? data.cards.class : data.cards.neutral;

                    if (callback) {
                        return callback(data);
                    }
                });
            });
        }
        
        // page flipping
        $scope.classPagination = AjaxPagination.new(15, data.classTotal,
            function (page, perpage) {
                var d = $q.defer();

                updateCards(page, perpage, $scope.filters.search, $scope.filters.mechanics, $scope.filters.mana, function (data) {
                    d.resolve(data.classTotal);
                });

                return d.promise;
            }
        );
        
        $scope.neutralPagination = AjaxPagination.new(15, data.neutralTotal,
            function (page, perpage) {
                var d = $q.defer();

                updateCards(page, perpage, $scope.filters.search, $scope.filters.mechanics, $scope.filters.mana, function (data) {
                    d.resolve(data.neutralTotal);
                });
                return d.promise;
            }
        );
        
        // filters
        $scope.filters = {
            search: '',
            mechanics: [],
            mana: 'all'
        };
        
        $scope.mechanics = Hearthstone.mechanics;
        $scope.inMechanics = function (mechanic) {
            return ($scope.filters.mechanics.indexOf(mechanic) >= 0);
        }
        $scope.toggleMechanic = function (mechanic) {
            updateCards(1,15,$scope.filters.search, $scope.filters.mechanics, $scope.filters.mana);
            var index = $scope.filters.mechanics.indexOf(mechanic);
            if (index === -1) {
                $scope.filters.mechanics.push(mechanic);
            } else {
                $scope.filters.mechanics.splice(index, 1);
            }
        }
        
        // filter by mechanics
        $scope.filters.byMechanics = function () {
            return function (item) {
                if (!$scope.filters.mechanics.length) { return true; }
                var matched = 0;
                for (var i = 0; i < item['mechanics'].length; i++) {
                    if ($scope.inMechanics(item['mechanics'][i])) matched++;
                }
                return (matched === $scope.filters.mechanics.length);
            }
        }
        
        // filter by mana
        $scope.doFilterByMana = function (m) {
            $scope.filters.mana = m;
            updateCards(1, 15, $scope.filters.search, $scope.filters.mechanics, $scope.filters.mana)
        }
        
        $scope.filters.byMana = function () {
            return function (item) {
                switch ($scope.filters.mana) {
                    case 'all':
                        return true;
                    case 0:
                    case 1:
                    case 2:
                    case 3:
                    case 4:
                    case 5:
                    case 6:
                        return (item['cost'] === $scope.filters.mana);
                    case '7+':
                        return (item['cost'] >= 7);
                }
            }
        };
        
        $scope.getManaCost = function () {
            switch ($scope.filters.mana) {
                case 'all':
                    return 'All';
                case 0:
                case 1:
                case 2:
                case 3:
                case 4:
                case 5:
                case 6:
                case '7+':
                    return $scope.filters.mana;
            }
        }
        
        // deck
        $scope.deckTypes = Hearthstone.deckTypes;
        $scope.deck = DeckBuilder.new(data.deck.className, data.deck);
        
        // current mulligan
        $scope.currentMulligan = $scope.deck.getMulligan($scope.classes[2]);
        
        $scope.setMulligan = function (mulligan) {
            $scope.currentMulligan = mulligan;
        };
        
        $scope.isMulliganSet = function (mulligan) {
            return (mulligan.withCoin.cards.length || mulligan.withCoin.instructions.length || mulligan.withoutCoin.cards.length || mulligan.withoutCoin.instructions.length);
        };
        
        //chapters
        var defaultChapter = {
            title: '',
            content: ''
        };
        
        $scope.newChapter = function () {
            var m = angular.copy(defaultChapter);
            $scope.deck.chapters.push(m);
        }
        
        $scope.removeChapter = function (index) {
            $scope.deck.chapters.splice(index,1);
        }
        
        //match-ups
        var defaultMatchUp = {
            deckName: '',
            klass: '',
            match: 0
        };
        
        $scope.newMatch = function (klass) {
            var m = angular.copy(defaultMatchUp);
            m.klass = klass;
            $scope.deck.matches.push(m);
        }
        
        $scope.removeMatch = function (index) {
            $scope.deck.matches.splice(index,1);
        }
        
        // premium
        $scope.premiumTypes = [
            { text: 'No', value: false },
            { text: 'Yes', value: true }
        ];
        
        $scope.isPremium = function () {
            var premium = $scope.deck.premium.isPremium;
            for (var i = 0; i < $scope.premiumTypes.length; i++) {
                if ($scope.premiumTypes[i].value === premium) {
                    return $scope.premiumTypes[i].text;
                }
            }
        }
        
        $scope.getMulliganCards = function (coin) {
            if (!$scope.currentMulligan) { return false; }
            var m = $scope.currentMulligan;
            return (coin) ? m.withCoin.cards : m.withoutCoin.cards;
        };
        
        $scope.cardLeft = function ($index, coin) {
            return (80 / ($scope.getMulliganCards(coin).length)) * $index;
        };
        
        // featured
        $scope.featuredTypes = [
            { text: 'No', value: false },
            { text: 'Yes', value: true }
        ];
        
        $scope.isFeatured = function () {
            var featured = $scope.deck.featured;
            for (var i = 0; i < $scope.featuredTypes.length; i++) {
                if ($scope.featuredTypes[i].value === featured) {
                    return $scope.featuredTypes[i].text;
                }
            }
        }
        
        updateCards(1, 15, $scope.filters.search, $scope.filters.mechanics, $scope.filters.mana);
        
        // save deck
        $scope.updateDeck = function () {
            if (!$scope.deck.validDeck() || !$scope.deck.validVideo()) { return false; }
            DeckBuilder.updateDeck($scope.deck).success(function (data) {
                if (data.success) {
                    $state.transitionTo('app.hs.decks.deck', { slug: data.slug });
                } else {
                    $scope.errors = data.errors;
                    $scope.showError = true;
                    $window.scrollTo(0,0);
                }
            });
        };
    }
])
.controller('AdminUserListCtrl', ['$scope', 'bootbox', 'Pagination', 'AlertService', 'AdminUserService', 'data', 
    function ($scope, bootbox, Pagination, AlertService, AdminUserService, data) {
        // grab alerts
        if (AlertService.hasAlert()) {
            $scope.success = AlertService.getSuccess();
            AlertService.reset();
        }
        
        // load users
        $scope.users = data.users;
        $scope.page = data.page;
        $scope.perpage = data.perpage;
        $scope.total = data.total;
        $scope.search = data.search;
        
        $scope.getUsers = function () {
            AdminUserService.getUsers($scope.page, $scope.perpage, $scope.search).then(function (data) {
                $scope.users = data.users;
                $scope.page = data.page;
                $scope.total = data.total;
            });
        }
        
        $scope.searchUsers = function () {
            $scope.page = 1;
            $scope.getUsers();
        }
                
        // pagination
        $scope.pagination = {
            page: function () {
                return $scope.page;
            },
            perpage: function () {
                return $scope.perpage;
            },
            results: function () {
                return $scope.total;
            },
            setPage: function (page) {
                $scope.page = page;
                $scope.getUsers();
            },
            pagesArray: function () {
                var pages = [],
                    start = 1,
                    end = this.totalPages();
                
                if (this.totalPages() > 5) {
                    if (this.page() < 3) {
                        start = 1;
                        end = start + 4;
                    } else if (this.page() > this.totalPages() - 2) {
                        end = this.totalPages();
                        start = end - 4;
                    } else {
                        start = this.page() - 2;
                        end = this.page() + 2;
                    }
                    
                }
                
                for (var i = start; i <= end; i++) {
                    pages.push(i);
                }
                
                return pages;
            },
            isPage: function (page) {
                return (page === this.page());
            },
            totalPages: function (page) {
                return (this.results() > 0) ? Math.ceil(this.results() / this.perpage()) : 0;
            },
            from: function () {
                return (this.page() * this.perpage()) - this.perpage() + 1;
            },
            to: function () {
                return ((this.page() * this.perpage()) > this.results()) ? this.results() : this.page() * this.perpage();
            }
        };  
        
        // delete user
        $scope.deleteUser = function (user) {
            var box = bootbox.dialog({
                title: 'Delete user: ' + user.username + '?',
                message: 'Are you sure you want to delete the user <strong>' + user.username + '</strong>?',
                buttons: {
                    delete: {
                        label: 'Delete',
                        className: 'btn-danger',
                        callback: function () {
                            AdminUserService.deleteUser(user._id).then(function (data) {
                                if (data.success) {
                                    var index = $scope.users.indexOf(user);
                                    if (index !== -1) {
                                        $scope.users.splice(index, 1);
                                    }
                                    $scope.success = {
                                        show: true,
                                        msg: user.username + ' deleted successfully.'
                                    };
                                }
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
                }
            });
            box.modal('show');
        };
    }
])
.controller('AdminUserAddCtrl', ['$scope', '$state', '$window', 'AdminUserService', 'AlertService', 
    function ($scope, $state, $window, AdminUserService, AlertService) {
        // default user
        var d = new Date();
        d.setMonth(d.getMonth()+1);
            
        var defaultUser = {
            email : '',
            username: '',
            password: '',
            cpassword: '',
            about: '',
            social: {
                twitter: '',
                facebook: '',
                twitch: '',
                instagram: '',
                youtube: ''
            },
            subscription: {
                isSubscribed: false,
                expiryDate: d
            },
            isProvider: false,
            providerDescription: '',
            isAdmin: false,
            active: true
        };
        
        // load user
        $scope.user = angular.copy(defaultUser);
        
        // select options
        $scope.userSubscription =
        $scope.userProvider =
        $scope.userAdmin =
        $scope.userActive = [
            { name: 'Yes', value: true },
            { name: 'No', value: false }
        ];
        
        // date picker options
        $scope.dateOptions = {};
        
        // add user
        $scope.addUser = function () {
            AdminUserService.addUser($scope.user).success(function (data) {
                if (!data.success) {
                    $scope.errors = data.errors;
                    $scope.showError = true;
                    $window.scrollTo(0,0);
                } else {
                    AlertService.setSuccess({ show: true, msg: $scope.user.username + ' has been added successfully.' });
                    $state.go('app.admin.users.list');
                }
            });
        };
    }
])
.controller('AdminUserEditCtrl', ['$scope', '$state', '$window', 'AdminUserService', 'AlertService', 'data', 
    function ($scope, $state, $window, AdminUserService, AlertService, data) {
        if (!data || !data.success) { return $state.go('app.admin.users.list'); }
        
        // load user
        $scope.user = data.user;
        
        // select options
        $scope.userSubscription =
        $scope.userProvider =
        $scope.userAdmin =
        $scope.userActive = [
            { name: 'Yes', value: true },
            { name: 'No', value: false }
        ];
        
        // date picker options
        $scope.dateOptions = {};
        
        // edit user
        $scope.editUser = function () {
            AdminUserService.editUser($scope.user).success(function (data) {
                if (!data.success) {
                    $scope.errors = data.errors;
                    $scope.showError = true;
                    $window.scrollTo(0,0);
                } else {
                    AlertService.setSuccess({ show: true, msg: $scope.user.username + ' has been updated successfully.' });
                    $state.go('app.admin.users.list');
                }
            });
        };
    }
])
.controller('AdminPollListCtrl', ['$scope', '$compile', 'bootbox', 'Pagination', 'AlertService', 'AdminPollService', 'data', 
    function ($scope, $compile, bootbox, Pagination, AlertService, AdminPollService, data) {
        // grab alerts
        if (AlertService.hasAlert()) {
            $scope.success = AlertService.getSuccess();
            AlertService.reset();
        }
        
        // load polls
        $scope.polls = data.polls;
        $scope.page = data.page;
        $scope.perpage = data.perpage;
        $scope.total = data.total;
        $scope.search = data.search;
        
        
        $scope.getPolls = function () {
            AdminPollService.getPolls($scope.page, $scope.perpage, $scope.search).then(function (data) {
                $scope.polls = data.polls;
                $scope.page = data.page;
                $scope.total = data.total;
            });
        }
        
        $scope.searchPolls = function () {
            $scope.page = 1;
            $scope.getPolls();
        }
            
        // pagination
        $scope.pagination = {
            page: function () {
                return $scope.page;
            },
            perpage: function () {
                return $scope.perpage;
            },
            results: function () {
                return $scope.total;
            },
            setPage: function (page) {
                $scope.page = page;
                $scope.getPolls();
            },
            pagesArray: function () {
                var pages = [],
                    start = 1,
                    end = this.totalPages();
                
                if (this.totalPages() > 5) {
                    if (this.page() < 3) {
                        start = 1;
                        end = start + 4;
                    } else if (this.page() > this.totalPages() - 2) {
                        end = this.totalPages();
                        start = end - 4;
                    } else {
                        start = this.page() - 2;
                        end = this.page() + 2;
                    }
                    
                }
                
                for (var i = start; i <= end; i++) {
                    pages.push(i);
                }
                
                return pages;
            },
            isPage: function (page) {
                return (page === this.page());
            },
            totalPages: function (page) {
                return (this.results() > 0) ? Math.ceil(this.results() / this.perpage()) : 0;
            },
            from: function () {
                return (this.page() * this.perpage()) - this.perpage() + 1;
            },
            to: function () {
                return ((this.page() * this.perpage()) > this.results()) ? this.results() : this.page() * this.perpage();
            }
        };  
        
        
        // delete poll
        $scope.deletePoll = function (poll) {
            var box = bootbox.dialog({
                title: 'Delete poll: ' + poll.title + '?',
                message: 'Are you sure you want to delete the poll <strong>' + poll.title + '</strong>?',
                buttons: {
                    delete: {
                        label: 'Delete',
                        className: 'btn-danger',
                        callback: function () {
                            AdminPollService.deletePoll(poll._id).then(function (data) {
                                if (data.success) {
                                    var index = $scope.polls.indexOf(poll);
                                    if (index !== -1) {
                                        $scope.polls.splice(index, 1);
                                    }
                                    $scope.success = {
                                        show: true,
                                        msg: poll.title + ' deleted successfully.'
                                    };
                                }
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
                }
            });
            box.modal('show');
        };
    }
])
.controller('AdminPollAddCtrl', ['$scope', '$state', '$window', '$upload', '$compile', 'AdminPollService', 'AlertService',
    function ($scope, $state, $window, $upload, $compile, AdminPollService, AlertService) {
        var box,
            defaultPoll = {
                title : '',
                subTitle: '',
                description: '',
                type: '',
                active: false,
                view: '',
                items: []
            },
            defaultItem = {
                name: '',
                orderNum: 0,
                photos: {
                    large: '',
                    thumb: ''
                }
            }
        
        $scope.options = {
          disableDragAndDrop: true,
          height: 300,
          fontNames: ['Open Sans Regular', 'Open Sans Bold'],
          defaultFontName: 'Open Sans Regular',
          toolbar: [
            ['style', ['bold', 'italic', 'underline', 'strikethrough', 'clear']],
            ['fontname', ['fontname']],
            ['fontsize', ['fontsize']],
            ['color', ['color']],
            ['para', ['ul', 'ol', 'paragraph']],
            ['table', ['table']],
            ['insert', ['link', 'picture', 'video']],
            ['format', ['hr']],
            ['misc', ['undo', 'redo', 'codeview']]
          ]
        };
        
        // load Poll
        $scope.poll = angular.copy(defaultPoll);
        $scope.item = angular.copy(defaultItem);
        $scope.currentItem = angular.copy(defaultItem);
        $scope.imgPath = 'polls/';
        
        $scope.pollType = [
            { name: 'Image', value: 'img' },
            { name: 'Text', value: 'txt' }
        ];
        
        $scope.pollView = [
            { name: 'Main', value: 'main' },
            { name: 'Sidebar', value: 'side' },
            { name: 'Hide', value: 'hide'}
        ];
        
        $scope.pollActive = [
            { name: 'Yes', value: 'true'},
            { name: 'No', value: 'false'}
        ];
        
        $scope.voteLimit = function() {
            var out = [];
            
            for (var i = 0; i < $scope.poll.items.length; i++) {
                out.push(i + 1);
            }
            
            return out;
        }
        
        $scope.photoUpload = function ($files) {
            if (!$files.length) return false;
            var uploadBox = bootbox.dialog({
                message: $compile('<div class="progress progress-striped active" style="margin-bottom: 0px;"><div class="progress-bar" role="progressbar" aria-valuenow="{{uploading}}" aria-valuemin="0" aria-valuemax="100" style="width: {{uploading}}%;"><span class="sr-only">{{uploading}}% Complete</span></div></div>')($scope),
                closeButton: false,
                animate: false
            });
            $scope.uploading = 0;
            uploadBox.modal('show');
            for (var i = 0; i < $files.length; i++) {
                var file = $files[i];
                $scope.upload = $upload.upload({
                    url: '/api/admin/upload/polls',
                    method: 'POST',
                    file: file
                }).progress(function(evt) {
                    $scope.uploading = parseInt(100.0 * evt.loaded / evt.total);
                }).success(function(data, status, headers, config) {
                    $scope.currentItem.photos = {
                        large: data.large,
                        thumb: data.thumb
                    };
                    uploadBox.modal('hide');
                });
            }
        };
        
        $scope.itemEditWnd = function (item) {
            $scope.currentItem = item;
                box = bootbox.dialog({
                title: 'Edit Item',
                message: $compile('<div poll-item-edit-form></div>')($scope)
            });
        };
        
        $scope.editItem = function () {
            box.modal('hide');
            $scope.currentItem = false;
        };
        
        $scope.deleteItem = function (item) {
            var index = $scope.poll.items.indexOf(item);
            $scope.poll.items.splice(index, 1);
            for (var i = 0; i < $scope.poll.items.length; i++) {
                $scope.poll.items[i].orderNum = i + 1;
            }
        };
        
        $scope.itemAddWnd = function () {
            $scope.currentItem = angular.copy($scope.item);
            box = bootbox.dialog({
                title: 'Add Item',
                message: $compile('<div poll-item-add-form></div>')($scope)
            });
        };
        
        $scope.addItem = function () {
            $scope.currentItem.orderNum = $scope.poll.items.length + 1;
            $scope.poll.items.push($scope.currentItem);
            box.modal('hide');
            $scope.currentItem = false;
        };
        
        $scope.updateDND = function (list, index) {
            list.splice(index, 1);
            for (var i = 0; i < list.length; i++) {
                list[i].orderNum = i + 1;
            }
        };
        
        $scope.getImage = function () {
            return ($scope.currentItem.photos && $scope.currentItem.photos.thumb === '') ?  $scope.app.cdn + 'img/blank.png' : $scope.app.cdn + $scope.imgPath + $scope.currentItem.photos.thumb;
        };
        
        // add Poll
        $scope.addPoll = function () {
            AdminPollService.addPoll($scope.poll).success(function (data) {
                if (!data.success) {
                    $scope.errors = data.errors;
                    $scope.showError = true;
                    $window.scrollTo(0,0);
                } else {
                    AlertService.setSuccess({ show: true, msg: $scope.poll.title + ' has been added successfully.' });
                    $state.go('app.admin.polls.list');
                }
            });
        };
    }
])
.controller('AdminPollEditCtrl', ['$scope', '$state', '$window', '$compile', '$upload', 'AdminPollService', 'AlertService', 'data', 
    function ($scope, $state, $window, $compile, $upload, AdminPollService, AlertService, data) {
        var box,
            defaultPoll = {
                title : '',
                subTitle: '',
                description: '',
                type: '',
                active: false,
                view: '',
                items: []
            },
            defaultItem = {
                name: '',
                orderNum: 0,
                photos: {
                    large: '',
                    thumb: ''
                }
            }
            
        $scope.options = {
          disableDragAndDrop: true,
          height: 300,
          fontNames: ['Open Sans Regular', 'Open Sans Bold'],
          defaultFontName: 'Open Sans Regular',
          toolbar: [
            ['style', ['bold', 'italic', 'underline', 'strikethrough', 'clear']],
            ['fontname', ['fontname']],
            ['fontsize', ['fontsize']],
            ['color', ['color']],
            ['para', ['ul', 'ol', 'paragraph']],
            ['table', ['table']],
            ['insert', ['link', 'picture', 'video']],
            ['format', ['hr']],
            ['misc', ['undo', 'redo', 'codeview']]
          ]
        };
        
        // load Poll
        $scope.poll = data.poll;
        $scope.item = angular.copy(defaultItem);
        $scope.currentItem = angular.copy(defaultItem);
        $scope.imgPath = 'polls/';
        
        $scope.pollType = [
            { name: 'Image', value: 'img' },
            { name: 'Text', value: 'txt' }
        ];
        
        $scope.pollView = [
            { name: 'Main', value: 'main' },
            { name: 'Sidebar', value: 'side' },
            { name: 'Hide', value: 'hide'}
        ];
        
        $scope.pollActive = [
            { name: 'Yes', value: 'true'},
            { name: 'No', value: 'false'}
        ];
        
        $scope.voteLimit = function() {
            var out = [];
            
            for (var i = 0; i < $scope.poll.items.length; i++) {
                out.push(i + 1);
            }
            
            return out;
        }
        
        $scope.photoUpload = function ($files) {
            if (!$files.length) return false;
            var uploadBox = bootbox.dialog({
                message: $compile('<div class="progress progress-striped active" style="margin-bottom: 0px;"><div class="progress-bar" role="progressbar" aria-valuenow="{{uploading}}" aria-valuemin="0" aria-valuemax="100" style="width: {{uploading}}%;"><span class="sr-only">{{uploading}}% Complete</span></div></div>')($scope),
                closeButton: false,
                animate: false
            });
            $scope.uploading = 0;
            uploadBox.modal('show');
            for (var i = 0; i < $files.length; i++) {
                var file = $files[i];
                $scope.upload = $upload.upload({
                    url: '/api/admin/upload/polls',
                    method: 'POST',
                    file: file
                }).progress(function(evt) {
                    $scope.uploading = parseInt(100.0 * evt.loaded / evt.total);
                }).success(function(data, status, headers, config) {
                    $scope.currentItem.photos = {
                        large: data.large,
                        thumb: data.thumb
                    };
                    uploadBox.modal('hide');
                });
            }
        };
        
        $scope.itemEditWnd = function (item) {
            $scope.currentItem = item;
                box = bootbox.dialog({
                title: 'Edit Item',
                message: $compile('<div poll-item-edit-form></div>')($scope)
            });
        };
        
        $scope.editItem = function () {
            box.modal('hide');
            $scope.currentItem = false;
        };
        
        $scope.deleteItem = function (item) {
            var index = $scope.poll.items.indexOf(item);
            $scope.poll.items.splice(index, 1);
            for (var i = 0; i < $scope.poll.items.length; i++) {
                $scope.poll.items[i].orderNum = i + 1;
            }
        };
        
        $scope.itemAddWnd = function () {
            $scope.currentItem = angular.copy($scope.item);
            box = bootbox.dialog({
                title: 'Add Item',
                message: $compile('<div poll-item-add-form></div>')($scope)
            });
        };
        
        $scope.addItem = function () {
            $scope.currentItem.orderNum = $scope.poll.items.length + 1;
            $scope.poll.items.push($scope.currentItem);
            box.modal('hide');
            $scope.currentItem = false;
        };
        
        $scope.updateDND = function (list, index) {
            list.splice(index, 1);
            for (var i = 0; i < list.length; i++) {
                list[i].orderNum = i + 1;
            }
        };
        
        $scope.getImage = function () {
            if (!$scope.currentItem) { return 'img/blank.png'; }
            return ($scope.currentItem.photos && $scope.currentItem.photos.thumb === '') ?  $scope.app.cdn + 'img/blank.png' : $scope.app.cdn + $scope.imgPath + $scope.currentItem.photos.thumb;
        };
        
        $scope.editPoll = function () {
            $scope.showError = false;

            AdminPollService.editPoll($scope.poll).success(function (data) {
                if (!data.success) {
                    $scope.errors = data.errors;
                    $scope.showError = true;
                    $window.scrollTo(0,0);
                } else {
                    AlertService.setSuccess({ show: true, msg: $scope.poll.title + ' has been updated successfully.' });
                    $state.go('app.admin.polls.list');
                }
            });
        };
    }
])
.controller('AdminBannerListCtrl', ['$scope', '$compile', 'bootbox', 'Pagination', 'AlertService', 'AdminBannerService', 'data', 
    function ($scope, $compile, bootbox, Pagination, AlertService, AdminBannerService, data) {
        // grab alerts
        if (AlertService.hasAlert()) {
            $scope.success = AlertService.getSuccess();
            AlertService.reset();
        }
        
        $scope.updateDND = function (list, index) {
            list.splice(index, 1);
            for (var i = 0; i < list.length; i++) {
                list[i].orderNum = i + 1;
            }
            AdminBannerService.updateOrder(list);
        };
        
        
        // load banners
        $scope.tsBanners = data.tsBanners;
        $scope.hsBanners = data.hsBanners;
        $scope.hotsBanners = data.hotsBanners;
        $scope.page = data.page;
        $scope.perpage = data.perpage;
        $scope.total = data.total;
        $scope.search = data.search;
        
        $scope.getBanners = function () {
            AdminBannerService.getBanners($scope.page, $scope.perpage, $scope.search).then(function (data) {
                $scope.banners = data.banners;
                $scope.page = data.page;
                $scope.total = data.total;
            });
        }
        
        // delete banner
        $scope.deleteBanner = function (page, banner) {
            var box = bootbox.dialog({
                title: 'Delete banner: ' + banner.title + '?',
                message: 'Are you sure you want to delete the banner <strong>' + banner.title + '</strong>?',
                buttons: {
                    delete: {
                        label: 'Delete',
                        className: 'btn-danger',
                        callback: function () {
                            AdminBannerService.deleteBanner(banner._id).then(function (data) {
                                if (data.success) {
                                    var arr = $scope[page],
                                        index = arr.indexOf(banner);
                                    if (index !== -1) {
                                        arr.splice(index, 1);
                                    }
                                    $scope.success = {
                                        show: true,
                                        msg: banner.title + ' deleted successfully.'
                                    };
                                }
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
                }
            });
            box.modal('show');
        };
    }
])
.controller('AdminBannerAddCtrl', ['$scope', '$state', '$window', '$upload', '$compile', 'AdminBannerService', 'AlertService',
    function ($scope, $state, $window, $upload, $compile, AdminBannerService, AlertService) {
        var box,
            defaultBanner = {
                title : '',
                description: '',
                bannerType: 'ts',
                active: false,
                photo: '',
                button: {
                    hasButton: false,
                    buttonText: '',
                    buttonLink: ''
                }
            };
        $scope.descriptionMax = 250;
        
        
        $scope.hasButton = false;
        
        $scope.summerNoteIsFull = function (e) {
        }
        
        $scope.options = {
          disableDragAndDrop: true,
          height: 100,
          fontNames: ['Open Sans Regular', 'Open Sans Bold'],
          defaultFontName: 'Open Sans Regular',
          toolbar: [
            ['style', ['bold', 'italic', 'underline', 'strikethrough', 'clear']],
            ['fontname', ['fontname']],
            ['fontsize', ['fontsize']],
            ['color', ['color']],
            ['para', ['ul', 'ol', 'paragraph']],
            ['table', ['table']],
            ['insert', ['link', 'picture', 'video']],
            ['format', ['hr']],
            ['misc', ['undo', 'redo', 'codeview']]
          ]
        };
        
        // load Poll
        $scope.banner = angular.copy(defaultBanner);
        $scope.imgPath = 'banners/';
        
        $scope.bannerTypes = [
            { name: 'TempoStorm', value: 'ts' },
            { name: 'Hearthstone', value: 'hs' },
            { name: 'Heroes of the Storm', value: 'hots'}
        ];
        
        $scope.bannerActive = [
            { name: 'Yes', value: 'true'},
            { name: 'No', value: 'false'}
        ];
        
        $scope.photoUpload = function ($files) {
            if (!$files.length) return false;
            var uploadBox = bootbox.dialog({
                message: $compile('<div class="progress progress-striped active" style="margin-bottom: 0px;"><div class="progress-bar" role="progressbar" aria-valuenow="{{uploading}}" aria-valuemin="0" aria-valuemax="100" style="width: {{uploading}}%;"><span class="sr-only">{{uploading}}% Complete</span></div></div>')($scope),
                closeButton: false,
                animate: false
            });
            $scope.uploading = 0;
            uploadBox.modal('show');
            for (var i = 0; i < $files.length; i++) {
                var file = $files[i];
                $scope.upload = $upload.upload({
                    url: '/api/admin/upload/banners',
                    method: 'POST',
                    file: file
                }).progress(function(evt) {
                    $scope.uploading = parseInt(100.0 * evt.loaded / evt.total);
                }).success(function(data, status, headers, config) {
                    $scope.banner.photo = data.large;
                    uploadBox.modal('hide');
                });
            }
        };

        
        $scope.getImage = function () {
            $scope.imgPath = 'banners/';
            return ($scope.banner.photo === '') ?  $scope.app.cdn + 'img/blank.png' : $scope.app.cdn + $scope.imgPath + $scope.banner.photo;
        };
        
        // add Poll
        $scope.addBanner = function () {
            AdminBannerService.addBanner($scope.banner).success(function (data) {
                if (!data.success) {
                    $scope.errors = data.errors;
                    $scope.showError = true;
                    $window.scrollTo(0,0);
                } else {
                    AlertService.setSuccess({ show: true, msg: $scope.banner.title + ' has been added successfully.' });
                    $state.go('app.admin.banners.list');
                }
            });
        };
    }
])
.controller('AdminBannerEditCtrl', ['$window', '$scope', '$state', '$compile', '$upload', 'AlertService', 'data', 'AdminBannerService', '$q',
    function($window, $scope, $state, $compile, $upload, AlertService, data, AdminBannerService, $q) {
        $scope.banner = data.banner;
        
        
        $scope.bannerTypes = [
            { name: 'TempoStorm', value: 'ts' },
            { name: 'Hearthstone', value: 'hs' },
            { name: 'Heroes of the Storm', value: 'hots'}
        ];

        $scope.bannerActive = [
            { name: 'Yes', value: 'true'},
            { name: 'No', value: 'false'}
        ];
        $scope.descriptionMax = 250;
        
        
        $scope.summerNoteIsFull = function () {
        }
        
        $scope.options = {
            disableDragAndDrop: true,
            height: 100,
            fontNames: ['Open Sans Regular', 'Open Sans Bold'],
            defaultFontName: 'Open Sans Regular',
            toolbar: [
            ['style', ['bold', 'italic', 'underline', 'strikethrough', 'clear']],
            ['fontname', ['fontname']],
            ['fontsize', ['fontsize']],
            ['color', ['color']],
            ['para', ['ul', 'ol', 'paragraph']],
            ['table', ['table']],
            ['insert', ['link', 'picture', 'video']],
            ['format', ['hr']],
            ['misc', ['undo', 'redo', 'codeview']]
            ]
        };  
        
        $scope.photoUpload = function ($files) {
            if (!$files.length) return false;
            var uploadBox = bootbox.dialog({
                message: $compile('<div class="progress progress-striped active" style="margin-bottom: 0px;"><div class="progress-bar" role="progressbar" aria-valuenow="{{uploading}}" aria-valuemin="0" aria-valuemax="100" style="width: {{uploading}}%;"><span class="sr-only">{{uploading}}% Complete</span></div></div>')($scope),
                closeButton: false,
                animate: false
            });
            $scope.uploading = 0;
            uploadBox.modal('show');
            for (var i = 0; i < $files.length; i++) {
                var file = $files[i];
                $scope.upload = $upload.upload({
                    url: '/api/admin/upload/banners',
                    method: 'POST',
                    file: file
                }).progress(function(evt) {
                    $scope.uploading = parseInt(100.0 * evt.loaded / evt.total);
                }).success(function(data, status, headers, config) {
                    $scope.banner.photo = data.large;
                    uploadBox.modal('hide');
                });
            }
        };

        
        $scope.getImage = function () {
            $scope.imgPath = 'banners/';
            return ($scope.banner.photo === '') ?  $scope.app.cdn + 'img/blank.png' : $scope.app.cdn + $scope.imgPath + $scope.banner.photo;
        };
        
        
         $scope.editBanner = function () {
            $scope.showError = false;

            AdminBannerService.editBanner($scope.banner).success(function (data) {
                if (!data.success) {
                    $scope.errors = data.errors;
                    $scope.showError = true;
                    $window.scrollTo(0,0);
                } else {
                    AlertService.setSuccess({ show: true, msg: $scope.banner.title + ' has been updated successfully.' });
                    $state.go('app.admin.banners.list');
                }
            });
        };
    }
])
.controller('DeckBuilderClassCtrl', ['$scope', 'Hearthstone', function ($scope, Hearthstone) {
    
    if ($scope.app.settings.secondaryPortrait == undefined || $scope.app.settings.secondaryPortrait.length == 0) {
        $scope.app.settings.secondaryPortrait = [0,0,0,0,0,0,0,0,0];
    }
    var portraitSettings = $scope.app.settings.secondaryPortrait;

    $scope.heroNames = Hearthstone.heroNames;
    $scope.klass = false;
    $scope.heroes = [
        { class: 'druid', hasSecondary: Hearthstone.heroNames.Druid.length > 1, secondary: portraitSettings[0] },
        { class: 'hunter', hasSecondary: Hearthstone.heroNames.Hunter.length > 1, secondary: portraitSettings[1] },
        { class: 'mage', hasSecondary: Hearthstone.heroNames.Mage.length > 1, secondary: portraitSettings[2] },
        { class: 'paladin', hasSecondary: Hearthstone.heroNames.Paladin.length > 1, secondary: portraitSettings[3] },
        { class: 'priest', hasSecondary: Hearthstone.heroNames.Priest.length > 1, secondary: portraitSettings[4] },
        { class: 'rogue', hasSecondary: Hearthstone.heroNames.Rogue.length > 1, secondary: portraitSettings[5] },
        { class: 'shaman', hasSecondary: Hearthstone.heroNames.Shaman.length > 1, secondary: portraitSettings[6] },
        { class: 'warlock', hasSecondary: Hearthstone.heroNames.Warlock.length > 1, secondary: portraitSettings[7] },
        { class: 'warrior', hasSecondary: Hearthstone.heroNames.Warrior.length > 1, secondary: portraitSettings[8] }
    ];
    
    //return the upper case name of the hero based on index
    function getClass (index) {
        return $scope.heroes[index].class[0].toUpperCase() + $scope.heroes[index].class.slice(1);
    }
     
    //increment the hero name selector and if at the end of hero name list, return 0
    function calc (index) {
        if(portraitSettings[index] == (Hearthstone.heroNames[getClass(index)].length - 1)) {
            return 0;
        } else {
            return ++portraitSettings[index];
        }
    }
    
    //get the hero name based on the index of portraitSettings' index
    $scope.getName = function (index, caps) {
        try {
            if (caps) {
                return Hearthstone.heroNames[getClass(index)][portraitSettings[index]];
            } else {
                var name = Hearthstone.heroNames[getClass(index)][portraitSettings[index]]
                return name[0].toLowerCase() + name.slice(1);
            }
        } catch(err) {
            $scope.app.settings.secondaryPortrait = [0,0,0,0,0,0,0,0,0];
            portraitSettings = $scope.app.settings.secondaryPortrait;
            $scope.getName(index, caps);
        }
    }
    
    //update the hero selection on button press
    $scope.updateHero = function (index) {
        var numb = calc(index);
        portraitSettings[index] = numb;
        $scope.app.settings.secondaryPortrait[index] = numb;
    }

    //
    for (var i = 0; i < $scope.app.settings.secondaryPortrait.length; i++) {
        if ($scope.getName(i, true) == undefined || $scope.getName(i, true) == '') {
            $scope.app.settings.secondaryPortrait[i] = 0;
            portraitSettings[i] = 0;
        }
    }
}])
.controller('DeckBuilderCtrl', ['$q', '$state', '$scope', '$timeout', '$compile', '$window', 'LoginModalService', 'AjaxPagination', 'Hearthstone', 'DeckBuilder', 'ImgurService', 'UserService', 'AuthenticationService', 'SubscriptionService', 'data', 'toStep',
    function ($q, $state, $scope, $timeout, $compile, $window, LoginModalService, AjaxPagination, Hearthstone, DeckBuilder, ImgurService, UserService, AuthenticationService, SubscriptionService, data, toStep) {
        // redirect back to class pick if no data
        if (!data || !data.success) { $state.transitionTo('app.hs.deckBuilder.class'); return false; }
        
        $scope.isSecondary = function (klass) {
            switch(klass) {
                case 'druid': return $scope.app.settings.secondaryPortrait[0]; break;
                case 'hunter': return $scope.app.settings.secondaryPortrait[1]; break;
                case 'mage': return $scope.app.settings.secondaryPortrait[2]; break;
                case 'paladin': return $scope.app.settings.secondaryPortrait[3]; break;
                case 'priest': return $scope.app.settings.secondaryPortrait[4]; break;
                case 'rogue': return $scope.app.settings.secondaryPortrait[5]; break;
                case 'shaman': return $scope.app.settings.secondaryPortrait[6]; break;
                case 'warlock': return $scope.app.settings.secondaryPortrait[7]; break;
                case 'warrior': return $scope.app.settings.secondaryPortrait[8]; break;
            }
        }
        
        // set default tab page
        $scope.step = 1;
        $scope.showManaCurve = false;
        $scope.classes = angular.copy(Hearthstone.classes).splice(1, 9);
        
        $scope.getDust = function (cards) {
            var dust = 0;
            for (var i = 0; i < cards.length; i++) {
                dust += cards[i].dust * cards[i].qty;
            }
            return dust
        }
        
        //get the hero name based on the index of portraitSettings' index
        $scope.getName = function (index, klass) {
            try {
                return Hearthstone.heroNames[klass][$scope.isSecondary(klass.toLowerCase())];
            } catch(err) {
                $scope.app.settings.secondaryPortrait = [0,0,0,0,0,0,0,0,0];
                $scope.getName(index, caps);
            }
        }
        
        $scope.getActiveDeckName = function () {
            return Hearthstone.heroNames[$scope.deck.playerClass][$scope.isSecondary($scope.deck.playerClass.toLowerCase())];
        }

        // steps
        $scope.stepDesc = {
            1: 'Select the cards for your deck.',
            2: 'Select which cards to mulligan for.',
            3: 'Provide a description for how to play your deck.',
            4: 'Select how your deck preforms against other classes.',
            5: 'Provide a synopsis and title for your deck.'            
        };
        
        $scope.type = 1;
        $scope.basic = false;
        
        $scope.prevStep = function () {
            if ($scope.step > 1) $scope.step = $scope.step - 1;
        }
        $scope.nextStep = function () {
            if ($scope.step < 5) $scope.step = $scope.step + 1;
        }
        
        // summernote options
        $scope.options = {
          disableDragAndDrop: true,
          height: 100,
          toolbar: [
            ['style', ['style']],
            ['style', ['bold', 'italic', 'underline', 'strikethrough', 'clear']],
            ['color', ['color']],
            ['para', ['ul', 'ol', 'paragraph']],
            ['table', ['table']],
            ['insert', ['link', 'picture', 'video']],
            ['format', ['hr']],
            ['misc', ['undo', 'redo']]
          ]
        };

        // load cards
        var classCards = true;
        
        $scope.isClassCards = function () {
            return classCards;
        }
        
        $scope.className = data.className;
        $scope.cards = data.cards;
        $scope.cards.current = $scope.cards.class;
        
        $scope.search = function() {
            updateCards(1, 15, $scope.filters.search, $scope.filters.mechanics, $scope.filters.mana);
        }
        
        function updateCards (page, perpage, search, mechanics, mana, callback) {
            $scope.fetching = true;
            DeckBuilder.loadCards(page, perpage, search, mechanics, mana, $scope.className.toLowerCase()).then(function (data) {
                $scope.classPagination.total = ($scope.isClassCards()) ? data.classTotal : data.neutralTotal;
                $scope.classPagination.page = page;
                $scope.neutralPagination.total = ($scope.isClassCards()) ? data.classTotal : data.neutralTotal;
                $scope.neutralPagination.page = page;
                $timeout(function () {
                    $scope.cards.current = ($scope.isClassCards()) ? data.cards.class : data.cards.neutral;
                    $scope.fetching = false;
                    if (callback) {
                        return callback(data);
                    }
                });
            });
        }
        
        // page flipping
        $scope.classPagination = AjaxPagination.new(15, data.classTotal,
            function (page, perpage) {
                var d = $q.defer();

                updateCards(page, perpage, $scope.filters.search, $scope.filters.mechanics, $scope.filters.mana, function (data) {
                    d.resolve(data.classTotal);
                });

                return d.promise;
            }
        );
        
        $scope.neutralPagination = AjaxPagination.new(15, data.neutralTotal,
            function (page, perpage) {
                var d = $q.defer();
                updateCards(page, perpage, $scope.filters.search, $scope.filters.mechanics, $scope.filters.mana, function (data) {
                    d.resolve(data.neutralTotal);
                });
                return d.promise;
            }
        );
        
        // filters
        $scope.filters = {
            search: '',
            mechanics: [],
            mana: 'all'
        };
        
        $scope.setClassCards = function (b) {
            classCards = b;
            updateCards(1, 15, $scope.filters.search, $scope.filters.mechanics, $scope.filters.mana);
        }
        
        $scope.mechanics = Hearthstone.mechanics;
        $scope.inMechanics = function (mechanic) {
            return ($scope.filters.mechanics.indexOf(mechanic) >= 0);
        }
        $scope.toggleMechanic = function (mechanic) {
            updateCards(1,15,$scope.filters.search, $scope.filters.mechanics, $scope.filters.mana);
            var index = $scope.filters.mechanics.indexOf(mechanic);
            if (index === -1) {
                $scope.filters.mechanics.push(mechanic);
            } else {
                $scope.filters.mechanics.splice(index, 1);
            }
        }
        
        // filter by mechanics
        $scope.filters.byMechanics = function () {
            return function (item) {
                if (!$scope.filters.mechanics.length) { return true; }
                var matched = 0;
                for (var i = 0; i < item['mechanics'].length; i++) {
                    if ($scope.inMechanics(item['mechanics'][i])) matched++;
                }
                return (matched === $scope.filters.mechanics.length);
            }
        }
        
        // filter by mana
        $scope.doFilterByMana = function (m) {
            $scope.filters.mana = m;
            updateCards(1, 15, $scope.filters.search, $scope.filters.mechanics, $scope.filters.mana)
        }
        
        $scope.filters.byMana = function () {
            return function (item) {
                switch ($scope.filters.mana) {
                    case 'all':
                        return true;
                    case 0:
                    case 1:
                    case 2:
                    case 3:
                    case 4:
                    case 5:
                    case 6:
                        return (item['cost'] === $scope.filters.mana);
                    case '7+':
                        return (item['cost'] >= 7);
                }
            }
        };
        
        $scope.getManaCost = function () {
            switch ($scope.filters.mana) {
                case 'all':
                    return 'All';
                case 0:
                case 1:
                case 2:
                case 3:
                case 4:
                case 5:
                case 6:
                case '7+':
                    return $scope.filters.mana;
            }
        }
        
        // deck
        $scope.deckTypes = Hearthstone.deckTypes;
        
        //$scope.deck = DeckBuilder.new(data.className);
        $scope.deck = ($scope.app.settings.deck && $scope.app.settings.deck !== null && data.className === $scope.app.settings.deck.playerClass) ? DeckBuilder.new(data.className, $scope.app.settings.deck) : DeckBuilder.new(data.className);
        $scope.$watch('deck', function(){
            $scope.app.settings.deck = {
                name: $scope.deck.name,
                deckType: $scope.deck.deckType,
                description: $scope.deck.description,
                chapters: $scope.deck.chapters,
                matches: $scope.deck.matches,
                cards: $scope.deck.cards,
                heroName: $scope.deck.heroName,
                playerClass: $scope.deck.playerClass,
                type: $scope.deck.type,
                basic: $scope.deck.basic,
                mulligans: $scope.deck.mulligans,
                video: $scope.deck.video,
                public: $scope.deck.public
            };
        }, true);
        
        // current mulligan
        $scope.currentMulligan = $scope.deck.getMulligan($scope.classes[0]);
        
        $scope.setMulligan = function (mulligan) {
            $scope.currentMulligan = mulligan;
        };
        
        $scope.isMulliganSet = function (mulligan) {
            return (mulligan.withCoin.cards.length || mulligan.withCoin.instructions.length || mulligan.withoutCoin.cards.length || mulligan.withoutCoin.instructions.length);
        };
        
        $scope.isMulliganCard = function (coin, card) {
            if (coin) {
                for (var i = 0; i < $scope.currentMulligan.withCoin.cards.length; i++) {
                    if ($scope.currentMulligan.withCoin.cards[i]._id == card._id) {
                        return true;
                    }
                }
            } else {
                for (var i = 0; i < $scope.currentMulligan.withoutCoin.cards.length; i++) {
                    if ($scope.currentMulligan.withoutCoin.cards[i]._id == card._id) {
                        return true;
                    }
                }
            }
        }

        // premium
        $scope.premiumTypes = [
            { text: 'No', value: false },
            { text: 'Yes', value: true }
        ];
        
        $scope.isPremium = function () {
            var premium = $scope.deck.premium.isPremium;
            for (var i = 0; i < $scope.premiumTypes.length; i++) {
                if ($scope.premiumTypes[i].value === premium) {
                    return $scope.premiumTypes[i].text;
                }
            }
        }
        
        $scope.getMulliganCards = function (coin) {
            if (!$scope.currentMulligan) { return false; }
            var m = $scope.currentMulligan;
            return (coin) ? m.withCoin.cards : m.withoutCoin.cards;
        };
        
        $scope.cardLeft = function ($index, coin) {
            return (80 / ($scope.getMulliganCards(coin).length)) * $index;
        };
        
        // featured
        $scope.featuredTypes = [
            { text: 'No', value: false },
            { text: 'Yes', value: true }
        ];
        
        $scope.isFeatured = function () {
            var featured = $scope.deck.featured;
            for (var i = 0; i < $scope.featuredTypes.length; i++) {
                if ($scope.featuredTypes[i].value === featured) {
                    return $scope.featuredTypes[i].text;
                }
            }
        }
        
        // save deck
        var box;
        $scope.saveDeck = function () {
            if (!$scope.deck.validDeck() || !$scope.deck.validVideo()) { return false; }
            if (!$scope.app.user.isLogged()) {
                LoginModalService.showModal('login');
            } else {
                $scope.deck.heroName = $scope.getActiveDeckName();
                DeckBuilder.saveDeck($scope.deck).success(function (data) {
                    if (data.success) {
                        $scope.app.settings.deck = null;
                        $state.transitionTo('app.hs.decks.deck', { slug: data.slug });
                    } else {
                        $scope.errors = data.errors;
                        $scope.showError = true;
                        $window.scrollTo(0,0);
                    }
                });
            }
        };
        
        // login for modal
//        $scope.login = function login(email, password) {
//            if (email !== undefined && password !== undefined) {
//                UserService.login(email, password).success(function(data) {
//                    AuthenticationService.setLogged(true);
//                    AuthenticationService.setAdmin(data.isAdmin);
//                    AuthenticationService.setProvider(data.isProvider);
//                    
//                    SubscriptionService.setSubscribed(data.subscription.isSubscribed);
//                    SubscriptionService.setTsPlan(data.subscription.plan);
//                    SubscriptionService.setExpiry(data.subscription.expiry);
//                    
//                    $window.sessionStorage.userID = data.userID;
//                    $window.sessionStorage.username = data.username;
//                    $window.sessionStorage.email = data.email;
//                    $scope.app.settings.token = $window.sessionStorage.token = data.token;
//                    box.modal('hide');
//                    $scope.saveDeck();
//                }).error(function() {
//                    $scope.showError = true;
//                });
//            }
//        }
    }
])
.controller('DeckEditCtrl', ['$state', '$scope', '$compile', '$window', '$timeout', '$q', 'LoginModalService', 'AjaxPagination', 'Hearthstone', 'DeckBuilder', 'ImgurService', 'UserService', 'AuthenticationService', 'data',
    function ($state, $scope, $compile, $window, $timeout, $q, LoginModalService, AjaxPagination, Hearthstone, DeckBuilder, ImgurService, UserService, AuthenticationService, data) {
          // redirect back to class pick if no data
        if (!data || !data.success) { $state.transitionTo('app.hs.deckBuilder.class'); return false; }
        
        $scope.isSecondary = function (klass) {
            switch(klass) {
                case 'druid': return $scope.app.settings.secondaryPortrait[0]; break;
                case 'hunter': return $scope.app.settings.secondaryPortrait[1]; break;
                case 'mage': return $scope.app.settings.secondaryPortrait[2]; break;
                case 'paladin': return $scope.app.settings.secondaryPortrait[3]; break;
                case 'priest': return $scope.app.settings.secondaryPortrait[4]; break;
                case 'rogue': return $scope.app.settings.secondaryPortrait[5]; break;
                case 'shaman': return $scope.app.settings.secondaryPortrait[6]; break;
                case 'warlock': return $scope.app.settings.secondaryPortrait[7]; break;
                case 'warrior': return $scope.app.settings.secondaryPortrait[8]; break;
            }
        }
        
        // set default tab page
        $scope.step = 1;
        $scope.showManaCurve = false;
        $scope.classes = angular.copy(Hearthstone.classes).splice(1, 9);
        
        // steps
        $scope.stepDesc = {
            1: 'Select the cards for your deck.',
            2: 'Select which cards to mulligan for.',
            3: 'Provide a description for how to play your deck.',
            4: 'Select how your deck preforms against other classes.',
            5: 'Provide a synopsis and title for your deck.'            
        };
        
        
        $scope.prevStep = function () {
            if ($scope.step > 1) $scope.step = $scope.step - 1;
        }
        $scope.nextStep = function () {
            if ($scope.step < 5) $scope.step = $scope.step + 1;
        }
        
        // summernote options
        $scope.options = {
          disableDragAndDrop: true,
          height: 100,
          toolbar: [
            ['style', ['style']],
            ['style', ['bold', 'italic', 'underline', 'strikethrough', 'clear']],
            ['color', ['color']],
            ['para', ['ul', 'ol', 'paragraph']],
            ['table', ['table']],
            ['insert', ['link', 'picture', 'video']],
            ['format', ['hr']],
            ['misc', ['undo', 'redo']]
          ]
        };

        // load cards
        var classCards = true;
        
        $scope.isClassCards = function () {
            return classCards;
        }
        
        $scope.setClassCards = function (b) {
            updateCards(1, 15, $scope.filters.search, $scope.filters.mechanics, $scope.filters.mana);
            $timeout(function () {
                classCards = b;
            });
        }
        
        $scope.className = data.deck.playerClass;
        $scope.cards = {};
//        $scope.cards.current = $scope.cards.class;
        
        $scope.search = function() {
            updateCards(1, 15, $scope.filters.search, $scope.filters.mechanics, $scope.filters.mana);
        }
        
        function updateCards (page, perpage, search, mechanics, mana, callback) {
            DeckBuilder.loadCards(page, perpage, search, mechanics, mana, $scope.className.toLowerCase()).then(function (data) {
                $scope.classPagination.total = ($scope.isClassCards()) ? data.classTotal : data.neutralTotal;
                $scope.classPagination.page = page;
                $scope.neutralPagination.total = ($scope.isClassCards()) ? data.classTotal : data.neutralTotal;
                $scope.neutralPagination.page = page;
                $timeout(function () {
                    $scope.cards.current = ($scope.isClassCards()) ? data.cards.class : data.cards.neutral;

                    if (callback) {
                        return callback(data);
                    }
                });
            });
        }
        
        // page flipping
        $scope.classPagination = AjaxPagination.new(15, data.classTotal,
            function (page, perpage) {
                var d = $q.defer();

                updateCards(page, perpage, $scope.filters.search, $scope.filters.mechanics, $scope.filters.mana, function (data) {
                    d.resolve(data.classTotal);
                });

                return d.promise;
            }
        );
        
        $scope.neutralPagination = AjaxPagination.new(15, data.neutralTotal,
            function (page, perpage) {
                var d = $q.defer();

                updateCards(page, perpage, $scope.filters.search, $scope.filters.mechanics, $scope.filters.mana, function (data) {
                    d.resolve(data.neutralTotal);
                });
                return d.promise;
            }
        );
        
        // filters
        $scope.filters = {
            search: '',
            mechanics: [],
            mana: 'all'
        };
        
        $scope.mechanics = Hearthstone.mechanics;
        $scope.inMechanics = function (mechanic) {
            return ($scope.filters.mechanics.indexOf(mechanic) >= 0);
        }
        $scope.toggleMechanic = function (mechanic) {
            updateCards(1,15,$scope.filters.search, $scope.filters.mechanics, $scope.filters.mana);
            var index = $scope.filters.mechanics.indexOf(mechanic);
            if (index === -1) {
                $scope.filters.mechanics.push(mechanic);
            } else {
                $scope.filters.mechanics.splice(index, 1);
            }
        }
        
        // filter by mechanics
        $scope.filters.byMechanics = function () {
            return function (item) {
                if (!$scope.filters.mechanics.length) { return true; }
                var matched = 0;
                for (var i = 0; i < item['mechanics'].length; i++) {
                    if ($scope.inMechanics(item['mechanics'][i])) matched++;
                }
                return (matched === $scope.filters.mechanics.length);
            }
        }
        
        // filter by mana
        $scope.doFilterByMana = function (m) {
            $scope.filters.mana = m;
            updateCards(1, 15, $scope.filters.search, $scope.filters.mechanics, $scope.filters.mana)
        }
        
        $scope.filters.byMana = function () {
            return function (item) {
                switch ($scope.filters.mana) {
                    case 'all':
                        return true;
                    case 0:
                    case 1:
                    case 2:
                    case 3:
                    case 4:
                    case 5:
                    case 6:
                        return (item['cost'] === $scope.filters.mana);
                    case '7+':
                        return (item['cost'] >= 7);
                }
            }
        };
        
        $scope.getManaCost = function () {
            switch ($scope.filters.mana) {
                case 'all':
                    return 'All';
                case 0:
                case 1:
                case 2:
                case 3:
                case 4:
                case 5:
                case 6:
                case '7+':
                    return $scope.filters.mana;
            }
        }
        
        // deck
        $scope.deckTypes = Hearthstone.deckTypes;
        $scope.deck = DeckBuilder.new(data.deck.className, data.deck);
        
        // current mulligan
        $scope.currentMulligan = $scope.deck.getMulligan($scope.classes[2]);
        
        $scope.setMulligan = function (mulligan) {
            $scope.currentMulligan = mulligan;
        };
        
        $scope.isMulliganSet = function (mulligan) {
            return (mulligan.withCoin.cards.length || mulligan.withCoin.instructions.length || mulligan.withoutCoin.cards.length || mulligan.withoutCoin.instructions.length);
        };
        
        //chapters
        var defaultChapter = {
            title: '',
            content: ''
        };
        
        $scope.newChapter = function () {
            var m = angular.copy(defaultChapter);
            $scope.deck.chapters.push(m);
        }
        
        $scope.removeChapter = function (index) {
            $scope.deck.chapters.splice(index,1);
        }
        
        //match-ups
        var defaultMatchUp = {
            deckName: '',
            klass: '',
            match: 0
        };
        
        $scope.newMatch = function (klass) {
            var m = angular.copy(defaultMatchUp);
            m.klass = klass;
            $scope.deck.matches.push(m);
        }
        
        $scope.removeMatch = function (index) {
            $scope.deck.matches.splice(index,1);
        }
        
        // premium
        $scope.premiumTypes = [
            { text: 'No', value: false },
            { text: 'Yes', value: true }
        ];
        
        $scope.isPremium = function () {
            var premium = $scope.deck.premium.isPremium;
            for (var i = 0; i < $scope.premiumTypes.length; i++) {
                if ($scope.premiumTypes[i].value === premium) {
                    return $scope.premiumTypes[i].text;
                }
            }
        }
        
        $scope.getMulliganCards = function (coin) {
            if (!$scope.currentMulligan) { return false; }
            var m = $scope.currentMulligan;
            return (coin) ? m.withCoin.cards : m.withoutCoin.cards;
        };
        
        $scope.cardLeft = function ($index, coin) {
            return (80 / ($scope.getMulliganCards(coin).length)) * $index;
        };
        
        // featured
        $scope.featuredTypes = [
            { text: 'No', value: false },
            { text: 'Yes', value: true }
        ];
        
        $scope.isFeatured = function () {
            var featured = $scope.deck.featured;
            for (var i = 0; i < $scope.featuredTypes.length; i++) {
                if ($scope.featuredTypes[i].value === featured) {
                    return $scope.featuredTypes[i].text;
                }
            }
        }
        
        updateCards(1, 15, $scope.filters.search, $scope.filters.mechanics, $scope.filters.mana);
        
        // save deck
        $scope.updateDeck = function () {
            if (!$scope.deck.validDeck() || !$scope.deck.validVideo()) { return false; }
            DeckBuilder.updateDeck($scope.deck).success(function (data) {
                if (data.success) {
                    $state.transitionTo('app.hs.decks.deck', { slug: data.slug });
                } else {
                    $scope.errors = data.errors;
                    $scope.showError = true;
                    $window.scrollTo(0,0);
                }
            });
        };
        
    }
])
.controller('SnapshotCtrl', ['$scope', '$state', '$compile', '$window', 'SnapshotService', 'data', 'VoteService', 'LoginModalService',
    function ($scope, $state, $compile, $window, SnapshotService, data, VoteService, LoginModalService) {
        
        $scope.snapshot = data;
        $scope.show = [];
        $scope.matchupName = [];
        $scope.voted = false;
        $scope.hasVoted = function () {
            for (var i = 0; i < $scope.snapshot.votes.length; i++) {
                if ($scope.snapshot.votes[i] == $scope.app.user.getUserID()) {
                    $scope.voted = true;
                    break;
                }
            }
        };
        $scope.show.comments = SnapshotService.getStorage();
        $scope.$watch('app.user.isLogged()', function() {
            updateCommentVotes();
            $scope.hasVoted();
        });
        
        $scope.SnapshotService = SnapshotService;
        
        var mouseOver = [],
            charts = [],
            viewHeight = 0,
            box = undefined;
        
        $scope.getImage = function () {
            return ($scope.snapshot.photos.large == "") ? $scope.app.cdn + 'snapshots/default-banner.jpg' : $scope.app.cdn + 'snapshots/' + $scope.snapshot.photos.large;
        }
        
        $scope.getMouseOver = function (deckID) {
            return mouseOver[deckID] || false;
        }
        
        $scope.setMouseOver = function (deckID, isOver, deckName) {
            mouseOver[deckID] = isOver;
            $scope.matchupName[deckID] = deckName || false;
        }
        
        $scope.metaservice.set($scope.snapshot.title + ' - The Meta Snapshot', $scope.snapshot.content.intro);
        
        var ogImg = ($scope.snapshot.photos.square == "") ? $scope.app.cdn + 'snapshots/default-banner-square.jpg' : $scope.app.cdn + 'snapshots/' + $scope.snapshot.photos.square;
        $scope.metaservice.setOg('https://tempostorm.com/hearthstone/meta-snapshot/' + $scope.snapshot.slug.url, $scope.snapshot.title, $scope.snapshot.content.intro, 'article', ogImg);
        
        for (var i = 0; i < $scope.snapshot.tiers.length; i++) {
            $scope.show[i+1] = false;
        }
        
        $scope.setView = function (height) {
            viewHeight = height*350;
        }
        
        $scope.getView = function () {
            return viewHeight;
        }

        // trends
        $scope.currentTier = 1;
        $scope.currentDeck = false;
        $scope.tierRange = [];
        
        $scope.snapshotTimeline = function () {
            var out = [];
            for (var i = $scope.snapshot.snapNum; i > $scope.snapshot.snapNum - 13; i--) {
                out.push(i);
            }
            return out;
        }
        
        $scope.getTier = function (tier) {
            for (var i = 0; i < $scope.snapshot.tiers.length; i++) {
                if ($scope.snapshot.tiers[i].tier == tier) {
                    return $scope.snapshot.tiers[i];
                }
            }
            return false;
        }
        
        function getTierRange (tierNum) {
            var tier = $scope.getTier(tierNum),
                out = [],
                highestRank = 0,
                lowestRank = 0;
            
            // find highest and lowest in tier
            for (var i = 0; i < tier.decks.length; i++) {
                var history = tier.decks[i].rank.all;
                for (var j = 0; j < history.length; j++) {
                    if (history[j] > highestRank && history[j] != 0) { highestRank = history[j]; }
                    if ((history[j] < lowestRank && history[j] != 0) || lowestRank == 0) { lowestRank = history[j]; }
                }
            }
            
            // generate range
            for (var i = lowestRank; i <= highestRank; i++) {
                out.push(i);
            }
            
            return out;
        };
        
        // init tier ranges
        for (var i = 0; i < $scope.snapshot.tiers.length; i++) {
            var tierNum = $scope.snapshot.tiers[i].tier;
            $scope.tierRange[tierNum] = getTierRange(tierNum);
        }
        
        $scope.toggleCurrentDeck = function (deckNum) {
            $scope.currentDeck = ($scope.currentDeck == deckNum) ? false : deckNum;
        };
        
        $scope.hasDeckSelected = function () {
            return $scope.currentDeck;
        };
        
        $scope.setCurrentTier = function (tierNum) {
            $scope.currentTier = tierNum;
            $scope.toggleCurrentDeck(false);
        };
        
        $scope.getPositionY = function (tierNum, deckIndex, height, padding) {
            var size = $scope.tierRange[tierNum].length;
            return Math.round(((height - padding)/size*deckIndex) + padding, 2);
        }
        
        $scope.getPositionX = function (index, padding) {
            return Math.round(100 - padding - ((100 - padding)/12*index) + (padding / 2), 2);
        }
        
        $scope.getRanks = function (deck) {
            var ranks = deck.rank.all;
            return ranks;
        };
        
        $scope.getRankIndex = function (tierNum, rank) {
            var range = $scope.tierRange[tierNum];
            return range.indexOf(rank);
        };
        
        $scope.getNextRank = function (deck, index) {
            return deck.rank.all[index + 1];
        };
        
        $scope.hasNextRank = function (deck, index) {
            return (deck.rank.all[index + 1]);
        };
        
        $scope.voteSnapshot = function () {
            if (!$scope.app.user.isLogged()) {
                LoginModalService.showModal('login', function() {
                    if (!$scope.hasVoted()) {
                        $scope.snapshot.votesCount++;
                        SnapshotService.vote($scope.snapshot._id);
                    }
                });
            } else {
                $scope.snapshot.votesCount++;
                SnapshotService.vote($scope.snapshot._id);
            }
            $scope.voted = true;
        }
        
        // check for custom deck name or load normal name
        function getDeckName (deckID) {
            for (var i = 0; i < $scope.snapshot.tiers.length; i++) {
                for (var j = 0; j < $scope.snapshot.tiers[i].decks.length; j++) {
                    if ($scope.snapshot.tiers[i].decks[j].deck._id == deckID) {
                        return ($scope.snapshot.tiers[i].decks[j].name.length) ? $scope.snapshot.tiers[i].decks[j].name : $scope.snapshot.tiers[i].decks[j].deck.name;
                    }
                }
            }
            return false;
        }
        
        function init () {
            var tierLength = $scope.snapshot.tiers.length,
                maxTierLength = (tierLength > 2) ? 2 : tierLength;
            
            /******************************************* HAS VOTED *******************************************/

            

            /******************************************* BUILD TIER MATCHES *******************************************/
            for (var j = 0; j < maxTierLength; j++) {
                for (var k = 0; k < $scope.snapshot.tiers[j].decks.length; k++) {
                    var matches = [];
                    for (var i = 0; i < $scope.snapshot.matches.length; i++) {
                        if($scope.snapshot.tiers[j].decks[k].deck._id == $scope.snapshot.matches[i].for._id || $scope.snapshot.tiers[j].decks[k].deck._id == $scope.snapshot.matches[i].against._id) {
                            var newObj = {
                                against: ($scope.snapshot.tiers[j].decks[k].deck._id == $scope.snapshot.matches[i].against._id) ? $scope.snapshot.matches[i].for._id : $scope.snapshot.matches[i].against._id,
                                chance: ($scope.snapshot.tiers[j].decks[k].deck._id == $scope.snapshot.matches[i].against._id) ? $scope.snapshot.matches[i].forChance : $scope.snapshot.matches[i].againstChance,
                                playerClass: ($scope.snapshot.tiers[j].decks[k].deck._id == $scope.snapshot.matches[i].against._id) ? $scope.snapshot.matches[i].for.playerClass : $scope.snapshot.matches[i].against.playerClass,
                                //name: ($scope.snapshot.tiers[j].decks[k].deck._id == $scope.snapshot.matches[i].against._id) ? $scope.snapshot.matches[i].for.name : $scope.snapshot.matches[i].against.name
                                name: ($scope.snapshot.tiers[j].decks[k].deck._id == $scope.snapshot.matches[i].against._id) ? getDeckName($scope.snapshot.matches[i].for._id) : getDeckName($scope.snapshot.matches[i].against._id)
                            };
                            matches.push(newObj);
                        }
                    }
                    charts[$scope.snapshot.tiers[j].decks[k].deck._id] = matches;
                }
            }
            
        }
        
        
        /******************************************* COMMENTS *******************************************/
        var defaultComment = {
            comment: ''
        };
        $scope.comment = angular.copy(defaultComment);
        
        $scope.commentPost = function () {
            if (!$scope.app.user.isLogged()) {
                LoginModalService.showModal('login', function () {
                    $scope.commentPost();
                });
            } else {
                SnapshotService.addComment($scope.snapshot, $scope.comment).success(function (data) {
                    if (data.success) {
                        $scope.snapshot.comments.push(data.comment);
                        $scope.comment.comment = '';
                    }
                });
            }
        };
                
        updateCommentVotes();
        function updateCommentVotes() {
            $scope.snapshot.comments.forEach(checkVotes);
            
            function checkVotes (comment) {
                var vote = comment.votes.filter(function (vote) {
                    return ($scope.app.user.getUserID() === vote.userID);
                })[0];
                
                if (vote) {
                    comment.voted = vote.direction;
                }
            }
        }
                
        $scope.voteComment = function (direction, comment) {
            if (!$scope.app.user.isLogged()) {
                LoginModalService.showModal('login', function () {
                    $scope.voteComment(direction, snapshot);
                });
            } else {
                if (comment.author._id === $scope.app.user.getUserID()) {
                    bootbox.alert("You can't vote for your own content.");
                    return false;
                }
                VoteService.voteComment(direction, comment).then(function (data) {
                    if (data.success) {
                        comment.voted = direction;
                        comment.votesCount = data.votesCount;
                    }
                });
            }
        };
        
        
        $scope.scrollToDeck = function (deck) {
            $('html, body').animate({
                scrollTop: (deck.offset().top - 100)
            }, 400);
        }
        
        $scope.findDeck = function (tier, deck) {
            var t = $('#collapseTier' + tier),
                d = $('#collapseDeck-' + deck);
            t.collapse('show');   
            d.collapse('show');
            $scope.scrollToDeck(d);  
        }
        
        $scope.goToTwitch = function ($event, usr) {
            $event.stopPropagation();
            var url = 'http://twitch.tv/' + usr
            window.open(url, '_blank');
        }
        
        $scope.goToTwitter = function ($event, usr) {
            $event.stopPropagation();
            var url = 'http://twitter.com/' + usr;
            window.open(url, '_blank');
        }
        
        $scope.getMatches = function (id) {
            return charts[id];
        }
        
        function getClass(deck) {
            return deck.playerClass;
        }
        
        $scope.getMatchClass = function (match, id) {
            return (match.for._id == id) ? match.against.playerClass : match.for.playerClass;
        }
        
        $scope.goToDeck = function ($event, slug) {
            $event.stopPropagation();
            var url = $state.href('app.hs.decks.deck', { slug: slug });
            window.open(url,'_blank');
        };
        
        $scope.goToTwitch = function ($event, usr) {
            $event.stopPropagation();
            var url = 'http://twitch.tv/' + usr
            window.open(url, '_blank');
        }
        
        $scope.goToTwitter = function ($event, usr) {
            $event.stopPropagation();
            var url = 'http://twitter.com/' + usr;
            window.open(url, '_blank');
        }
        
        $scope.toggleComments = function () {
            if (!SnapshotService.getStorage()) {
                SnapshotService.setStorage(true);
            } else {
                SnapshotService.setStorage(false);
            }
            $scope.show.comments = SnapshotService.getStorage();
        }
        
        init();
    }
])
.controller('SnapshotsCtrl', ['$scope', 'SnapshotService', 'data', 'MetaService',
    function ($scope, SnapshotService, data, MetaService) {
    
        $scope.snapshots = data.snapshots;
        $scope.total = data.total;
        $scope.page = parseInt(data.page);
        $scope.perpage = data.perpage;
        $scope.search = data.search;
        
        $scope.metaservice = MetaService;
        
        $scope.metaservice.setOg('https://tempostorm.com/hearthstone/snapshots');
        
        $scope.pagination = {
            page: function () {
                return $scope.page;
            },
            perpage: function () {
                return $scope.perpage;
            },
            results: function () {
                return $scope.total;
            },
            setPage: function (page) {
                $scope.page = page;
                $scope.getArticles();
            },
            pagesArray: function () {
                var pages = [],
                    start = 1,
                    end = this.totalPages();
                
                if (this.totalPages() > 5) {
                    if (this.page() < 3) {
                        start = 1;
                        end = start + 4;
                    } else if (this.page() > this.totalPages() - 2) {
                        end = this.totalPages();
                        start = end - 4;
                    } else {
                        start = this.page() - 2;
                        end = this.page() + 2;
                    }
                    
                }
                
                for (var i = start; i <= end; i++) {
                    pages.push(i);
                }
                
                return pages;
            },
            isPage: function (page) {
                return (page === this.page());
            },
            totalPages: function (page) {
                return (this.results() > 0) ? Math.ceil(this.results() / this.perpage()) : 1;
            },
            
        };
        
    }
])
.controller('ArticlesCtrl', ['$scope', '$state', '$q', '$timeout', 'ArticleService', 'data', 'MetaService', 'AjaxPagination',
    function ($scope, $state, $q, $timeout, ArticleService, data, MetaService, AjaxPagination) {
        //if (!data.success) { return $state.transitionTo('app.articles.list'); }
        
        // articles
        $scope.articles = data.articles;
        $scope.total = data.total;
        $scope.articleType = data.articleType;
        $scope.filter = data.filter;
        $scope.page = parseInt(data.page);
        $scope.perpage = data.perpage;
        $scope.search = data.search;
        $scope.fetching = false;
        
        
        $scope.metaservice = MetaService;
        
        $scope.metaservice.setOg('https://tempostorm.com/articles');
        
        
        $scope.hasSearch = function () {
            return (data.search) ? data.search.length : false;
        }
        
        $scope.setKlass = function (klass) {
            $scope.filter = klass;
            $scope.page = 1;
            $scope.getArticles();
        };

        $scope.getArticles = function () {
            var params = {};
            
            if ($scope.search) {
                params.s = $scope.search;
            }
            
            if ($scope.page !== 1) {
                params.p = $scope.page;
            }
            
            if ($scope.articleType != 'all') {
                params.t = $scope.articleType;
            }

            if ($scope.filter != 'all') {
                params.f = $scope.filter;
            }
            
            $scope.loading = true;
            $state.transitionTo('app.articles.list', params);
        }
        
        // pagination
        function updateArticles (page, perpage, search, callback) {
            $scope.fetching = true;
            ArticleService.getArticles('all', 'all', ((page*perpage)-perpage), 12, search).then(function (data) {
                $scope.articlePagination.total = data.total;
                $scope.articlePagination.page = page;
                $scope.articlePagination.perpage = perpage;
                $timeout(function () {
                    $scope.articles = data.articles;
                    $scope.fetching = false;
                    if (callback) {
                        return callback(data);
                    }
                });
            });
        }
        // page flipping
        $scope.articlePagination = AjaxPagination.new(12, data.total,
            function (page, perpage) {
                var d = $q.defer();

                updateArticles(page, perpage, $scope.search, function (data) {
                    d.resolve(data.total);
                });

                return d.promise;
            }
        );
        
        // verify valid page
//        if ($scope.page < 1 || $scope.page > $scope.pagination.totalPages()) {
//            $scope.pagination.setPage(1);
//        }
    }
])
.controller('ArticleCtrl', ['$scope', '$parse', '$sce', 'data', '$state', '$compile', '$window', 'bootbox', 'ArticleService', 'VoteService', 'MetaService', 'LoginModalService',
    function ($scope, $parse, $sce, data, $state, $compile, $window, bootbox, ArticleService, VoteService, MetaService, LoginModalService) {
        
        $scope.article = data.article;
        $scope.authorEmail = data.article.author.email;
        $scope.ArticleService = ArticleService;
        $scope.$watch('app.user.isLogged()', function() {
            for (var i = 0; i < $scope.article.votes.length; i++) {
                if ($scope.article.votes[i] == $scope.app.user.getUserID()) {
                    checkVotes();
                    updateCommentVotes();
                }
            }
        });
        
        $scope.isPremium = function () {
            if (!$scope.article.premium.isPremium) { return false; }
            var now = new Date().getTime(),
                expiry = new Date($scope.article.premium.expiryDate).getTime();
            if (expiry > now) {
                return true;
            } else {
                return false;
            }
        }
        
        $scope.metaservice = MetaService;
        $scope.metaservice.set($scope.article.title + ' - Articles', $scope.article.description);
        
        var ogImg = ($scope.article.photos.square != undefined) ? $scope.app.cdn + 'articles/' + $scope.article.photos.square : $scope.app.cdn + 'articles/' + $scope.article.photos.large;
        $scope.metaservice.setOg('https://tempostorm.com/articles/' + data.article.slug.url, $scope.article.title, $scope.article.description, 'article', ogImg);
        
        $scope.getContent = function () {
            return $sce.trustAsHtml($scope.article.content);
        };
        
        // show
        if (!$scope.app.settings.show.article) {
            $scope.app.settings.show['article'] = {
                related: true,
                comments: true
            };
        }
        $scope.show = $scope.app.settings.show.article;
        $scope.$watch('show', function(){ $scope.app.settings.show.article = $scope.show; }, true);
        
        
        // related
        $scope.relatedActive = function () {
            var related = $scope.article.related;
            if (!related || !related.length) { return false; }
            for (var i = 0; i < related.length; i++) {
                if (related[i].active) { return true; }
            }
            return false;
        };
        
        $scope.getType = function (item) {
            if (!item.articleType[1]) {
                switch (item.articleType[0]) {
                    case 'hs' : return 'hearthstone'; break;
                    case 'ts' : return 'tempostorm'; break;
                    case 'hots' : return 'heroes'; break;
                }
            } else {
                return 'tempostorm';
            }
        }
        
        //vote
        var box,
            callback;
        
        function checkVotes () {
            for (var i = 0; i < $scope.article.votes.length; i++) {
                if (typeof($scope.article.votes[i]) === 'object') {
                    if ($scope.article.votes[i].userID == $scope.app.user.getUserID()) {
                        $scope.hasVoted = true;
                        break;
                    }
                } else {
                    if ($scope.article.votes[i] == $scope.app.user.getUserID()) {
                        $scope.hasVoted = true;
                        break;
                    }
                }
            }
            return $scope.hasVoted
        }
        
        $scope.voteArticle = function (article) {
            vote(article);       
        };
        
        function vote(article) {
            if (!$scope.app.user.isLogged()) {
                LoginModalService.showModal('login', function() {
                    vote(article);
                });
            } else {
                if (!$scope.hasVoted) {
                    VoteService.voteArticle(article).then(function (data) {
                        if (data.success) {
                            $scope.hasVoted = true;
                            article.votesCount = data.votesCount;
                        }
                    });
                }
            }
            checkVotes();
            updateCommentVotes();
        };
        
        // comments
        var defaultComment = {
            comment: ''
        };
        $scope.comment = angular.copy(defaultComment);
        
        $scope.commentPost = function () {
            if (!$scope.app.user.isLogged()) {
                LoginModalService.showModal('login', function () {
                    $scope.commentPost();
                });
            } else {
                ArticleService.addComment($scope.article, $scope.comment).success(function (data) {
                    if (data.success) {
                        $scope.article.comments.push(data.comment);
                        $scope.comment.comment = '';
                    }
                });
            }
        };
        
        if ($scope.app.user.isLogged()) {
            updateCommentVotes();
        }
        
        function updateCommentVotes() {
            $scope.article.comments.forEach(checkVotes);
            
            function checkVotes (comment) {
                var vote = comment.votes.filter(function (vote) {
                    return ($scope.app.user.getUserID() === vote.userID);
                })[0];
                
                if (vote) {
                    comment.voted = vote.direction;
                }
            }
        }
                
        $scope.voteComment = function (direction, comment) {
            if (!$scope.app.user.isLogged()) {
                LoginModalService.showModal('login', function () {
                    $scope.voteComment(direction, comment);
                });
            } else {
                if (comment.author._id === $scope.app.user.getUserID()) {
                    bootbox.alert("You can't vote for your own content.");
                    return false;
                }
                VoteService.voteComment(direction, comment).then(function (data) {
                    if (data.success) {
                        comment.voted = direction;
                        comment.votesCount = data.votesCount;
                    }
                });
            }
            checkVotes();
            updateCommentVotes();
        };
        
        // get premium
        $scope.getPremium = function (plan) {
            if ($scope.app.user.isLogged()) {
                if (!$scope.app.user.isSubscribed()) {
                    $state.transitionTo('app.profile.subscription', { username: $scope.app.user.getUsername(), plan: plan });
                }
            } else {
                LoginModalService.showModal('login', function () {
                    if (!$scope.app.user.isSubscribed() && !$scope.app.user.isAdmin() && !$scope.app.user.isProvider()) {
                        $scope.getPremium(plan);
                    }
                });
            }
        }
    }
])
.controller('DecksCtrl', ['$scope', '$state', '$timeout', '$q', 'AjaxPagination', 'Hearthstone', 'Util', 'DeckService', 'dataDecksTempostorm', 'dataDecksCommunity', 
    function ($scope, $state, $timeout, $q, AjaxPagination, Hearthstone, Util, DeckService, dataDecksTempostorm, dataDecksCommunity) {
        $scope.metaservice.setOg('https://tempostorm.com/hearthstone/decks');
        
        // decks
        $scope.deckSearch = '';
        $scope.tempostormDecks = dataDecksTempostorm.decks;
        $scope.communityDecks = dataDecksCommunity.decks;
        
        // filters
        $scope.filters = {
            classes: [],
            search: ''
        };
        $scope.classes = angular.copy(Hearthstone.classes).splice(1, 9);
        
        var initializing = true;
        $scope.$watch(function(){ return $scope.filters; }, function (value) {
            if (initializing) {
                $timeout(function () {
                    initializing = false;
                });
            } else {
                updateTempostormDecks(1, 4);
                updateCommunityDecks(1, 12);
            }
        }, true);
        
        $scope.dustFormatted = function (dust) {
            return Util.numberWithCommas(dust);
        }
        
        $scope.newSearch = function () {
            $scope.filters.search = $scope.deckSearch;
        }
        
        // pagination
        function updateTempostormDecks (page, perpage, callback) {
            DeckService.getDecksFeatured($scope.filters.classes, page, perpage, $scope.filters.search).then(function (data) {
                $scope.tempostormPagination.total = data.total;
                $scope.tempostormPagination.page = page;
                $timeout(function () {
                    $scope.tempostormDecks = data.decks;

                    if (callback) {
                        return callback(data);
                    }
                });
            });
        }
        
        $scope.tempostormPagination = AjaxPagination.new(4, dataDecksTempostorm.total,
            function (page, perpage) {
                var d = $q.defer();

                updateTempostormDecks(page, perpage, function (data) {
                    d.resolve(data.total);
                });

                return d.promise;
            }
        );
        
        function updateCommunityDecks (page, perpage, callback) {
            DeckService.getDecksCommunity($scope.filters.classes, page, perpage, $scope.filters.search).then(function (data) {
                $scope.communityPagination.total = data.total;
                $scope.communityPagination.page = page;
                $timeout(function () {
                    $scope.communityDecks = data.decks;

                    if (callback) {
                        return callback(data);
                    }
                });
            });
        }
        
        $scope.communityPagination = AjaxPagination.new(12, dataDecksCommunity.total,
            function (page, perpage) {
                var d = $q.defer();

                updateCommunityDecks(page, perpage, function (data) {
                    d.resolve(data.total);
                });

                return d.promise;
            }
        );
        
        //is premium
        $scope.isPremium = function (guide) {
            if (!guide.premium.isPremium) { return false; }
            var now = new Date().getTime(),
                expiry = new Date(guide.premium.expiryDate).getTime();
            if (expiry > now) {
                return true;
            } else {
                return false;
            }
        }
    }
])
.controller('DeckCtrl', ['$scope', '$state', '$sce', '$compile', '$window', 'bootbox', 'Hearthstone', 'DeckService', 'VoteService', 'data', 'MetaService', 'LoginModalService',
    function ($scope, $state, $sce, $compile, $window, bootbox, Hearthstone, DeckService, VoteService, data, MetaService, LoginModalService) {
        if (!data || !data.success) { return $state.go('app.hs.decks.list'); }

        // load deck
        $scope.deck = data.deck;
        $scope.DeckService = DeckService;
        
        $scope.premiumTypes = [
            { text: 'No', value: false },
            { text: 'Yes', value: true }
        ];
        
        $scope.isPremium = function () {
            if (!$scope.deck.premium.isPremium) { return false; }
            var now = new Date().getTime(),
                expiry = new Date($scope.deck.premium.expiryDate).getTime();
            if (expiry > now) {
                return true;
            } else {
                return false;
            }
        }
        
        $scope.metaservice = MetaService;
        $scope.metaservice.set($scope.deck.name + ' - Decks', $scope.deck.description);
        
        var ogImg = $scope.app.cdn + 'img/decks/' + $scope.deck.playerClass + '.png';
        $scope.metaservice.setOg('https://tempostorm.com/hearthstone/decks/' + $scope.deck.slug, $scope.deck.name, $scope.deck.description, 'article', ogImg.toLowerCase());
        
        // classes
        $scope.classes = angular.copy(Hearthstone.classes).splice(1, 9);
        
        // show
        if (!$scope.app.settings.show.deck) {
            $scope.app.settings.show['deck'] = {
                mana: true,
                description: true,
                mulligans: true,
                video: true,
                matchups: true,
                gameplay: true,
                stats: true,
                comments: true
            };
        }
        $scope.show = $scope.app.settings.show.deck;
        $scope.$watch('show', function(){ $scope.app.settings.show.deck = $scope.show; }, true);
        
        // mulligans
        $scope.coin = true;
        
        $scope.toggleCoin = function () {
            $scope.coin = !$scope.coin;
        }
        
        $scope.getFirstMulligan = function () {
            var mulligans = $scope.deck.mulligans;
            for (var i = 0; i < mulligans.length; i++) {
                if ($scope.isMulliganSet(mulligans[i]) === true) {
                    return mulligans[i];
                }
            }
            return false;
        }
        
        $scope.getMulligan = function (klass) {
            var mulligans = $scope.deck.mulligans;
            for (var i = 0; i < mulligans.length; i++) {
                if (mulligans[i].klass === klass) {
                    return mulligans[i];
                }
            }
            return false;
        }
        
        $scope.setMulligan = function (mulligan) {
            $scope.currentMulligan = mulligan;
        };
        
        $scope.isMulliganSet = function (mulligan) {
            return (mulligan.withCoin.cards.length > 0 || mulligan.withCoin.instructions.length > 0 || mulligan.withoutCoin.cards.length > 0 || mulligan.withoutCoin.instructions.length > 0);
        };
        
        $scope.anyMulliganSet = function () {
            var mulligans = $scope.deck.mulligans;
            for (var i = 0; i < mulligans.length; i++) {
                if ($scope.isMulliganSet(mulligans[i]) === true) {
                    return true;
                }
            }
            return false;
        };
        
        $scope.mulliganHide = function (card) {
            if (!$scope.anyMulliganSet()) { return false; }
            if (!$scope.currentMulligan) { return false; }
            var cards = ($scope.coin) ? $scope.currentMulligan.withCoin.cards : $scope.currentMulligan.withoutCoin.cards;

            for (var i = 0; i < cards.length; i++) {
                if (cards[i]._id === card.card._id) { return false; }
            }

            return true;
        }
        
        $scope.getMulliganInstructions = function () {
            if (!$scope.currentMulligan) { return false; }
            var m = $scope.currentMulligan;
            return ($scope.coin) ? m.withCoin.instructions : m.withoutCoin.instructions;
        };
        
        $scope.getMulliganCards = function () {
            if (!$scope.currentMulligan) { return false; }
            var m = $scope.currentMulligan;
            return ($scope.coin) ? m.withCoin.cards : m.withoutCoin.cards;
        };
        
        $scope.cardLeft = function ($index) {
            return (80 / ($scope.getMulliganCards().length)) * $index;
        };
        
        $scope.cardRight = function () {
            return $scope.getMulliganCards().length * 80 / 2;
        };
        
        // charts
        $scope.charts = {
            colors: ['rgba(151,187,205,1)', 'rgba(151,187,205,1)', 'rgba(151,187,205,1)', 'rgba(151,187,205,1)']
        };
        
        $scope.labels = ["Download Sales", "In-Store Sales", "Mail-Order Sales"];
        $scope.data = [300, 500, 100];
        
        $scope.getVideo = function () {
            return $scope.getContent('<iframe src="//www.youtube.com/embed/' + $scope.deck.video + '" frameborder="0" height="360" width="100%" allowfullscreen></iframe>');
        };
        
        $scope.getContent = function (content) {
            return $sce.trustAsHtml(content);
        };
        
        
        //matches
        $scope.mouseOver = '';
        $scope.setMouseOver = function (deck) {
            (deck != false) ? $scope.mouseOver = deck : $scope.mouseOver = false;
        }
        
        $scope.getMouseOver = function (deck) {
            return $scope.mouseOver;
        }
        
        // deck dust
        $scope.deck.getDust = function () {
            var dust = 0;
            for (var i = 0; i < $scope.deck.cards.length; i++) {
                dust += $scope.deck.cards[i].qty * $scope.deck.cards[i].card.dust;
            }
            return dust;
        };
        
        // mana curve
        $scope.deck.manaCurve = function (mana) {
            var big = 0,
                cnt;
            // figure out largest mana count
            for (var i = 0; i <= 7; i++) {
                cnt = $scope.deck.manaCount(i);
                if (cnt > big) big = cnt;
            }

            if (big === 0) return 0;

            return Math.ceil($scope.deck.manaCount(mana) / big * 98);
        };

        // mana count
        $scope.deck.manaCount = function (mana) {
            var cnt = 0;
            for (var i = 0; i < $scope.deck.cards.length; i++) {
                if ($scope.deck.cards[i].card.cost === mana || (mana === 7 && $scope.deck.cards[i].card.cost >= 7)) {
                    cnt += $scope.deck.cards[i].qty;
                }
            }
            return cnt;
        };
        
        // voting
        $scope.voteDown = function (deck) {
            vote(-1, deck);
        };
        
        $scope.voteUp = function (deck) {
            vote(1, deck)       
        };
        
        var box,
            callback;
        
        updateVotes();
        function updateVotes() {
            checkVotes($scope.deck);
            
            function checkVotes (deck) {
                var vote = deck.votes.filter(function (vote) {
                    return ($scope.app.user.getUserID() === vote.userID);
                })[0];
                
                if (vote) {
                    deck.voted = vote.direction;
                }
            }
        }
                
        function vote(direction, deck) {
            if (!$scope.app.user.isLogged()) {
                LoginModalService.showModal('login', function () {
                    vote(direction, deck);
                });
            } else {
                if (deck.author._id === $scope.app.user.getUserID()) {
                    bootbox.alert("You can't vote for your own content.");
                    return false;
                }
                VoteService.voteDeck(direction, deck).then(function (data) {
                    if (data.success) {
                        deck.voted = direction;
                        deck.votesCount = data.votesCount;
                    }
                });
            }
            updateCommentVotes();
            updateVotes();
        };
        
        // get premium
        $scope.getPremium = function (plan) {
            if ($scope.app.user.isLogged()) {
                if (!$scope.app.user.isSubscribed()) {
                    $state.transitionTo('app.profile.subscription', { username: $scope.app.user.getUsername(), plan: plan });
                }
            } else {
                LoginModalService.showModal('login', function () {
                    if (!$scope.app.user.isSubscribed() && !$scope.app.user.isAdmin() && !$scope.app.user.isProvider()) {
                        $scope.getPremium(plan);
                    }
                });
            }
        }
    }
])
.controller('ForumCategoryCtrl', ['$scope', 'data', 'MetaService',
    function ($scope, data, MetaService) {
        $scope.categories = data.categories;
        $scope.metaservice.setOg('https://tempostorm.com/forum');
    }
])
.controller('ForumThreadCtrl', ['$scope', 'Pagination', 'data', 'MetaService',
    function ($scope, Pagination, data, MetaService) {
        $scope.thread = data.thread;
        
        $scope.metaservice = MetaService;
        $scope.metaservice.set($scope.thread.title + ' - Forum');
        
        $scope.metaservice.setOg('https://tempostorm.com/forum/' + $scope.thread.slug.url, $scope.thread.title);
        
        // page flipping
        $scope.pagination = Pagination.new(20);
        $scope.pagination.results = function () {
            return $scope.thread.posts.length;
        };
    }
])
.controller('ForumAddCtrl', ['$scope', '$location', '$window', '$compile', 'bootbox', 'ForumService', 'UserService', 'AuthenticationService', 'SubscriptionService', 'data', 
    function ($scope, $location, $window, $compile, bootbox, ForumService, UserService, AuthenticationService, SubscriptionService, data) {
        // thread
        $scope.thread = data.thread;
        
        // post
        var defaultPost = {
            title: '',
            content: ''
        };
        
        $scope.post = angular.copy(defaultPost);
        
        // summernote options
        $scope.options = {
          disableDragAndDrop: true,
          height: 300,
          toolbar: [
            ['style', ['bold', 'italic', 'underline', 'strikethrough', 'clear']],
            ['fontsize', ['fontsize']],
            ['color', ['color']],
            ['para', ['ul', 'ol', 'paragraph']],
            ['insert', ['link', 'picture', 'video']],
            ['format', ['hr']],
            ['misc', ['undo', 'redo']]
          ]
        };
        
        var box,
            callback;
        $scope.addPost = function () {
            if (!$scope.app.user.isLogged()) {
                box = bootbox.dialog({
                    title: 'Login Required',
                    message: $compile('<div login-form></div>')($scope)
                });
                box.modal('show');
                callback = function () {
                    $scope.addPost();
                };
            } else {
                ForumService.addPost($scope.thread, $scope.post).success(function (data) {
                    if (data.success) {
                        $location.path('/forum/' + $scope.thread.slug.url);
                    } else {
                        $scope.errors = data.errors;
                        $scope.showError = true;
                        $window.scrollTo(0,0);
                    }
                });
            }
        };

        // login for modal
        $scope.login = function login(email, password) {
            if (email !== undefined && password !== undefined) {
                UserService.login(email, password).success(function(data) {
                    AuthenticationService.setLogged(true);
                    AuthenticationService.setAdmin(data.isAdmin);
                    AuthenticationService.setProvider(data.isProvider);
                    
                    SubscriptionService.setSubscribed(data.subscription.isSubscribed);
                    SubscriptionService.setTsPlan(data.subscription.plan);
                    SubscriptionService.setExpiry(data.subscription.expiry);
                    
                    $window.sessionStorage.userID = data.userID;
                    $window.sessionStorage.username = data.username;
                    $window.sessionStorage.email = data.email;
                    $scope.app.settings.token = $window.sessionStorage.token = data.token;
                    box.modal('hide');
                    callback();
                }).error(function() {
                    $scope.showError = true;
                });
            }
        }

    }
])
.controller('ForumPostCtrl', ['$scope', '$sce', '$compile', '$window', 'bootbox', 'ForumService', 'UserService', 'AuthenticationService', 'VoteService', 'SubscriptionService', 'data', 'MetaService',
    function ($scope, $sce, $compile, $window, bootbox, ForumService, UserService, AuthenticationService, VoteService, SubscriptionService, data, MetaService) {
        
        
        $scope.post = data.post;
        $scope.ForumService = ForumService;
        $scope.thread = data.thread;
        
        $scope.metaservice = MetaService;
        $scope.metaservice.set($scope.post.title + ' - ' + $scope.thread.title);
        
        $scope.metaservice.setOg('https://tempostorm.com/forum/' + $scope.thread.slug.url + '/' + $scope.post.slug.url, $scope.post.title, $scope.post.content);
        
        
        var defaultComment = {
            comment: ''
        };
        $scope.comment = angular.copy(defaultComment);
        
        $scope.post.getContent = function () {
            return $sce.trustAsHtml($scope.post.content);
        };
        
        var box,
            callback;
        $scope.commentPost = function () {
            if (!$scope.app.user.isLogged()) {
                box = bootbox.dialog({
                    title: 'Login Required',
                    message: $compile('<div login-form></div>')($scope)
                });
                box.modal('show');
                callback = function () {
                    $scope.commentPost();
                };
            } else {
                ForumService.addComment($scope.post, $scope.comment).success(function (data) {
                    if (data.success) {
                        $scope.post.comments.push(data.comment);
                        $scope.comment.comment = '';
                        updateVotes();
                    }
                });
            }
        };
        
        if ($scope.app.user.isLogged()) {
            updateVotes();
        }
        function updateVotes() {
            $scope.post.comments.forEach(checkVotes);
            
            function checkVotes (comment) {
                var vote = comment.votes.filter(function (vote) {
                    return ($scope.app.user.getUserID() === vote.userID);
                })[0];
                
                if (vote) {
                    comment.voted = vote.direction;
                }
            }
        }
                
        $scope.voteComment = function (direction, comment) {
            if (!$scope.app.user.isLogged()) {
                box = bootbox.dialog({
                    title: 'Login Required',
                    message: $compile('<div login-form></div>')($scope)
                });
                box.modal('show');
                callback = function () {
                    $scope.voteComment(direction, comment);
                };
            } else {
                if (comment.author._id === $scope.app.user.getUserID()) {
                    bootbox.alert("You can't vote for your own content.");
                    return false;
                }
                VoteService.voteComment(direction, comment).then(function (data) {
                    if (data.success) {
                        comment.voted = direction;
                        comment.votesCount = data.votesCount;
                    }
                });
            }
        };
        
        // login for modal
        $scope.login = function login(email, password) {
            if (email !== undefined && password !== undefined) {
                UserService.login(email, password).success(function(data) {
                    AuthenticationService.setLogged(true);
                    AuthenticationService.setAdmin(data.isAdmin);
                    AuthenticationService.setProvider(data.isProvider);
                    
                    SubscriptionService.setSubscribed(data.subscription.isSubscribed);
                    SubscriptionService.setTsPlan(data.subscription.plan);
                    SubscriptionService.setExpiry(data.subscription.expiry);
                    
                    $window.sessionStorage.userID = data.userID;
                    $window.sessionStorage.username = data.username;
                    $window.sessionStorage.email = data.email;
                    $scope.app.settings.token = $window.sessionStorage.token = data.token;
                    box.modal('hide');
                    callback();
                }).error(function() {
                    $scope.showError = true;
                });
            }
        }
    }
])
.controller('AdminForumStructureListCtrl', ['$scope', 'bootbox', 'AlertService', 'AdminForumService', 'data', 
    function ($scope, bootbox, AlertService, AdminForumService, data) {
        // grab alerts
        if (AlertService.hasAlert()) {
            $scope.success = AlertService.getSuccess();
            AlertService.reset();
        }
        
        // load categories
        $scope.categories = data.categories;
        
        // delete category
        $scope.deleteCategory = function (category) {
            var box = bootbox.dialog({
                title: 'Delete category: ' + category.title + '?',
                message: 'Are you sure you want to delete the category <strong>' + category.title + '</strong>?',
                buttons: {
                    delete: {
                        label: 'Delete',
                        className: 'btn-danger',
                        callback: function () {
                            AdminForumService.deleteCategory(category._id).then(function (data) {
                                if (data.success) {
                                    var index = $scope.categories.indexOf(category);
                                    if (index !== -1) {
                                        $scope.categories.splice(index, 1);
                                    }
                                    $scope.success = {
                                        show: true,
                                        msg: category.title + ' deleted successfully.'
                                    };
                                }
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
                }
            });
            box.modal('show');
        };

        // delete thread
        $scope.deleteThread = function (thread) {
            var box = bootbox.dialog({
                title: 'Delete thread: ' + thread.title + '?',
                message: 'Are you sure you want to delete the thread <strong>' + thread.title + '</strong>?',
                buttons: {
                    delete: {
                        label: 'Delete',
                        className: 'btn-danger',
                        callback: function () {
                            AdminForumService.deleteThread(thread._id, thread.category).then(function (data) {
                                if (data.success) {
                                    var index = $scope.threads.indexOf(thread);
                                    if (index !== -1) {
                                        $scope.threads.splice(index, 1);
                                    }
                                    $scope.success = {
                                        show: true,
                                        msg: thread.title + ' deleted successfully.'
                                    };
                                }
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
                }
            });
            box.modal('show');
        };
    }
])
.controller('AdminForumCategoryAddCtrl', ['$scope', '$state', '$window', 'AdminForumService', 'AlertService', 
    function ($scope, $state, $window, AdminForumService, AlertService) {
        // default category
        var defaultCategory = {
            title : '',
            active: true
        };
        
        // load category
        $scope.category = angular.copy(defaultCategory);
        
        // select options
        $scope.categoryActive = [
            { name: 'Yes', value: true },
            { name: 'No', value: false }
        ];
        
        $scope.addCategory = function () {
            $scope.showError = false;

            AdminForumService.addCategory($scope.category).success(function (data) {
                if (!data.success) {
                    $scope.errors = data.errors;
                    $scope.showError = true;
                    $window.scrollTo(0,0);
                } else {
                    AlertService.setSuccess({ show: true, msg: $scope.category.title + ' has been added successfully.' });
                    $state.go('app.admin.forum.categories.list');
                }
            });
        };
    }
])
.controller('AdminForumCategoryEditCtrl', ['$scope', '$state', '$window', 'AdminForumService', 'AlertService', 'data', 
    function ($scope, $state, $window, AdminForumService, AlertService, data) {
        // load category
        $scope.category = data.category;
        
        // select options
        $scope.categoryActive = [
            { name: 'Yes', value: true },
            { name: 'No', value: false }
        ];
        
        $scope.editCategory = function () {
            $scope.showError = false;

            AdminForumService.editCategory($scope.category).success(function (data) {
                if (!data.success) {
                    $scope.errors = data.errors;
                    $scope.showError = true;
                    $window.scrollTo(0,0);
                } else {
                    AlertService.setSuccess({ show: true, msg: $scope.category.title + ' has been updated successfully.' });
                    $state.go('app.admin.forum.categories.list');
                }
            });
        };
    }
])
.controller('AdminForumThreadAddCtrl', ['$scope', '$state', '$window', 'Util', 'AdminForumService', 'AlertService', 'data', 
    function ($scope, $state, $window, Util, AdminForumService, AlertService, data) {
        // default thread
        var defaultThread = {
            category: data.categories[0]._id || '',
            title : '',
            description: '',
            slug: {
                url: '',
                linked: true
            },
            active: true
        };
        
        // load thread
        $scope.thread = angular.copy(defaultThread);
        
        $scope.setSlug = function () {
            if (!$scope.thread.slug.linked) { return false; }
            $scope.thread.slug.url = Util.slugify($scope.thread.title);
        };
        
        $scope.toggleSlugLink = function () {
            $scope.thread.slug.linked = !$scope.thread.slug.linked;
            $scope.setSlug();
        };
        
        // select options
        $scope.selectCategories = data.categories;
        $scope.threadActive = [
            { name: 'Yes', value: true },
            { name: 'No', value: false }
        ];
        
        $scope.addThread = function () {
            $scope.showError = false;

            AdminForumService.addThread($scope.thread).success(function (data) {
                if (!data.success) {
                    $scope.errors = data.errors;
                    $scope.showError = true;
                    $window.scrollTo(0,0);
                } else {
                    AlertService.setSuccess({ show: true, msg: $scope.thread.title + ' has been added successfully.' });
                    $state.go('app.admin.forum.categories.list');
                }
            });
        };
    }
])
.controller('AdminForumThreadEditCtrl', ['$scope', '$state', '$window', 'Util', 'AdminForumService', 'AlertService', 'dataCategories', 'dataThread', 
    function ($scope, $state, $window, Util, AdminForumService, AlertService, dataCategories, dataThread) {
        // load thread
        $scope.thread = dataThread.thread;
        
        $scope.setSlug = function () {
            if (!$scope.thread.slug.linked) { return false; }
            $scope.thread.slug.url = Util.slugify($scope.thread.title);
        };
        
        $scope.toggleSlugLink = function () {
            $scope.thread.slug.linked = !$scope.thread.slug.linked;
            $scope.setSlug();
        };
        
        // select options
        $scope.selectCategories = dataCategories.categories;
        $scope.threadActive = [
            { name: 'Yes', value: true },
            { name: 'No', value: false }
        ];
        
        $scope.editThread = function () {
            $scope.showError = false;

            AdminForumService.editThread($scope.thread).success(function (data) {
                if (!data.success) {
                    $scope.errors = data.errors;
                    $scope.showError = true;
                    $window.scrollTo(0,0);
                } else {
                    AlertService.setSuccess({ show: true, msg: $scope.thread.title + ' has been updated successfully.' });
                    $state.go('app.admin.forum.categories.list');
                }
            });
        };
    }
])
.controller('Twitch', ['$scope', 
    function ($scope) {
        $scope.login = function () {
            window.location.replace('/auth/twitch');
        };
        
        $scope.signup = function () {
            window.location.replace('/auth/twitch');
        };
    }
])
.controller('Bnet', ['$scope', 
    function ($scope) {
        $scope.login = function () {
            window.location.replace('/auth/bnet');
        };
    }
])
/* admin hots */
.controller('AdminHeroListCtrl', ['$scope', 'AdminHeroService', 'AlertService', 'Pagination', 'data', 
    function ($scope, AdminHeroService, AlertService, Pagination, data) {
        // grab alerts
        if (AlertService.hasAlert()) {
            $scope.success = AlertService.getSuccess();
            AlertService.reset();
        }
        
        // load heroes
        $scope.heroes = data.heroes;
        $scope.page = data.page;
        $scope.perpage = data.perpage;
        $scope.total = data.total;
        $scope.search = data.search;
        
        $scope.getHeroes = function () {
            AdminHeroService.getHeroes($scope.page, $scope.perpage, $scope.search).then(function (data) {
                $scope.heroes = data.heroes;
                $scope.page = data.page;
                $scope.total = data.total;
            });
        }
        
        $scope.searchHeroes = function () {
            $scope.page = 1;
            $scope.getHeroes();
        }
        
        // pagination
        $scope.pagination = {
            page: function () {
                return $scope.page;
            },
            perpage: function () {
                return $scope.perpage;
            },
            results: function () {
                return $scope.total;
            },
            setPage: function (page) {
                $scope.page = page;
                $scope.getHeroes();
            },
            pagesArray: function () {
                var pages = [],
                    start = 1,
                    end = this.totalPages();
                
                if (this.totalPages() > 5) {
                    if (this.page() < 3) {
                        start = 1;
                        end = start + 4;
                    } else if (this.page() > this.totalPages() - 2) {
                        end = this.totalPages();
                        start = end - 4;
                    } else {
                        start = this.page() - 2;
                        end = this.page() + 2;
                    }
                    
                }
                
                for (var i = start; i <= end; i++) {
                    pages.push(i);
                }
                
                return pages;
            },
            isPage: function (page) {
                return (page === this.page());
            },
            totalPages: function (page) {
                return (this.results() > 0) ? Math.ceil(this.results() / this.perpage()) : 0;
            },
            from: function () {
                return (this.page() * this.perpage()) - this.perpage() + 1;
            },
            to: function () {
                return ((this.page() * this.perpage()) > this.results()) ? this.results() : this.page() * this.perpage();
            }
        };
        
        // delete hero
        $scope.deleteHero = function deleteHero(hero) {
            var box = bootbox.dialog({
                title: 'Delete hero: ' + hero.name + '?',
                message: 'Are you sure you want to delete the hero <strong>' + hero.name + '</strong>?',
                buttons: {
                    delete: {
                        label: 'Delete',
                        className: 'btn-danger',
                        callback: function () {
                            AdminHeroService.deleteHero(hero._id).then(function (data) {
                                if (data.success) {
                                    var index = $scope.heroes.indexOf(hero);
                                    if (index !== -1) {
                                        $scope.heroes.splice(index, 1);
                                    }
                                    $scope.success = {
                                        show: true,
                                        msg: hero.name + ' deleted successfully.'
                                    };
                                }
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
                }
            });
            box.modal('show');
        }
    }
])
.controller('AdminHeroAddCtrl', ['$scope', '$state', '$window', '$compile', 'bootbox', 'Util', 'HOTS', 'AlertService', 'AdminHeroService', 
    function ($scope, $state, $window, $compile, bootbox, Util, HOTS, AlertService, AdminHeroService) {
        // default hero
        var defaultHero = {
                name : '',
                description: '',
                title: '',
                role: HOTS.roles[0],
                heroType: HOTS.types[0],
                universe: HOTS.universes[0],
                manaType: HOTS.manaTypes[0],
                abilities: [],
                talents: [],
                characters: [],
                price: {
                    gold: ''
                },
                className: '',
                active: true
            },
            defaultAbility = {
                name: '',
                abilityType: HOTS.abilityTypes[0],
                mana: '',
                cooldown: '',
                description: '',
                damage: '',
                healing: '',
                className: '',
                orderNum: 1
            },
            defaultTalent = {
                name: '',
                tier: HOTS.tiers[0],
                description: '',
                ability: null,
                className: '',
                orderNum: 1
            },
            defaultCharacter = {
                name: '',
                stats: {
                    base: {
                        health: 0,
                        healthRegen: 0,
                        mana: 0,
                        manaRegen: 0,
                        attackSpeed: 0,
                        range: 0,
                        damage: 0
                    },
                    gain: {
                        health: 0,
                        healthRegen: 0,
                        mana: 0,
                        manaRegen: 0,
                        attackSpeed: 0,
                        range: 0,
                        damage: 0
                    }
                }
            };
        
        // load hero
        $scope.hero = angular.copy(defaultHero);
        
        // roles
        $scope.roles = HOTS.roles;
        
        // types
        $scope.heroTypes = HOTS.types;
        
        // universe
        $scope.universes = HOTS.universes;
        
        // mana types
        $scope.manaTypes = HOTS.manaTypes;
        
        // select options
        $scope.heroActive = [
            { name: 'Yes', value: true },
            { name: 'No', value: false }
        ];
        
        // abilities
        $scope.abilityTypes = HOTS.abilityTypes;
        var box;
        $scope.abilityAddWnd = function () {
            $scope.currentAbility = angular.copy(defaultAbility);
            Util.getObjectID().success(function (data) {
                if (data.success) {
                    $scope.currentAbility._id = data.id;
                    box = bootbox.dialog({
                        title: 'Add Ability',
                        message: $compile('<div ability-add-form></div>')($scope)
                    });
                }
            });
        };

        $scope.abilityEditWnd = function (ability) {
            $scope.currentAbility = ability;
            box = bootbox.dialog({
                title: 'Edit Ability',
                message: $compile('<div ability-edit-form></div>')($scope)
            });
        };

        $scope.addAbility = function () {
            $scope.currentAbility.orderNum = $scope.hero.abilities.length + 1;
            $scope.hero.abilities.push($scope.currentAbility);
            box.modal('hide');
            $scope.currentAbility = false;
        };
        
        $scope.editAbility = function (ability) {
            box.modal('hide');
            $scope.currentAbility = false;
        };
        
        $scope.deleteAbility = function (ability) {
            var index = $scope.hero.abilities.indexOf(ability);
            $scope.hero.abilities.splice(index, 1);
            
            for (var i = 0; i < $scope.hero.abilities.length; i++) {
                $scope.hero.abilities[i].orderNum = i + 1;
            }
        };
        
        // talents
        $scope.talentTiers = HOTS.tiers;
        $scope.talentAddWnd = function () {
            $scope.currentTalent = angular.copy(defaultTalent);
            $scope.talentAbilities = [{ _id: undefined, name: 'None' }].concat($scope.hero.abilities);
            box = bootbox.dialog({
                title: 'Add Talent',
                message: $compile('<div talent-add-form></div>')($scope)
            });
        };

        $scope.talentEditWnd = function (talent) {
            $scope.currentTalent = talent;
            $scope.talentAbilities = [{ _id: undefined, name: 'None' }].concat($scope.hero.abilities);
            box = bootbox.dialog({
                title: 'Edit Talent',
                message: $compile('<div talent-edit-form></div>')($scope)
            });
        };
        
        $scope.addTalent = function () {
            $scope.currentTalent.orderNum = $scope.hero.talents.length + 1;
            $scope.hero.talents.push($scope.currentTalent);
            box.modal('hide');
            $scope.currentTalent = false;
        };
        
        $scope.editTalent = function (talent) {
            box.modal('hide');
            $scope.currentAbility = false;
        };
        
        $scope.deleteTalent = function (talent) {
            var index = $scope.hero.talents.indexOf(talent);
            $scope.hero.talents.splice(index, 1);
            
            for (var i = 0; i < $scope.hero.talents.length; i++) {
                $scope.hero.talents[i].orderNum = i + 1;
            }
        };
                
        // characters
        $scope.charAddWnd = function () {
            $scope.currentCharacter = angular.copy(defaultCharacter);
            box = bootbox.dialog({
                title: 'Add Character',
                message: $compile('<div char-add-form></div>')($scope)
            });
        };

        $scope.charEditWnd = function (character) {
            $scope.currentCharacter = character;
            box = bootbox.dialog({
                title: 'Edit Character',
                message: $compile('<div char-edit-form></div>')($scope)
            });
        };

        $scope.addCharacter = function () {
            $scope.hero.characters.push($scope.currentCharacter);
            box.modal('hide');
            $scope.currentCharacter = false;
        };
        
        $scope.editCharacter = function (character) {
            box.modal('hide');
            $scope.currentCharacter = false;
        };
        
        $scope.deleteChar = function (character) {
            var index = $scope.hero.characters.indexOf(character);
            $scope.hero.characters.splice(index, 1);
        };

        $scope.updateDND = function (list, index) {
            list.splice(index, 1);
            
            for (var i = 0; i < list.length; i++) {
                list[i].orderNum = i + 1;
            }
        };
        
        $scope.addHero = function () {
            $scope.showError = false;

            AdminHeroService.addHero($scope.hero).success(function (data) {
                if (!data.success) {
                    $scope.errors = data.errors;
                    $scope.showError = true;
                    $window.scrollTo(0,0);
                } else {
                    AlertService.setSuccess({ show: true, msg: $scope.hero.name + ' has been added successfully.' });
                    $state.go('app.admin.hots.heroes.list');
                }
            });
        };
    }
])
.controller('AdminHeroEditCtrl', ['$scope', '$state', '$window', '$compile', 'bootbox', 'Util', 'HOTS', 'AlertService', 'AdminHeroService', 'data', 
    function ($scope, $state, $window, $compile, bootbox, Util, HOTS, AlertService, AdminHeroService, data) {
        // defaults
        var defaultAbility = {
                name: '',
                abilityType: HOTS.abilityTypes[0],
                mana: '',
                cooldown: '',
                description: '',
                damage: '',
                healing: '',
                className: '',
                orderNum: 1
            },
            defaultTalent = {
                name: '',
                tier: HOTS.tiers[0],
                description: '',
                ability: null,
                className: '',
                orderNum: 1
            },
            defaultCharacter = {
                name: '',
                stats: {
                    base: {
                        health: 0,
                        healthRegen: 0,
                        mana: 0,
                        manaRegen: 0,
                        attackSpeed: 0,
                        range: 0,
                        damage: 0
                    },
                    gain: {
                        health: 0,
                        healthRegen: 0,
                        mana: 0,
                        manaRegen: 0,
                        attackSpeed: 0,
                        range: 0,
                        damage: 0
                    }
                }
            };
        
        // load hero
        $scope.hero = data.hero;
        
        // roles
        $scope.roles = HOTS.roles;
        
        // types
        $scope.heroTypes = HOTS.types;
        
        // universe
        $scope.universes = HOTS.universes;

        // mana types
        $scope.manaTypes = HOTS.manaTypes;

        // select options
        $scope.heroActive = [
            { name: 'Yes', value: true },
            { name: 'No', value: false }
        ];
        
        // abilities
        $scope.abilityTypes = HOTS.abilityTypes;
        var box;
        $scope.abilityAddWnd = function () {
            $scope.currentAbility = angular.copy(defaultAbility);
            Util.getObjectID().success(function (data) {
                if (data.success) {
                    $scope.currentAbility._id = data.id;
                    box = bootbox.dialog({
                        title: 'Add Ability',
                        message: $compile('<div ability-add-form></div>')($scope)
                    });
                }
            });
        };

        $scope.abilityEditWnd = function (ability) {
            $scope.currentAbility = ability;
            box = bootbox.dialog({
                title: 'Edit Ability',
                message: $compile('<div ability-edit-form></div>')($scope)
            });
        };

        $scope.addAbility = function () {
            $scope.currentAbility.orderNum = $scope.hero.abilities.length + 1;
            $scope.hero.abilities.push($scope.currentAbility);
            box.modal('hide');
            $scope.currentAbility = false;
        };
        
        $scope.editAbility = function (ability) {
            box.modal('hide');
            $scope.currentAbility = false;
        };
        
        $scope.deleteAbility = function (ability) {
            var index = $scope.hero.abilities.indexOf(ability);
            $scope.hero.abilities.splice(index, 1);
            
            for (var i = 0; i < $scope.hero.abilities.length; i++) {
                $scope.hero.abilities[i].orderNum = i + 1;
            }
        };
        
        // talents
        $scope.talentTiers = HOTS.tiers;
        $scope.talentAddWnd = function () {
            $scope.currentTalent = angular.copy(defaultTalent);
            $scope.talentAbilities = [{ _id: undefined, name: 'None' }].concat($scope.hero.abilities);
            box = bootbox.dialog({
                title: 'Add Talent',
                message: $compile('<div talent-add-form></div>')($scope)
            });
        };

        $scope.talentEditWnd = function (talent) {
            $scope.currentTalent = talent;
            $scope.talentAbilities = [{ _id: undefined, name: 'None' }].concat($scope.hero.abilities);
            box = bootbox.dialog({
                title: 'Edit Talent',
                message: $compile('<div talent-edit-form></div>')($scope)
            });
        };

        $scope.addTalent = function () {
            $scope.currentTalent.orderNum = $scope.hero.talents.length + 1;
            $scope.hero.talents.push($scope.currentTalent);
            box.modal('hide');
            $scope.currentTalent = false;
        };
        
        $scope.editTalent = function (talent) {
            box.modal('hide');
            $scope.currentTalent = false;
        };
        
        $scope.deleteTalent = function (talent) {
            var index = $scope.hero.talents.indexOf(talent);
            $scope.hero.talents.splice(index, 1);
            
            for (var i = 0; i < $scope.hero.talents.length; i++) {
                $scope.hero.talents[i].orderNum = i + 1;
            }
        };
        
        // characters
        $scope.charAddWnd = function () {
            $scope.currentCharacter = angular.copy(defaultCharacter);
            box = bootbox.dialog({
                title: 'Add Character',
                message: $compile('<div char-add-form></div>')($scope)
            });
        };

        $scope.charEditWnd = function (character) {
            $scope.currentCharacter = character;
            box = bootbox.dialog({
                title: 'Edit Character',
                message: $compile('<div char-edit-form></div>')($scope)
            });
        };

        $scope.addCharacter = function () {
            $scope.hero.characters.push($scope.currentCharacter);
            box.modal('hide');
            $scope.currentCharacter = false;
        };
        
        $scope.editCharacter = function (character) {
            box.modal('hide');
            $scope.currentCharacter = false;
        };
        
        $scope.deleteChar = function (character) {
            var index = $scope.hero.characters.indexOf(character);
            $scope.hero.characters.splice(index, 1);
        };
        
        $scope.updateDND = function (list, index) {
            list.splice(index, 1);
            
            for (var i = 0; i < list.length; i++) {
                list[i].orderNum = i + 1;
            }
        };
        
        $scope.editHero = function () {
            $scope.showError = false;

            AdminHeroService.editHero($scope.hero).success(function (data) {
                if (!data.success) {
                    $scope.errors = data.errors;
                    $scope.showError = true;
                    $window.scrollTo(0,0);
                } else {
                    AlertService.setSuccess({ show: true, msg: $scope.hero.name + ' has been updated successfully.' });
                    $state.go('app.admin.hots.heroes.list');
                }
            });
        };
    }
])
.controller('AdminMapsListCtrl', ['$scope', 'AdminMapService', 'AlertService', 'Pagination', 'data', 
    function ($scope, AdminMapService, AlertService, Pagination, data) {
        // grab alerts
        if (AlertService.hasAlert()) {
            $scope.success = AlertService.getSuccess();
            AlertService.reset();
        }
        
        // load maps
        $scope.maps = data.maps;
        $scope.page = data.page;
        $scope.perpage = data.perpage;
        $scope.total = data.total;
        $scope.search = data.search;
        
        $scope.getMaps = function () {
            AdminMapService.getMaps($scope.page, $scope.perpage, $scope.search).then(function (data) {
                $scope.maps = data.maps;
                $scope.page = data.page;
                $scope.total = data.total;
            });
        }
        
        $scope.searchMaps = function () {
            $scope.page = 1;
            $scope.getMaps();
        }
        
        // pagination
        $scope.pagination = {
            page: function () {
                return $scope.page;
            },
            perpage: function () {
                return $scope.perpage;
            },
            results: function () {
                return $scope.total;
            },
            setPage: function (page) {
                $scope.page = page;
                $scope.getMaps();
            },
            pagesArray: function () {
                var pages = [],
                    start = 1,
                    end = this.totalPages();
                
                if (this.totalPages() > 5) {
                    if (this.page() < 3) {
                        start = 1;
                        end = start + 4;
                    } else if (this.page() > this.totalPages() - 2) {
                        end = this.totalPages();
                        start = end - 4;
                    } else {
                        start = this.page() - 2;
                        end = this.page() + 2;
                    }
                    
                }
                
                for (var i = start; i <= end; i++) {
                    pages.push(i);
                }
                
                return pages;
            },
            isPage: function (page) {
                return (page === this.page());
            },
            totalPages: function (page) {
                return (this.results() > 0) ? Math.ceil(this.results() / this.perpage()) : 0;
            },
            from: function () {
                return (this.page() * this.perpage()) - this.perpage() + 1;
            },
            to: function () {
                return ((this.page() * this.perpage()) > this.results()) ? this.results() : this.page() * this.perpage();
            }
        };
        
        // delete map
        $scope.deleteMap = function deleteMap(map) {
            var box = bootbox.dialog({
                title: 'Delete map: ' + map.name + '?',
                message: 'Are you sure you want to delete the map <strong>' + map.name + '</strong>?',
                buttons: {
                    delete: {
                        label: 'Delete',
                        className: 'btn-danger',
                        callback: function () {
                            AdminMapService.deleteMap(map._id).then(function (data) {
                                if (data.success) {
                                    var index = $scope.maps.indexOf(map);
                                    if (index !== -1) {
                                        $scope.maps.splice(index, 1);
                                    }
                                    $scope.success = {
                                        show: true,
                                        msg: map.name + ' deleted successfully.'
                                    };
                                }
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
                }
            });
            box.modal('show');
        }
    }
])
.controller('AdminMapAddCtrl', ['$scope', '$state', '$window', '$compile', 'bootbox', 'HOTS', 'AlertService', 'AdminMapService', 
    function ($scope, $state, $window, $compile, bootbox, HOTS, AlertService, AdminMapService) {
        // default map
        var defaultMap = {
                name : '',
                description: '',
                className: '',
                active: true
            };
        
        // load map
        $scope.map = angular.copy(defaultMap);
        
        // select options
        $scope.mapActive = [
            { name: 'Yes', value: true },
            { name: 'No', value: false }
        ];
                
        $scope.addMap = function () {
            $scope.showError = false;

            AdminMapService.addMap($scope.map).success(function (data) {
                if (!data.success) {
                    $scope.errors = data.errors;
                    $scope.showError = true;
                    $window.scrollTo(0,0);
                } else {
                    AlertService.setSuccess({ show: true, msg: $scope.map.name + ' has been added successfully.' });
                    $state.go('app.admin.hots.maps.list');
                }
            });
        };
    }
])
.controller('AdminMapEditCtrl', ['$scope', '$state', '$window', '$compile', 'bootbox', 'HOTS', 'AlertService', 'AdminMapService', 'data', 
    function ($scope, $state, $window, $compile, bootbox, HOTS, AlertService, AdminMapService, data) {
        // load map
        $scope.map = data.map;
        
        // select options
        $scope.mapActive = [
            { name: 'Yes', value: true },
            { name: 'No', value: false }
        ];
        
        $scope.editMap = function () {
            $scope.showError = false;

            AdminMapService.editMap($scope.map).success(function (data) {
                if (!data.success) {
                    $scope.errors = data.errors;
                    $scope.showError = true;
                    $window.scrollTo(0,0);
                } else {
                    AlertService.setSuccess({ show: true, msg: $scope.map.name + ' has been updated successfully.' });
                    $state.go('app.admin.hots.maps.list');
                }
            });
        };
    }
])
.controller('AdminHOTSGuideListCtrl', ['$scope', '$state', 'AdminHOTSGuideService', 'AlertService', 'Pagination', 'data', 
    function ($scope, $state, AdminHOTSGuideService, AlertService, Pagination, data) {
        // grab alerts
        if (AlertService.hasAlert()) {
            $scope.success = AlertService.getSuccess();
            AlertService.reset();
        }
        
        // load guides
        $scope.guides = data.guides;
        $scope.page = data.page;
        $scope.perpage = data.perpage;
        $scope.total = data.total;
        $scope.search = data.search;
        
        $scope.getGuides = function () {
            AdminHOTSGuideService.getGuides($scope.page, $scope.perpage, $scope.search).then(function (data) {
                $scope.guides = data.guides;
                $scope.page = data.page;
                $scope.total = data.total;
            });
        }
        
        $scope.searchGuides = function () {
            $scope.page = 1;
            $scope.getGuides();
        }
        
        // pagination
        $scope.pagination = {
            page: function () {
                return $scope.page;
            },
            perpage: function () {
                return $scope.perpage;
            },
            results: function () {
                return $scope.total;
            },
            setPage: function (page) {
                $scope.page = page;
                $scope.getGuides();
            },
            pagesArray: function () {
                var pages = [],
                    start = 1,
                    end = this.totalPages();
                
                if (this.totalPages() > 5) {
                    if (this.page() < 3) {
                        start = 1;
                        end = start + 4;
                    } else if (this.page() > this.totalPages() - 2) {
                        end = this.totalPages();
                        start = end - 4;
                    } else {
                        start = this.page() - 2;
                        end = this.page() + 2;
                    }
                }
                
                for (var i = start; i <= end; i++) {
                    pages.push(i);
                }
                
                return pages;
            },
            isPage: function (page) {
                return (page === this.page());
            },
            totalPages: function (page) {
                return (this.results() > 0) ? Math.ceil(this.results() / this.perpage()) : 0;
            },
            from: function () {
                return (this.page() * this.perpage()) - this.perpage() + 1;
            },
            to: function () {
                return ((this.page() * this.perpage()) > this.results()) ? this.results() : this.page() * this.perpage();
            }
        };
        
        // edit guide
        $scope.editGuide = function (guide) {
            if (guide.guideType === 'hero') {
                return $state.go('app.admin.hots.guides.edit.hero', { guideID: guide._id });
            } else {
                return $state.go('app.admin.hots.guides.edit.map', { guideID: guide._id });
            }
        };
        
        // delete guide
        $scope.deleteGuide = function deleteGuide(guide) {
            var box = bootbox.dialog({
                title: 'Delete guide: ' + guide.name + '?',
                message: 'Are you sure you want to delete the guide <strong>' + guide.name + '</strong>?',
                buttons: {
                    delete: {
                        label: 'Delete',
                        className: 'btn-danger',
                        callback: function () {
                            AdminHOTSGuideService.deleteGuide(guide._id).then(function (data) {
                                if (data.success) {
                                    var index = $scope.guides.indexOf(guide);
                                    if (index !== -1) {
                                        $scope.guides.splice(index, 1);
                                    }
                                    $scope.success = {
                                        show: true,
                                        msg: guide.name + ' deleted successfully.'
                                    };
                                }
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
                }
            });
            box.modal('show');
        }
    }
])
.controller('AdminHOTSGuideAddHeroCtrl', ['$scope', '$state', 'AlertService', 'AdminHOTSGuideService', 'GuideBuilder', 'HOTS', 'dataHeroes', 'dataMaps', 
    function ($scope, $state, AlertService, AdminHOTSGuideService, GuideBuilder, HOTS, dataHeroes, dataMaps) {
        // create guide
        $scope.guide = ($scope.app.settings.guide && $scope.app.settings.guide.guideType === 'hero') ? GuideBuilder.new('hero', $scope.app.settings.guide) : GuideBuilder.new('hero');
        $scope.$watch('guide', function(){
            $scope.app.settings.guide = $scope.guide;
        }, true);

        // heroes
        $scope.heroes = dataHeroes.heroes;
        
        // maps
        $scope.maps = dataMaps.maps;
        
        // steps
        $scope.step = 2;
        $scope.prevStep = function () {
            if ($scope.step == 2) { return $state.go('app.admin.hots.guides.add.step1', {}); }
            if ($scope.step > 1) $scope.step = $scope.step - 1;
        }
        $scope.nextStep = function () {
            if ($scope.step < 7) $scope.step = $scope.step + 1;
        }
        
        $scope.stepOne = function () {
            $state.go('app.admin.hots.guides.add.step1', {});
        };
        
        // draw hero rows
        var heroRows = HOTS.heroRows;
        $scope.heroRows = [];
        var index = 0;
        for (var row = 0; row < heroRows.length; row++) {
            var heroes = [];
            for (var i = 0; i < heroRows[row]; i++) {
                if (dataHeroes.heroes[index]) {
                    heroes.push(dataHeroes.heroes[index]);
                } else {
                    heroes.push({});
                }
                index++;
            }
            $scope.heroRows.push(heroes);
        }
        
        $scope.tooltipPos = function (row, $index) {
            return (($index + 1) > Math.ceil(row.length / 2)) ? 'left' : 'right';
        };
        
        $scope.tooltipPosTalent = function ($index) {
            return ($index === 2) ? 'left' : 'right';
        };        
        
        // draw map rows
        var mapRows = HOTS.mapRows;
        $scope.mapRows = [];
        var index = 0;
        for (var row = 0; row < mapRows.length; row++) {
            var maps = [];
            for (var i = 0; i < mapRows[row]; i++) {
                if (dataMaps.maps[index]) {
                    maps.push(dataMaps.maps[index]);
                }
                index++;
            }
            $scope.mapRows.push(maps);
        }
        
        // talents
        $scope.getTalents = function (hero) {
            return $scope.guide.sortTalents(hero);
        }
        
        // summernote options
        $scope.options = {
          disableDragAndDrop: true,
          height: 100,
          toolbar: [
            ['style', ['style']],
            ['style', ['bold', 'italic', 'underline', 'strikethrough', 'clear']],
            ['color', ['color']],
            ['para', ['ul', 'ol', 'paragraph']],
            ['table', ['table']],
            ['insert', ['link', 'picture', 'video']],
            ['format', ['hr']],
            ['misc', ['undo', 'redo']]
          ]
        };

        // premium
        $scope.premiumTypes = [
            { text: 'No', value: false },
            { text: 'Yes', value: true }
        ];
        
        $scope.isPremium = function () {
            var premium = $scope.guide.premium.isPremium;
            for (var i = 0; i < $scope.premiumTypes.length; i++) {
                if ($scope.premiumTypes[i].value === premium) {
                    return $scope.premiumTypes[i].text;
                }
            }
        }
        
        // featured
        $scope.featuredTypes = [
            { text: 'No', value: false },
            { text: 'Yes', value: true }
        ];
        
        $scope.isFeatured = function () {
            var featured = $scope.guide.featured;
            for (var i = 0; i < $scope.featuredTypes.length; i++) {
                if ($scope.featuredTypes[i].value === featured) {
                    return $scope.featuredTypes[i].text;
                }
            }
        }
        
        // save guide
        $scope.saveGuide = function () {
            if ( !$scope.guide.hasAnyHero() || !$scope.guide.allTalentsDone() ) {
                return false;
            }
            
            AdminHOTSGuideService.addGuide($scope.guide).success(function (data) {
                if (!data.success) {
                    $scope.errors = data.errors;
                    $scope.showError = true;
                    $window.scrollTo(0,0);
                } else {
                    $scope.app.settings.guide = null;
                    AlertService.setSuccess({ show: true, msg: $scope.guide.name + ' has been added successfully.' });
                    $state.go('app.admin.hots.guides.list');
                }
            });
        };
    }
])
.controller('AdminHOTSGuideAddMapCtrl', ['$scope', '$state', 'AlertService', 'HOTS', 'AdminHOTSGuideService', 'GuideBuilder', 'dataHeroes', 'dataMaps', 
    function ($scope, $state, AlertService, HOTS, AdminHOTSGuideService, GuideBuilder, dataHeroes, dataMaps) {
        // create guide
        $scope.guide = ($scope.app.settings.guide && $scope.app.settings.guide.guideType === 'map') ? GuideBuilder.new('map', $scope.app.settings.guide) : GuideBuilder.new('map');
        $scope.$watch('guide', function(){
            $scope.app.settings.guide = $scope.guide;
        }, true);

        // heroes
        $scope.heroes = dataHeroes.heroes;
        
        // maps
        $scope.maps = dataMaps.maps;
        
        // steps
        $scope.step = 2;
        $scope.prevStep = function () {
            if ($scope.step == 2) { return $state.go('app.admin.hots.guides.add.step1', {}); }
            if ($scope.step > 1) $scope.step = $scope.step - 1;
        }
        $scope.nextStep = function () {
            if ($scope.step < 5) $scope.step = $scope.step + 1;
        }
        
        $scope.stepOne = function () {
            $state.go('app.admin.hots.guides.add.step1', {});
        };
        
        // draw map rows
        var mapRows = HOTS.mapRows;
        $scope.mapRows = [];
        var index = 0;
        for (var row = 0; row < mapRows.length; row++) {
            var maps = [];
            for (var i = 0; i < mapRows[row]; i++) {
                if (dataMaps.maps[index]) {
                    maps.push(dataMaps.maps[index]);
                }
                index++;
            }
            $scope.mapRows.push(maps);
        }

        $scope.tooltipPos = function (row, $index) {
            return (($index + 1) > Math.ceil(row.length / 2)) ? 'left' : 'right';
        };
        
        // summernote options
        $scope.options = {
          disableDragAndDrop: true,
          height: 100,
          toolbar: [
            ['style', ['style']],
            ['style', ['bold', 'italic', 'underline', 'strikethrough', 'clear']],
            ['color', ['color']],
            ['para', ['ul', 'ol', 'paragraph']],
            ['table', ['table']],
            ['insert', ['link', 'picture', 'video']],
            ['format', ['hr']],
            ['misc', ['undo', 'redo']]
          ]
        };

        // premium
        $scope.premiumTypes = [
            { text: 'No', value: false },
            { text: 'Yes', value: true }
        ];
        
        $scope.isPremium = function () {
            var premium = $scope.guide.premium.isPremium;
            for (var i = 0; i < $scope.premiumTypes.length; i++) {
                if ($scope.premiumTypes[i].value === premium) {
                    return $scope.premiumTypes[i].text;
                }
            }
        }
        
        // featured
        $scope.featuredTypes = [
            { text: 'No', value: false },
            { text: 'Yes', value: true }
        ];
        
        $scope.isFeatured = function () {
            var featured = $scope.guide.featured;
            for (var i = 0; i < $scope.featuredTypes.length; i++) {
                if ($scope.featuredTypes[i].value === featured) {
                    return $scope.featuredTypes[i].text;
                }
            }
        }
        
        // save guide
        $scope.saveGuide = function () {
            if ( !$scope.guide.hasAnyMap() || !$scope.guide.hasAnyChapter() ) {
                return false;
            }
            
            AdminHOTSGuideService.addGuide($scope.guide).success(function (data) {
                if (!data.success) {
                    $scope.errors = data.errors;
                    $scope.showError = true;
                    $window.scrollTo(0,0);
                } else {
                    $scope.app.settings.guide = null;
                    AlertService.setSuccess({ show: true, msg: $scope.guide.name + ' has been added successfully.' });
                    $state.go('app.admin.hots.guides.list');
                }
            });
        };
    }
])
.controller('AdminHOTSGuideEditStep1Ctrl', ['$scope', 'dataGuide', 
    function ($scope, dataGuide) {
        $scope.guide = dataGuide.guide;
    }
])
.controller('AdminHOTSGuideEditHeroCtrl', ['$scope', '$state', '$window', 'AlertService', 'GuideBuilder', 'AdminHOTSGuideService', 'HOTS', 'dataGuide', 'dataHeroes', 'dataMaps', 
    function ($scope, $state, $window, AlertService, GuideBuilder, AdminHOTSGuideService, HOTS, dataGuide, dataHeroes, dataMaps) {
        // create guide
        $scope.guide = GuideBuilder.new('hero', dataGuide.guide);
        
        // heroes
        $scope.heroes = dataHeroes.heroes;
        
        // maps
        $scope.maps = dataMaps.maps;
        
        // steps
        $scope.step = 2;
        $scope.prevStep = function () {
            if ($scope.step == 2) { return $state.go('app.admin.hots.guides.edit.step1', { guideID: $scope.guide._id }); }
            if ($scope.step > 1) $scope.step = $scope.step - 1;
        }
        $scope.nextStep = function () {
            if ($scope.step < 7) $scope.step = $scope.step + 1;
        }
        
        $scope.stepOne = function () {
            $state.go('app.admin.hots.guides.edit.step1', { guideID: $scope.guide._id });
        };
        
        // draw hero rows
        var heroRows = HOTS.heroRows;
        $scope.heroRows = [];
        var index = 0;
        for (var row = 0; row < heroRows.length; row++) {
            var heroes = [];
            for (var i = 0; i < heroRows[row]; i++) {
                if (dataHeroes.heroes[index]) {
                    heroes.push(dataHeroes.heroes[index]);
                } else {
                    heroes.push({});
                }
                index++;
            }
            $scope.heroRows.push(heroes);
        }
        
        // draw map rows
        var mapRows = HOTS.mapRows;
        $scope.mapRows = [];
        var index = 0;
        for (var row = 0; row < mapRows.length; row++) {
            var maps = [];
            for (var i = 0; i < mapRows[row]; i++) {
                if (dataMaps.maps[index]) {
                    maps.push(dataMaps.maps[index]);
                }
                index++;
            }
            $scope.mapRows.push(maps);
        }

        $scope.tooltipPos = function (row, $index) {
            return (($index + 1) > Math.ceil(row.length / 2)) ? 'left' : 'right';
        };
        
        $scope.tooltipPosTalent = function ($index) {
            return ($index === 2) ? 'left' : 'right';
        };

        // talents
        $scope.getTalents = function (hero) {
            return $scope.guide.sortTalents(hero);
        }
        
        $scope.hasTalent = function (hero, talent) {
            return ($scope.guide.hasTalent(hero, talent)) ? ' active' : '';
        }
        
        $scope.hasAnyTalent = function (hero, talent) {
            return ($scope.guide.hasAnyTalent(hero, talent)) ? ' tier-selected' : '';
        }
        
        // summernote options
        $scope.options = {
          disableDragAndDrop: true,
          height: 100,
          toolbar: [
            ['style', ['style']],
            ['style', ['bold', 'italic', 'underline', 'strikethrough', 'clear']],
            ['color', ['color']],
            ['para', ['ul', 'ol', 'paragraph']],
            ['table', ['table']],
            ['insert', ['link', 'picture', 'video']],
            ['format', ['hr']],
            ['misc', ['undo', 'redo']]
          ]
        };

        // premium
        $scope.premiumTypes = [
            { text: 'No', value: false },
            { text: 'Yes', value: true }
        ];
        
        $scope.isPremium = function () {
            var premium = $scope.guide.premium.isPremium;
            for (var i = 0; i < $scope.premiumTypes.length; i++) {
                if ($scope.premiumTypes[i].value === premium) {
                    return $scope.premiumTypes[i].text;
                }
            }
        }
        
        // featured
        $scope.featuredTypes = [
            { text: 'No', value: false },
            { text: 'Yes', value: true }
        ];
        
        $scope.isFeatured = function () {
            var featured = $scope.guide.featured;
            for (var i = 0; i < $scope.featuredTypes.length; i++) {
                if ($scope.featuredTypes[i].value === featured) {
                    return $scope.featuredTypes[i].text;
                }
            }
        }
        
        // save guide
        $scope.saveGuide = function () {
            if ( !$scope.guide.hasAnyHero() || !$scope.guide.allTalentsDone() ) {
                return false;
            }
            
            AdminHOTSGuideService.editGuide($scope.guide).success(function (data) {
                if (!data.success) {
                    $scope.errors = data.errors;
                    $scope.showError = true;
                    $window.scrollTo(0,0);
                } else {
                    AlertService.setSuccess({ show: true, msg: $scope.guide.name + ' has been updated successfully.' });
                    $state.go('app.admin.hots.guides.list');
                }
            });
        };
    }
])
.controller('AdminHOTSGuideEditMapCtrl', ['$scope', '$state', '$window', 'AlertService', 'HOTS', 'GuideBuilder', 'AdminHOTSGuideService', 'dataGuide', 'dataHeroes', 'dataMaps', 
    function ($scope, $state, $window, AlertService, HOTS, GuideBuilder, AdminHOTSGuideService, dataGuide, dataHeroes, dataMaps) {
        // create guide
        $scope.guide = GuideBuilder.new('map', dataGuide.guide);
        
        // heroes
        $scope.heroes = dataHeroes.heroes;
        
        // maps
        $scope.maps = dataMaps.maps;
        
        // steps
        $scope.step = 2;
        $scope.prevStep = function () {
            if ($scope.step == 2) { return $state.go('app.admin.hots.guides.edit.step1', { guideID: $scope.guide._id }); }
            if ($scope.step > 1) $scope.step = $scope.step - 1;
        }
        $scope.nextStep = function () {
            if ($scope.step < 5) $scope.step = $scope.step + 1;
        }
        
        $scope.stepOne = function () {
            $state.go('app.admin.hots.guides.edit.step1', { guideID: $scope.guide._id });
        };
        
        // draw map rows
        var mapRows = HOTS.mapRows;
        $scope.mapRows = [];
        var index = 0;
        for (var row = 0; row < mapRows.length; row++) {
            var maps = [];
            for (var i = 0; i < mapRows[row]; i++) {
                if (dataMaps.maps[index]) {
                    maps.push(dataMaps.maps[index]);
                }
                index++;
            }
            $scope.mapRows.push(maps);
        }

        $scope.tooltipPos = function (row, $index) {
            return (($index + 1) > Math.ceil(row.length / 2)) ? 'left' : 'right';
        };
        
        // summernote options
        $scope.options = {
          disableDragAndDrop: true,
          height: 100,
          toolbar: [
            ['style', ['style']],
            ['style', ['bold', 'italic', 'underline', 'strikethrough', 'clear']],
            ['color', ['color']],
            ['para', ['ul', 'ol', 'paragraph']],
            ['table', ['table']],
            ['insert', ['link', 'picture', 'video']],
            ['format', ['hr']],
            ['misc', ['undo', 'redo']]
          ]
        };

        // premium
        $scope.premiumTypes = [
            { text: 'No', value: false },
            { text: 'Yes', value: true }
        ];
        
        $scope.isPremium = function () {
            var premium = $scope.guide.premium.isPremium;
            for (var i = 0; i < $scope.premiumTypes.length; i++) {
                if ($scope.premiumTypes[i].value === premium) {
                    return $scope.premiumTypes[i].text;
                }
            }
        }
        
        // featured
        $scope.featuredTypes = [
            { text: 'No', value: false },
            { text: 'Yes', value: true }
        ];
        
        $scope.isFeatured = function () {
            var featured = $scope.guide.featured;
            for (var i = 0; i < $scope.featuredTypes.length; i++) {
                if ($scope.featuredTypes[i].value === featured) {
                    return $scope.featuredTypes[i].text;
                }
            }
        }
        
        // save guide
        $scope.saveGuide = function () {
            if ( !$scope.guide.hasAnyMap() || !$scope.guide.hasAnyChapter() ) {
                return false;
            }
            
            AdminHOTSGuideService.editGuide($scope.guide).success(function (data) {
                if (!data.success) {
                    $scope.errors = data.errors;
                    $scope.showError = true;
                    $window.scrollTo(0,0);
                } else {
                    AlertService.setSuccess({ show: true, msg: $scope.guide.name + ' has been updated successfully.' });
                    $state.go('app.admin.hots.guides.list');
                }
            });
        };
    }
])
.controller('HOTSHomeCtrl', ['$scope', '$filter', '$timeout', 'dataHeroes', 'dataMaps', 'dataArticles', 'dataGuidesCommunity', 'dataGuidesFeatured', 'ArticleService', 'HOTSGuideService', 
    function ($scope, $filter, $timeout, dataHeroes, dataMaps, dataArticles, dataGuidesCommunity, dataGuidesFeatured, ArticleService, HOTSGuideService) {
        // data
        $scope.heroes = dataHeroes.heroes;
        $scope.maps = dataMaps.maps;
        $scope.articles = dataArticles.articles;
        $scope.guidesCommunity = dataGuidesCommunity.guides;
        $scope.guidesFeatured = dataGuidesFeatured.guides;
        
        $scope.filters = {
            roles: [],
            universes: [],
            search: '',
            heroes: [],
            map: false
        };
        
        // filtering
        function hasFilterRole (role) {
            for (var i = 0; i < $scope.filters.roles.length; i++) {
                if ($scope.filters.roles[i] == role) {
                    return true;
                }
            }
            return false;
        };

        function hasFilterUniverse (universe) {
            for (var i = 0; i < $scope.filters.universes.length; i++) {
                if ($scope.filters.universes[i] == universe) {
                    return true;
                }
            }
            return false;
        };
        
        function hasFilterSearch (hero) {
            var filtered = ($scope.filters.search && $scope.filters.search.length) ? $filter('filter')($scope.heroes, { name: $scope.filters.search }) : $scope.heroes;
            return (filtered.indexOf(hero) === -1);
        }
        
        function getFilters () {
            var filters = [];
            
            // check for no filters
            if (!$scope.filters.roles.length && 
                !$scope.filters.universes.length && 
                !$scope.filters.heroes.length && 
                !$scope.filters.map) {
                return false;
            }

            // heroes
            if ($scope.filters.heroes.length) {
                for (var i = 0; i < $scope.filters.heroes.length; i++) {
                    filters.push($scope.filters.heroes[i]._id);
                }
            } else if ($scope.filters.roles.length || $scope.filters.universes.length) {
                for (var i = 0; i < $scope.heroes.length; i++) {
                    if (!isFiltered($scope.heroes[i])) {
                        filters.push($scope.heroes[i]._id);
                    }
                }
            }
            
            // maps
            if ($scope.filters.map) {
                filters.push($scope.filters.map._id);
            }
            
            return filters;
        }
        
        function isFiltered (hero) {
            if ($scope.filters.roles.length && !hasFilterRole(hero.role)) {
                return true;
            }
            if ($scope.filters.universes.length && !hasFilterUniverse(hero.universe)) {
                return true;
            }
            if ($scope.filters.search.length && hasFilterSearch(hero)) {
                return true;
            }
            return false;
        };
        
        var initializing = true;
        $scope.$watch(function(){ return $scope.filters; }, function (value) {
            if (initializing) {
                $timeout(function () {
                    initializing = false;
                });
            } else {
                // article filters
                var articleFilters = [];
                for (var i = 0; i < $scope.heroes.length; i++) {
                    if (!isFiltered($scope.heroes[i])) {
                        articleFilters.push($scope.heroes[i].name);
                    }
                }
                
                // load articles
                ArticleService.getArticles('hots', articleFilters, 0, 6).then(function (data) {
                    $timeout(function () {
                        $scope.articles = data.articles;
                    });
                });
                
                // load tempostorm guides
                HOTSGuideService.getGuidesFeatured(getFilters(), 0, 10, $scope.filters.search).then(function (data) {
                    $timeout(function () {
                        $scope.guidesFeatured = data.guides;
                    });
                });
                
                // load community guides
                HOTSGuideService.getGuidesCommunity(getFilters(), 0, 10, $scope.filters.search, false).then(function (data) {
                    $timeout(function () {
                        $scope.guidesCommunity = data.guides;
                    });
                });
            }
        }, true);
        
        // guides
        $scope.getGuideCurrentHero = function (guide) {
            return (guide.currentHero) ? guide.currentHero : guide.heroes[0];
        };
        
        $scope.getGuideClass = function (guide) {
            return (guide.guideType == 'hero') ? $scope.getGuideCurrentHero(guide).hero.className : guide.maps[0].className;
        };
        
        $scope.guidePrevHero = function ($event, guide) {
            $event.preventDefault();
            $event.stopPropagation();
            
            var currentHero = $scope.getGuideCurrentHero(guide),
                index = 0;
            
            // get index of current hero
            for (var i = 0; i < guide.heroes.length; i++) {
                if (currentHero.hero._id == guide.heroes[i].hero._id) {
                    index = i;
                    break;
                }
            }
            
            guide.currentHero = (index == 0) ? guide.heroes[guide.heroes.length - 1] : guide.heroes[index - 1];
        };

        $scope.guideNextHero = function ($event, guide) {
            $event.preventDefault();
            $event.stopPropagation();
            
            var currentHero = $scope.getGuideCurrentHero(guide),
                index = 0;
            
            // get index of current hero
            for (var i = 0; i < guide.heroes.length; i++) {
                if (currentHero.hero._id == guide.heroes[i].hero._id) {
                    index = i;
                    break;
                }
            }
            
            guide.currentHero = (index == guide.heroes.length - 1) ? guide.heroes[0] : guide.heroes[index + 1];
        };
        
        //is premium
        $scope.isPremium = function (guide) {
            if (!guide.premium.isPremium) { return false; }
            var now = new Date().getTime(),
                expiry = new Date(guide.premium.expiryDate).getTime();
            if (expiry > now) {
                return true;
            } else {
                return false;
            }
        }
    }
])
.controller('HOTSGuidesListCtrl', ['$q', '$scope', '$state', '$timeout', '$filter', 'HOTSGuideService', 'AjaxPagination', 'dataCommunityGuides', 'dataTopGuide', 'dataTempostormGuides', 'dataHeroes', 'dataMaps', 
    function ($q, $scope, $state, $timeout, $filter, HOTSGuideService, AjaxPagination, dataCommunityGuides, dataTopGuide, dataTempostormGuides, dataHeroes, dataMaps) {
        $scope.communityGuides = dataCommunityGuides.guides;
        $scope.topGuides = (dataTopGuide.total) ? dataTopGuide.guides : false;
        $scope.tempostormGuides = dataTempostormGuides.guides;
        
        // filtering
        $scope.heroes = dataHeroes.heroes;
        $scope.maps = dataMaps.maps;
        $scope.filters = {
            roles: [],
            universes: [],
            search: '',
            heroes: [],
            map: false
        };
        
        var initializing = true;
        $scope.$watch(function(){ return $scope.filters; }, function (value) {
            if (initializing) {
                $timeout(function () {
                    initializing = false;
                });
            } else {
                // generate filters
                var guideFilters = [];
                for (var i = 0; i < $scope.filters.heroes.length; i++) {
                    guideFilters.push($scope.filters.heroes[i]._id);
                }
                if ($scope.filters.map) {
                    guideFilters.push($scope.filters.map._id);
                }
                
                updateTopGuide();
                updateTempostormGuides(1, 4);
                updateCommunityGuides(1, 10);
            }
        }, true);
        
        // top guide
        $scope.getTopGuideHeroBg = function (guide) {
            return ($scope.app.bootstrapWidth !== 'xs') ? $scope.getGuideCurrentHero(guide).hero.className : '';
        };
        
        $scope.isLarge = function () {
            var width = $scope.app.bootstrapWidth;
            return (width === 'lg' || width === 'md') ? 'large' : '';
        };
        
        // guides
        $scope.getGuideCurrentHero = function (guide) {
            return (guide.currentHero) ? guide.currentHero : guide.heroes[0];
        };
        
        $scope.getGuideClass = function (guide) {
            return (guide.guideType == 'hero') ? $scope.getGuideCurrentHero(guide).hero.className : guide.maps[0].className;
        };
        
        $scope.guidePrevHero = function ($event, guide) {
            $event.preventDefault();
            $event.stopPropagation();
            
            var currentHero = $scope.getGuideCurrentHero(guide),
                index = 0;
            
            // get index of current hero
            for (var i = 0; i < guide.heroes.length; i++) {
                if (currentHero.hero._id == guide.heroes[i].hero._id) {
                    index = i;
                    break;
                }
            }
            
            guide.currentHero = (index == 0) ? guide.heroes[guide.heroes.length - 1] : guide.heroes[index - 1];
        };

        $scope.guideNextHero = function ($event, guide) {
            $event.preventDefault();
            $event.stopPropagation();
            
            var currentHero = $scope.getGuideCurrentHero(guide),
                index = 0;
            
            // get index of current hero
            for (var i = 0; i < guide.heroes.length; i++) {
                if (currentHero.hero._id == guide.heroes[i].hero._id) {
                    index = i;
                    break;
                }
            }
            
            guide.currentHero = (index == guide.heroes.length - 1) ? guide.heroes[0] : guide.heroes[index + 1];
        };
        
        $scope.getTalents = function (hero, tier) {
            var out = [];
            
            for (var i = 0; i < hero.hero.talents.length; i++) {
                if (hero.hero.talents[i].tier === tier) {
                    out.push(hero.hero.talents[i]);
                }
            }
            
            return out;
        };
        
        $scope.selectedTalent = function (hero, tier, talent) {
            return (hero.talents['tier' + tier]._id == talent._id);
        };
        
        $scope.getTalent = function (hero, tier) {
            for (var i = 0; i < hero.hero.talents.length; i++) {
                if (hero.talents['tier' + tier] == hero.hero.talents[i]._id) {
                    return hero.hero.talents[i];
                }
            }
            return false;
        };
        
        //is premium
        $scope.isPremium = function (guide) {
            if (!guide.premium.isPremium) { return false; }
            var now = new Date().getTime(),
                expiry = new Date(guide.premium.expiryDate).getTime();
            if (expiry > now) {
                return true;
            } else {
                return false;
            }
        }
                
        // filtering
        function hasFilterRole (role) {
            for (var i = 0; i < $scope.filters.roles.length; i++) {
                if ($scope.filters.roles[i] == role) {
                    return true;
                }
            }
            return false;
        };

        function hasFilterUniverse (universe) {
            for (var i = 0; i < $scope.filters.universes.length; i++) {
                if ($scope.filters.universes[i] == universe) {
                    return true;
                }
            }
            return false;
        };
        
        function hasFilterSearch (hero) {
            var filtered = ($scope.filters.search && $scope.filters.search.length) ? $filter('filter')($scope.heroes, { name: $scope.filters.search }) : $scope.heroes;
            return (filtered.indexOf(hero) === -1);
        }
        
        function isFiltered (hero) {
            if ($scope.filters.roles.length && !hasFilterRole(hero.role)) {
                return true;
            }
            if ($scope.filters.universes.length && !hasFilterUniverse(hero.universe)) {
                return true;
            }
            if ($scope.filters.search.length && hasFilterSearch(hero)) {
                return true;
            }
            return false;
        };
        
        function getFilters () {
            var filters = [];
            
            // check for no filters
            if (!$scope.filters.roles.length && 
                !$scope.filters.universes.length && 
                !$scope.filters.heroes.length && 
                !$scope.filters.map) {
                return false;
            }

            // heroes
            if ($scope.filters.heroes.length) {
                for (var i = 0; i < $scope.filters.heroes.length; i++) {
                    filters.push($scope.filters.heroes[i]._id);
                }
            } else if ($scope.filters.roles.length || $scope.filters.universes.length) {
                for (var i = 0; i < $scope.heroes.length; i++) {
                    if (!isFiltered($scope.heroes[i])) {
                        filters.push($scope.heroes[i]._id);
                    }
                }
            }
            
            // maps
            if ($scope.filters.map) {
                filters.push($scope.filters.map._id);
            }
            
            return filters;
        }
        
        function updateTopGuide () {
            HOTSGuideService.getGuides('hero', getFilters(), 1, 1, $scope.filters.search).then(function (data) {
                $timeout(function () {
                    $scope.topGuides = (data.total) ? data.guides : false;
                });
            });
        }
        
        // pagination
        function updateTempostormGuides (page, perpage, callback) {
            var offset = ((page * perpage) - perpage);
            
            HOTSGuideService.getGuidesFeatured(getFilters(), offset, perpage, $scope.filters.search).then(function (data) {
                $scope.tempostormPagination.total = data.total;
                $scope.tempostormPagination.page = page;
                $timeout(function () {
                    $scope.tempostormGuides = data.guides;

                    if (callback) {
                        return callback(data);
                    }
                });
            });
        }
        
        $scope.tempostormPagination = AjaxPagination.new(4, dataTempostormGuides.total,
            function (page, perpage) {
                var d = $q.defer();

                updateTempostormGuides(page, perpage, function (data) {
                    d.resolve(data.total);
                });

                return d.promise;
            }
        );
        
        function updateCommunityGuides (page, perpage, callback) {
            var offset = ((page * perpage) - perpage);
            
            HOTSGuideService.getGuidesCommunity(getFilters(), offset, perpage, $scope.filters.search, false).then(function (data) {
                $scope.communityPagination.total = data.total;
                $scope.communityPagination.page = page;
                $timeout(function () {
                    $scope.communityGuides = data.guides;

                    if (callback) {
                        return callback(data);
                    }
                });
            });
        }
        
        $scope.communityPagination = AjaxPagination.new(10, dataCommunityGuides.total,
            function (page, perpage) {
                var d = $q.defer(),
                    offset = ((page * perpage) - perpage);

                HOTSGuideService.getGuidesCommunity(getFilters(), offset, perpage, $scope.filters.search, false).then(function (data) {
                    $timeout(function () {
                        $scope.communityGuides = data.guides;
                        d.resolve(data.total);
                    });
                });
                return d.promise;
            }
        );
        
        //is premium
        $scope.isPremium = function (guide) {
            if (!guide.premium.isPremium) { return false; }
            var now = new Date().getTime(),
                expiry = new Date(guide.premium.expiryDate).getTime();
            if (expiry > now) {
                return true;
            } else {
                return false;
            }
        }
    }
])
.controller('HOTSGuideCtrl', ['$scope', '$window', '$state', '$sce', '$compile', 'bootbox', 'VoteService', 'HOTSGuideService', 'data', 'dataHeroes', 'dataMaps', 'LoginModalService', 'MetaService',
    function ($scope, $window, $state, $sce, $compile, bootbox, VoteService, HOTSGuideService, data, dataHeroes, dataMaps, LoginModalService, MetaService) {
        
        $scope.guide = data.guide;
        $scope.HOTSGuideService = HOTSGuideService;
        $scope.currentHero = ($scope.guide.heroes.length) ? $scope.guide.heroes[0].hero : false;
        $scope.heroes = dataHeroes.heroes;
        $scope.maps = dataMaps.maps;
        
        
        $scope.metaservice = MetaService;
        $scope.metaservice.set($scope.guide.name + ' - Guides', $scope.guide.description);
        
        var ogImg = $scope.app.cdn + 'img/hots/hots-logo.png';
        $scope.metaservice.setOg('https://tempostorm.com/heroes-of-the-storm/guides/' + data.guide.slug, $scope.guide.name, $scope.guide.description, 'article', ogImg);
        
        // show
        if (!$scope.app.settings.show.guide) {
            $scope.app.settings.show['guide'] = {
                talents: true,
                description: true,
                video: true,
                matchups: true,
                maps: true,
                content: [],
                comments: true
            };
        }
        $scope.show = $scope.app.settings.show.guide;
        $scope.$watch('show', function(){ $scope.app.settings.show.guide = $scope.show; }, true);
        
        $scope.setCurrentHero = function (hero) {
            $scope.currentHero = hero;
        };
        
        $scope.getCurrentHero = function () {
            for (var i = 0; i < $scope.guide.heroes.length; i++) {
                if ($scope.guide.heroes[i].hero._id === $scope.currentHero._id) {
                    return $scope.guide.heroes[i];
                }
            }
            return false;
        };
        
        $scope.justHeroes = function () {
            var out = [];
            
            for (var i = 0; i < $scope.guide.heroes.length; i++) {
                out.push($scope.guide.heroes[i].hero);
            }
            
            return out;
        };
        
        $scope.getTiers = function () {
            return [1, 4, 7, 10, 13, 16, 20];
        };
        
        $scope.getTalents = function (hero, tier) {
            var out = [];
            
            for (var i = 0; i < hero.hero.talents.length; i++) {
                if (hero.hero.talents[i].tier === tier) {
                    out.push(hero.hero.talents[i]);
                }
            }
            
            return out;
        };
        
        $scope.selectedTalent = function (hero, tier, talent) {
            return (hero.talents['tier' + tier] == talent._id);
        };
        
        $scope.getTalent = function (hero, tier) {
            for (var i = 0; i < hero.hero.talents.length; i++) {
                if (hero.talents['tier' + tier] == hero.hero.talents[i]._id) {
                    return hero.hero.talents[i];
                }
            }
            return false;
        };
        
        // matchups
        $scope.hasSynergy = function (hero) {
            return ($scope.guide.synergy.indexOf(hero._id) !== -1);
        };
        $scope.hasStrong = function (hero) {
            return ($scope.guide.against.strong.indexOf(hero._id) !== -1);
        };
        $scope.hasWeak = function (hero) {
            return ($scope.guide.against.weak.indexOf(hero._id) !== -1);
        };
        
        // maps
        $scope.hasMap = function (map) {
            for (var i = 0; i < $scope.guide.maps.length; i++) {
                if ($scope.guide.maps[i]._id === map._id) {
                    return true;
                }
            }
            return false;
        };
        
        $scope.getVideo = function () {
            return $scope.getContent('<iframe src="//www.youtube.com/embed/' + $scope.guide.video + '" frameborder="0" height="360" width="100%" allowfullscreen></iframe>');
        };
        
        $scope.getContent = function (content) {
            return $sce.trustAsHtml(content);
        };

        // voting
        $scope.voteDown = function (guide) {
            vote(-1, guide);
        };
        
        $scope.voteUp = function (guide) {
            vote(1, guide)       
        };
        
        var box,
            callback;
        
        updateVotes();
        function updateVotes() {
            checkVotes($scope.guide);
            
            function checkVotes (guide) {
                var vote = guide.votes.filter(function (vote) {
                    return ($scope.app.user.getUserID() === vote.userID);
                })[0];
                
                if (vote) {
                    guide.voted = vote.direction;
                }
            }
        }
                
        function vote(direction, guide) {
            if (!$scope.app.user.isLogged()) {
                LoginModalService.showModal('login', function () {
                    vote(direction, guide);
                });
            } else {
                if (guide.author._id === $scope.app.user.getUserID()) {
                    bootbox.alert("You can't vote for your own content.");
                    return false;
                }
                VoteService.voteGuide(direction, guide).then(function (data) {
                    if (data.success) {
                        guide.voted = direction;
                        guide.votesCount = data.votesCount;
                    }
                });
            }
            updateVotes();
            updateCommentVotes();
        };
        
        // comments
        var defaultComment = {
            comment: ''
        };
        $scope.comment = angular.copy(defaultComment);
        
        $scope.commentPost = function () {
            if (!$scope.app.user.isLogged()) {
                LoginModalService.showModal('login', function () {
                    $scope.commentPost();
                });
            } else {
                HOTSGuideService.addComment($scope.guide, $scope.comment).success(function (data) {
                    if (data.success) {
                        $scope.guide.comments.push(data.comment);
                        $scope.comment.comment = '';
                    }
                });
            }
        };
        
        updateCommentVotes();
        function updateCommentVotes() {
            $scope.guide.comments.forEach(checkVotes);
            
            function checkVotes (comment) {
                var vote = comment.votes.filter(function (vote) {
                    return ($scope.app.user.getUserID() === vote.userID);
                })[0];
                
                if (vote) {
                    comment.voted = vote.direction;
                }
            }
        }
                
        $scope.voteComment = function (direction, comment) {
            if (!$scope.app.user.isLogged()) {
                LoginModalService.showModal('login', function () {
                    $scope.voteComment(direction, deck);
                });
            } else {
                if (comment.author._id === $scope.app.user.getUserID()) {
                    bootbox.alert("You can't vote for your own content.");
                    return false;
                }
                VoteService.voteComment(direction, comment).then(function (data) {
                    if (data.success) {
                        comment.voted = direction;
                        comment.votesCount = data.votesCount;
                    }
                });
            }
            updateVotes();
            updateCommentVotes();
        };
        
        //is premium
        $scope.isPremium = function () {
            if (!$scope.guide.premium.isPremium) { return false; }
            var now = new Date().getTime(),
                expiry = new Date($scope.guide.premium.expiryDate).getTime();
            if (expiry > now) {
                return true;
            } else {
                return false;
            }
        }
        
        // get premium
        $scope.getPremium = function (plan) {
            if ($scope.app.user.isLogged()) {
                if (!$scope.app.user.isSubscribed()) {
                    $state.transitionTo('app.profile.subscription', { username: $scope.app.user.getUsername(), plan: plan });
                }
            } else {
                LoginModalService.showModal('login', function () {
                    $scope.getPremium(plan);
                });
            }
        }
    }
])
.controller('HOTSGuideBuilderHeroCtrl', ['$scope', '$state', '$window', '$compile', 'HOTSGuideService', 'GuideBuilder', 'HOTS', 'dataHeroes', 'dataMaps', 'LoginModalService',
    function ($scope, $state, $window, $compile, HOTSGuideService, GuideBuilder, HOTS, dataHeroes, dataMaps, LoginModalService) {
        var box;
        
        // create guide
        $scope.guide = ($scope.app.settings.guide && $scope.app.settings.guide.guideType === 'hero') ? GuideBuilder.new('hero', $scope.app.settings.guide) : GuideBuilder.new('hero');
        $scope.$watch('guide', function(){
            $scope.app.settings.guide = $scope.guide;
        }, true);

        // heroes
        $scope.heroes = dataHeroes.heroes;
        
        // maps
        $scope.maps = dataMaps.maps;
        
        // steps
        $scope.step = 2;
        $scope.prevStep = function () {
            if ($scope.step == 2) { return $state.go('app.hots.guideBuilder.step1', {}); }
            if ($scope.step > 1) $scope.step = $scope.step - 1;
        }
        $scope.nextStep = function () {
            if ($scope.step < 7) $scope.step = $scope.step + 1;
        }
        
        $scope.stepOne = function () {
            $state.go('app.hots.guideBuilder.step1', {});
        };
        
        // draw hero rows
        var heroRows = HOTS.heroRows;
        $scope.heroRows = [];
        var index = 0;
        for (var row = 0; row < heroRows.length; row++) {
            var heroes = [];
            for (var i = 0; i < heroRows[row]; i++) {
                if (dataHeroes.heroes[index]) {
                    heroes.push(dataHeroes.heroes[index]);
                } else {
                    heroes.push({});
                }
                index++;
            }
            $scope.heroRows.push(heroes);
        }
        
        $scope.tooltipPos = function (row, $index) {
            return (($index + 1) > Math.ceil(row.length / 2)) ? 'left' : 'right';
        };
        
        $scope.tooltipPosTalent = function ($index) {
            return ($index === 2) ? 'left' : 'right';
        };        
        
        // draw map rows
        var mapRows = HOTS.mapRows;
        $scope.mapRows = [];
        var index = 0;
        for (var row = 0; row < mapRows.length; row++) {
            var maps = [];
            for (var i = 0; i < mapRows[row]; i++) {
                if (dataMaps.maps[index]) {
                    maps.push(dataMaps.maps[index]);
                }
                index++;
            }
            $scope.mapRows.push(maps);
        }
        
        // talents
        $scope.getTalents = function (hero) {
            return $scope.guide.sortTalents(hero);
        }
        
        $scope.hasTalent = function (hero, talent) {
            return ($scope.guide.hasTalent(hero, talent)) ? ' active' : '';
        }
        
        $scope.hasAnyTalent = function (hero, talent) {
            return ($scope.guide.hasAnyTalent(hero, talent)) ? ' tier-selected' : '';
        }
        
        // summernote options
        $scope.options = {
          height: 100,
          toolbar: [
            ['style', ['style']],
            ['style', ['bold', 'italic', 'underline', 'strikethrough', 'clear']],
            ['color', ['color']],
            ['para', ['ul', 'ol', 'paragraph']],
            ['table', ['table']],
            ['insert', ['link', 'picture', 'video']],
            ['format', ['hr']],
            ['misc', ['undo', 'redo']]
          ]
        };

        // premium
        $scope.isPremium = function () {
            if (!$scope.guide.premium.isPremium) { return false; }
            var now = new Date().getTime(),
                expiry = new Date($scope.guide.premium.expiryDate).getTime();
            if (expiry > now) {
                return true;
            } else {
                return false;
            }
        }
        
        // featured
        $scope.featuredTypes = [
            { text: 'No', value: false },
            { text: 'Yes', value: true }
        ];
        
        $scope.isFeatured = function () {
            var featured = $scope.guide.featured;
            for (var i = 0; i < $scope.featuredTypes.length; i++) {
                if ($scope.featuredTypes[i].value === featured) {
                    return $scope.featuredTypes[i].text;
                }
            }
        }
        
        // save guide
        $scope.saveGuide = function () {
            if ( !$scope.guide.hasAnyHero() || !$scope.guide.allTalentsDone() ) {
                return false;
            }
            if (!$scope.app.user.isLogged()) {
                LoginModalService.showModal('login');
            } else {
                HOTSGuideService.addGuide($scope.guide).success(function (data) {
                    if (!data.success) {
                        $scope.errors = data.errors;
                        $scope.showError = true;
                        $window.scrollTo(0,0);
                    } else {
                        $scope.app.settings.guide = null;
                        $state.go('app.hots.guides.guide', { slug: data.slug });
                    }
                });
            }
        };
    }
])
.controller('HOTSGuideBuilderMapCtrl', ['$scope', '$state', '$window', '$compile', 'HOTS', 'HOTSGuideService', 'GuideBuilder', 'dataHeroes', 'dataMaps', 'LoginModalService',
    function ($scope, $state, $window, $compile, HOTS, HOTSGuideService, GuideBuilder, dataHeroes, dataMaps, LoginModalService) {
        var box;
        
        // create guide
        $scope.guide = ($scope.app.settings.guide && $scope.app.settings.guide.guideType === 'map') ? GuideBuilder.new('map', $scope.app.settings.guide) : GuideBuilder.new('map');
        $scope.$watch('guide', function(){
            $scope.app.settings.guide = $scope.guide;
        }, true);

        // heroes
        $scope.heroes = dataHeroes.heroes;
        
        // maps
        $scope.maps = dataMaps.maps;
        
        // steps
        $scope.step = 2;
        $scope.prevStep = function () {
            if ($scope.step == 2) { return $state.go('app.hots.guideBuilder.step1', {}); }
            if ($scope.step > 1) $scope.step = $scope.step - 1;
        }
        $scope.nextStep = function () {
            if ($scope.step < 5) $scope.step = $scope.step + 1;
        }
        
        $scope.stepOne = function () {
            $state.go('app.hots.guideBuilder.step1', {});
        };
        
        // draw map rows
        var mapRows = HOTS.mapRows;
        $scope.mapRows = [];
        var index = 0;
        for (var row = 0; row < mapRows.length; row++) {
            var maps = [];
            for (var i = 0; i < mapRows[row]; i++) {
                if (dataMaps.maps[index]) {
                    maps.push(dataMaps.maps[index]);
                }
                index++;
            }
            $scope.mapRows.push(maps);
        }

        $scope.tooltipPos = function (row, $index) {
            return (($index + 1) > Math.ceil(row.length / 2)) ? 'left' : 'right';
        };
        
        // summernote options
        $scope.options = {
          height: 100,
          toolbar: [
            ['style', ['style']],
            ['style', ['bold', 'italic', 'underline', 'strikethrough', 'clear']],
            ['color', ['color']],
            ['para', ['ul', 'ol', 'paragraph']],
            ['table', ['table']],
            ['insert', ['link', 'picture', 'video']],
            ['format', ['hr']],
            ['misc', ['undo', 'redo']]
          ]
        };

        // premium
        $scope.premiumTypes = [
            { text: 'No', value: false },
            { text: 'Yes', value: true }
        ];
        
        $scope.isPremium = function () {
            var premium = $scope.guide.premium.isPremium;
            for (var i = 0; i < $scope.premiumTypes.length; i++) {
                if ($scope.premiumTypes[i].value === premium) {
                    return $scope.premiumTypes[i].text;
                }
            }
        }
        
        // featured
        $scope.featuredTypes = [
            { text: 'No', value: false },
            { text: 'Yes', value: true }
        ];
        
        $scope.isFeatured = function () {
            var featured = $scope.guide.featured;
            for (var i = 0; i < $scope.featuredTypes.length; i++) {
                if ($scope.featuredTypes[i].value === featured) {
                    return $scope.featuredTypes[i].text;
                }
            }
        }

        // save guide
        $scope.saveGuide = function () {
            if ( !$scope.guide.hasAnyMap() || !$scope.guide.hasAnyChapter() ) {
                return false;
            }
            if (!$scope.app.user.isLogged()) {
                LoginModalService.showModal('login');
            } else {
                HOTSGuideService.addGuide($scope.guide).success(function (data) {
                    if (!data.success) {
                        $scope.errors = data.errors;
                        $scope.showError = true;
                        $window.scrollTo(0,0);
                    } else {
                        $scope.app.settings.guide = null;
                        $state.go('app.hots.guides.guide', { slug: data.slug });
                    }
                });
            }
        };
    }
])
.controller('HOTSGuideBuilderEditStep1Ctrl', ['$scope', 'dataGuide', 
    function ($scope, dataGuide) {
        $scope.guide = dataGuide.guide;
    }
])
.controller('HOTSGuideBuilderEditHeroCtrl', ['$scope', '$state', '$window', 'GuideBuilder', 'HOTSGuideService', 'HOTS', 'dataGuide', 'dataHeroes', 'dataMaps', 'LoginModalService',
    function ($scope, $state, $window, GuideBuilder, HOTSGuideService, HOTS, dataGuide, dataHeroes, dataMaps, LoginModalService) {
        // create guide
        $scope.guide = GuideBuilder.new('hero', dataGuide.guide);
        
        // heroes
        $scope.heroes = dataHeroes.heroes;
        
        // maps
        $scope.maps = dataMaps.maps;
        
        // steps
        $scope.step = 2;
        $scope.prevStep = function () {
            if ($scope.step == 2) { return $state.go('app.hots.guideBuilder.edit.step1', { slug: $scope.guide.slug }); }
            if ($scope.step > 1) $scope.step = $scope.step - 1;
        }
        $scope.nextStep = function () {
            if ($scope.step < 7) $scope.step = $scope.step + 1;
        }
        
        $scope.stepOne = function () {
            $state.go('app.hots.guideBuilder.edit.step1', { slug: $scope.guide.slug });
        };
        
        // draw hero rows
        var heroRows = HOTS.heroRows;
        $scope.heroRows = [];
        var index = 0;
        for (var row = 0; row < heroRows.length; row++) {
            var heroes = [];
            for (var i = 0; i < heroRows[row]; i++) {
                if (dataHeroes.heroes[index]) {
                    heroes.push(dataHeroes.heroes[index]);
                } else {
                    heroes.push({});
                }
                index++;
            }
            $scope.heroRows.push(heroes);
        }
        
        // draw map rows
        var mapRows = HOTS.mapRows;
        $scope.mapRows = [];
        var index = 0;
        for (var row = 0; row < mapRows.length; row++) {
            var maps = [];
            for (var i = 0; i < mapRows[row]; i++) {
                if (dataMaps.maps[index]) {
                    maps.push(dataMaps.maps[index]);
                }
                index++;
            }
            $scope.mapRows.push(maps);
        }

        $scope.tooltipPos = function (row, $index) {
            return (($index + 1) > Math.ceil(row.length / 2)) ? 'left' : 'right';
        };
        
        $scope.tooltipPosTalent = function ($index) {
            return ($index === 2) ? 'left' : 'right';
        };

        // talents
        $scope.getTalents = function (hero) {
            return $scope.guide.sortTalents(hero);
        }
        
        $scope.hasTalent = function (hero, talent) {
            return ($scope.guide.hasTalent(hero, talent)) ? ' active' : '';
        }
        
        $scope.hasAnyTalent = function (hero, talent) {
            return ($scope.guide.hasAnyTalent(hero, talent)) ? ' tier-selected' : '';
        }
        
        // summernote options
        $scope.options = {
          height: 100,
          toolbar: [
            ['style', ['style']],
            ['style', ['bold', 'italic', 'underline', 'strikethrough', 'clear']],
            ['color', ['color']],
            ['para', ['ul', 'ol', 'paragraph']],
            ['table', ['table']],
            ['insert', ['link', 'picture', 'video']],
            ['format', ['hr']],
            ['misc', ['undo', 'redo']]
          ]
        };

        // premium
        $scope.premiumTypes = [
            { text: 'No', value: false },
            { text: 'Yes', value: true }
        ];
        
        $scope.isPremium = function () {
            var premium = $scope.guide.premium.isPremium;
            for (var i = 0; i < $scope.premiumTypes.length; i++) {
                if ($scope.premiumTypes[i].value === premium) {
                    return $scope.premiumTypes[i].text;
                }
            }
        }
        
        // featured
        $scope.featuredTypes = [
            { text: 'No', value: false },
            { text: 'Yes', value: true }
        ];
        
        $scope.isFeatured = function () {
            var featured = $scope.guide.featured;
            for (var i = 0; i < $scope.featuredTypes.length; i++) {
                if ($scope.featuredTypes[i].value === featured) {
                    return $scope.featuredTypes[i].text;
                }
            }
        }
        
        $scope.login = function login(email, password) {
            if (email !== undefined && password !== undefined) {
                UserService.login(email, password).success(function(data) {
                    AuthenticationService.setLogged(true);
                    AuthenticationService.setAdmin(data.isAdmin);
                    AuthenticationService.setProvider(data.isProvider);
                    
                    SubscriptionService.setSubscribed(data.subscription.isSubscribed);
                    SubscriptionService.setTsPlan(data.subscription.plan);
                    SubscriptionService.setExpiry(data.subscription.expiry);
                    
                    $window.sessionStorage.userID = data.userID;
                    $window.sessionStorage.username = data.username;
                    $window.sessionStorage.email = data.email;
                    $scope.app.settings.token = $window.sessionStorage.token = data.token;
                    box.modal('hide');
                    $scope.saveGuide();
                }).error(function() {
                    $scope.showError = true;
                });
            }
        }
        
        
        // save guide
        $scope.saveGuide = function () {
            if ( !$scope.guide.hasAnyHero() || !$scope.guide.allTalentsDone() ) {
                return false;
            }
            if (!$scope.app.user.isLogged()) {
                LoginModalService.showModal('login');
            } else {
                HOTSGuideService.editGuide($scope.guide).success(function (data) {
                    if (!data.success) {
                        $scope.errors = data.errors;
                        $scope.showError = true;
                        $window.scrollTo(0,0);
                    } else {
                        $state.go('app.hots.guides.guide', { slug: data.slug });
                    }
                });
            }
        };
    }
])
.controller('HOTSGuideBuilderEditMapCtrl', ['$scope', '$state', '$window', 'HOTS', 'GuideBuilder', 'HOTSGuideService', 'dataGuide', 'dataHeroes', 'dataMaps', 'LoginModalService',
    function ($scope, $state, $window, HOTS, GuideBuilder, HOTSGuideService, dataGuide, dataHeroes, dataMaps, LoginModalService) {
        // create guide
        $scope.guide = GuideBuilder.new('map', dataGuide.guide);
        
        // heroes
        $scope.heroes = dataHeroes.heroes;
        
        // maps
        $scope.maps = dataMaps.maps;
        
        // steps
        $scope.step = 2;
        $scope.prevStep = function () {
            if ($scope.step == 2) { return $state.go('app.hots.guideBuilder.edit.step1', { slug: $scope.guide.slug }); }
            if ($scope.step > 1) $scope.step = $scope.step - 1;
        }
        $scope.nextStep = function () {
            if ($scope.step < 5) $scope.step = $scope.step + 1;
        }
        
        $scope.stepOne = function () {
            $state.go('app.hots.guideBuilder.edit.step1', { slug: $scope.guide.slug });
        };
        
        // draw map rows
        var mapRows = HOTS.mapRows;
        $scope.mapRows = [];
        var index = 0;
        for (var row = 0; row < mapRows.length; row++) {
            var maps = [];
            for (var i = 0; i < mapRows[row]; i++) {
                if (dataMaps.maps[index]) {
                    maps.push(dataMaps.maps[index]);
                }
                index++;
            }
            $scope.mapRows.push(maps);
        }

        $scope.tooltipPos = function (row, $index) {
            return (($index + 1) > Math.ceil(row.length / 2)) ? 'left' : 'right';
        };
        
        // summernote options
        $scope.options = {
          height: 100,
          toolbar: [
            ['style', ['style']],
            ['style', ['bold', 'italic', 'underline', 'strikethrough', 'clear']],
            ['color', ['color']],
            ['para', ['ul', 'ol', 'paragraph']],
            ['table', ['table']],
            ['insert', ['link', 'picture', 'video']],
            ['format', ['hr']],
            ['misc', ['undo', 'redo']]
          ]
        };

        // premium
        $scope.premiumTypes = [
            { text: 'No', value: false },
            { text: 'Yes', value: true }
        ];
        
        $scope.isPremium = function () {
            var premium = $scope.guide.premium.isPremium;
            for (var i = 0; i < $scope.premiumTypes.length; i++) {
                if ($scope.premiumTypes[i].value === premium) {
                    return $scope.premiumTypes[i].text;
                }
            }
        }
        
        // featured
        $scope.featuredTypes = [
            { text: 'No', value: false },
            { text: 'Yes', value: true }
        ];
        
        $scope.isFeatured = function () {
            var featured = $scope.guide.featured;
            for (var i = 0; i < $scope.featuredTypes.length; i++) {
                if ($scope.featuredTypes[i].value === featured) {
                    return $scope.featuredTypes[i].text;
                }
            }
        }
        
        // save guide
        $scope.saveGuide = function () {
            if ( !$scope.guide.hasAnyMap() || !$scope.guide.hasAnyChapter() ) {
                return false;
            }
            if (!$scope.app.user.isLogged()) {
                LoginModalService.showModal('login');
            } else {
                HOTSGuideService.editGuide($scope.guide).success(function (data) {
                    if (!data.success) {
                        $scope.errors = data.errors;
                        $scope.showError = true;
                        $window.scrollTo(0,0);
                    } else {
                        $state.go('app.hots.guides.guide', { slug: data.slug });
                    }
                });
            }
        };
    }
])
.controller('HOTSTalentCalculatorCtrl', ['$scope', 'dataHeroesList', 
    function ($scope, dataHeroesList) {
        $scope.heroes = dataHeroesList.heroes;
        $scope.currentHero = false;
        
        $scope.setCurrentHero = function (hero) {
            $scope.currentHero = hero;
        }

        $scope.getCurrentHero = function () {
            return $scope.currentHero;
        };
    }
])
.controller('HOTSTalentCalculatorHeroCtrl', ['$scope', '$state', '$stateParams', '$location', '$window', 'HOTS', 'Base64', 'dataHero', 'MetaService',
    function ($scope, $state, $stateParams, $location, $window, HOTS, Base64, dataHero, MetaService) {
        if (!dataHero.success) { return $state.go('app.hots.talentCalculator.hero', { hero: $scope.heroes[0].className }); }

        $scope.setCurrentHero(dataHero.hero);
        $scope.currentCharacter = $scope.currentHero.characters[0];
        $scope.currentAbility = false;
        $scope.level = 1;
        
        var defaultTalents = {
            tier1: null,
            tier4: null,
            tier7: null,
            tier10: null,
            tier13: null,
            tier16: null,
            tier20: null
        };
        
        $scope.metaservice = MetaService;
        $scope.metaservice.set(dataHero.hero.name + ' - Talent Calculator', dataHero.hero.description);
        
        var ogImg = $scope.app.cdn + 'img/hots/hots-logo.png';
        $scope.metaservice.setOg($location.absUrl(), dataHero.hero.name, dataHero.hero.description, 'article', ogImg);
        
        $scope.getCurrentCharacter = function () {
            return $scope.currentCharacter;
        };
        
        $scope.setCurrentCharacter = function (character) {
            $scope.currentCharacter = character;
        };
        
        $scope.getAbilities = function () {
            var abilities = $scope.getCurrentHero().abilities,
                out = [];
            for (var i = 0; i < abilities.length; i++) {
                if (abilities[i].abilityType == 'Ability') {
                    out.push(abilities[i]);
                }
            }
            return out;
        };
        
        $scope.getHeroics = function () {
            var abilities = $scope.getCurrentHero().abilities,
                out = [];
            for (var i = 0; i < abilities.length; i++) {
                if (abilities[i].abilityType == 'Heroic Ability') {
                    out.push(abilities[i]);
                }
            }
            return out;
        };
        
        $scope.getTrait = function () {
            var abilities = $scope.getCurrentHero().abilities;
            for (var i = 0; i < abilities.length; i++) {
                if (abilities[i].abilityType == 'Combat Trait') {
                    return abilities[i];
                }
            }
            return false;
        };
        
        // abilities
        $scope.getCurrentAbility = function () {
            return $scope.currentAbility;
        };
        
        $scope.toggleAbility = function (ability) {
            if (!$scope.getCurrentAbility() || $scope.getCurrentAbility() !== ability) {
                $scope.currentAbility = ability;
            } else {
                $scope.currentAbility = false;
            }
        };
        
        // talents
        $scope.tiers = HOTS.tiers;

        $scope.talentsByTier = function (tier) {
            var hero = $scope.currentHero,
                talents = [];
            
            for (var i = 0; i < hero.talents.length; i++) {
                if (hero.talents[i].tier === tier) {
                    talents.push(hero.talents[i]);
                }
            }
            return talents;
        };
        
        $scope.hasTalent = function (talent) {
            return ($scope.currentTalents['tier'+talent.tier] == talent._id) ? ' active' : '';
        }
        
        $scope.hasAnyTalent = function (talent) {
            return ($scope.currentTalents['tier'+talent.tier] !== null) ? ' tier-selected' : '';
        }
        
        $scope.toggleTalent = function (talent, tierIndex, talentIndex) {
            if ($scope.hasTalent(talent)) {
                $scope.currentTalents['tier'+talent.tier] = null;
            } else {
                $scope.currentTalents['tier'+talent.tier] = talent._id;
            }
            
            // set hash
            $scope.hash[tierIndex] = ($scope.hasTalent(talent)) ? talentIndex + 2 : 1;
            if (checkHash($scope.hash)) {
                setHash();
            }
        };
                
        // hash
        $scope.hash = [1,1,1,1,1,1,1];

        function getHash (hash) {
            hash = hash || $location.hash();
            var hashInt = Base64.toInt(hash),
                arr = (hashInt+'').split('');
            
            for (var i = 0; i < arr.length; i++) {
                arr[i] = +arr[i];
            }
            
            if (checkHash(arr)) {
                $scope.hash =  arr;
            } else {
                $scope.hash = [1,1,1,1,1,1,1];
            }
            setHash();
        }
        getHash();
        
        function checkHash (hash) {
            if (hash.length !== 7) { return false; }
            
            for (var i = 1; i <= 7; i++) {
                var num = +hash[i - 1];
                if ((num < 1) || (num > $scope.talentsByTier($scope.tiers[i - 1]).length + 1)) { return false; }
            }
            return true;
        }
        
        function setHash() {
            var hashInt = +$scope.hash.join(''),
                hash = (hashInt > 1111111) ? Base64.fromInt(hashInt) : '';
            $location.hash(hash);
        }
        
        function getTalents () {
            var hash = $scope.hash,
                out = {};
            if (checkHash(hash)) {
                for (var i = 1; i <= 7; i++) {
                    var num = +hash[i - 1];
                    out['tier' + $scope.tiers[i - 1]] = (num > 1) ? $scope.talentsByTier($scope.tiers[i - 1])[num - 2]._id : null;
                }
                return out;
            } else {
                return angular.copy(defaultTalents);
            }
        }
        $scope.currentTalents = getTalents();
        
        $scope.$watch(function () {
            return location.hash;
        }, function (value) {
            var newHash = value.substr(1, value.length-1);
            getHash(newHash);
            $scope.currentTalents = getTalents();
        });
        
        function getTalentByID (id) {
            var hero = $scope.getCurrentHero();
            for (var i = 0; i < hero.talents.length; i++) {
                if (hero.talents[i]._id == id) {
                    return hero.talents[i];
                }
            }
            return false;
        }
        
        $scope.getAbilityTalents = function () {
            var ability = $scope.getCurrentAbility(),
                currentTalents = $scope.currentTalents,
                tiers = $scope.tiers,
                out = [],
                talent;
            
            if (!ability) { return out; }
            
            for (var i = 0; i < tiers.length; i++) {
                if (currentTalents['tier' + tiers[i]] !== null) {
                    talent = getTalentByID(currentTalents['tier' + tiers[i]]);
                    if (talent && talent.ability == ability._id) {
                        out.push(talent);
                    }
                }
            }
            
            return out;
        };
        
        // url
        $scope.url = function () {
            return $location.absUrl();
        }
        
        // stats
        function isNum (num) {
            return (num % 1 == 0);
        }
        
        $scope.getHealth = function () {
            var char = $scope.getCurrentCharacter(),
                level = $scope.level;
            
            return (char.stats.base.health + ((level * char.stats.gain.health) - char.stats.gain.health));
        };
        $scope.getHealthRegen = function () {
            var char = $scope.getCurrentCharacter(),
                level = $scope.level,
                val = (char.stats.base.healthRegen + ((level * char.stats.gain.healthRegen) - char.stats.gain.healthRegen));
            
            return (isNum(val)) ? val : +val.toFixed(2);
        };
        $scope.getMana = function () {
            var char = $scope.getCurrentCharacter(),
                level = $scope.level;
            
            return (char.stats.base.mana + ((level * char.stats.gain.mana) - char.stats.gain.mana)) || 'N/A';
        };
        $scope.getManaRegen = function () {
            var char = $scope.getCurrentCharacter(),
                level = $scope.level,
                val = (char.stats.base.manaRegen + ((level * char.stats.gain.manaRegen) - char.stats.gain.manaRegen));
            
            return (isNum(val)) ? val || 'N/A' : +val.toFixed(2);
        };
        $scope.getSpeed = function () {
            var char = $scope.getCurrentCharacter(),
                level = $scope.level,
                val = (char.stats.base.attackSpeed + ((level * char.stats.gain.attackSpeed) - char.stats.gain.attackSpeed));
            
            return (isNum(val)) ? val : +val.toFixed(2);
        };
        $scope.getRange = function () {
            var char = $scope.getCurrentCharacter(),
                level = $scope.level,
                val = (char.stats.base.range + ((level * char.stats.gain.range) - char.stats.gain.range));
            
            return (isNum(val)) ? val : +val.toFixed(2);
        };
        $scope.getDamage = function () {
            var char = $scope.getCurrentCharacter(),
                level = $scope.level;
            
            return (char.stats.base.damage + ((level * char.stats.gain.damage) - char.stats.gain.damage));
        };
        $scope.getDPS = function () {
            var val = ($scope.getSpeed() * $scope.getDamage());
            return (isNum(val)) ? val : +val.toFixed(2);
        };
        
        // copy
        $scope.copyUrl = function () {
            var url = document.querySelector('.tc-url');  
            url.select();

            try {  
                var successful = document.execCommand('copy');  
            } catch(err) {  
                alert('Your browser does not support this feature.');
            }
            
            window.getSelection().removeAllRanges();
        };
        
        // reset
        $scope.reset = function () {
            $location.hash('');
        };
    }
])
.controller('PollsCtrl', ['$scope', '$sce', '$compile', 'bootbox', 'PollService', 'dataPollsMain', 'dataPollsSide', 
    function ($scope, $sce, $compile, bootbox, PollService, dataPollsMain, dataPollsSide) {
        
        var box;
        $scope.pollsMain = dataPollsMain.polls;
        $scope.pollsSide = dataPollsSide.polls;
        
        $scope.toggleItem = function (poll, item) {
            if (!poll.votes) { poll.votes = []; }
            
            if ($scope.hasVoted(poll, item)) {
                poll.votes.splice(poll.votes.indexOf(item._id), 1);
            } else {
                if (poll.votes.length >= poll.voteLimit) { return false; }
                poll.votes.push(item._id);
            }
        };
        
        $scope.getContent = function (content) {
            return $sce.trustAsHtml(content);
        };
        
        $scope.btnText = function (poll, item) {
            return ($scope.hasVoted(poll, item)) ? 'Unpick' : 'Pick';
        }
        
        $scope.voteCurve = function (item, poll) {
            var v = item.votes,
                big = 0,
                item,
                cnt;
            for (var i = 0; i < poll.items.length; i++) {
                cnt = poll.items[i].votes;
                if (cnt > big) { big = cnt; }
            }
            if (big === 0) { return 0; }
            return Math.ceil(v / big * 100);
        };
        
        $scope.votePercentage = function (item, poll) {            
            var v = item.votes,
                cnt = 0;
            for (var i = 0; i < poll.items.length; i++) {
                cnt = parseInt(cnt + poll.items[i].votes);
            }
            if (cnt === 0) { return 0; }
            return Math.ceil(v / cnt * 100);
        };
        
        $scope.hasVoted = function (poll, item) {
            if (!poll.votes) { return false; }
            return (poll.votes.indexOf(item._id) !== -1);
        };
        
        
        $scope.isDoneVoting = function (poll) {
            if (PollService.getStorage(poll)) {
                return PollService.getStorage(poll);
            }
            return null;
        };
        
        $scope.setDoneVoting = function (poll, votes) {
            return PollService.setStorage(poll._id, votes);
        };
        
        $scope.getVotes = function (poll) {
            return poll.votes
        };
        
        $scope.getLocalVotes = function (poll, item) {
            var localVotes = PollService.getStorage(poll._id).split(',');
            for (var i = 0; i < localVotes.length; i++) {
                if(item._id == localVotes[i]) {
                    return true;
                }
            }
        }
        
        $scope.bigImg = function (img, title) {
                box = bootbox.dialog({
                title: title,
                message: $compile('<a ng-click="closeBox()"><img class="img-responsive" ng-src="' + $scope.app.cdn + 'polls/' +img+ '" alt=""></a>')($scope),
                backdrop: true
            });
            
            box.modal('show');
        };
        
        $scope.closeBox = function () {
            box.modal('hide');
        }
        
        $scope.submitVote = function (poll) {
            PollService.postVote(poll, poll.votes).success(function (data) {
                if(!data.success) {
                    $data.errors = data.errors;
                } else {
                    var votesString = $scope.getVotes(poll).join(',');
                    $scope.setDoneVoting(poll, votesString);
                    for (var i = 0; i != poll.items.length; i++){
                        for (var j = 0; j != $scope.getVotes(poll).length; j++) {
                            if (poll.items[i]._id == $scope.getVotes(poll)[j]) {
                                poll.items[i].votes++;
                            }
                        }
                    }
                }
            })
        };
    }                                         
])
.controller('twitchCtrl', ['$scope', 'dataTwitch',
    function($scope, dataTwitch) {
        $scope.streams = dataTwitch.stuff;
    }
])
;;'use strict';
var Z;

angular.module('app.directives', ['ui.load'])
.directive('uiModule', ['MODULE_CONFIG','uiLoad', '$compile', function(MODULE_CONFIG, uiLoad, $compile) {
    return {
        restrict: 'A',
        compile: function (el, attrs) {
            var contents = el.contents().clone();
            return function(scope, el, attrs){
                el.contents().remove();
                uiLoad.load(MODULE_CONFIG[attrs.uiModule])
                .then(function(){
                    $compile(contents)(scope, function(clonedElement, scope) {
                        el.append(clonedElement);
                    });
                });
            }
        }
    };
}])
.directive('uiAdminNav', [function () {
    return {
        restrict: 'AE',
        link: function (scope, el, attr) {
            el.on('click', 'a', function (event) {
                var _this = $(this);
                _this.parent().siblings('.active').toggleClass('active');
                _this.next().is('ul') && _this.parent().toggleClass('active');
            });
        }
    };
}])
.directive('hsCard', function () {
    return {
        restrict: 'A',
        link: function (scope, el, attr) {
            var xPos = (attr['tooltipPos'] && attr['tooltipPos'] === 'left') ? -344 : 60;
            el.wTooltip({
                delay: 500,
                offsetX: xPos,
                offsetY: -40,
                content: '<img src="'+attr['tooltipImg']+'" alt="">',
                style: false,
                className: 'hs-card-tooltip'
            });
        }
    };
})
.directive('loginModal', ['LoginModalService', '$rootScope', function (LoginModalService, $rootScope) {
    return {
        templateUrl: tpl + 'views/frontend/directives/login/login.modal.html',
        scope: true,
        controller: ['$scope', function ($scope) {
            $scope.state = $rootScope.LoginModalService.state;
            $scope.callback = $rootScope.LoginModalService.callback;

            $scope.getState = function () {
                return $scope.state;
            }
            
            $scope.setState = function (s) {
                switch(s) {
                    case 'login':  $scope.state = "login" ; $scope.title = "User Login"; break;
                    case 'signup': $scope.state = "signup"; $scope.title = "User Signup"; break;
                    case 'forgot': $scope.state = "forgot"; $scope.title = "Forgot Password"; break;
                    case 'verify': $scope.state = "verify"; $scope.title = "Verify Email"; break;
                    default:       $scope.state = "login" ; $scope.title = "UserLogin"; break;
                }
            }
            $scope.setState($scope.state);
            
            $scope.closeModal = function () {
                LoginModalService.hideModal();
            }
        }],
        link: function($scope, el, attr) {
            $scope.setTitle = function(s) {
                $(".modal-title")[0].innerHTML = s;
            }
        }
    }
}])
.directive('loginForm', ['$window', '$cookies', '$state', 'AuthenticationService', 'LoginModalService', 'UserService', 'SubscriptionService', function ($window, $cookies, $state, AuthenticationService, LoginModalService, UserService, SubscriptionService) {
    return {
        templateUrl: tpl + 'views/frontend/directives/login/login.form.html',
        scope: true,
        link: function ($scope, el, attr) {
            $scope.remember;
            $scope.loginInfo = {
                email: "",
                password: ""
            };
            var cook = $cookies.getObject('TSRememberMe');
            
            if (cook != undefined) {
                $scope.remember = true;
                $scope.loginInfo.email = cook.email;
                $scope.loginInfo.password = cook.password;
            }

            $scope.login = function login(email, password) {
                if (email !== undefined && password !== undefined) {
                    UserService.login(email, password).success(function(data) {
                        AuthenticationService.setLogged(true);
                        AuthenticationService.setAdmin(data.isAdmin);
                        AuthenticationService.setProvider(data.isProvider);

                        SubscriptionService.setSubscribed(data.subscription.isSubscribed);
                        SubscriptionService.setTsPlan(data.subscription.plan);
                        SubscriptionService.setExpiry(data.subscription.expiry);

                        $window.sessionStorage.userID = data.userID;
                        $window.sessionStorage.username = data.username;
                        $window.sessionStorage.email = data.email;
                        $window.sessionStorage.token = data.token;
                        
                        if ($scope.setState) {
                            $scope.closeModal();
                        } else {
                            $state.go('app.home');
                        }
                            
                        if ($scope.remember) {
                            var expireDate = new Date();
                            expireDate.setDate(expireDate.getDate() + 356);
                            $cookies.putObject('TSRememberMe', { email: $scope.loginInfo.email, password: $scope.loginInfo.password }, { expires: expireDate });
                        } else {
                            $cookies.remove('TSRememberMe');
                        }
                        
                        if ($scope.callback) {
                            $scope.callback();
                        }
                            
                    }).error(function() {
                        $scope.showError = true;
                    });
                }
            }
        }
    }
}])
.directive('signupForm', ['$state', 'UserService', 'LoginModalService', function ($state, UserService, LoginModalService) {
    return {
        templateUrl: tpl + 'views/frontend/directives/login/signup.form.html',
        scope: true,
        link: function ($scope, el, attr) {
            $scope.verify = {
                email: "",
                code: ""
            }
            
            $scope.signup = function signup(email, username, password, cpassword) {
                if (email !== undefined && username !== undefined && password !== undefined && cpassword !== undefined) {
                    UserService.signup(email, username, password, cpassword).success(function (data) {
                        if (!data.success) {
                            $scope.errors = data.errors;
                            $scope.showError = true;
                        } else {
                            $scope.verify.email = email;
                            if ($scope.setState) {
                                $scope.state = "verify";
                            } else {
                                $state.go('app.verify');
                            }
//                            return $state.transitionTo('app.verify', { email: email });
                        }
                    });
                }
            }
        }
    }
}])
.directive('forgotPasswordForm', ['LoginModalService', 'UserService', function (LoginModalService, UserService) {
    return {
        templateUrl: tpl + 'views/frontend/directives/login/forgot.password.form.html',
        scope: true,
        link: function ($scope, el, attr) {
            $scope.forgotPassword = function () {
                UserService.forgotPassword($scope.forgot.email).success(function (data) {
                    if (!data.success) {
                        $scope.errors = data.errors;
                        $scope.showError = true;
                    } else {
                        $scope.showSuccess = true;
                        $scope.forgot.email = '';
                    }
                });
            };
        }
    }
}])
.directive('verifyForm', ['LoginModalService', function (LoginModalService) {
    return {
        templateUrl: tpl + 'views/frontend/directives/login/verify.form.html',
        scope: true,
        link: function ($scope, el, attr) {
            $scope.verifyEmail = function (email, code) {
                 UserService.verifyEmail(email, code).success(function (data) {
                    if (!data.success) {
                        $scope.errors = data.errors;
                        $scope.showError = true;
                    } else {
                        AuthenticationService.setLogged(true);
                        AuthenticationService.setAdmin(data.isAdmin);
                        AuthenticationService.setProvider(data.isProvider);

                        SubscriptionService.setSubscribed(data.subscription.isSubscribed);
                        SubscriptionService.setTsPlan(data.subscription.plan);
                        SubscriptionService.setExpiry(data.subscription.expiry);

                        $window.sessionStorage.userID = data.userID;
                        $window.sessionStorage.username = data.username;
                        $window.sessionStorage.email = data.email;
                        $window.sessionStorage.token = data.token;
                        $scope.closeModal();
                    }
                });
            };
        }
    }
}])
.directive('commentSection', ['$rootScope', '$sce', 'VoteService', 'LoginModalService', function ($rootScope, $sce, VoteService, LoginModalService) {
    return {
        restrict: "E",
        templateUrl: tpl + 'views/frontend/directives/comments/commentSection.html',
        scope: { 
            commentable: "=",
            service:     "=", 
        },
        controller: ['$scope', function ($scope) {
            $scope.commentable;
            $scope.service;
            $scope.app = $rootScope.app;
            
            var defaultComment = '';
            $scope.comment = angular.copy(defaultComment);

            $scope.parseComment = function (c) {
                return $sce.trustAsHtml(c);
            }
            
            $scope.commentPost = function () {
                if (!$scope.app.user.isLogged()) {
                    LoginModalService.showModal('login', function () {
                        $scope.commentPost();
                    });
                } else {
                    console.log($scope.comment, $scope.comment.replace(/<[^>]+>/gm, ''));
                    $scope.service.addComment($scope.commentable, $scope.comment).success(function (data) {
                        if (data.success) {
                            $scope.commentable.comments.push(data.comment);
                            $scope.comment = '';
                            updateCommentVotes();
                        }
                    });
                }
            };

            updateCommentVotes();
            function updateCommentVotes() {
                $scope.commentable.comments.forEach(checkVotes);

                function checkVotes (comment) {
                    var vote = comment.votes.filter(function (vote) {
                        return ($scope.app.user.getUserID() === vote.userID);
                    })[0];

                    if (vote) {
                        comment.voted = vote.direction;
                    }
                }
            }

            $scope.voteComment = function (direction, comment) {
                if (!$scope.app.user.isLogged()) {
                    LoginModalService.showModal('login', function () {
                        $scope.voteComment(direction, comment);
                    });
                } else {
                    if (comment.author._id === $scope.app.user.getUserID()) {
                        bootbox.alert("You can't vote for your own content.");
                        return false;
                    }
                    VoteService.voteComment(direction, comment).then(function (data) {
                        if (data.success) {
                            comment.voted = direction;
                            comment.votesCount = data.votesCount;
                        }
                    });
                }
                updateCommentVotes();
            }
        }],
        link: function ($scope, el, attr) {
            
            $scope.addAreaFocus = false;
            
        }
    }
}])
.directive('datePicker', function (){
    return {
        replace: true,
        templateUrl: tpl + 'views/admin/date-picker.html',
        scope: {
            ngModel: '=',
            ngDisabled: '=',
            dateOptions: '='
        },
        link: function($scope, $element, $attrs, $controller) {
            var id = $attrs.id || 'datePicker',
                name = $attrs.name || 'datePicker',
                $button = $element.find('button'),
                classes = $attrs.class || '',
                $input = $element.find('input').attr('id', id).attr('name', name).addClass(classes);
            $button.on('click',function(){
                if ($input.is(':focus')) {
                    $input.trigger('blur');
                } else {
                    $input.trigger('focus');
                }
            });
        }    
    };
})
.directive('ngRightClick', ['$parse', function($parse) {
    return function(scope, element, attrs) {
        var fn = $parse(attrs.ngRightClick);
        element.bind('contextmenu', function(event) {
            scope.$apply(function() {
                event.preventDefault();
                fn(scope, {$event:event});
            });
        });
    };
}])
.directive('footer', function () {
    return {
        templateUrl: tpl + 'views/frontend/footer.html'
    };
})
.directive("scroll", ['$window', function ($window) {
    return function(scope, element, attrs) {
        angular.element($window).bind("scroll", function() {
             if (this.pageYOffset >= 1) {
                 scope.scrolled = true;
             } else {
                 scope.scrolled = false;
             }
            scope.$apply();
        });
    };
}])
.directive("subNav", ['$window', function ($window) {
    return function(scope, element, attrs) {
        angular.element($window).bind("scroll", function() {
            if (this.pageYOffset >= (element.parent().offset().top - 50)) {
                element.addClass('sticky');
                element.parent().addClass('sticky');
            } else {
                element.removeClass('sticky');
                element.parent().removeClass('sticky');
            }
            scope.$apply();
        });
        angular.element($window).bind("resize", function() {
            if (this.pageYOffset >= (element.parent().offset().top - 50)) {
                element.addClass('sticky');
                element.parent().addClass('sticky');
            } else {
                element.removeClass('sticky');
                element.parent().removeClass('sticky');
            }
            scope.$apply();
        });
    };
}])
.directive("subNavStream", ['TwitchService', '$timeout', 'Util', function (TwitchService, $timeout, Util) {
    return {
        restrict: 'E',
        replace: true,
        scope: false,
        templateUrl: "views/frontend/directives/subnav.stream.html",
        controller: ['$scope', function ($scope) {
            $scope.subNavStreams = [];
            $scope.showSubNavStream = false;
            
            TwitchService.getStreams().then(function(data) {
                for (var i = 0; i < data.data.length; i++) {
                    var log = data.data[i].logoUrl;
                    var sub = log.substr(4);
                    var im = "https" + sub;
                    data.data[i].logoUrl = im;
                    
                    data.data[i].viewerCount = +data.data[i].viewerCount;
                }
                $scope.selectedStream = data.data.length-1;
                $timeout(function() {
                    if (data.data.length) {
                        $scope.showSubNavStream = true;
                    }
                    $scope.subNavStreams = data.data;
                });
            });
            
            $scope.changeStream = function (direction) {
                if (direction == 'increment') {
                    if (++$scope.selectedStream == $scope.subNavStreams.length) {
                        $scope.selectedStream = 0;
                    }
                } else if (direction == 'decrement') {
                    if (--$scope.selectedStream < 0) {
                        $scope.selectedStream = $scope.subNavStreams.length-1;
                    }
                }
            }
            
            $scope.getNumber = function (x) {
                return Util.numberWithCommas(x);
            }
            
        }]
    }
}])
.directive('ngBackground', function(){
    return function(scope, element, attrs){
        var url = attrs.ngBackground;
        element.css({
            'background-image': 'url(\'' + url +'\')',
            'background-position': 'center center',
            'background-size' : 'cover'
        });
    };
})
.directive('ngTooltip', ['$timeout', function($timeout) {
    return {
        restrict: 'A',
        link: function(scope, element, attrs) {
            $timeout(function () {
                $(element).tooltip();
            });
        }
    };
}])
.directive('tsArticle', ['$timeout', function ($timeout) {
    return {
        restrict: 'A',
        link: function(scope, element, attrs) {
            $timeout(function () {
                element.find('img').addClass('img-responsive').css('height', 'auto');
                element.find('table').addClass('table-responsive').css('table-layout', 'auto');
            });
        }
    };
}])
.directive('pollItemAddForm', function () {
    return {
        templateUrl: tpl + 'views/admin/polls.item.add.html'
    };
})
.directive('pollItemEditForm', function () {
    return {
        templateUrl: tpl + 'views/admin/polls.item.edit.html'
    };
})
.directive('abilityAddForm', function () {
    return {
        templateUrl: tpl + 'views/admin/hots.heroes.ability.add.html'
    };
})
.directive('abilityEditForm', function () {
    return {
        templateUrl: tpl + 'views/admin/hots.heroes.ability.edit.html'
    };
})
.directive('talentAddForm', function () {
    return {
        templateUrl: tpl + 'views/admin/hots.heroes.talent.add.html'
    };
})
.directive('talentEditForm', function () {
    return {
        templateUrl: tpl + 'views/admin/hots.heroes.talent.edit.html'
    };
})
.directive('charAddForm', function () {
    return {
        templateUrl: tpl + 'views/admin/hots.heroes.char.add.html'
    };
})
.directive('charEditForm', function () {
    return {
        templateUrl: tpl + 'views/admin/hots.heroes.char.edit.html'
    };
})
.directive('talentModal', function () {
    return {
        templateUrl: tpl + 'views/frontend/hots.talent.modal.html'
    };
})
.directive('heroModal', function () {
    return {
        templateUrl: tpl + 'views/frontend/hots.hero.modal.html'
    };
})
.directive('mapModal', function () {
    return {
        templateUrl: tpl + 'views/frontend/hots.map.modal.html'
    };
})
.directive('hotsTalent', ['$compile', function ($compile) {
    return {
        restrict: 'A',
        scope: {
            hero: '=hero',
            talent: '=talent'
        },
        link: function (scope, el, attr) {
            var xPos = (attr['tooltipPos'] && attr['tooltipPos'] === 'left') ? -560 : 111;
            el.wTooltip({
                delay: 500,
                offsetX: xPos,
                offsetY: -70,
                content: $compile('<div talent-modal></div>')(scope),
                style: false,
                className: 'hots-talent-tooltip'
            });
        }
    };
}])
.directive('hotsHero', ['$compile', function ($compile) {
    return {
        restrict: 'A',
        link: function (scope, el, attr) {
            var xPos = (attr['tooltipPos'] && attr['tooltipPos'] === 'left') ? -690 : 60;
            el.wTooltip({
                delay: 500,
                offsetX: xPos,
                offsetY: -130,
                content: $compile('<div hero-modal></div>')(scope),
                style: false,
                className: 'hots-hero-tooltip'
            });
        }
    };
}])
.directive('hotsMap', ['$compile', function ($compile) {
    return {
        restrict: 'A',
        link: function (scope, el, attr) {
            var xPos = (attr['tooltipPos'] && attr['tooltipPos'] === 'left') ? -560 : 60;
            el.wTooltip({
                delay: 500,
                offsetX: xPos,
                offsetY: -130,
                content: $compile('<div map-modal></div>')(scope),
                style: false,
                className: 'hots-map-tooltip'
            });
        }
    };
}])
.directive('activitySignup', function () {
    return {
        templateUrl: tpl + 'views/frontend/activity/activity.signup.html'
    };
})
.directive('activityArticle', function () {
    return {
        templateUrl: tpl + 'views/frontend/activity/activity.article.html'
    };
})
.directive('activityArticleComment', function () {
    return {
        templateUrl: tpl + 'views/frontend/activity/activity.article.comment.html'
    };
})
.directive('activityDeck', function () {
    return {
        templateUrl: tpl + 'views/frontend/activity/activity.deck.html'
    };
})
.directive('activityDeckComment', function () {
    return {
        templateUrl: tpl + 'views/frontend/activity/activity.deck.comment.html'
    };
})
.directive('activityForumPost', function () {
    return {
        templateUrl: tpl + 'views/frontend/activity/activity.forumPost.html'
    };
})
.directive('activityForumPostComment', function () {
    return {
        templateUrl: tpl + 'views/frontend/activity/activity.forumPost.comment.html'
    };
})
.directive('activityGuide', function () {
    return {
        templateUrl: tpl + 'views/frontend/activity/activity.guide.html'
    };
})
.directive('activityGuideComment', function () {
    return {
        templateUrl: tpl + 'views/frontend/activity/activity.guide.comment.html'
    };
})
.directive('activitySnapshotComment', function () {
    return {
        templateUrl: tpl + 'views/frontend/activity/activity.snapshot.comment.html'
    };
})
.directive('premiumPage', function () {
    return {
        templateUrl: tpl + 'views/frontend/premiumDirective.html'
    };
})
.directive('articleItemAdd', function () {
    return {
        templateUrl: tpl + 'views/admin/articles.item.add.html',
    };
})
.directive('articleRelatedAdd', function () {
    return {
        templateUrl: tpl + 'views/admin/articles.related.add.html',
    };
})
.directive('hsBuilder', function() {
    return {
        templateUrl: tpl + 'views/frontend/hs.deckBuilder.directive.html',
    }
})
.directive('hotsBuilder', function() {
    return {
        templateUrl: tpl + 'views/frontend/hots.guideBuilder.directive.html',
    }
})
.directive('hotsTc', function() {
    return {
        templateUrl: tpl + 'views/frontend/hots.tc.directive.html',
    }
})
.directive('a', function() {
    return {
        restrict: 'E',
        link: function(scope, elem, attrs) {
            if(attrs.ngClick || attrs.href === '' || attrs.href === '#'){
                elem.on('click', function(e){
                    e.preventDefault();
                });
            }
        }
   };
})
.directive('talentIconLg', ['$window', function ($window) {
    return {
        restrict: 'A',
        link: function (scope, elem, attrs) {  
            
            scope.isLarge = ($window.innerWidth >= 1200) ? ' large' : '';
            
            angular.element($window).on('resize', function () {
                scope.$apply(function(){
                    scope.isLarge = ($window.innerWidth >= 1200) ? ' large' : '';
                })
            });
        }
    }
}])
.directive('talentIconMd', ['$window', function ($window) {
    return {
        restrict: 'A',
        link: function (scope, elem, attrs) {  
            
            scope.isLarge = ($window.innerWidth >= 992) ? ' large' : '';
            
            angular.element($window).on('resize', function () {
                scope.$apply(function(){
                    scope.isLarge = ($window.innerWidth >= 992) ? ' large' : '';
                })
            });
        }
    }
}])
.directive('spinnerButton', [function() {
    return {
        restrict: 'A',
        link: function(scope, element, attrs) {
            element.addClass("has-spinner");
            element.append(' <span class="spinner"><i class="fa fa-refresh fa-spin"></i></span>');

            scope.$watch(attrs.spinnerButton, function(value) {
                element.toggleClass("spinning", value);
            });
        }
    };
}])
.directive("markItUp", ["markitupSettings", function(markitupSettings) {
    return {
      restrict: "A",
      scope: {
        ngModel: "="
      },
      link: function(scope, element, attrs) {
        var settings;
        settings = markitupSettings.create(function(event) {
          scope.$apply(function() {
            scope.ngModel = event.textarea.value;
          });
        });
        angular.element(element).markItUp(settings);
      }
    };
  }
])
.directive('snapshotAddAuthor', [function () {
    return {
        templateUrl: tpl + "views/admin/snapshot.add.author.html"
    };
}])
.directive('snapshotAddDeck', [function () {
    return {
        templateUrl: tpl + "views/admin/snapshot.add.deck.html"
    }
}])
.directive('snapshotAddCard', [function () {
    return {
        templateUrl: tpl + "views/admin/snapshot.add.card.html"
    };
}])
.directive("fbLikeButton", [function () {
    return {
        restrict: "A",
        replace: true,
        scope: {
            url: "=url"
        },
        templateUrl: tpl + 'views/frontend/socialmedia/fblikebutton.html'
    }
}])
.directive("tweetButton", [function () {
    return {
        restrict: "A",
        replace: true,
        scope: {
            url: "=url"
        },
        templateUrl: tpl + 'views/frontend/socialmedia/tweetbutton.html'
    }
}])
.directive("redditButton", [function () {
    return {
        restrict: "A",
        replace: true,
        scope: {
            url: "=url"
        },
        templateUrl: tpl + 'views/frontend/socialmedia/redditbutton.html'
    }
}])
.directive("dbDeck", [function () {
    return {
        restrict: "A",
        replace: true,
        scope: {
            mulliganHide: "=",
            deck: "=deck"
        },
        link: function (scope,elem,attr) {
            scope.getDust = function () {
                var dust = 0;
                for (var i = 0; i < scope.deck.cards.length; i++) {
                    dust += scope.deck.cards[i].qty * scope.deck.cards[i].card.dust;
                }
                return dust;
            };
        },
        controller: ['$scope', function ($scope) {
            $scope.cdn = $scope.$parent.$parent.$parent.$parent.$parent.app.cdn;
        }],
        templateUrl: tpl + 'views/frontend/directives/db.deck.html'
    }
}])
.directive('homeArticles', ['$window', function ($window) {
    return {
        restrict: 'A',
        scope: {
            viewable: '&',
            offset: '=',
            size: '='
        },
        link: function(scope, element, attrs) {
            function updateWidth () {
                var newWidth = (((100 / scope.viewable()) * scope.size) / 100 * ($('body').innerWidth() - 20));
                $(element).find('.home-articles-inner').css('width', newWidth + 'px');
                $(element).find('.home-article-wrapper').css('width', Math.floor(newWidth / scope.size, 2) + 'px');
            }
            
            function updateOffset () {
                var newWidth = (((100 / scope.viewable()) * scope.size) / 100 * ($('body').innerWidth() - 20));
                var offset = (scope.offset + scope.viewable() > scope.size) ? scope.size - scope.viewable() : scope.offset;
                $(element).find('.home-articles-inner').css('left', (Math.floor(newWidth / scope.size) * offset * -1) + 'px');
            }
            
            scope.$watch(
                function ($scope) {
                    return $scope.viewable();
                },
                function(newValue){
                    updateWidth();
                    updateOffset();
            });
            scope.$watch('offset', function(value){
                updateOffset();
            });
            scope.$watch('size', function(value){
                updateWidth();
            });
            angular.element($window).bind("resize", function() {
                updateWidth();
                updateOffset();
            });
        }
    };
}])
.directive('bootstrapWidth', ['$window', '$timeout', function ($window, $timeout) {
    return {
        restrict: 'A',
        link: function(scope, element, attrs) {
            function updateBootstrapWidth () {
                var width = $('body').innerWidth();
                
                if (width < 768) {
                    scope.app.bootstrapWidth = 'xs';
                } else if (width < 993) {
                    scope.app.bootstrapWidth = 'sm';
                } else if (width < 1199) {
                    scope.app.bootstrapWidth = 'md';
                } else {
                    scope.app.bootstrapWidth = 'lg';
                }
                $timeout(function () {
                    scope.$apply();
                });
            }
            updateBootstrapWidth();
            angular.element($window).bind("resize", function() {
                updateBootstrapWidth();
            });
        }
    };
}])
.directive('hotsFiltering', ['$filter', '$timeout', function ($filter, $timeout) {
    return {
        restrict: 'A',
        scope: {
            maps: '=',
            heroes: '=',
            filters: '='
        },
        templateUrl: tpl + 'views/frontend/directives/hots.filtering.html',
        link: function (scope, element, attrs) {
            var initializing = true,
                randHeroIndex = false;
            
            function randomIntFromInterval (min,max) {
                return Math.floor(Math.random()*(max-min+1)+min);
            }
            
            scope.$watch(function(){ return scope.filters; }, function (value) {
                if (initializing) {
                    $timeout(function () {
                        initializing = false;
                        randHeroIndex = randomIntFromInterval(0, scope.heroes.length - 1);
                    });
                } else {
                    scope.filters = value;
                }
            }, true);
            
            scope.updateSearch = function () {
                scope.filters.search = scope.searchHeroes;
            }
            
            scope.hasFilterRole = function (role) {
                for (var i = 0; i < scope.filters.roles.length; i++) {
                    if (scope.filters.roles[i] == role) {
                        return true;
                    }
                }
                return false;
            };
            
            scope.hasFilterUniverse = function (universe) {
                for (var i = 0; i < scope.filters.universes.length; i++) {
                    if (scope.filters.universes[i] == universe) {
                        return true;
                    }
                }
                return false;
            };
            
            scope.toggleFilterHero = function (hero) {
                var index = scope.filters.heroes.indexOf(hero);
                if (index === -1) {
                    if (scope.filters.roles.length && scope.filters.roles.indexOf(hero.role) == -1) {
                        scope.filters.roles.push(hero.role);
                    }
                    if (scope.filters.universes.length && scope.filters.universes.indexOf(hero.universe) == -1) {
                        scope.filters.universes.push(hero.universe);
                    }
                    scope.filters.heroes = [hero];
                    //scope.filters.heroes.push(hero);
                } else {
                    scope.filters.heroes = [];
                    //scope.filters.heroes.splice(index, 1);
                }
                
                if (!scope.filters.heroes.length) {
                    randHeroIndex = randomIntFromInterval(0, scope.heroes.length - 1);
                }
            };
            
            scope.isFiltered = function (hero) {
                if (scope.hasFilterHero(hero)) {
                    return false;
                }
                if (scope.hasAnyFilterHero() && !scope.hasFilterHero(hero)) {
                    return true;
                }
                if (scope.filters.roles.length && !scope.hasFilterRole(hero.role)) {
                    return true;
                }
                if (scope.filters.universes.length && !scope.hasFilterUniverse(hero.universe)) {
                    return true;
                }
                if (scope.searchHeroes && scope.searchHeroes.length && scope.hasFilterSearch(hero)) {
                    return true;
                }
                return false;
            };
            
            scope.hasFilterHero = function (hero) {
                return (scope.filters.heroes.indexOf(hero) !== -1);
            };

            scope.hasFilterSearch = function (hero) {
                var filtered = (scope.searchHeroes && scope.searchHeroes.length) ? $filter('filter')(scope.heroes, { name: scope.searchHeroes }) : scope.heroes;
                return (filtered.indexOf(hero) === -1);
            }

            scope.hasAnyFilter = function () {
                return (scope.filters.roles.length ||
                        scope.filters.universes.length ||
                        scope.filters.search.length ||
                        scope.filters.heroes.length);
            };

            scope.hasAnyFilterHero = function () {
                return (scope.filters.heroes.length);
            };

            scope.hasFilterMap = function (map) {
                return (scope.filters.map === map);
            };

            scope.hasAnyFilterMap = function () {
                return (scope.filters.map !== false);
            };

            scope.toggleFilterMap = function (map) {
                scope.filters.map = (scope.filters.map == map) ? false : map;
            };

            scope.currentMapBack = function () {
                return (scope.filters.map) ? scope.filters.map.className : 'default';
            };

            // setup hero filters
            scope.heroDots = [{}];
            for (var i = 0; i < 55; i++) {
                if (scope.heroes[i]) {
                    scope.heroDots.push(scope.heroes[i]);
                } else {
                    scope.heroDots.push({});
                }
            }
            
            function getRandomHero () {
                var hero = scope.heroes[randHeroIndex];
                return {
                    name: hero.name,
                    title: hero.title,
                    className: hero.className
                };
            }
            
            // latest hero
            scope.hero = function () {
                if (scope.filters.heroes.length) {
                    return scope.filters.heroes[scope.filters.heroes.length - 1];
                } else if (randHeroIndex) {
                    return getRandomHero();
                } else {
                    return {
                        name: '\u00A0',
                        title: '\u00A0',
                        className: 'default'
                    };
                }
            };            
        }
    };
}])
.directive('hotsFilterRole', ['$filter', '$timeout', function ($filter, $timeout) {
    return {
        restrict: 'A',
        scope: {
            filters: '='
        },
        templateUrl: tpl + 'views/frontend/directives/hots.filter.role.html',
        replace: true,
        link: function (scope, element, attrs) {
            var initializing = true;
            
            scope.$watch(function(){ return scope.filters; }, function (value) {
                if (initializing) {
                    $timeout(function () {
                        initializing = false;
                    });
                } else {
                    scope.filters = value;
                }
            }, true);
            
            scope.toggleFilterRole = function (role) {
                var index = scope.filters.roles.indexOf(role);
                if (index === -1) {
                    scope.filters.roles.push(role);
                } else {
                    scope.filters.roles.splice(index, 1);
                }
            };

            scope.hasFilterRole = function (role) {
                for (var i = 0; i < scope.filters.roles.length; i++) {
                    if (scope.filters.roles[i] == role) {
                        return true;
                    }
                }
                return false;
            };
        }
    };
}])
.directive('hotsFilterUniverse', ['$filter', '$timeout', function ($filter, $timeout) {
    return {
        restrict: 'A',
        scope: {
            filters: '='
        },
        templateUrl: tpl + 'views/frontend/directives/hots.filter.universe.html',
        replace: true,
        link: function (scope, element, attrs) {
            var initializing = true;
            
            scope.$watch(function(){ return scope.filters; }, function (value) {
                if (initializing) {
                    $timeout(function () {
                        initializing = false;
                    });
                } else {
                    scope.filters = value;
                }
            }, true);
            
            scope.toggleFilterUniverse = function (universe) {
                var index = scope.filters.universes.indexOf(universe);
                if (index === -1) {
                    scope.filters.universes.push(universe);
                } else {
                    scope.filters.universes.splice(index, 1);
                }
            };

            scope.hasFilterUniverse = function (universe) {
                for (var i = 0; i < scope.filters.universes.length; i++) {
                    if (scope.filters.universes[i] == universe) {
                        return true;
                    }
                }
                return false;
            };
        }
    };
}])
.directive('hsFilterClass', ['$filter', '$timeout', function ($filter, $timeout) {
    return {
        restrict: 'A',
        scope: {
            classes: '=',
            filters: '='
        },
        templateUrl: tpl + 'views/frontend/directives/hs.filter.class.html',
        replace: true,
        link: function (scope, element, attrs) {
            var initializing = true;
            
            scope.$watch(function(){ return scope.filters; }, function (value) {
                if (initializing) {
                    $timeout(function () {
                        initializing = false;
                    });
                } else {
                    scope.filters = value;
                }
            }, true);
            
            scope.toggleFilterClass = function (klass) {
                var index = scope.filters.classes.indexOf(klass);
                if (index === -1) {
                    scope.filters.classes.push(klass);
                } else {
                    scope.filters.classes.splice(index, 1);
                }
            };

            scope.hasFilterClass = function (klass) {
                if (!klass) {
                    return (scope.filters.classes.length > 0);
                }
                
                for (var i = 0; i < scope.filters.classes.length; i++) {
                    if (scope.filters.classes[i] == klass) {
                        return true;
                    }
                }
                return false;
            };
        }
    };
}])
.directive('articleThumb', ['$sce', function ($sce) {
    return {
        restrict: 'E',
        replace: true,
        scope: {
            article: '='
        },
        templateUrl: tpl + 'views/frontend/directives/article.thumb.html',
        controller: ['$scope', function ($scope) {
            $scope.getDescription = function (i) {
                var temp = i,
                    magicNumber = 170;
                if(i.length > magicNumber-10) {
                    if (i[magicNumber] != " ") {
                        for (var j = 0; i[magicNumber+j] != " " && i[magicNumber+j] != undefined; j++) {}
                        i = temp.slice(0,magicNumber+j);
                    } else {
                        i = temp.slice(0,magicNumber);
                    }
                    i = i + "...";
                }
                return $sce.trustAsHtml(i);
            }
            
            //is premium
            $scope.isPremium = function (guide) {
                if (!guide.premium.isPremium) { return false; }
                var now = new Date().getTime(),
                    expiry = new Date(guide.premium.expiryDate).getTime();
                if (expiry > now) {
                    return true;
                } else {
                    return false;
                }
            }
        }]
    }
}])
.directive('hsFilterClassLarge', ['$filter', '$timeout', function ($filter, $timeout) {
    return {
        restrict: 'A',
        scope: {
            classes: '=',
            filters: '='
        },
        templateUrl: tpl + 'views/frontend/directives/hs.filter.class.large.html',
        replace: true,
        link: function (scope, element, attrs) {
            var initializing = true;
            
            scope.$watch(function(){ return scope.filters; }, function (value) {
                if (initializing) {
                    $timeout(function () {
                        initializing = false;
                    });
                } else {
                    scope.filters = value;
                }
            }, true);
            
            scope.toggleFilterClass = function (klass) {
                var index = scope.filters.classes.indexOf(klass);
                if (index === -1) {
                    scope.filters.classes.push(klass);
                } else {
                    scope.filters.classes.splice(index, 1);
                }
            };

            scope.hasFilterClass = function (klass) {
                if (!klass) {
                    return (scope.filters.classes.length > 0);
                }
                
                for (var i = 0; i < scope.filters.classes.length; i++) {
                    if (scope.filters.classes[i] == klass) {
                        return true;
                    }
                }
                return false;
            };
        }
    };
}])
.directive('pagination', ['$timeout', function ($timeout) {
    return {
        restrict: 'A',
        scope: {
            pagination: '='
        },
        templateUrl: function (element, attrs) {
            var theme = attrs.theme || 'default';
            return tpl + 'views/frontend/directives/pagination/' + theme + '.html';
        }
    };
}])
.directive('noAnimate', ['$animate', function ($animate) {
    return {
        restrict: 'A',
        link: function (scope, element, attrs) {
            $animate.enabled(element, false);
        }
    };
}])
.directive('tempostormTv', ['TwitchService', 'Util', function (TwitchService, Util) {
    return {
        restrict: 'A',
        scope: false,
        templateUrl: tpl + 'views/frontend/directives/twitch.streams.html',
        link: function (scope, element, attrs) {
            scope.streamWheel = false;
            scope.streams = undefined;
            
            scope.getNumber = function (x) {
                return Util.numberWithCommas(x);
            }

            TwitchService.getStreams().then(function(data) {
                for (var i = 0; i < data.data.length; i++) {
                    var log = data.data[i].screenshotUrl;
                    var sub = log.substr(4);
                    var im = "https" + sub;
                    data.data[i].screenshotUrl = im;
                    
                    data.data[i].viewerCount = +data.data[i].viewerCount;
                }
                scope.streamWheel = true;
                scope.streams = data.data;
            });
        }
    };
}])
.directive('twitterFeed', ['$sce', 'TwitterService', function ($sce, TwitterService) {
    return {
        restrict: 'A',
        templateUrl: tpl + 'views/frontend/directives/twitter.tweets.html',
        link: function (scope, element, attrs) {
            scope.twitWheel = false;
            scope.tweets = undefined;

            TwitterService.getFeed().then(function(data) {
                scope.twitWheel = true;
                scope.tweets = data.data;
            });

            scope.getContent = function (c) {
                return $sce.trustAsHtml(c);
            };

        }
    };
}])
.directive('videoOfTheDay', ['VodService', function (VodService) {
    return {
        restrict: 'A',
        template: function () {
            return '<h3 class="sub-title m-b-md">{{vod.subTitle}}</h3><youtube-video class="home-vod" ng-if="vod.url" video-url="vod.url"></youtube-video><youtube-video class="home-vod" ng-if="vod.vars.list" player-vars="vod.vars"></youtube-video>';
        },
        link: function (scope, element, attrs) {
            VodService.getLatestVod().then(function (data) {
                scope.vod = data.vod;
            });
        }
    };
}])
;;'use strict';

angular.module('app.filters', [])
.filter('startFrom', function () {
    return function (input, start) {
        start = +start;
        return input.slice(start);
    }
})
.filter('filterAll', ['$filter', function ($filter) {
    var filter = $filter('filter');
    return function (input, search) {
        
        Array.prototype.diff = function(arr2) {
            var ret = [];
            for(i in this) {
                if(arr2.indexOf( this[i] ) > -1){
                    ret.push( this[i] );
                }
            }
            return ret;
        };
        
        search = search || '';
        search = search.split('+');
        
        var results = [];
        for (var i = 0; i < search.length; i++) {
            if (i === 0) {
                results = results.concat(filter(input, search[i]));
            } else {
                results = results.diff(filter(input, search[i]));
            }
        }
        
        return results;
    };
}])
;;'use strict';

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
        },        
        setPlan: function (plan, cctoken) {
            cctoken = cctoken || false;
            return $http.post('/api/subscription/setplan', { plan: plan, cctoken: cctoken });
        },
        setCard: function (cctoken) {
            return $http.post('/api/subscription/setcard', { cctoken: cctoken });
        },
        cancel: function () {
            return $http.post('/api/subscription/cancel', {});
        }
    };
}])
.factory('UserService', ['$http', '$compile', function($http, $compile) {
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
}])
.factory('LoginModalService', ['$rootScope', '$compile', function ($rootScope, $compile) {
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
            box.modal('show');
        },
        hideModal: function () {
            box.modal('hide');
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
.factory('TokenInterceptor', ['$q', '$window', function ($q, $window) {
    return {
        request: function (config) {
            config.headers = config.headers || {};
            if (config.method == "POST" && $window.sessionStorage.token) {
                config.headers.Authorization = 'Bearer ' + $window.sessionStorage.token;
            }
            return config;
        },
 
        response: function (response) {
            return response || $q.when(response);
        }
    };
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
.factory('AdminArticleService', ['$http', '$q', function ($http, $q) {
    return {
        articleTypes: function () {
            return [
                { name: 'Tempo Storm', value: 'ts' },
                { name: 'Hearthstone', value: 'hs' },
                { name: 'Heroes of the Storm', value: 'hots' }
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
.factory('AjaxPagination', [function () {
    var pagination = {};
    
    pagination.new = function (perpage, total, callback) {
        var paginate = {
            page: 1,
            perpage: perpage || 10,
            total: total || 0,
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
.factory('Util', ['$http', function ($http) {
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
        },
        numberWithCommas : function (x) {
            return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
        },
        getObjectID: function () {
            return $http.post('/api/admin/id', {});
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
        Paladin: ['Uther'],
        Priest: ['Anduin'],
        Warlock: ['Guldan'],
        Hunter: ['Rexxar', 'Alleria'],
        Druid: ['Malfurion']
    };
    hs.mechanics = ['Battlecry', 'Charge', 'Choose One', 'Combo', 'Deathrattle', 'Divine Shield', 'Enrage', 'Freeze', 'Inspire', 'Jousting', 'Overload', 'Secret', 'Silence', 'Spell Damage', 'Stealth', 'Summon', 'Taunt', 'Windfury'];
    hs.deckTypes = ['None', 'Aggro', 'Control', 'Midrange', 'Combo', 'Theory Craft'];
    hs.expansions = ['Basic', 'Naxxramas', 'Goblins Vs. Gnomes', 'Blackrock Mountain', 'The Grand Tournament'];
    
    return hs;
})
.factory('HOTS', function () {
    var hots = {};
    
    hots.roles = ["Warrior", "Assassin", "Support", "Specialist"];
    hots.types = ["Melee", "Ranged"];
    hots.universes = ["Warcraft", "Starcraft", "Diablo", "Blizzard"];
    hots.abilityTypes = ["Combat Trait", "Ability", "Heroic Ability", "Heroic Skill", "Mount"];
    hots.manaTypes = ['Mana', 'Brew', 'Energy', 'Fury'];
    hots.tiers = [1,4,7,10,13,16,20];
    hots.heroRows = [9, 8, 9, 8, 7];
    hots.mapRows = [5,4];
    
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
.factory('DeckBuilder', ['$sce', '$http', '$q', function ($sce, $http, $q) {

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
            chapters: data.chapters || [],
            type: data.type || 1,
            basic: data.basic || false,
            matches: data.matches || [],
            cards: data.cards || [],
            heroName: data.heroName || '',
            playerClass: playerClass,
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
            video: data.video || '',
            premium: data.premium || {
                isPremium: false,
                expiryDate: d
            },
            featured: data.featured || false,
            public: data.public || 'true'
        };
        
        db.validVideo = function () {
            //var r = /^(?:https?:\/\/)?(?:www\.)?(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))((\w|-){11})(?:\S+)?$/;
            //return (db.video.length) ? db.video.match(r) : true;
            return true;
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
        
        db.getStrong = function (klass) {
            var strong = db.against.strong;
            for (var i = 0; i < strong.length; i++) {
                if (strong[i].klass === klass) {
                    return strong[i];
                }
            }
            return false;
        }

        db.getWeak = function (klass) {
            var weak = db.against.weak;
            for (var i = 0; i < weak.length; i++) {
                if (weak[i].klass === klass) {
                    return weak[i];
                }
            }
            return false;
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
        
        db.getMulligan = function (klass) {
            var mulligans = db.mulligans;
            for (var i = 0; i < mulligans.length; i++) {
                if (mulligans[i].klass === klass) {
                    return mulligans[i];
                }
            }
            return false;
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
                    cardType: card.cardType,
                    dust: card.dust,
                    photos: {
                        small: card.photos.small,
                        medium: card.photos.medium,
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
                        result = dynamicSort(props[i])(a, b);
                        i++;
                    }
                    return result;
                }
            }

            db.cards.sort(dynamicSortMultiple('cost', 'cardType', 'name'));
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

            return Math.ceil(db.manaCount(mana) / big * 100);
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
            var m = {
                deckName: '',
                klass: '',
                match: 0
            };
            
            m.klass = klass;
            db.matches.push(m);
        }
        
        db.removeMatch = function (index) {
            db.matches.splice(index,1);
        }

        return db;
    }

    deckBuilder.loadCards = function (page, perpage, search, mechanics, mana, playerClass) {
        var d = $q.defer();
        $http.post('/deckbuilder', { page: page, perpage: perpage, search: search, mechanics: mechanics, mana: mana, playerClass: playerClass }).success(function (data) {
            d.resolve(data);
        });
        return d.promise;
    }

    deckBuilder.saveDeck = function (deck) {
        return $http.post('/api/deck/add', {
            name: deck.name,
            deckType: deck.deckType,
            description: deck.description,
            chapters: deck.chapters,
            matches: deck.matches,
            type: deck.type,
            basic: deck.basic,
            cards: deck.cards,
            heroName: deck.heroName,
            playerClass: deck.playerClass,
            mulligans: deck.mulligans,
            video: deck.video,
            premium: deck.premium,
            featured: deck.featured,
            public: deck.public
        });
    }
    
    deckBuilder.updateDeck = function (deck) {
        return $http.post('/api/deck/update', {
            _id: deck._id,
            name: deck.name,
            deckType: deck.deckType,
            description: deck.description,
            chapters: deck.chapters,
            matches: deck.matches,
            type: deck.type,
            basic: deck.basic,
            cards: deck.cards,
            heroName: deck.heroName,
            playerClass: deck.playerClass,
            mulligans: deck.mulligans,
            video: deck.video,
            premium: deck.premium,
            featured: deck.featured,
            public: deck.public
        });
    }

    return deckBuilder;
}])
.factory('GuideBuilder', ['$sce', '$http', '$q', function ($sce, $http, $q) {

    var guideBuilder = {};

    guideBuilder.new = function (guideType, data) {
        data = data || {};
        
        var d = new Date();
        d.setMonth(d.getMonth() + 1);
        
        var gb = {
            _id: data._id || null,
            name: data.name || '',
            slug: data.slug || '',
            guideType: guideType,
            description: data.description || '',
            content: data.content || [],
            heroes: data.heroes || [],
            maps: data.maps || [],
            synergy: data.synergy || [],
            against: data.against || {
                strong: [],
                weak: []
            },
            video: data.video || '',
            premium: data.premium || {
                isPremium: false,
                expiryDate: d
            },
            featured: data.featured || false,
            public: (data.public) ? data.public.toString() : 'true'
        };
        
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
                for (var i = 0; i < gb.heroes.length; i++) {
                    if (gb.heroes[i].hero._id === hero._id) {
                        gb.heroes.splice(i, 1);
                        return true;
                    }
                }
            } else {
                if (gb.heroes.length === 5) { return false; }
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
        
        gb.hasHero = function (hero) {
            if (!hero) { return false; }
            for (var i = 0; i < gb.heroes.length; i++) {
                if (gb.heroes[i].hero._id === hero._id) {
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
            var talents = [];
            for (var i = 0; i < hero.talents.length; i++) {
                if (hero.talents[i].tier === tier) {
                    talents.push(hero.talents[i]);
                }
            }
            return talents;
        };
        
        gb.toggleTalent = function (hero, talent) {
            if (gb.hasTalent(hero, talent)) {
                hero.talents['tier'+talent.tier] = null;
            } else {
                hero.talents['tier'+talent.tier] = talent._id;
            }
        };
        
        gb.hasAnyTalent = function (hero, talent) {
            return (hero.talents['tier'+talent.tier] !== null);
        }
        
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
        
        gb.hasTalent = function (hero, talent) {
            return (hero.talents['tier'+talent.tier] == talent._id);
        };
        
        gb.toggleSynergy = function (hero) {
            if (gb.hasSynergy(hero)) {
                for (var i = 0; i < gb.synergy.length; i++) {
                    if (gb.synergy[i] === hero._id) {
                        gb.synergy.splice(i, 1);
                        return true;
                    }
                }
            } else {
                gb.synergy.push(hero._id);
            }
        };
        
        gb.hasSynergy = function (hero) {
            for (var i = 0; i < gb.synergy.length; i++) {
                if (gb.synergy[i] === hero._id) {
                    return true;
                }
            }
            return false;
        };
        
        gb.toggleStrong = function (hero) {
            if (gb.hasStrong(hero)) {
                for (var i = 0; i < gb.against.strong.length; i++) {
                    if (gb.against.strong[i] === hero._id) {
                        gb.against.strong.splice(i, 1);
                        return true;
                    }
                }
            } else {
                gb.against.strong.push(hero._id);
            }
        };
        
        gb.hasStrong = function (hero) {
            for (var i = 0; i < gb.against.strong.length; i++) {
                if (gb.against.strong[i] === hero._id) {
                    return true;
                }
            }
            return false;
        };
        
        gb.toggleWeak = function (hero) {
            if (gb.hasWeak(hero)) {
                for (var i = 0; i < gb.against.weak.length; i++) {
                    if (gb.against.weak[i] === hero._id) {
                        gb.against.weak.splice(i, 1);
                        return true;
                    }
                }
            } else {
                gb.against.weak.push(hero._id);
            }
        };
        
        gb.hasWeak = function (hero) {
            for (var i = 0; i < gb.against.weak.length; i++) {
                if (gb.against.weak[i] === hero._id) {
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
            gb.maps = [map._id];
        };
        
        gb.toggleMap = function (map) {
            if (gb.hasMap(map)) {
                for (var i = 0; i < gb.maps.length; i++) {
                    if (gb.maps[i] === map._id) {
                        gb.maps.splice(i, 1);
                        return true;
                    }
                }
            } else {
                gb.maps.push(map._id);
            }
        };
        
        gb.hasMap = function (map) {
            for (var i = 0; i < gb.maps.length; i++) {
                if (gb.maps[i] === map._id) {
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

    guideBuilder.saveGuide = function (guide) {
        return $http.post('/api/guide/add', guide);
    }
    
    guideBuilder.updateGuide = function (guide) {
        return $http.post('/api/guide/update', guide);
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
]);
;