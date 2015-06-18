'use strict';

var app = angular.module('app', [
    'angularFileUpload',
    'summernote',
    'angular-bootbox',
    'angularMoment',
    'angularPayments',
    'dndLists',
    'ngAnimate',
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
    ['$rootScope', '$state', '$stateParams', '$window', '$http', '$q', 'AuthenticationService', 'UserService', '$location', 'ngProgress', 'MetaService', '$cookies', "$localStorage",
        function ($rootScope, $state, $stateParams, $window, $http, $q, AuthenticationService, UserService, $location, ngProgress, MetaService, $cookies, $localStorage) {
            $rootScope.$state = $state;
            $rootScope.$stateParams = $stateParams;
            $rootScope.metaservice = MetaService;
            
            
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
            $rootScope.$on("$routeChangeError", function(evt, current, previous, rejection){
                console.log(3);
                if(rejection == "invalid_user"){
                    console.log(previous);
                    //$state.transitionTo();
                }
            });
        }
    ]
)
.config(
    ['$locationProvider', '$stateProvider', '$urlRouterProvider', '$controllerProvider', '$compileProvider', '$filterProvider', '$provide', '$httpProvider', '$bootboxProvider', 
    function ($locationProvider, $stateProvider, $urlRouterProvider, $controllerProvider, $compileProvider, $filterProvider, $provide, $httpProvider, $bootboxProvider) {
        
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
        
        var tpl = (cdnUrl) ? cdnUrl : '';
        
        $urlRouterProvider.otherwise('404');
        $stateProvider
            .state('app', {
                abstract: true,
                url: '/',
                views: {
                    root: {
                        templateUrl: tpl + 'views/frontend/index.html'
                    }
                },
                resolve: {
                    User: ['$window', '$cookies', '$state', '$q', 'AuthenticationService', 'SubscriptionService', 'UserService', function($window, $cookies, $state, $q, AuthenticationService, SubscriptionService, UserService) {
                        if ($cookies.token) {
                            $window.sessionStorage.token = $cookies.token;
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
                                delete $cookies.token;
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
                                    page = 1,
                                    perpage = 3;
                                return ArticleService.getArticles('ts', klass, page, perpage);
                            }],
                            dataBanners: ['BannerService', function (BannerService) {
                                 return BannerService.getBanners('ts');
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
                                    perpage = 10,
                                    search = $stateParams.s || '';
                                
                                return ArticleService.getArticles(articleType, filter, page, perpage, search);
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
            .state('app.hs', {
                abstract: true,
                url: 'hearthstone',
                views: {
                    content: {
                        templateUrl: 'views/frontend/hs.html'
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
                                    perpage = 9;
                                return ArticleService.getArticles('hs', klass, page, perpage);
                            }],
                            dataDecks: ['DeckService', function (DeckService) {
                                var klass = 'all',
                                    page = 1,
                                    perpage = 10;
                                return DeckService.getDecksCommunity(klass, page, perpage);
                            }],
                            dataDecksFeatured: ['DeckService', function (DeckService) {
                                var klass = 'all',
                                    page = 1,
                                    perpage = 10;
                                return DeckService.getDecksFeatured(klass, page, perpage);
                            }],
                            dataBanners: ['BannerService', function (BannerService) {
                                return BannerService.getBanners('hs');
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
                            data: ['$stateParams', 'DeckService', function ($stateParams, DeckService) {
                                var klass = $stateParams.k || 'all',
                                    page = $stateParams.p || 1,
                                    perpage = 24,
                                    search = $stateParams.s || '',
                                    age = $stateParams.a || '',
                                    order = $stateParams.o || '';
                                
                                return DeckService.getDecks(klass, page, perpage, search, age, order);
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
                        templateUrl: tpl + 'views/frontend/hs.deck-builder.class.html'
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
                                var playerClass = $stateParams.playerClass;
                                return DeckBuilder.loadCards(playerClass);
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
                                var hero = 'all',
                                    page = 1,
                                    perpage = 9;
                                return ArticleService.getArticles('hots', hero, page, perpage);
                            }],
                            dataGuidesCommunity: ['HOTSGuideService', function (HOTSGuideService) {
                                return HOTSGuideService.getGuidesCommunity();
                            }],
                            dataGuidesFeatured: ['HOTSGuideService', function (HOTSGuideService) {
                                return HOTSGuideService.getGuidesFeatured();
                            }],
                            dataBanners: ['BannerService', function (BannerService) {
                                return BannerService.getBanners('hots');
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
                            data: ['$stateParams', 'HOTSGuideService', function ($stateParams, HOTSGuideService) {
                                var guideType = $stateParams.t || 'all',
                                    hero = $stateParams.h || 'all',
                                    map = $stateParams.m || 'all',
                                    page = $stateParams.p || 1,
                                    perpage = 24,
                                    search = $stateParams.s || '',
                                    age = $stateParams.a || '',
                                    order = $stateParams.o || '';
                                
                                return HOTSGuideService.getGuides(guideType, hero, map, page, perpage, search, age, order);
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
            .state('app.team', {
                abstract: true,
                url: 'team',
                views: {
                    content: {
                        templateUrl: tpl + 'views/frontend/team.html'
                    }
                }
            })
            .state('app.team.hearthstone', {
                url: '/team/hearthstone',
                views: {
                    team: {
                        templateUrl: tpl + 'views/frontend/team.hearthstone.html'
                    }
                },
                seo: { title: 'Hearthstone', description: 'TempoStorm Hearthstone team.', keywords: '' }
            })
            .state('app.team.heroes', {
                url: '/team/hots',
                views: {
                    team: {
                        templateUrl: tpl + 'views/frontend/team.hots.html'
                    }
                },
                seo: { title: 'Heroes of the Storm', description: 'TempoStorm Heroes of the Storm team.', keywords: '' }
            })
            .state('app.team.csgo', {
                url: '/team/csgo',
                views: {
                    team: {
                        templateUrl: tpl + 'views/frontend/team.csgo.html'
                    }
                },
                seo: { title: 'CS:GO', description: 'TempoStorm Counter Strike: Global Offensive team.', keywords: '' }
            })
            .state('app.team.fifa', {
                url: '/fifa',
                views: {
                    team: {
                        templateUrl: tpl + 'views/frontend/team.fifa.html'
                    }
                },
                seo: { title: 'FIFA', description: 'TempoStorm FIFA team.', keywords: '' }
            })
            .state('app.team.fgc', {
                url: '/fgc',
                views: {
                    team: {
                        templateUrl: tpl + 'views/frontend/team.fgc.html'
                    }
                },
                seo: { title: 'FGC', description: 'TempoStorm FGC team.', keywords: '' }
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
                                console.log(AuthenticationService.isLogged());
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
                                return AdminDeckService.getAllDecks();
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
                                return AdminDeckService.getAllDecks();
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
                        templateUrl: tpl + 'views/admin/decks.add.class.html'
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
                                var playerClass = $stateParams.playerClass;
                                return DeckBuilder.loadCards(playerClass);
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
