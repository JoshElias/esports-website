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
                    TweenMax.to(element.find('.banner-panel'), 1.2, { left: '50%', ease: Back.easeOut });
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
    ['$rootScope', '$state', '$stateParams', '$window', '$http', '$q', 'AuthenticationService', 'UserService', '$location', 'ngProgress', 'MetaService',
        function ($rootScope, $state, $stateParams, $window, $http, $q, AuthenticationService, UserService, $location, ngProgress, MetaService) {
            $rootScope.$state = $state;
            $rootScope.$stateParams = $stateParams;
            $rootScope.metaservice = MetaService;
            
            // handle state changes
            $rootScope.$on("$stateChangeStart", function(event, toState, toParams, fromState, fromParams) {
                //ngProgress.start();
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
                //ngProgress.complete();
                $window.ga('send', 'pageview', $location.path());
                
                // adsense refresh
                if ($window.googletag && $window.googletag.pubads) {
                    $window.googletag.pubads().refresh();
                }
                
                // seo
                if (toState.seo) {
                    $rootScope.metaservice.set(toState.seo.title, toState.seo.description, toState.seo.keywords);
                }
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
        
        var production = false,
            tpl = (production) ? 'https://s3-us-west-2.amazonaws.com/ts-node2' : '';
        
        $urlRouterProvider.otherwise('/');
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
                            delete $cookies.token;
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
                            }).error(function () {
                                delete $window.sessionStorage.userID;
                                delete $window.sessionStorage.username;
                                delete $window.sessionStorage.token;
                                delete $window.sessionStorage.email;
                                $state.transitionTo('app.login');
                                d.resolve();
                            });
                            return d.promise;
                        }
                    }]
                }
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
                                return BannerService.getBanners();
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
                seo: { title: 'Articles', description: 'TempoStorm articles to bring you the latest news.', keywords: '' }
            })
            .state('app.articles.article', {
                url: '/:slug',
                views: {
                    articles: {
                        templateUrl: tpl + 'views/frontend/articles.article.html',
                        controller: 'ArticleCtrl',
                        resolve: {
                            data: ['$stateParams', 'ArticleService', function ($stateParams, ArticleService) {
                                var slug = $stateParams.slug;
                                return ArticleService.getArticle(slug);
                            }]
                        }
                    }
                }
            })
            .state('app.decks', {
                abstract: true,
                url: 'decks',
                views: {
                    content: {
                        templateUrl: tpl + 'views/frontend/decks.html'
                    }
                }
            })
            .state('app.decks.list', {
                url: '?p&s&k&a&o',
                views: {
                    decks: {
                        templateUrl: tpl + 'views/frontend/decks.list.html',
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
            .state('app.decks.deck', {
                url: '/:slug',
                views: {
                    decks: {
                        templateUrl: tpl + 'views/frontend/decks.deck.html',
                        controller: 'DeckCtrl',
                        resolve: {
                            data: ['$stateParams', 'DeckService', function ($stateParams, DeckService) {
                                var slug = $stateParams.slug;
                                return DeckService.getDeck(slug);
                            }]
                        }
                    }
                }
            })
            .state('app.deckBuilder', {
                abstract: true,
                url: 'deck-builder',
                views: {
                    content: {
                        templateUrl: tpl + 'views/frontend/deck-builder.html'
                    }
                }
            })
            .state('app.deckBuilder.class', {
                url: '',
                views: {
                    deckBuilder: {
                        templateUrl: tpl + 'views/frontend/deck-builder.class.html'
                    }
                },
                seo: { title: 'Deck Builder', description: 'Deck building tool for Hearthstone.', keywords: '' }
            })
            .state('app.deckBuilder.build', {
                url: '/:playerClass',
                views: {
                    deckBuilder: {
                        templateUrl: tpl + 'views/frontend/deck-builder.build.html',
                        controller: 'DeckBuilderCtrl',
                        resolve: {
                            data: ['$stateParams', 'DeckBuilder', function ($stateParams, DeckBuilder) {
                                var playerClass = $stateParams.playerClass;
                                return DeckBuilder.loadCards(playerClass);
                            }]
                        }
                    }
                },
            })
            .state('app.deckBuilder.edit', {
                url: '/edit/:slug',
                views: {
                    deckBuilder: {
                        templateUrl: tpl + 'views/frontend/deck-builder.edit.html',
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
                }
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
                                return HOTSGuideService.getGuide(slug);
                            }],
                            dataHeroes: ['HeroService', function (HeroService) {
                                return HeroService.getHeroes();
                            }]
                        }
                    }
                }
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
                            data: ['ForumService', function (ForumService) {
                                return ForumService.getCategories();
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
                            data: ['$stateParams', 'ForumService', function ($stateParams, ForumService) {
                                var thread = $stateParams.thread;
                                return ForumService.getThread(thread);
                            }]
                        }
                    }
                }
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
                            data: ['$stateParams', 'ForumService', function ($stateParams, ForumService) {
                                var thread = $stateParams.thread,
                                    post = $stateParams.post;
                                return ForumService.getPost(thread, post);
                            }]
                        }
                    }
                }
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
                url: '/hearthstone',
                views: {
                    team: {
                        templateUrl: tpl + 'views/frontend/team.hearthstone.html'
                    }
                },
                seo: { title: 'Hearthstone', description: 'Tempo Storm Hearthstone team.', keywords: '' }
            })
            .state('app.team.heroes', {
                url: '/hots',
                views: {
                    team: {
                        templateUrl: tpl + 'views/frontend/team.hots.html'
                    }
                },
                seo: { title: 'Heroes of the Storm', description: 'Tempo Storm Heroes of the Storm team.', keywords: '' }
            })
            .state('app.team.csgo', {
                url: '/csgo',
                views: {
                    team: {
                        templateUrl: tpl + 'views/frontend/team.csgo.html'
                    }
                },
                seo: { title: 'CS:GO', description: 'Tempo Storm Counter Strike: Global Offensive team.', keywords: '' }
            })
            .state('app.sponsors', {
                url: 'sponsors',
                views: {
                    content: {
                        templateUrl: tpl + 'views/frontend/sponsors.html'
                    }
                },
                seo: { title: 'Sponsors', description: 'Tempo Storm sponsor page.', keywords: '' }
            })
            .state('app.premium', {
                url: 'premium',
                views: {
                    content: {
                        templateUrl: tpl + 'views/frontend/premium.html',
                        controller: 'PremiumCtrl'
                    }
                },
                seo: { title: 'Get Premium', description: 'Get Premium with Tempo Storm', keywords: '' }
            })
            .state('app.terms', {
                url: 'terms',
                views: {
                    content: {
                        templateUrl: tpl + 'views/frontend/terms.html'
                    }
                },
                seo: { title: 'Terms and Conditions', description: 'Tempo Storm Terms and Conditions', keywords: '' }
            })
            .state('app.privacy', {
                url: 'privacy',
                views: {
                    content: {
                        templateUrl: tpl + 'views/frontend/privacy.html'
                    }
                },
                seo: { title: 'Privacy Policy', description: 'Tempo Storm Privacy Policy', keywords: '' }
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
                seo: { title: 'Login', description: 'Tempo Storm login screen.', keywords: '' }
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
                seo: { title: 'Sign up', description: 'Sign up for Tempo Storm.', keywords: '' }
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
                                return ProfileService.getProfile(username);
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
                            dataDecks: ['$stateParams', 'ProfileService', 'AuthenticationService', 'User', function ($stateParams, ProfileService, AuthenticationService, User) {
                                var username = $stateParams.username;
                                if (AuthenticationService.isLogged()) {
                                    console.log("Authentication successful");
                                    return ProfileService.getGuidesLoggedIn(username);
                                } else {
                                    console.log("Authentication unsuccessful");
                                    return ProfileService.getGuides(username);
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
                                    console.log("Authentication successful");
                                    return ProfileService.getGuidesLoggedIn(username);
                                } else {
                                    console.log("Authentication unsuccessful");
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
                seo: { title: 'Dashboard', description: '', keywords: '' }
            })
            .state('app.admin.articles', {
                abstract: true,
                url: '/articles',
                views: {
                    admin: {
                        templateUrl: tpl + 'views/admin/articles.html'
                    }
                },
                access: { auth: true, admin: true }
            })
            .state('app.admin.articles.list', {
                url: '',
                views: {
                    articles: {
                        templateUrl: tpl + 'views/admin/articles.list.html',
                        controller: 'AdminArticleListCtrl',
                        resolve: {
                            data: ['AdminArticleService', function (AdminArticleService) {
                                return AdminArticleService.getArticles();
                            }]
                        }
                    }
                },
                access: { auth: true, admin: true }
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
                access: { auth: true, admin: true }
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
                access: { auth: true, admin: true }
            })
            .state('app.admin.hearthstone', {
                abstract: true,
                url: '/hs',
                views: {
                    admin: {
                        templateUrl: tpl + 'views/admin/hearthstone.html'
                    }
                },
                access: { auth: true, admin: true }
            })
            .state('app.admin.hearthstone.decks', {
                abstract: true,
                url: '/decks',
                views: {
                    hearthstone: {
                        templateUrl: tpl + 'views/admin/decks.html'
                    }
                },
                access: { auth: true, admin: true }
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
                access: { auth: true, admin: true }
            })
            .state('app.admin.hearthstone.decks.add', {
                url: '/add',
                views: {
                    decks: {
                        templateUrl: tpl + 'views/admin/decks.add.class.html'
                    }
                },
                access: { auth: true, admin: true }
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
                access: { auth: true, admin: true }
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
                seo: { title: 'Admin Deck Edit', description: '', keywords: '' }
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
            })
            .state('app.admin.hearthstone.cards.add', {
                url: '/add',
                views: {
                    cards: {
                        templateUrl: tpl + 'views/admin/cards.add.html',
                        controller: 'AdminCardAddCtrl'
                    }
                },
                access: { auth: true, admin: true }
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
                access: { auth: true, admin: true }
            })
            .state('app.admin.hots', {
                abstract: true,
                url: '/hots',
                views: {
                    admin: {
                        templateUrl: tpl + 'views/admin/hots.html'
                    }
                },
                access: { auth: true, admin: true }
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
                access: { auth: true, admin: true }
            })
            .state('app.admin.hots.heroes.add', {
                url: '/add',
                views: {
                    heroes: {
                        templateUrl: tpl + 'views/admin/hots.heroes.add.html',
                        controller: 'AdminHeroAddCtrl'
                    }
                },
                access: { auth: true, admin: true }
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
                access: { auth: true, admin: true }
            })
            .state('app.admin.hots.maps', {
                abstract: true,
                url: '/maps',
                views: {
                    hots: {
                        templateUrl: tpl + 'views/admin/hots.maps.html'
                    }
                },
                access: { auth: true, admin: true }
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
                access: { auth: true, admin: true }
            })
            .state('app.admin.hots.maps.add', {
                url: '/add',
                views: {
                    maps: {
                        templateUrl: tpl + 'views/admin/hots.maps.add.html',
                        controller: 'AdminMapAddCtrl'
                    }
                },
                access: { auth: true, admin: true }
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
                access: { auth: true, admin: true }
            })
            .state('app.admin.hots.guides', {
                abstract: true,
                url: '/guides',
                views: {
                    hots: {
                        templateUrl: tpl + 'views/admin/hots.guides.html'
                    }
                },
                access: { auth: true, admin: true }
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
                access: { auth: true, admin: true }
            })
            .state('app.admin.hots.guides.add', {
                abstract: true,
                url: '/add',
                views: {
                    guides: {
                        templateUrl: tpl + 'views/admin/hots.guides.add.html'
                    }
                },
                access: { auth: true, admin: true }
            })
            .state('app.admin.hots.guides.add.step1', {
                url: '',
                views: {
                    add: {
                        templateUrl: tpl + 'views/admin/hots.guides.add.step1.html'
                    }
                },
                access: { auth: true, admin: true }
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
                access: { auth: true, admin: true }
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
                access: { auth: true, admin: true }
            })
            .state('app.admin.hots.guides.edit', {
                abstract: true,
                url: '/edit',
                views: {
                    guides: {
                        templateUrl: tpl + 'views/admin/hots.guides.edit.html'
                    }
                },
                access: { auth: true, admin: true }
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
                access: { auth: true, admin: true }
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
                access: { auth: true, admin: true }
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
                access: { auth: true, admin: true }
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
                access: { auth: true, admin: true }
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
                access: { auth: true, admin: true }
            })
            .state('app.admin.forum.structure.categoryAdd', {
                url: '/category/add',
                views: {
                    categories: {
                        templateUrl: tpl + 'views/admin/forum.categories.add.html',
                        controller: 'AdminForumCategoryAddCtrl'
                    }
                },
                access: { auth: true, admin: true }
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
                access: { auth: true, admin: true }
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
                access: { auth: true, admin: true }
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
                access: { auth: true, admin: true }
            })
            .state('app.admin.forum.management', {
                url: '/management',
                views: {
                    admin: {
                        templateUrl: tpl + 'views/admin/forum.management.html'
                    }
                },
                access: { auth: true, admin: true }
            })
            .state('app.admin.users', {
                abstract: true,
                url: '/users',
                views: {
                    admin: {
                        templateUrl: tpl + 'views/admin/users.html'
                    }
                },
                access: { auth: true, admin: true }
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
                access: { auth: true, admin: true }
            })
            .state('app.admin.users.add', {
                url: '/add',
                views: {
                    users: {
                        templateUrl: tpl + 'views/admin/users.add.html',
                        controller: 'AdminUserAddCtrl'
                    }
                },
                access: { auth: true, admin: true }
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
                access: { auth: true, admin: true }
            })
            .state('app.admin.subscriptions', {
                url: '/subscriptions',
                views: {
                    admin: {
                        templateUrl: tpl + 'views/admin/subscriptions.html'
                    }
                },
                access: { auth: true, admin: true }
            })
            .state('app.admin.streams', {
                url: '/streams',
                views: {
                    admin: {
                        templateUrl: tpl + 'views/admin/streams.html'
                    }
                },
                access: { auth: true, admin: true }
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
  .controller('AppCtrl', ['$scope', '$localStorage', '$window', '$location', 'SubscriptionService', 'AuthenticationService', 'UserService', 
    function($scope, $localStorage, $window, $location, SubscriptionService, AuthenticationService, UserService) {
      var isIE = !!navigator.userAgent.match(/MSIE/i);
      isIE && angular.element($window.document.body).addClass('ie');
      isSmartDevice( $window ) && angular.element($window.document.body).addClass('smart');

      // config
      $scope.app = {
        name: 'TempoStorm',
        version: '0.0.1',
        copyright: new Date().getFullYear(),
        cdn: 'https://s3-us-west-2.amazonaws.com/ts-node2',
        getTitle: function () {
            return $scope.app.seo.title;
        },
        seo: {
            title: 'TempoStorm',
            description: ''
        },
        settings: {
            token: null,
            deck: null,
            show: {
                deck: null,
                article: null,
                decks: null
            }
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
                }
                return $location.path("/login");
            }
        }
      };
        
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
          
        // persistent login  
        if ($scope.app.settings.token && $scope.app.settings.token !== null) {
            $window.sessionStorage.token = $scope.app.settings.token;
        }
      } else {
        $localStorage.settings = $scope.app.settings;
      }
      $scope.$watch('app.settings', function(){ $localStorage.settings = $scope.app.settings; }, true);

      function isSmartDevice( $window )
      {
          // Adapted from http://www.detectmobilebrowsers.com
          var ua = $window['navigator']['userAgent'] || $window['navigator']['vendor'] || $window['opera'];
          // Checks for iOs, Android, Blackberry, Opera Mini, and Windows mobile devices
          return (/iPhone|iPod|iPad|Silk|Android|BlackBerry|Opera Mini|IEMobile/).test(ua);
      }

  }])
.controller('UserCtrl', ['$scope', '$location', '$window', '$state', 'UserService', 'AuthenticationService', 'AlertService', 'SubscriptionService', 
    function ($scope, $location, $window, $state, UserService, AuthenticationService, AlertService, SubscriptionService) {
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
        
        $scope.signup = function signup(email, username, password, cpassword) {
            if (email !== undefined && username !== undefined && password !== undefined && cpassword !== undefined) {
                UserService.signup(email, username, password, cpassword).success(function (data) {
                    if (!data.success) {
                        $scope.errors = data.errors;
                        $scope.showError = true;
                    } else {
                        return $state.transitionTo('app.verify', { email: email });
                    }
                });
            }
        }
        
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
.controller('HomeCtrl', ['$scope', 'dataBanners', 'dataArticles', 'dataDecks', 'dataDecksFeatured', 'ArticleService', 'DeckService', 
    function ($scope, dataBanners, dataArticles, dataDecks, dataDecksFeatured, ArticleService, DeckService) {
        // data
        $scope.articles = dataArticles.articles;
        $scope.decks = dataDecks.decks;
        $scope.decksFeatured = dataDecksFeatured.decks;
        $scope.loading = {
            articles: false,
            community: false,
            featured: false
        };
        
        // banner
        $scope.banner = {
            current: 0,
            direction: 'left',
            slides: dataBanners.banners,
            setCurrent: function (current) {
                this.direction = 'right';
                this.current = current;
            },
            next: function () {
                this.direction = 'right';
                this.current = (this.current < (this.slides.length - 1)) ? ++this.current : 0;
            },
            prev: function () {
                this.direction = 'left';
                this.current = (this.current > 0) ? --this.current : this.slides.length - 1;
            }
        };
        
        // content
        $scope.klass = 'all';
        $scope.setKlass = function (klass) {
            $scope.klass = klass;
            $scope.loading = {
                articles: true,
                community: true,
                featured: true
            };
            
            ArticleService.getArticles('hs', klass, 1, 9).then(function (data) {
                $scope.articles = data.articles;
                $scope.loading.articles = false;
            });

            DeckService.getDecksCommunity(klass, 1, 10).then(function (data) {
                $scope.decks = data.decks;
                $scope.loading.community = false;
            });
            
            DeckService.getDecksFeatured(klass, 1, 10).then(function (data) {
                $scope.decksFeatured = data.decks;
                $scope.loading.featured = false;
            });
        };
    }
])
.controller('PremiumCtrl', ['$scope', '$state', '$window', '$compile', 'bootbox', 'UserService', 'AuthenticationService', 'SubscriptionService', 
    function ($scope, $state, $window, $compile, bootbox, UserService, AuthenticationService, SubscriptionService) {
        var box,
            callback;
        
        // get premium
        $scope.getPremium = function (plan) {
            if ($scope.app.user.isLogged()) {
                if (!$scope.app.user.isSubscribed()) {
                    $state.transitionTo('app.profile.subscription', { username: $scope.app.user.getUsername(), plan: plan });
                }
            } else {
                box = bootbox.dialog({
                    title: 'Login Required',
                    message: $compile('<div login-form></div>')($scope)
                });
                box.modal('show');
                callback = function () {
                    $scope.getPremium(plan);
                };
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
.controller('ProfileCtrl', ['$scope', 'dataProfile', 'MetaService', 
    function ($scope, dataProfile, MetaService) {
        $scope.user = dataProfile.user;
        
        function isMyProfile() {
            if($scope.app.user.getUsername() == $scope.user.username) {
                return 'My Profile';
            } else {
                return '@' + $scope.user.username + ' - Profile';
            }
        }
        $scope.metaservice = MetaService;
        $scope.metaservice.set(isMyProfile());
        
        $scope.socialExists = function () {
            if (!$scope.user.social) { return false; }
            return ($scope.user.social.twitter && $scope.user.social.twitter.length) || 
            ($scope.user.social.facebook && $scope.user.social.facebook.length) || 
            ($scope.user.social.twitch && $scope.user.social.twitch.length) || 
            ($scope.user.social.instagram && $scope.user.social.instagram.length) || 
            ($scope.user.social.youtube && $scope.user.social.youtube.length);
        };
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
        $scope.profile = dataProfileEdit.user;
        
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
            if (result.error) {
                console.log(result);
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
.controller('ProfileActivityCtrl', ['$scope', '$sce', 'dataActivity',  
    function ($scope, $sce, dataActivity) {
        $scope.activities = dataActivity.activities;
        
        $scope.activities.forEach(function (activity) {
            activity.getActivity = function () {
                return $sce.trustAsHtml(activity.activity);
            };
        });
    }
])
.controller('ProfileArticlesCtrl', ['$scope', 'dataArticles',  
    function ($scope, dataArticles) {
        $scope.articles = dataArticles.articles;
    }
])
.controller('ProfileDecksCtrl', ['$scope', 'bootbox', 'DeckService', 'dataDecks',  
    function ($scope, bootbox, DeckService, dataDecks) {
        $scope.decks = dataDecks.decks;
        
        // delete deck
        $scope.deckDelete = function deleteDeck(deck) {
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
.controller('ProfileGuidesCtrl', ['$scope', 'bootbox', 'HOTSGuideService', 'dataGuides',  
    function ($scope, bootbox, HOTSGuideService, dataGuides) {
        $scope.guides = dataGuides.guides;
        // delete guide
        $scope.guideDelete = function deleteGuide(guide) {
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
        }
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
        
        $scope.cardImg = $scope.deckImg = $scope.app.cdn + '/img/blank.png';
        
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
                    $scope.cardImg = '.' + data.path + data.large;
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
                    $scope.deckImg = '.' + data.path + data.small;
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
        
        $scope.cardImg = ($scope.card.photos.large.length) ? $scope.app.cdn + '/cards/' + $scope.card.photos.large : $scope.app.cdn + '/img/blank.png';
        $scope.deckImg = ($scope.card.photos.small.length) ? $scope.app.cdn + '/cards/' + $scope.card.photos.small : $scope.app.cdn + '/img/blank.png';
        
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
                    $scope.cardImg = '.' + data.path + data.large;
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
                    $scope.deckImg = '.' + data.path + data.small;
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
.controller('AdminArticleAddCtrl', ['$scope', '$state', '$window', '$upload', '$compile', 'bootbox', 'Hearthstone', 'Util', 'AlertService', 'AdminArticleService', 'dataDecks', 'dataGuides', 'dataArticles', 'dataProviders', 'dataHeroes', 
    function ($scope, $state, $window, $upload, $compile, bootbox, Hearthstone, Util, AlertService, AdminArticleService, dataDecks, dataGuides, dataArticles, dataProviders, dataHeroes) {
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
                small: ''
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
            articleType: AdminArticleService.articleTypes()[0].value,
            active: true
        };
        
        // load article
        $scope.article = angular.copy(defaultArticle);
        
        // load decks
        $scope.decks = [{_id: undefined, name: 'No deck'}].concat(dataDecks.decks);

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
        $scope.getTags = function () {
            switch ($scope.article.articleType) {
                case 'hs':
                    return ['Druid', 'Hunter', 'Mage', 'Paladin', 'Priest', 'Rogue', 'Shaman', 'Warlock', 'Warrior'];
                case 'hots':
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
                        small: data.small
                    };
                    $scope.cardImg = '.' + data.path + data.small;
                    box.modal('hide');
                });
            }
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
.controller('AdminArticleEditCtrl', ['$scope', '$state', '$window', '$upload', '$compile', 'bootbox', 'Hearthstone', 'Util', 'AlertService', 'AdminArticleService', 'data', 'dataDecks', 'dataGuides', 'dataArticles', 'dataProviders', 'dataHeroes',  
    function ($scope, $state, $window, $upload, $compile, bootbox, Hearthstone, Util, AlertService, AdminArticleService, data, dataDecks, dataGuides, dataArticles, dataProviders, dataHeroes) {
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
        
        $scope.setSlug = function () {
            if (!$scope.article.slug.linked) { return false; }
            $scope.article.slug.url = Util.slugify($scope.article.title);
        };
        
        $scope.toggleSlugLink = function () {
            $scope.article.slug.linked = !$scope.article.slug.linked;
            $scope.setSlug();
        };
        
        // photo
        $scope.cardImg = ($scope.article.photos.small && $scope.article.photos.small.length) ? $scope.app.cdn + '/articles/' + $scope.article.photos.small : $scope.app.cdn + '/img/blank.png';
        
        // tags
        $scope.getTags = function () {
            switch ($scope.article.articleType) {
                case 'hs':
                    return ['Druid', 'Hunter', 'Mage', 'Paladin', 'Priest', 'Rogue', 'Shaman', 'Warlock', 'Warrior'];
                case 'hots':
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
                        small: data.small
                    };
                    $scope.cardImg = '.' + data.path + data.small;
                    box.modal('hide');
                });
            }
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
    
        // page flipping
        $scope.pagination = Pagination.new(100);
        $scope.pagination.results = function () {
            return ($scope.filtered) ? $scope.filtered.length : $scope.articles.length;
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
.controller('AdminDeckAddCtrl', ['$state', '$scope', '$compile', '$window', 'Pagination', 'Hearthstone', 'DeckBuilder', 'ImgurService', 'AlertService', 'AdminDeckService', 'data', 
    function ($state, $scope, $compile, $window, Pagination, Hearthstone, DeckBuilder, ImgurService, AlertService, AdminDeckService, data) {
        // redirect back to class pick if no data
        if (!data || !data.success) { $state.transitionTo('app.admin.hearthstone.decks.add'); return false; }
        
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
        $scope.className = data.className;
        $scope.cards = data.cards;
        $scope.cards.current = $scope.cards.class;

        // page flipping
        $scope.pagination = Pagination.new(6);
        $scope.pagination.perpage = 10;
        $scope.pagination.results = function () {
            return ($scope.filtered) ? $scope.filtered.length : $scope.cards.current.length;
        };
        
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
        
        // deck premium
        $scope.deckPremium = [
            { name: 'Yes', value: true },
            { name: 'No', value: false }
        ];
        
        // deck
        $scope.deck = ($scope.app.settings.deck && $scope.app.settings.deck !== null && data.className === $scope.app.settings.deck.playerClass) ? DeckBuilder.new(data.className, $scope.app.settings.deck) : DeckBuilder.new(data.className);
        $scope.$watch('deck', function(){
            $scope.app.settings.deck = {
                name: $scope.deck.name,
                deckType: $scope.deck.deckType,
                description: $scope.deck.description,
                contentEarly: $scope.deck.contentEarly,
                contentMid: $scope.deck.contentMid,
                contentLate: $scope.deck.contentLate,
                cards: $scope.deck.cards,
                playerClass: $scope.deck.playerClass,
                arena: $scope.deck.arena,
                mulligans: $scope.deck.mulligans,
                against: $scope.deck.against,
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
        $scope.saveDeck = function () {
            AdminDeckService.addDeck($scope.deck).success(function (data) {
                if (!data.success) {
                    $scope.errors = data.errors;
                    $scope.showError = true;
                    $window.scrollTo(0,0);
                } else {
                    $scope.app.settings.deck = null;
                    AlertService.setSuccess({ show: true, msg: $scope.deck.name + ' has been added successfully.' });
                    $state.go('app.admin.hearthstone.decks.list');
                }
            });
        };
        
    }
])
.controller('AdminDeckEditCtrl', ['$state', '$scope', '$compile', '$window', 'Pagination', 'Hearthstone', 'DeckBuilder', 'ImgurService', 'AlertService', 'AdminDeckService', 'data', 
    function ($state, $scope, $compile, $window, Pagination, Hearthstone, DeckBuilder, ImgurService, AlertService, AdminDeckService, data) {
        // redirect back to class pick if no data
        if (!data || !data.success) { $state.transitionTo('app.admin.hearthstone.decks.list'); return false; }
        
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
        
        // steps
        $scope.prevStep = function () {
            if ($scope.step > 1) $scope.step = $scope.step - 1;
        }
        $scope.nextStep = function () {
            if ($scope.step < 5) $scope.step = $scope.step + 1;
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

        // load cards
        $scope.className = data.deck.playerClass;
        $scope.cards = data.cards;
        $scope.cards.current = $scope.cards.class;

        // page flipping
        $scope.pagination = Pagination.new(6);
        $scope.pagination.perpage = 10;
        $scope.pagination.results = function () {
            return ($scope.filtered) ? $scope.filtered.length : $scope.cards.current.length;
        };
        
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
        
        // deck
        $scope.deckTypes = Hearthstone.deckTypes;
        
        $scope.deck = DeckBuilder.new(data.deck.playerClass, data.deck);
        
        // current mulligan
        $scope.currentMulligan = $scope.deck.getMulligan($scope.classes[0]);
        
        $scope.setMulligan = function (mulligan) {
            $scope.currentMulligan = mulligan;
        };
        
        $scope.isMulliganSet = function (mulligan) {
            return (mulligan.withCoin.cards.length || mulligan.withCoin.instructions.length || mulligan.withoutCoin.cards.length || mulligan.withoutCoin.instructions.length);
        };
        
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
        $scope.updateDeck = function () {
            AdminDeckService.editDeck($scope.deck).success(function (data) {
                if (!data.success) {
                    $scope.errors = data.errors;
                    $scope.showError = true;
                    $window.scrollTo(0,0);
                } else {
                    AlertService.setSuccess({ show: true, msg: $scope.deck.name + ' has been updated successfully.' });
                    $state.go('app.admin.hearthstone.decks.list');
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
.controller('DeckBuilderCtrl', ['$state', '$scope', '$compile', '$window', 'Pagination', 'Hearthstone', 'DeckBuilder', 'ImgurService', 'UserService', 'AuthenticationService', 'SubscriptionService', 'data', 
    function ($state, $scope, $compile, $window, Pagination, Hearthstone, DeckBuilder, ImgurService, UserService, AuthenticationService, SubscriptionService, data) {
        // redirect back to class pick if no data
        if (!data || !data.success) { $state.transitionTo('app.deckBuilder.class'); return false; }
        
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
        $scope.className = data.className;
        $scope.cards = data.cards;
        $scope.cards.current = $scope.cards.class;

        // page flipping
        $scope.pagination = Pagination.new(6);
        $scope.pagination.perpage = 10;
        $scope.pagination.results = function () {
            return ($scope.filtered) ? $scope.filtered.length : $scope.cards.current.length;
        };
        
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
                contentEarly: $scope.deck.contentEarly,
                contentMid: $scope.deck.contentMid,
                contentLate: $scope.deck.contentLate,
                cards: $scope.deck.cards,
                playerClass: $scope.deck.playerClass,
                arena: $scope.deck.arena,
                mulligans: $scope.deck.mulligans,
                against: $scope.deck.against,
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
            if (!$scope.app.user.isLogged()) {
                box = bootbox.dialog({
                    title: 'Login Required',
                    message: $compile('<div login-form></div>')($scope)
                });
                box.modal('show');
            } else {
                DeckBuilder.saveDeck($scope.deck).success(function (data) {
                    if (data.success) {
                        $scope.app.settings.deck = null;
                        $state.transitionTo('app.decks.deck', { slug: data.slug });
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
                    $scope.saveDeck();
                }).error(function() {
                    $scope.showError = true;
                });
            }
        }
    }
])
.controller('DeckEditCtrl', ['$state', '$scope', '$compile', '$window', 'Pagination', 'Hearthstone', 'DeckBuilder', 'ImgurService', 'UserService', 'AuthenticationService', 'data',
    function ($state, $scope, $compile, $window, Pagination, Hearthstone, DeckBuilder, ImgurService, UserService, AuthenticationService, data) {
        // redirect back to class pick if no data
        if (!data || !data.success) { $state.transitionTo('app.home'); return false; }
        
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
        
        // steps
        $scope.prevStep = function () {
            if ($scope.step > 1) $scope.step = $scope.step - 1;
        }
        $scope.nextStep = function () {
            if ($scope.step < 5) $scope.step = $scope.step + 1;
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

        // load cards
        $scope.className = data.deck.playerClass;
        $scope.cards = data.cards;
        $scope.cards.current = $scope.cards.class;

        // page flipping
        $scope.pagination = Pagination.new(6);
        $scope.pagination.perpage = 10;
        $scope.pagination.results = function () {
            return ($scope.filtered) ? $scope.filtered.length : $scope.cards.current.length;
        };
        
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
        
        // deck
        $scope.deckTypes = Hearthstone.deckTypes;
        
        $scope.deck = DeckBuilder.new(data.deck.playerClass, data.deck);
        
        // current mulligan
        $scope.currentMulligan = $scope.deck.getMulligan($scope.classes[0]);
        
        $scope.setMulligan = function (mulligan) {
            $scope.currentMulligan = mulligan;
        };
        
        $scope.isMulliganSet = function (mulligan) {
            return (mulligan.withCoin.cards.length || mulligan.withCoin.instructions.length || mulligan.withoutCoin.cards.length || mulligan.withoutCoin.instructions.length);
        };
        
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
        $scope.updateDeck = function () {
            DeckBuilder.updateDeck($scope.deck).success(function (data) {
                if (data.success) {
                    $state.transitionTo('app.decks.deck', { slug: data.slug });
                } else {
                    $scope.errors = data.errors;
                    $scope.showError = true;
                    $window.scrollTo(0,0);
                }
            });
        };
        
    }
])
.controller('ArticlesCtrl', ['$scope', '$state', 'ArticleService', 'data', 'MetaService',
    function ($scope, $state, ArticleService, data, MetaService) {
        //if (!data.success) { return $state.transitionTo('app.articles.list'); }
        
        // articles
        $scope.articles = data.articles;
        $scope.total = data.total;
        $scope.articleType = data.articleType;
        $scope.filter = data.filter;
        $scope.page = parseInt(data.page);
        $scope.perpage = data.perpage;
        $scope.search = data.search;
        $scope.loading = false;
        
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
        
        // verify valid page
        if ($scope.page < 1 || $scope.page > $scope.pagination.totalPages()) {
            $scope.pagination.setPage(1);
        }
    }
])
.controller('ArticleCtrl', ['$scope', '$sce', 'data', '$state', '$compile', '$window', 'bootbox', 'UserService', 'ArticleService', 'AuthenticationService', 'VoteService', 'SubscriptionService', 'MetaService', 
    function ($scope, $sce, data, $state, $compile, $window, bootbox, UserService, ArticleService, AuthenticationService, VoteService, SubscriptionService, MetaService) {
        $scope.article = data.article;
        
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
        
        // deck dust
        $scope.getDust = function () {
            var dust = 0;
            for (var i = 0; i < $scope.article.deck.cards.length; i++) {
                dust += $scope.article.deck.cards[i].qty * $scope.article.deck.cards[i].card.dust;
            }
            return dust;
        };
        
        // related
        $scope.relatedActive = function () {
            var related = $scope.article.related;
            if (!related || !related.length) { return false; }
            for (var i = 0; i < related.length; i++) {
                if (related[i].active) { return true; }
            }
            return false;
        };
        
        // voting
        $scope.voteDown = function (article) {
            vote(-1, article);
        };
        
        $scope.voteUp = function (article) {
            vote(1, article)       
        };
        
        var box,
            callback;
        
        if ($scope.app.user.isLogged()) {
            updateVotes();
        }
            
        function updateVotes() {
            checkVotes($scope.article);

            function checkVotes (article) {
                var vote = article.votes.filter(function (vote) {
                    return ($scope.app.user.getUserID() === vote.userID);
                })[0];

                if (vote) {
                    article.voted = vote.direction;
                }
            }
        }
        
        function vote(direction, article) {
            if (!$scope.app.user.isLogged()) {
                box = bootbox.dialog({
                    title: 'Login Required',
                    message: $compile('<div login-form></div>')($scope)
                });
                box.modal('show');
                callback = function () {
                    vote(direction, article);
                };
            } else {
                if (article.author._id === $scope.app.user.getUserID()) {
                    bootbox.alert("You can't vote for your own content.");
                    return false;
                }
                VoteService.voteArticle(direction, article).then(function (data) {
                    if (data.success) {
                        article.voted = direction;
                        article.votesCount = data.votesCount;
                    }
                });
            }
        };
        
        // comments
        var defaultComment = {
            comment: ''
        };
        $scope.comment = angular.copy(defaultComment);
        
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
                box = bootbox.dialog({
                    title: 'Login Required',
                    message: $compile('<div login-form></div>')($scope)
                });
                box.modal('show');
                callback = function () {
                    $scope.voteComment(direction, deck);
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
        
        // get premium
        $scope.getPremium = function (plan) {
            if ($scope.app.user.isLogged()) {
                if (!$scope.app.user.isSubscribed()) {
                    $state.transitionTo('app.profile.subscription', { username: $scope.app.user.getUsername(), plan: plan });
                }
            } else {
                box = bootbox.dialog({
                    title: 'Login Required',
                    message: $compile('<div login-form></div>')($scope)
                });
                box.modal('show');
                callback = function () {
                    $scope.getPremium(plan);
                };
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
                    updateVotes();
                    updateCommentVotes();
                    callback();
                }).error(function() {
                    $scope.showError = true;
                });
            }
        }
    }
])
.controller('DecksCtrl', ['$scope', '$state', 'Hearthstone', 'DeckService', 'data', 
    function ($scope, $state, Hearthstone, DeckService, data) {
        if (!data.success) { return $state.transitionTo('app.decks.list'); }
        
        // decks
        $scope.decks = data.decks;
        $scope.total = data.total;
        $scope.klass = data.klass;
        $scope.page = parseInt(data.page);
        $scope.perpage = data.perpage;
        $scope.search = data.search;
        $scope.age = data.age;
        $scope.order = data.order;

        $scope.hasSearch = function () {
            return (data.search) ? data.search.length : false;
        }
        
        // advanced filters
        if (!$scope.app.settings.show.decks) {
            $scope.app.settings.show.decks = {
                advanced: false
            };
        }

        $scope.toggleAdvanced = function () {
            $scope.app.settings.show.decks.advanced = !$scope.app.settings.show.decks.advanced;
        }
        
        $scope.showAdvanced = function () {
            return $scope.app.settings.show.decks.advanced;
        }
        
        $scope.loading = false;

        $scope.setKlass = function (klass) {
            $scope.klass = klass;
            $scope.page = 1;
            $scope.getDecks();
        };
        
        // filters
        $scope.getFilter = function (name, value) {
            var filter = $scope.filters.all[name];
            for (var i = 0; i < filter.length; i++) {
                if (filter[i].value == value) {
                    return filter[i];
                }
            }
            return filter[0];
        }

        $scope.filters = {
            all: {
                age: [
                    { name: 'All Decks', value: 'all' },
                    { name: '7 Days', value: '7' },
                    { name: '15 Days', value: '15' },
                    { name: '30 Days', value: '30' },
                    { name: '60 Days', value: '60' },
                    { name: '90 Days', value: '90' }
                ],
                order: [
                    { name: 'Highest Ranked', value: 'high' },
                    { name: 'Lowest Ranked', value: 'low' },
                    { name: 'Newest Decks', value: 'new' },
                    { name: 'Oldest Decks', value: 'old' }
                ]
            }
        };
        $scope.filters.age = $scope.getFilter('age', $scope.age);
        $scope.filters.order = $scope.getFilter('order', $scope.order);
        
        $scope.getDecks = function () {
            var params = {};
            
            if ($scope.search) {
                params.s = $scope.search;
            }
            
            if ($scope.page !== 1) {
                params.p = $scope.page;
            }
            
            if ($scope.klass != 'all') {
                params.k = $scope.klass;
            }
            
            if ($scope.filters.age.value !== 'all') {
                params.a = $scope.filters.age.value;
            }
            
            if ($scope.filters.order.value !== 'high') {
                params.o = $scope.filters.order.value;
            }
            
            $scope.loading = true;
            $state.transitionTo('app.decks.list', params);
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
                return (this.results() > 0) ? Math.ceil(this.results() / this.perpage()) : 1;
            },
            
        };

        // verify valid page
        if ($scope.page < 1 || $scope.page > $scope.pagination.totalPages()) {
            $scope.pagination.setPage(1);
        }   
    }
])
.controller('DeckCtrl', ['$scope', '$state', '$sce', '$compile', '$window', 'bootbox', 'Hearthstone', 'UserService', 'DeckService', 'AuthenticationService', 'VoteService', 'SubscriptionService', 'data', 'MetaService',
    function ($scope, $state, $sce, $compile, $window, bootbox, Hearthstone, UserService, DeckService, AuthenticationService, VoteService, SubscriptionService, data, MetaService) {
        if (!data || !data.success) { return $state.go('app.decks.list'); }

        // load deck
        $scope.deck = data.deck;
        
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
        
        $scope.currentMulligan = false;
        
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
        
        // strong / weak
        $scope.hasStrong = function () {
            var strong = $scope.deck.against.strong;
            for (var i = 0; i < strong.length; i++) {
                if (strong[i].isStrong) {
                    return true;
                }
            }
            
            return false;
        };
        $scope.hasWeak = function () {
            var weak = $scope.deck.against.weak;
            for (var i = 0; i < weak.length; i++) {
                if (weak[i].isWeak) {
                    return true;
                }
            }
            
            return false;
        };
        
        // charts
        $scope.charts = {
            colors: ['rgba(151,187,205,1)', 'rgba(151,187,205,1)', 'rgba(151,187,205,1)', 'rgba(151,187,205,1)']
        };
        
        $scope.labels = ["Download Sales", "In-Store Sales", "Mail-Order Sales"];
        $scope.data = [300, 500, 100];
        
        $scope.getVideo = function () {
            return $scope.getContent('<iframe src="//www.youtube.com/embed/' + $scope.deck.video + '" frameborder="0" height="360" width="100%"></iframe>');
        };
        
        $scope.getContent = function (content) {
            return $sce.trustAsHtml(content);
        };
        
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
                box = bootbox.dialog({
                    title: 'Login Required',
                    message: $compile('<div login-form></div>')($scope)
                });
                box.modal('show');
                callback = function () {
                    vote(direction, deck);
                };
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
        };
        
        // comments
        var defaultComment = {
            comment: ''
        };
        $scope.comment = angular.copy(defaultComment);
        
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
                DeckService.addComment($scope.deck, $scope.comment).success(function (data) {
                    if (data.success) {
                        $scope.deck.comments.push(data.comment);
                        $scope.comment.comment = '';
                    }
                });
            }
        };
                
        updateCommentVotes();
        function updateCommentVotes() {
            $scope.deck.comments.forEach(checkVotes);
            
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
                    $scope.voteComment(direction, deck);
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
        
        // get premium
        $scope.getPremium = function (plan) {
            if ($scope.app.user.isLogged()) {
                if (!$scope.app.user.isSubscribed()) {
                    $state.transitionTo('app.profile.subscription', { username: $scope.app.user.getUsername(), plan: plan });
                }
            } else {
                box = bootbox.dialog({
                    title: 'Login Required',
                    message: $compile('<div login-form></div>')($scope)
                });
                box.modal('show');
                callback = function () {
                    $scope.getPremium(plan);
                };
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
                    updateVotes();
                    callback();
                }).error(function() {
                    $scope.showError = true;
                });
            }
        }
    }
])
.controller('ForumCategoryCtrl', ['$scope', 'data', 
    function ($scope, data) {
        $scope.categories = data.categories;
    
    }
])
.controller('ForumThreadCtrl', ['$scope', 'Pagination', 'data', 'MetaService',
    function ($scope, Pagination, data, MetaService) {
        $scope.thread = data.thread;
        
        $scope.metaservice = MetaService;
        $scope.metaservice.set($scope.thread.title + ' - Forum');
        
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
        $scope.thread = data.thread;
        
        $scope.metaservice = MetaService;
        $scope.metaservice.set($scope.post.title + ' - ' + $scope.thread.title);
        
        
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
.controller('AdminHeroAddCtrl', ['$scope', '$state', '$window', '$compile', 'bootbox', 'HOTS', 'AlertService', 'AdminHeroService', 
    function ($scope, $state, $window, $compile, bootbox, HOTS, AlertService, AdminHeroService) {
        // default hero
        var defaultHero = {
                name : '',
                description: '',
                title: '',
                role: HOTS.roles[0],
                heroType: HOTS.types[0],
                universe: HOTS.universes[0],
                abilities: [],
                talents: [],
                stats: HOTS.genStats(),
                price: {
                    gold: '',
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
                className: '',
                orderNum: 1
            };
        
        // load hero
        $scope.hero = angular.copy(defaultHero);
        
        // roles
        $scope.roles = HOTS.roles;
        
        // types
        $scope.heroTypes = HOTS.types;
        
        // universe
        $scope.universes = HOTS.universes;
        
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
            box = bootbox.dialog({
                title: 'Add Ability',
                message: $compile('<div ability-add-form></div>')($scope)
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

            console.log($scope.hero.abilities);
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
            
            console.log($scope.hero.abilities);
        };
        
        // talents
        $scope.talentTiers = HOTS.tiers;
        $scope.talentAddWnd = function () {
            $scope.currentTalent = angular.copy(defaultTalent);
            box = bootbox.dialog({
                title: 'Add Talent',
                message: $compile('<div talent-add-form></div>')($scope)
            });
        };

        $scope.talentEditWnd = function (talent) {
            $scope.currentTalent = talent;
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
            
            console.log($scope.hero.talents);
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
            
            console.log($scope.hero.talents);
        };
        
        $scope.updateDND = function (list, index) {
            list.splice(index, 1);
            
            for (var i = 0; i < list.length; i++) {
                list[i].orderNum = i + 1;
            }
            
            console.log(list);
        };
        
        // stats
        $scope.statLevel = 1;
        
        $scope.nextLevel = function () {
            var next = $scope.statLevel + 1;
            if (next <= 30) {
                $scope.statLevel = next;
            }
        };
        
        $scope.prevLevel = function () {
            var prev = $scope.statLevel - 1;
            if (prev >= 1) {
                $scope.statLevel = prev;
            }
        };
        
        $scope.getLevel = function () {
            return $scope.statLevel;
        };
        
        $scope.currentStats = function () {
            for (var i = 0; i < $scope.hero.stats.length; i++) {
                if ($scope.hero.stats[i].level === $scope.getLevel()) {
                    return $scope.hero.stats[i];
                }
            }
            
            return false;
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
.controller('AdminHeroEditCtrl', ['$scope', '$state', '$window', '$compile', 'bootbox', 'HOTS', 'AlertService', 'AdminHeroService', 'data', 
    function ($scope, $state, $window, $compile, bootbox, HOTS, AlertService, AdminHeroService, data) {
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
                className: '',
                orderNum: 1
            };
        
        // load hero
        $scope.hero = data.hero;
        
        // roles
        $scope.roles = HOTS.roles;
        
        // types
        $scope.heroTypes = HOTS.types;
        
        // universe
        $scope.universes = HOTS.universes;
        
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
            box = bootbox.dialog({
                title: 'Add Ability',
                message: $compile('<div ability-add-form></div>')($scope)
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

            console.log($scope.hero.abilities);
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
            
            console.log($scope.hero.abilities);
        };
        
        // talents
        $scope.talentTiers = HOTS.tiers;
        $scope.talentAddWnd = function () {
            $scope.currentTalent = angular.copy(defaultTalent);
            box = bootbox.dialog({
                title: 'Add Talent',
                message: $compile('<div talent-add-form></div>')($scope)
            });
        };

        $scope.talentEditWnd = function (talent) {
            $scope.currentTalent = talent;
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
            
            console.log($scope.hero.talents);
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
            
            console.log($scope.hero.talents);
        };
        
        $scope.updateDND = function (list, index) {
            list.splice(index, 1);
            
            for (var i = 0; i < list.length; i++) {
                list[i].orderNum = i + 1;
            }
            
            console.log(list);
        };
        
        // stats
        $scope.statLevel = 1;
        
        $scope.nextLevel = function () {
            var next = $scope.statLevel + 1;
            if (next <= 30) {
                $scope.statLevel = next;
            }
        };
        
        $scope.prevLevel = function () {
            var prev = $scope.statLevel - 1;
            if (prev >= 1) {
                $scope.statLevel = prev;
            }
        };
        
        $scope.getLevel = function () {
            return $scope.statLevel;
        };
        
        $scope.currentStats = function () {
            for (var i = 0; i < $scope.hero.stats.length; i++) {
                if ($scope.hero.stats[i].level === $scope.getLevel()) {
                    return $scope.hero.stats[i];
                }
            }
            
            return false;
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
.controller('AdminHOTSGuideAddHeroCtrl', ['$scope', '$state', 'AlertService', 'AdminHOTSGuideService', 'GuideBuilder', 'dataHeroes', 'dataMaps', 
    function ($scope, $state, AlertService, AdminHOTSGuideService, GuideBuilder, dataHeroes, dataMaps) {
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
        var heroRows = [9,10,9,8];
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
        var mapRows = [4,3];
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
.controller('AdminHOTSGuideAddMapCtrl', ['$scope', '$state', 'AlertService', 'AdminHOTSGuideService', 'GuideBuilder', 'dataHeroes', 'dataMaps', 
    function ($scope, $state, AlertService, AdminHOTSGuideService, GuideBuilder, dataHeroes, dataMaps) {
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
        var mapRows = [4,3];
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
.controller('AdminHOTSGuideEditHeroCtrl', ['$scope', '$state', '$window', 'AlertService', 'GuideBuilder', 'AdminHOTSGuideService', 'dataGuide', 'dataHeroes', 'dataMaps', 
    function ($scope, $state, $window, AlertService, GuideBuilder, AdminHOTSGuideService, dataGuide, dataHeroes, dataMaps) {
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
        var heroRows = [9,10,9,8];
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
        var mapRows = [4,3];
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
.controller('AdminHOTSGuideEditMapCtrl', ['$scope', '$state', '$window', 'AlertService', 'GuideBuilder', 'AdminHOTSGuideService', 'dataGuide', 'dataHeroes', 'dataMaps', 
    function ($scope, $state, $window, AlertService, GuideBuilder, AdminHOTSGuideService, dataGuide, dataHeroes, dataMaps) {
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
        var mapRows = [4,3];
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
.controller('HOTSHomeCtrl', ['$scope', 'dataBanners', 'dataArticles', 'dataGuidesCommunity', 'dataGuidesFeatured', 'ArticleService', 'HOTSGuideService', 
    function ($scope, dataBanners, dataArticles, dataGuidesCommunity, dataGuidesFeatured, ArticleService, HOTSGuideService) {
        // data
        $scope.articles = dataArticles.articles;
        $scope.guidesCommunity = dataGuidesCommunity.guides;
        $scope.guidesFeatured = dataGuidesFeatured.guides;
        $scope.loading = {
            articles: false,
            community: false,
            featured: false
        };
        
        // banner
        $scope.banner = {
            current: 0,
            direction: 'left',
            slides: dataBanners.banners,
            setCurrent: function (current) {
                this.direction = 'right';
                this.current = current;
            },
            next: function () {
                this.direction = 'right';
                this.current = (this.current < (this.slides.length - 1)) ? ++this.current : 0;
            },
            prev: function () {
                this.direction = 'left';
                this.current = (this.current > 0) ? --this.current : this.slides.length - 1;
            }
        };
        
        // content
        $scope.hero = 'all';
        $scope.setHero = function (hero) {
            $scope.hero = hero;
            $scope.loading = {
                articles: true,
                community: true,
                featured: true
            };
            
            ArticleService.getArticles('hots', hero, 1, 9).then(function (data) {
                $scope.articles = data.articles;
                $scope.loading.articles = false;
            });

            HOTSGuideService.getGuidesCommunity(hero, 1, 10).then(function (data) {
                $scope.guidesCommunity = data.guides;
                $scope.loading.community = false;
            });
            
            HOTSGuideService.getGuidesFeatured(hero, 1, 10).then(function (data) {
                $scope.guidesFeatured = data.guides;
                $scope.loading.featured = false;
            });
        };
    }
])
.controller('HOTSGuidesListCtrl', ['$scope', '$state', 'data', 'dataHeroes', 'dataMaps', 
    function ($scope, $state, data, dataHeroes, dataMaps) {
        if (!data.success) { return $state.transitionTo('app.hots.guides.list'); }
        
        // guides
        $scope.guides = data.guides;
        $scope.total = data.total;
        $scope.page = parseInt(data.page);
        $scope.perpage = data.perpage;
        $scope.search = data.search;
        $scope.age = data.age;
        $scope.order = data.order;
        $scope.hero = data.hero;
        $scope.guideType = data.guideType;
        $scope.map = data.map;

        $scope.hasSearch = function () {
            return (data.search) ? data.search.length : false;
        }
        
        // advanced filters
        if (!$scope.app.settings.show.guides) {
            $scope.app.settings.show.guides = {
                advanced: false
            };
        }

        $scope.toggleAdvanced = function () {
            $scope.app.settings.show.guides.advanced = !$scope.app.settings.show.guides.advanced;
        }
        
        $scope.showAdvanced = function () {
            return $scope.app.settings.show.guides.advanced;
        }
        
        $scope.loading = false;

        // filters
        $scope.getFilter = function (name, value) {
            var filter = $scope.filters.all[name];
            for (var i = 0; i < filter.length; i++) {
                if (filter[i].value == value) {
                    return filter[i];
                }
            }
            return filter[0];
        }
        
        function dataToFilter (heroes) {
            var out = [];
            for (var i = 0; i < heroes.length; i++) {
                out.push({ name: heroes[i].name, value: heroes[i].className });
            }
            return out;
        }

        $scope.filters = {
            all: {
                age: [
                    { name: 'All Guides', value: 'all' },
                    { name: '7 Days', value: '7' },
                    { name: '15 Days', value: '15' },
                    { name: '30 Days', value: '30' },
                    { name: '60 Days', value: '60' },
                    { name: '90 Days', value: '90' }
                ],
                order: [
                    { name: 'Highest Ranked', value: 'high' },
                    { name: 'Lowest Ranked', value: 'low' },
                    { name: 'Newest Decks', value: 'new' },
                    { name: 'Oldest Decks', value: 'old' }
                ],
                heroes: [{ name: 'All Heroes', value: 'all' }].concat(dataToFilter(dataHeroes.heroes)),
                guideType: [
                    { name: 'All Guides', value: 'all' },
                    { name: 'Hero', value: 'hero' },
                    { name: 'Map', value: 'map' }
                ],
                maps: [{ name: 'All Maps', value: 'all' }].concat(dataToFilter(dataMaps.maps)),
            }
        };
        $scope.filters.age = $scope.getFilter('age', $scope.age);
        $scope.filters.order = $scope.getFilter('order', $scope.order);
        $scope.filters.hero = $scope.getFilter('heroes', $scope.hero);
        $scope.filters.guideType = $scope.getFilter('guideType', $scope.guideType);
        $scope.filters.map = $scope.getFilter('maps', $scope.map);
        
        $scope.getGuides = function () {
            var params = {};
            
            if ($scope.search) {
                params.s = $scope.search;
            }
            
            if ($scope.page !== 1) {
                params.p = $scope.page;
            }
            
            if ($scope.filters.guideType != 'all') {
                params.t = $scope.filters.guideType.value;
            }

            if ($scope.filters.hero != 'all') {
                params.h = $scope.filters.hero.value;
            }
            
            if ($scope.filters.map != 'all') {
                params.m = $scope.filters.map.value;
            }
            
            if ($scope.filters.age.value !== 'all') {
                params.a = $scope.filters.age.value;
            }
            
            if ($scope.filters.order.value !== 'high') {
                params.o = $scope.filters.order.value;
            }
            
            $scope.loading = true;
            $state.transitionTo('app.hots.guides.list', params);
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
                return (this.results() > 0) ? Math.ceil(this.results() / this.perpage()) : 1;
            },
            
        };

        // verify valid page
        if ($scope.page < 1 || $scope.page > $scope.pagination.totalPages()) {
            $scope.pagination.setPage(1);
        }
    }
])
.controller('HOTSGuideCtrl', ['$scope', '$state', '$sce', 'bootbox', 'VoteService', 'HOTSGuideService', 'data', 'dataHeroes', 
    function ($scope, $state, $sce, bootbox, VoteService, HOTSGuideService, data, dataHeroes) {
        $scope.guide = data.guide;
        $scope.currentHero = $scope.guide.heroes[0];
        $scope.heroes = dataHeroes.heroes;
        
        // show
        if (!$scope.app.settings.show.guide) {
            $scope.app.settings.show['guide'] = {
                talents: true,
                description: true,
                video: true,
                matchups: true,
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
            return $scope.currentHero;
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
        
        };
        $scope.hasStrong = function (hero) {
        
        };
        $scope.hasWeak = function (hero) {
        
        };
        
        $scope.getVideo = function () {
            return $scope.getContent('<iframe src="//www.youtube.com/embed/' + $scope.guide.video + '" frameborder="0" height="360" width="100%"></iframe>');
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
                box = bootbox.dialog({
                    title: 'Login Required',
                    message: $compile('<div login-form></div>')($scope)
                });
                box.modal('show');
                callback = function () {
                    vote(direction, guide);
                };
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
        };
        
        // comments
        var defaultComment = {
            comment: ''
        };
        $scope.comment = angular.copy(defaultComment);
        
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
                box = bootbox.dialog({
                    title: 'Login Required',
                    message: $compile('<div login-form></div>')($scope)
                });
                box.modal('show');
                callback = function () {
                    $scope.voteComment(direction, deck);
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
        
        // get premium
        $scope.getPremium = function (plan) {
            if ($scope.app.user.isLogged()) {
                if (!$scope.app.user.isSubscribed()) {
                    $state.transitionTo('app.profile.subscription', { username: $scope.app.user.getUsername(), plan: plan });
                }
            } else {
                box = bootbox.dialog({
                    title: 'Login Required',
                    message: $compile('<div login-form></div>')($scope)
                });
                box.modal('show');
                callback = function () {
                    $scope.getPremium(plan);
                };
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
                    updateVotes();
                    callback();
                }).error(function() {
                    $scope.showError = true;
                });
            }
        }
    }
])
.controller('TeamCtrl', ['$scope',
    function ($scope) {
        
    }
])
.controller('ContactCtrl', ['$scope',
    function ($scope) {

    }
])
;;'use strict';

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
.directive('loginForm', function () {
    return {
        templateUrl: 'views/frontend/login.form.html'
    };
})
.directive('datePicker', function($compile){
    return {
        replace: true,
        templateUrl: 'views/admin/date-picker.html',
        scope: {
            ngModel: '=',
            ngDisabled: '=',
            dateOptions: '='
        },
        link: function($scope, $element, $attrs, $controller){
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
        templateUrl: 'views/frontend/footer.html'
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
.directive('abilityAddForm', function () {
    return {
        templateUrl: 'views/admin/hots.heroes.ability.add.html'
    };
})
.directive('abilityEditForm', function () {
    return {
        templateUrl: 'views/admin/hots.heroes.ability.edit.html'
    };
})
.directive('talentAddForm', function () {
    return {
        templateUrl: 'views/admin/hots.heroes.talent.add.html'
    };
})
.directive('talentEditForm', function () {
    return {
        templateUrl: 'views/admin/hots.heroes.talent.edit.html'
    };
})
.directive('talentModal', function () {
    return {
        templateUrl: 'views/frontend/hots.talent.modal.html'
    };
})
.directive('heroModal', function () {
    return {
        templateUrl: 'views/frontend/hots.hero.modal.html'
    };
})
.directive('mapModal', function () {
    return {
        templateUrl: 'views/frontend/hots.map.modal.html'
    };
})
.directive('hotsTalent', ['$compile', function ($compile) {
    return {
        restrict: 'A',
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
        templateUrl: 'views/frontend/activity/activity.signup.html'
    };
})
.directive('activityArticle', function () {
    return {
        templateUrl: 'views/frontend/activity/activity.article.html'
    };
})
.directive('activityArticleComment', function () {
    return {
        templateUrl: 'views/frontend/activity/activity.article.comment.html'
    };
})
.directive('activityDeck', function () {
    return {
        templateUrl: 'views/frontend/activity/activity.deck.html'
    };
})
.directive('activityDeckComment', function () {
    return {
        templateUrl: 'views/frontend/activity/activity.deck.comment.html'
    };
})
.directive('activityForumPost', function () {
    return {
        templateUrl: 'views/frontend/activity/activity.forumPost.html'
    };
})
.directive('activityForumComment', function () {
    return {
        templateUrl: 'views/frontend/activity/activity.forumComment.html'
    };
})
.directive('googleAdSense', function () {
    return {
        restrict: 'A',
        replace: true,       
        templateUrl: "views/frontend/googleAds.html",
        controller: function () {
            (adsbygoogle = window.adsbygoogle || []).push({});
        }
    };
})
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
   var title = '';
   var metaDescription = '';
   var metaKeywords = '';
   return {
      set: function(newTitle, newMetaDescription, newKeywords) {
          metaKeywords = newKeywords;
          metaDescription = newMetaDescription;
          title = newTitle + ' - TempoStorm'; 
      },
      metaTitle: function(){ return title; },
      metaDescription: function() { return metaDescription; },
      metaKeywords: function() { return metaKeywords; }
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
.factory('UserService', ['$http', function($http) {
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
.factory('ArticleService', ['$http', '$q', function ($http, $q) {
    return {
        getArticles: function (articleType, filter, page, perpage, search) {
            var d = $q.defer(),
                articleType = articleType || 'all',
                filter = filter || 'all',
                page = page || 1,
                perpage = perpage || 20,
                search = search || '';
            
            $http.post('/articles', { articleType: articleType, filter: filter, page: page, perpage: perpage, search: search }).success(function (data) {
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
.factory('ProfileService', ['$http', '$q', function ($http, $q) {
    return {
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
            if ($window.sessionStorage.token) {
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
    hs.expansions = ['Basic', 'Naxxramas', 'Goblins Vs. Gnomes', 'Blackrock Mountain'];
    
    return hs;
})
.factory('HOTS', function () {
    var hots = {};
    
    hots.roles = ["Warrior", "Assassin", "Support", "Specialist"];
    hots.types = ["Melee", "Ranged"];
    hots.universes = ["Warcraft", "Starcraft", "Diablo", "Blizzard"];
    hots.abilityTypes = ["Combat Trait", "Ability", "Heroic Ability"];
    hots.tiers = [1,4,7,10,13,16,20];
    
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
            featured: data.featured || false,
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
            contentEarly: deck.contentEarly,
            contentMid: deck.contentMid,
            contentLate: deck.contentLate,
            cards: deck.cards,
            playerClass: deck.playerClass,
            arena: deck.arena,
            mulligans: deck.mulligans,
            against: deck.against,
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
            var r = /^(?:https?:\/\/)?(?:www\.)?(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))((\w|-){11})(?:\S+)?$/;
            return (gb.video.length) ? gb.video.match(r) : true;
        };
        
        gb.getContent = function (content) {
            return $sce.trustAsHtml(content);
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
        getDecksCommunity: function (klass, page, perpage) {
            klass = klass || 'all';
            page = page || 1;
            perpage = perpage || 24;
            
            var d = $q.defer();
            $http.post('/decks/community', { klass: klass, page: page, perpage: perpage }).success(function (data) {
                d.resolve(data);
            });
            return d.promise;
        },
        getDecksFeatured: function (klass, page, perpage) {
            klass = klass || 'all';
            page = page || 1;
            perpage = perpage || 24;
            
            var d = $q.defer();
            $http.post('/decks/featured', { klass: klass, page: page, perpage: perpage }).success(function (data) {
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
        getGuidesCommunity: function (hero, page, perpage) {
            hero = hero || 'all';
            page = page || 1;
            perpage = perpage || 24;
            
            var d = $q.defer();
            $http.post('/hots/guides/community', { hero: hero, page: page, perpage: perpage }).success(function (data) {
                d.resolve(data);
            });
            return d.promise;
        },
        getGuidesFeatured: function (hero, page, perpage) {
            hero = hero || 'all';
            page = page || 1;
            perpage = perpage || 24;
            
            var d = $q.defer();
            $http.post('/hots/guides/featured', { hero: hero, page: page, perpage: perpage }).success(function (data) {
                d.resolve(data);
            });
            return d.promise;
        },
        getGuides: function (guideType, hero, map, page, perpage, search, age, order) {
            guideType = guideType || 'all';
            hero = hero || 'all';
            map = map || 'all';
            page = page || 1;
            perpage = perpage || 24;
            search = search || '';
            age = age || 'all';
            order = order || 'high';
            
            var d = $q.defer();
            $http.post('/hots/guides', { guideType: guideType, hero: hero, map: map, page: page, perpage: perpage, search: search, age: age, order: order }).success(function (data) {
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
        }
    };
}])
.factory('VoteService', ['$http', '$q', function ($http, $q) {
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
        getBanners: function () {
            var d = $q.defer();
            $http.post('/banners', {}).success(function (data) {
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
;