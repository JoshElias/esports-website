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
    ['$rootScope', '$state', '$stateParams', '$window', '$http', '$q', 'AuthenticationService', 'UserService', '$location', 'ngProgress', 
        function ($rootScope, $state, $stateParams, $window, $http, $q, AuthenticationService, UserService, $location, ngProgress) {
            $rootScope.$state = $state;
            $rootScope.$stateParams = $stateParams;
            
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
                    event.preventDefault();
                    $state.transitionTo('app.home');
                }
                $window.scrollTo(0,0);
            });
            $rootScope.$on("$stateChangeSuccess", function(event, toState, toParams, fromState, fromParams) {
                //ngProgress.complete();
                $window.ga('send', 'pageview', $location.path());
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
                    User: ['$window', '$cookies', '$state', '$q', 'AuthenticationService', 'SubscriptionService', 'UserService' , function($window, $cookies, $state, $q, AuthenticationService, SubscriptionService, UserService) {
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
                                    perpage = 8;
                                return ArticleService.getArticles(klass, page, perpage);
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
                url: '?s&p&k',
                views: {
                    articles: {
                        templateUrl: tpl + 'views/frontend/articles.list.html',
                        controller: 'ArticlesCtrl',
                        resolve: {
                            data: ['$stateParams', 'ArticleService', function ($stateParams, ArticleService) {
                                var klass = $stateParams.k || 'all',
                                    page = $stateParams.p || 1,
                                    perpage = 10,
                                    search = $stateParams.s || '';
                                
                                return ArticleService.getArticles(klass, page, perpage, search);
                            }]
                        }
                    }
                }
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
                }
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
                }
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
                }
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
                }
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
                url: 'the-team',
                views: {
                    content: {
                        templateUrl: tpl + 'views/frontend/team.html'
                    }
                }
            })
            .state('app.sponsors', {
                url: 'sponsors',
                views: {
                    content: {
                        templateUrl: tpl + 'views/frontend/sponsors.html'
                    }
                }
            })
            .state('app.premium', {
                url: 'premium',
                views: {
                    content: {
                        templateUrl: tpl + 'views/frontend/premium.html',
                        controller: 'PremiumCtrl'
                    }
                }
            })
            .state('app.terms', {
                url: 'terms',
                views: {
                    content: {
                        templateUrl: tpl + 'views/frontend/terms.html'
                    }
                }
            })
            .state('app.privacy', {
                url: 'privacy',
                views: {
                    content: {
                        templateUrl: tpl + 'views/frontend/privacy.html'
                    }
                }
            })
            .state('app.login', {
                url: 'login',
                views: {
                    content: {
                        templateUrl: tpl + 'views/frontend/login.html',
                        controller: 'UserCtrl',
                    }
                },
                access: { noauth: true }
            })
            .state('app.signup', {
                url: 'signup',
                views: {
                    content: {
                        templateUrl: tpl + 'views/frontend/signup.html',
                        controller: 'UserCtrl',
                    }
                },
                access: { noauth: true }
            })
            .state('app.verify', {
                url: 'verify?email&code',
                views: {
                    content: {
                        templateUrl: tpl + 'views/frontend/verify.html',
                        controller: 'UserVerifyCtrl',
                    }
                },
                access: { noauth: true }
            })
            .state('app.forgotPassword', {
                url: 'forgot-password',
                views: {
                    content: {
                        templateUrl: tpl + 'views/frontend/forgot-password.html',
                        controller: 'UserCtrl'
                    }
                },
                access: { noauth: true }
            })
            .state('app.resetPassword', {
                url: 'forgot-password/reset?email&code',
                views: {
                    content: {
                        templateUrl: tpl + 'views/frontend/reset-password.html',
                        controller: 'UserResetPasswordCtrl'
                    }
                },
                access: { noauth: true }
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
                            dataDecks: ['$stateParams', 'ProfileService', 'AuthenticationService', function ($stateParams, ProfileService, AuthenticationService) {
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
                access: { auth: true }
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
                access: { auth: true }
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
                access: { auth: true }
            })
            .state('app.admin', {
                abstract: true,
                url: 'admin',
                views: {
                    content: {
                        templateUrl: tpl + 'views/admin/index.html'
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
            .state('app.admin.hearthstone.articles', {
                abstract: true,
                url: '/articles',
                views: {
                    hearthstone: {
                        templateUrl: tpl + 'views/admin/articles.html'
                    }
                },
                access: { auth: true, admin: true }
            })
            .state('app.admin.hearthstone.articles.list', {
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
            .state('app.admin.hearthstone.articles.add', {
                url: '/add',
                views: {
                    articles: {
                        templateUrl: tpl + 'views/admin/articles.add.html',
                        controller: 'AdminArticleAddCtrl',
                        resolve: {
                            dataDecks: ['AdminDeckService', function (AdminDeckService) {
                                return AdminDeckService.getAllDecks();
                            }],
                            dataArticles: ['AdminArticleService', function (AdminArticleService) {
                                return AdminArticleService.getAllArticles();
                            }],
                            dataProviders: ['AdminUserService', function (AdminUserService) {
                                return AdminUserService.getProviders();
                            }]
                        }
                    }
                },
                access: { auth: true, admin: true }
            })
            .state('app.admin.hearthstone.articles.edit', {
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
                            dataArticles: ['AdminArticleService', function (AdminArticleService) {
                                return AdminArticleService.getAllArticles();
                            }],
                            dataProviders: ['AdminUserService', function (AdminUserService) {
                                return AdminUserService.getProviders();
                            }]
                        }
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
                access: { auth: true, admin: true }
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
                access: { auth: true, admin: true }
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
            
            ArticleService.getArticles(klass).then(function (data) {
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
.controller('ProfileCtrl', ['$scope', 'dataProfile',  
    function ($scope, dataProfile) {
        $scope.user = dataProfile.user;
        
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
        
        $scope.cardImg = $scope.deckImg = $scope.app.cdn + '/dist/img/blank.png';
        
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
        
        $scope.cardImg = ($scope.card.photos.large.length) ? $scope.app.cdn + '/cards/' + $scope.card.photos.large : $scope.app.cdn + '/dist/img/blank.png';
        $scope.deckImg = ($scope.card.photos.small.length) ? $scope.app.cdn + '/cards/' + $scope.card.photos.small : $scope.app.cdn + '/dist/img/blank.png';
        
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
        $scope.classes = [{ name: 'All Classes', value: ''}].concat(Util.toSelect(Hearthstone.classes));
        $scope.types = [{ name: 'All Types', value: ''}].concat(Util.toSelect(Hearthstone.types));
        $scope.rarities = [{ name: 'All Rarities', value: ''}].concat(Util.toSelect(Hearthstone.rarities));
        
        // default filters
        $scope.filterClass = $scope.filterType = $scope.filterRarity = '';
        
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
.controller('AdminArticleAddCtrl', ['$scope', '$state', '$window', '$upload', '$compile', 'bootbox', 'Hearthstone', 'Util', 'AlertService', 'AdminArticleService', 'dataDecks', 'dataArticles', 'dataProviders', 
    function ($scope, $state, $window, $upload, $compile, bootbox, Hearthstone, Util, AlertService, AdminArticleService, dataDecks, dataArticles, dataProviders) {
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
            related: [],
            classTags: [],
            theme: 'none',
            featured: false,
            premium: {
                isPremium: false,
                expiryDate: d
            },
            active: true
        };
        
        // load article
        $scope.article = angular.copy(defaultArticle);
        
        // load decks
        $scope.decks = [{_id: undefined, name: 'No deck'}].concat(dataDecks.decks);
        
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
        
        // klass tags
        $scope.klassTags = ['Druid', 'Hunter', 'Mage', 'Paladin', 'Priest', 'Rogue', 'Shaman', 'Warlock', 'Warrior'];
        
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
                    $state.go('app.admin.hearthstone.articles.list');
                }
            });
        };
    }
])
.controller('AdminArticleEditCtrl', ['$scope', '$state', '$window', '$upload', '$compile', 'bootbox', 'Hearthstone', 'Util', 'AlertService', 'AdminArticleService', 'data', 'dataDecks', 'dataArticles', 'dataProviders', 
    function ($scope, $state, $window, $upload, $compile, bootbox, Hearthstone, Util, AlertService, AdminArticleService, data, dataDecks, dataArticles, dataProviders) {
        // load article
        $scope.article = data.article;
        
        // load decks
        $scope.decks = [{_id: undefined, name: 'No deck'}].concat(dataDecks.decks);
        
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
        $scope.cardImg = ($scope.article.photos.small && $scope.article.photos.small.length) ? $scope.app.cdn + '/articles/' + $scope.article.photos.small : $scope.app.cdn + '/dist/img/blank.png';
        
        // klass tags
        $scope.klassTags = ['Druid', 'Hunter', 'Mage', 'Paladin', 'Priest', 'Rogue', 'Shaman', 'Warlock', 'Warrior'];
        
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
                    $state.go('app.admin.hearthstone.articles.list');
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
.controller('ArticlesCtrl', ['$scope', '$state', 'ArticleService', 'data', 
    function ($scope, $state, ArticleService, data) {
        //if (!data.success) { return $state.transitionTo('app.articles.list'); }
        
        // articles
        $scope.articles = data.articles;
        $scope.total = data.total;
        $scope.klass = data.klass;
        $scope.page = parseInt(data.page);
        $scope.perpage = data.perpage;
        $scope.search = data.search;
        $scope.loading = false;
                
        $scope.hasSearch = function () {
            return (data.search) ? data.search.length : false;
        }
        
        $scope.setKlass = function (klass) {
            $scope.klass = klass;
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
            
            if ($scope.klass != 'all') {
                params.k = $scope.klass;
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
.controller('ArticleCtrl', ['$scope', '$sce', 'data', '$state', '$compile', '$window', 'bootbox', 'UserService', 'ArticleService', 'AuthenticationService', 'VoteService', 'SubscriptionService',  
    function ($scope, $sce, data, $state, $compile, $window, bootbox, UserService, ArticleService, AuthenticationService, VoteService, SubscriptionService) {
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
.controller('DeckCtrl', ['$scope', '$state', '$sce', '$compile', '$window', 'bootbox', 'Hearthstone', 'UserService', 'DeckService', 'AuthenticationService', 'VoteService', 'SubscriptionService', 'data', 
    function ($scope, $state, $sce, $compile, $window, bootbox, Hearthstone, UserService, DeckService, AuthenticationService, VoteService, SubscriptionService, data) {
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
.controller('ForumThreadCtrl', ['$scope', 'Pagination', 'data', 
    function ($scope, Pagination, data) {
        $scope.thread = data.thread;
        
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
.controller('ForumPostCtrl', ['$scope', '$sce', '$compile', '$window', 'bootbox', 'ForumService', 'UserService', 'AuthenticationService', 'VoteService', 'SubscriptionService', 'data', 
    function ($scope, $sce, $compile, $window, bootbox, ForumService, UserService, AuthenticationService, VoteService, SubscriptionService, data) {
        $scope.post = data.post;
        $scope.thread = data.thread;
        
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
                delay: 0,
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
        getArticles: function (klass, page, perpage, search) {
            var d = $q.defer(),
                page = page || 1,
                perpage = perpage || 20,
                search = search || '';
            
            $http.post('/articles', { klass: klass, page: page, perpage: perpage, search: search }).success(function (data) {
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
    hs.expansions = ['Basic', 'Naxxramas', 'Goblins Vs. Gnomes'];
    
    return hs;
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
;