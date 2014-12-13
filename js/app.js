'use strict';

var app = angular.module('app', [
    'angularFileUpload',
    'summernote',
    'angular-bootbox',
    'angularMoment',
    'chart.js',
    'ui.select',
    'ngAnimate',
    'ngCookies',
    'ngStorage',
    'ngSanitize',
    'ui.router',
    'ui.load',
    'ui.jq',
    'ui.validate',
    'ui.date',
    'app.controllers',
    'app.services',
    'app.filters',
    'app.directives'
])
.run(
    ['$rootScope', '$state', '$stateParams', '$window', '$http', '$q', 'AuthenticationService', 'UserService',
        function ($rootScope, $state, $stateParams, $window, $http, $q, AuthenticationService, UserService) {
            $rootScope.$state = $state;
            $rootScope.$stateParams = $stateParams;
            
            // handle state changes
            $rootScope.$on("$stateChangeStart", function(event, toState, toParams, fromState, fromParams) {
                if (toState.access && toState.access.noauth && $window.sessionStorage.token && AuthenticationService.isLogged()) {
                    event.preventDefault();
                    $state.transitionTo('app.home');
                }
                if (toState.access && toState.access.auth && !$window.sessionStorage.token && !AuthenticationService.isLogged()) {
                    event.preventDefault();
                    $state.transitionTo('app.login');
                }
                $window.scrollTo(0,0);
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
        
        $urlRouterProvider.otherwise('/');
        $stateProvider
            .state('app', {
                abstract: true,
                url: '/',
                views: {
                    root: {
                        templateUrl: 'views/frontend/index.html'
                    }
                },
                resolve: {
                    User: ['$window', '$cookies', '$state', '$q', 'AuthenticationService', 'UserService' , function($window, $cookies, $state, $q, AuthenticationService, UserService) {
                        if ($cookies.token) {
                            $window.sessionStorage.token = $cookies.token;
                            delete $cookies.token;
                        }
                        if ($window.sessionStorage.token && !AuthenticationService.isLogged()) {
                            var d = $q.defer();
                            UserService.verify().success(function (data) {
                                AuthenticationService.setLogged(true);
                                AuthenticationService.setAdmin(data.isAdmin);
                                $window.sessionStorage.userID = data.userID;
                                $window.sessionStorage.username = data.username;
                                d.resolve();
                            }).error(function () {
                                delete $window.sessionStorage.userID;
                                delete $window.sessionStorage.username;
                                delete $window.sessionStorage.token;
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
                        templateUrl: 'views/frontend/home.html',
                        controller: 'HomeCtrl',
                        resolve: {
                            dataArticles: ['ArticleService', function (ArticleService) {
                                var klass = 'all',
                                    page = 1,
                                    perpage = 5;
                                return ArticleService.getArticles(klass, page, perpage);
                            }],
                            dataDecks: ['DeckService', function (DeckService) {
                                var klass = 'all',
                                    page = 1,
                                    perpage = 10;
                                return DeckService.getDecks(klass, page, perpage);
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
                        templateUrl: 'views/frontend/articles.html'
                    }
                }
            })
            .state('app.articles.list', {
                url: '',
                views: {
                    articles: {
                        templateUrl: 'views/frontend/articles.list.html',
                        controller: 'ArticlesCtrl',
                        resolve: {
                            data: ['ArticleService', function (ArticleService) {
                                var klass = 'all',
                                    page = 1,
                                    perpage = 10;
                                return ArticleService.getArticles(klass, page, perpage);
                            }]
                        }
                    }
                }
            })
            .state('app.articles.article', {
                url: '/:slug',
                views: {
                    articles: {
                        templateUrl: 'views/frontend/articles.article.html',
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
                        templateUrl: 'views/frontend/decks.html'
                    }
                }
            })
            .state('app.decks.list', {
                url: '',
                views: {
                    decks: {
                        templateUrl: 'views/frontend/decks.list.html',
                        controller: 'DecksCtrl',
                        resolve: {
                            data: ['DeckService', function (DeckService) {
                                var klass = 'all',
                                    page = 1,
                                    perpage = 24;
                                return DeckService.getDecks(klass, page, perpage);
                            }]
                        }
                    }
                }
            })
            .state('app.decks.deck', {
                url: '/:slug',
                views: {
                    decks: {
                        templateUrl: 'views/frontend/decks.deck.html',
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
                        templateUrl: 'views/frontend/deck-builder.html'
                    }
                }
            })
            .state('app.deckBuilder.class', {
                url: '',
                views: {
                    deckBuilder: {
                        templateUrl: 'views/frontend/deck-builder.class.html'
                    }
                }
            })
            .state('app.deckBuilder.build', {
                url: '/:playerClass',
                views: {
                    deckBuilder: {
                        templateUrl: 'views/frontend/deck-builder.build.html',
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
                        templateUrl: 'views/frontend/deck-builder.edit.html',
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
                        templateUrl: 'views/frontend/forum.html'
                    }
                }
            })
            .state('app.forum.home', {
                url: '',
                views: {
                    forum: {
                        templateUrl: 'views/frontend/forum.home.html',
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
                        templateUrl: 'views/frontend/forum.threads.html',
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
                        templateUrl: 'views/frontend/forum.add.html',
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
                        templateUrl: 'views/frontend/forum.post.html',
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
                        templateUrl: 'views/frontend/team.html'
                    }
                }
            })
            .state('app.terms', {
                url: 'terms',
                views: {
                    content: {
                        templateUrl: 'views/frontend/terms.html'
                    }
                }
            })
            .state('app.privacy', {
                url: 'privacy',
                views: {
                    content: {
                        templateUrl: 'views/frontend/privacy.html'
                    }
                }
            })
            .state('app.login', {
                url: 'login',
                views: {
                    content: {
                        templateUrl: 'views/frontend/login.html',
                        controller: 'UserCtrl',
                    }
                },
                access: { noauth: true }
            })
            .state('app.signup', {
                url: 'signup',
                views: {
                    content: {
                        templateUrl: 'views/frontend/signup.html',
                        controller: 'UserCtrl',
                    }
                },
                access: { noauth: true }
            })
            .state('app.verify', {
                url: 'verify?email&code',
                views: {
                    content: {
                        templateUrl: 'views/frontend/verify.html',
                        controller: 'UserVerifyCtrl',
                    }
                },
                access: { noauth: true }
            })
            .state('app.forgotPassword', {
                url: 'forgot-password',
                views: {
                    content: {
                        templateUrl: 'views/frontend/forgot-password.html',
                        controller: 'UserCtrl'
                    }
                },
                access: { noauth: true }
            })
            .state('app.resetPassword', {
                url: 'forgot-password/reset?email&code',
                views: {
                    content: {
                        templateUrl: 'views/frontend/reset-password.html',
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
                        templateUrl: 'views/frontend/profile.html',
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
                        templateUrl: 'views/frontend/profile.activity.html',
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
                        templateUrl: 'views/frontend/profile.articles.html',
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
                        templateUrl: 'views/frontend/profile.decks.html',
                        controller: 'ProfileDecksCtrl',
                        resolve: {
                            dataDecks: ['$stateParams', 'ProfileService', function ($stateParams, ProfileService) {
                                var username = $stateParams.username;
                                return ProfileService.getDecks(username);
                            }]
                        }
                    }
                }
            })
            .state('app.profile.posts', {
                url: '/posts',
                views: {
                    profile: {
                        templateUrl: 'views/frontend/profile.posts.html',
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
            .state('app.admin', {
                abstract: true,
                url: 'admin',
                views: {
                    content: {
                        templateUrl: 'views/admin/index.html'
                    }
                },
                access: { auth: true, admin: true }
            })
            .state('app.admin.dashboard', {
                url: '',
                views: {
                    admin: {
                        templateUrl: 'views/admin/dashboard.html'
                    }
                },
                access: { auth: true, admin: true }
            })
            .state('app.admin.articles', {
                abstract: true,
                url: '/articles',
                views: {
                    admin: {
                        templateUrl: 'views/admin/articles.html'
                    }
                },
                access: { auth: true, admin: true }
            })
            .state('app.admin.articles.list', {
                url: '',
                views: {
                    articles: {
                        templateUrl: 'views/admin/articles.list.html',
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
                        templateUrl: 'views/admin/articles.add.html',
                        controller: 'AdminArticleAddCtrl',
                        resolve: {
                            dataDecks: ['AdminDeckService', function (AdminDeckService) {
                                return AdminDeckService.getAllDecks();
                            }],
                            dataArticles: ['AdminArticleService', function (AdminArticleService) {
                                return AdminArticleService.getAllArticles();
                            }],
                            dataAdmins: ['AdminUserService', function (AdminUserService) {
                                return AdminUserService.getAdmins();
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
                        templateUrl: 'views/admin/articles.edit.html',
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
                            dataAdmins: ['AdminUserService', function (AdminUserService) {
                                return AdminUserService.getAdmins();
                            }]
                        }
                    }
                },
                access: { auth: true, admin: true }
            })
            .state('app.admin.decks', {
                abstract: true,
                url: '/decks',
                views: {
                    admin: {
                        templateUrl: 'views/admin/decks.html'
                    }
                },
                access: { auth: true, admin: true }
            })
            .state('app.admin.decks.list', {
                url: '',
                views: {
                    decks: {
                        templateUrl: 'views/admin/decks.list.html',
                        controller: 'AdminDeckListCtrl',
                        resolve: {
                            data: ['AdminDeckService', function (AdminDeckService) {
                                var page = 1,
                                    perpage = 50;
                                return AdminDeckService.getDecks(page, perpage);
                            }]
                        }
                    }
                },
                access: { auth: true, admin: true }
            })
            .state('app.admin.decks.add', {
                url: '/add',
                views: {
                    decks: {
                        templateUrl: 'views/admin/decks.add.class.html'
                    }
                },
                access: { auth: true, admin: true }
            })
            .state('app.admin.decks.addBuild', {
                url: '/add/:playerClass',
                views: {
                    decks: {
                        templateUrl: 'views/admin/decks.add.build.html',
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
            .state('app.admin.decks.edit', {
                url: '/edit/:deckID',
                views: {
                    decks: {
                        templateUrl: 'views/admin/decks.edit.html',
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
            .state('app.admin.cards', {
                abstract: true,
                url: '/cards',
                views: {
                    admin: {
                        templateUrl: 'views/admin/cards.html'
                    }
                },
                access: { auth: true, admin: true }
            })
            .state('app.admin.cards.list', {
                url: '',
                views: {
                    cards: {
                        templateUrl: 'views/admin/cards.list.html',
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
            .state('app.admin.cards.add', {
                url: '/add',
                views: {
                    cards: {
                        templateUrl: 'views/admin/cards.add.html',
                        controller: 'AdminCardAddCtrl'
                    }
                },
                access: { auth: true, admin: true }
            })
            .state('app.admin.cards.edit', {
                url: '/edit/:cardID',
                views: {
                    cards: {
                        templateUrl: 'views/admin/cards.edit.html',
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
                        templateUrl: 'views/admin/forum.html'
                    }
                },
                access: { auth: true, admin: true }
            })
            .state('app.admin.forum.structure', {
                abstract: true,
                url: '/structure',
                views: {
                    forum: {
                        templateUrl: 'views/admin/forum.structure.html'
                    }
                },
                access: { auth: true, admin: true }
            })
            .state('app.admin.forum.structure.list', {
                url: '',
                views: {
                    categories: {
                        templateUrl: 'views/admin/forum.structure.list.html',
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
                        templateUrl: 'views/admin/forum.categories.add.html',
                        controller: 'AdminForumCategoryAddCtrl'
                    }
                },
                access: { auth: true, admin: true }
            })
            .state('app.admin.forum.structure.categoryEdit', {
                url: '/category/edit/:categoryID',
                views: {
                    categories: {
                        templateUrl: 'views/admin/forum.categories.edit.html',
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
                        templateUrl: 'views/admin/forum.threads.add.html',
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
                        templateUrl: 'views/admin/forum.threads.edit.html',
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
                        templateUrl: 'views/admin/forum.management.html'
                    }
                },
                access: { auth: true, admin: true }
            })
            .state('app.admin.users', {
                abstract: true,
                url: '/users',
                views: {
                    admin: {
                        templateUrl: 'views/admin/users.html'
                    }
                },
                access: { auth: true, admin: true }
            })
            .state('app.admin.users.list', {
                url: '',
                views: {
                    users: {
                        templateUrl: 'views/admin/users.list.html',
                        controller: 'AdminUserListCtrl',
                        resolve: {
                            data: ['AdminUserService', function (AdminUserService) {
                                var page = 1,
                                    perpage = 50;
                                return AdminUserService.getUsers(page, perpage);
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
                        templateUrl: 'views/admin/users.add.html',
                        controller: 'AdminUserAddCtrl'
                    }
                },
                access: { auth: true, admin: true }
            })
            .state('app.admin.users.edit', {
                url: '/edit/:userID',
                views: {
                    users: {
                        templateUrl: 'views/admin/users.edit.html',
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
                        templateUrl: 'views/admin/subscriptions.html'
                    }
                },
                access: { auth: true, admin: true }
            })
            .state('app.admin.streams', {
                url: '/streams',
                views: {
                    admin: {
                        templateUrl: 'views/admin/streams.html'
                    }
                },
                access: { auth: true, admin: true }
            })
            ;
    }]
);