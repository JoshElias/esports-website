'use strict';

var app = angular.module('app', [
    'lbServices',
    'angularFileUpload',
    'summernote',
    'angular-bootbox',
    'angular-iscroll',
    'angularMoment',
    'angularPayments',
    'angular-svg-round-progressbar',
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
    'hotsSnapshot',
    //'tsAdSense'
])
.run(
    ['$rootScope', '$state', '$stateParams', '$window', '$http', '$q', '$location', 'MetaService', '$cookies', "$localStorage", "LoginModalService", 'LoopBackAuth', 'AlertService', 'User', 'Util',
        function ($rootScope, $state, $stateParams, $window, $http, $q, $location, MetaService, $cookies, $localStorage, LoginModalService, LoopBackAuth, AlertService, User, Util) {
            $rootScope.$state = $state;
            $rootScope.$stateParams = $stateParams;
            $rootScope.metaservice = MetaService;
            $rootScope.LoginModalService = LoginModalService

            // handle state changes
            $rootScope.$on("$stateChangeStart", function(event, toState, toParams, fromState, fromParams) {
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
                    var redirect = toState.name;
                    event.preventDefault();

                    $state.go('app.login', { redirect: redirect });
                }
                if (toState.access && toState.access.admin && User.isAuthenticated()) {
                    User.isInRoles({
                        uid: LoopBackAuth.currentUserId,
                        roleNames: ['$admin', '$redbullAdmin']
                    })
                    .$promise
                    .then(function (data) {
                        if (data.isInRoles.$admin !== true && data.isInRoles.$redbullAdmin !== true) {
                            event.preventDefault();
                            $state.transitionTo('app.home');
                        }
                    });
                }

//                if (toState.access && toState.access.admin && !AuthenticationService.isAdmin()) {
//                    //event.preventDefault();
//                    //$state.transitionTo('app.home');
//                }
                $window.scrollTo(0,0);
            });
            $rootScope.$on("$stateChangeSuccess", function(event, toState, toParams, fromState, fromParams) {
                $rootScope.metaservice.setStatusCode(200);
                if ($window.ga) {
                    $window.ga('send', 'pageview', $location.path());
                }

                // seo
                if (toState.seo) {
                    $rootScope.metaservice.set(toState.seo.title, toState.seo.description, toState.seo.keywords)
                }
                if (!toState.og) {
                    $rootScope.metaservice.setOg('https://tempoStorm.com' + toState.url);
                }

                //we're resetting the alertService if unless persist is set to true, then we reset persist and the alertservice will reset on the NEXT state change
                if (!AlertService.getPersist()) {
                  AlertService.reset();
                } else {
				          AlertService.setShow(true);
                  AlertService.setPersist(false);
                }

            });
            $rootScope.$on("$stateChangeError", function(event, toState, toParams, fromState, fromParams, error) {
//                $state.go('app.404');
            });

            var accessToken = Util.getAuthCookie("access_token");
            var userId = Util.getAuthCookie("userId");
            if (accessToken && userId) {
                $cookies.remove("access_token");
                $cookies.remove("userId");
                LoopBackAuth.setUser(accessToken, userId);
                LoopBackAuth.save();
            }

            // TODO: extend $cookies with this function


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

        Stripe.setPublishableKey('pk_live_2BNbCCvFcOfU0awquAaYrHZo');

        $bootboxProvider.setDefaults({ locale: "en" });

        $locationProvider.html5Mode(true);
        $httpProvider.interceptors.push('AuthInterceptor');

        // cdn templates
        tpl = tpl || '';

        $sceDelegateProvider.resourceUrlWhitelist([
            'self',
            tpl + '**'
        ]);

        var throw404 = function ($state) {
            var options = {
                location: "replace",
                inherit: true,
                notify: true,
                relative: $state.$current
            }

            $state.transitionTo('app.404', {}, options);
        }

        // ignore ng-animate on font awesome spin
        //$animateProvider.classNameFilter(/^((?!(fa-spin)).)*$/);

        $urlRouterProvider.otherwise(function ($injector, $location) {
            $injector.invoke(['$state', function ($state) {
                return throw404($state)
            }]);
        });

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
                            return LoopBackAuth.currentUserData;
                        }
                    ],
                    getRoles: ['User', 'UserRoleService', function (User, UserRoleService) {
                        if (User.isAuthenticated()) {
                            User.isInRoles({
                                uid: User.getCurrentId(),
                                roleNames: ['$premium']
                            })
                            .$promise
                            .then(function (data) {
                                UserRoleService.setRoles(data);
                            });
                        }
                    }]
                },
                onEnter: ['$cookies', '$state', 'EventService', 'LoginModalService', 'AlertService', 'Util', function($cookies, $state, EventService, LoginModalService, AlertService, Util) {
                    // look for redirect cookie
                    var redirectState = $cookies.get("redirectStateString");
                    if(redirectState) {
                        redirectState = JSON.parse(redirectState);
                        $cookies.remove("redirectStateString");
                        $state.go(redirectState.name, redirectState.params);
                        return;
                    }

                    var thirdPartyError = Util.getAuthCookie("thirdPartyError");
                    if(thirdPartyError) {
                        if (!redirectState) {
                            $cookies.remove("thirdPartyError");
                            LoginModalService.showModal('login');
                        }

                        AlertService.setError({ persist: true, show: true, msg: thirdPartyError });
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
                params: { url: undefined },
                onEnter: ['$stateParams', '$location', function ($stateParams, $location) {
                    $location.url($stateParams.url);
//                    console.log($stateParams.url);
                }],
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
                                            content: false
                                        },
                                        include: [
                                            {
                                                relation: 'author'
                                            },
                                            {
                                                relation: 'slugs'
                                            }
                                        ],
                                        order: "createdDate DESC",
                                        skip: (offset * num) - num,
                                        limit: num
                                    }
                                })
                                .$promise
                                .then(function (articles) {
                                    return articles;
                                })
                                .catch(function (err) {
                                    console.log('err:', err);
                                });
//                                .then(function (data) { return _.sortBy(data, "createdDate").reverse(); });
                            }],
                            articlesTotal: ['Article', function (Article) {
                                return Article.count({
                                    where: {
                                        isActive: true
                                    }
                                }).$promise;
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
                            articles: ['Article', 'Util', function (Article, Util) {
                                var perpage = 6;

                                return Article.find({
                                    filter: {
                                        where: {
                                            articleType: 'overwatch',
                                            isActive: true
                                        },
                                        include: [
                                            {
                                                relation: 'author'
                                            },
                                            {
                                                relation: 'slugs'
                                            }
                                        ],
                                        fields: {
                                            content: false,
                                            votes: false
                                        },
                                        order: 'createdDate DESC',
                                        limit: perpage
                                    }
                                }).$promise
                                .then(function (owArticles) {
                                    _.each(owArticles, function (owArticle) {
                                        owArticle.slug = Util.setSlug(owArticle);
                                    });
                                    
                                    return owArticles;
                                });
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
            .state('app.overwatch.snapshot', {
                abstract: true,
                url: '/meta-snapshot',
                views: {
                    overwatch: {
                        templateUrl: tpl + 'views/frontend/overwatch.snapshots.html'
                    }
                }
            })
            .state('app.overwatch.snapshot.snapshot', {
                url: '/test',
                views: {
                    overwatchSnapshots: {
                        templateUrl: tpl + 'views/frontend/overwatch.snapshots.snapshot.html',
                    }
                }
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
                                })
                                .$promise
                                .catch(function (err) {
                                    if (err.status === 404) {
                                        return throw404();
                                    }
                                });
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
                url: '?p&f&s',
                views: {
                    articles: {
                        templateUrl: tpl + 'views/frontend/articles.list.html',
                        controller: 'ArticlesCtrl',
                        resolve: {
                            paginationParams: ['$stateParams', 'StateParamHelper', '$q', function($stateParams,  StateParamHelper, $q) {
                                var articleFilters = ['ts', 'hs', 'hots', 'overwatch', 'wow'];

                                // if only 1 filter, parse into array
                                if (angular.isString($stateParams.f)) {
                                    var tmp = $stateParams.f;
                                    $stateParams.f = [];
                                    $stateParams.f.push(tmp);
                                }

                                // validate filters
                                StateParamHelper.validateFilters($stateParams.f, articleFilters);

                                StateParamHelper.validatePage($stateParams.p);
                                var pattern = '/.*'+$stateParams.s+'.*/i',
                                artWhere = {
                                    isActive: true
                                };

                                if (!_.isEmpty($stateParams.s)) {
                                    artWhere.or = [
                                        { title: { regexp: pattern } },
                                        { description: { regexp: pattern } },
                                        { content: { regexp: pattern } }
                                    ];
                                }

                                if ($stateParams.f) {
                                    artWhere.articleType = {
                                        inq: $stateParams.f
                                    }
                                }

                                return {
                                    artParams: {
                                        page: parseInt($stateParams.p) || 1,
                                        perpage: 12,
                                        total: 0,
                                        where: artWhere,
                                        order: 'createdDate DESC',
                                        fields: {
                                            content: false
                                        },
                                        include: [
                                          {
                                            relation: "author",
                                            scope: {
                                              fields: [
                                                'id',
                                                'username'
                                              ]
                                            }
                                          },
                                          {
                                            relation: "slugs"
                                          }
                                        ]
                                    },
                                    search: $stateParams.s || '',
                                    filters: $stateParams.f || [],
                                };
                            }],
                            articles: ['paginationParams', 'Article', 'Util', function (paginationParams, Article, Util) {
                                return Article.find({
                                    filter: {
                                        where: paginationParams.artParams.where,
                                        fields: paginationParams.artParams.fields,
                                        include: paginationParams.artParams.include,
                                        order: paginationParams.artParams.order,
                                        skip: ((paginationParams.artParams.page * paginationParams.artParams.perpage) - paginationParams.artParams.perpage),
                                        limit: paginationParams.artParams.perpage
                                    }
                                })
                                .$promise
                                .then(function (articles) {
                                    _.each(articles, function (article) {
                                        article.slug = Util.setSlug(article);
                                    });

                                    return articles;
                                });

                            }],
                            articlesTotal: ['paginationParams', 'StateParamHelper', 'Article', function (paginationParams, StateParamHelper, Article) {
                                return Article.count({
                                    where: paginationParams.artParams.where
                                })
                                .$promise
                                .then(function (artCount) {
                                    StateParamHelper.validatePage(paginationParams.artParams.page, artCount.count, paginationParams.artParams.perpage);

                                    paginationParams.artParams.total = artCount.count;
                                    return artCount.count;
                                });
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
                            userRoles: ['User', function(User) {
                                if (!User.isAuthenticated()) {
                                    return false;
                                } else {
                                    return User.isInRoles({
                                        uid: User.getCurrentId(),
                                        roleNames: ['$admin', '$contentProvider', '$premium']
                                    })
                                    .$promise
                                    .then(function (userRoles) {
                                        return userRoles;
                                    })
                                    .catch(function (roleErr) {
                                        console.log('roleErr: ', roleErr);
                                    });
                                }
                            }],
                            article: ['$state', '$stateParams', 'Util', 'Article', function ($state, $stateParams, Util, Article) {
                                var slug = $stateParams.slug;
                                console.log("looking for slug:", slug);


                                return Article.findOne({
                                    filter: {
                                        where: {
                                            slug: slug
                                        },
                                        include: [
                                           {
                                               relation: "author",
                                               scope: {
                                                   fields: [
                                                       "username",
                                                       "about",
                                                       "providerDescription",
                                                       "social",
                                                       "email"
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
                                               relation: 'votes',
                                               scope: {
                                                   fields: {
                                                       id: true,
                                                       direction: true,
                                                       authorId: true
                                                   }
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
                                           },
                                            {
                                                relation: "deck",
                                                scope: {
                                                    fields: {
                                                        id: true,
                                                        playerClass: true,
                                                        heroName: true,
                                                        dust: true,
                                                        gameModeType: true,
                                                        name: true
                                                    },
                                                    include: {
                                                        relation: 'cards',
                                                        scope: {
                                                            include: {
                                                                relation: 'card',
                                                                scope: {
                                                                    fields: [
                                                                        'id',
                                                                        'name',
                                                                        'cost',
                                                                        'photoNames'
                                                                    ]
                                                                }
                                                            }
                                                        }
                                                    }
                                                }
                                            }
                                        ]
                                    }
                                })
                                .$promise
                                .then(function (data) {
                                    console.log('data:', data);
                                    // create slug as it was moved from model
                                    data.slug = {
                                        url: slug
                                    };
                                    
                                    // tally votescore
                                    data.voteScore = Util.tally(data.votes, 'direction');
                                    
                                    return data;
                                })
                                .catch(function (err) {
                                    console.log('err:', err);
                                    if (err.status === 404) {
                                        return throw404($state);
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
                url: '?k',
                views: {
                    hs: {
                        templateUrl: tpl + 'views/frontend/hs.home.html',
                        controller: 'HearthstoneHomeCtrl',
                        resolve: {
                            filterParams: ['$stateParams', 'StateParamHelper', 'Hearthstone', function($stateParams, StateParamHelper, Hearthstone) {
                                var classFilters = angular.copy(Hearthstone.classes).splice(1, 9);

                                // if only 1 filter, parse into array
                                if (angular.isString($stateParams.k) && $stateParams.k.length) {
                                    var tmp = $stateParams.k;
                                    $stateParams.k = [];
                                    $stateParams.k.push(tmp);
                                }

                                var artWhere = {
                                  isActive: true,
                                  articleType: ['hs']
                                },
                                tsDeckWhere = {
                                    isFeatured: true
                                },
                                comDeckWhere = {
                                  isPublic: true,
                                  isFeatured: false
                                };

                                // validate klass filters
                                StateParamHelper.validateFilters($stateParams.k, classFilters);

                                if (!_.isEmpty($stateParams.k)) {

                                    artWhere.classTags = {
                                        inq: $stateParams.k
                                    };

                                    tsDeckWhere.playerClass = {
                                        inq: $stateParams.k
                                    };

                                    comDeckWhere.playerClass = {
                                        inq: $stateParams.k
                                    };
                                }
                                return {
                                    articleParams: {
                                        options: {
                                            filter: {
                                                limit: 6,
                                                order: "createdDate DESC",
                                                where: artWhere,
                                                fields: {
                                                    id: true,
                                                    articleType: true,
                                                    authorId: true,
                                                    createdDate: true,
                                                    description: true,
                                                    photoNames: true,
                                                    slug: true,
                                                    themeName: true,
                                                    title: true,
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
                                                        relation: "slugs"
                                                    }
                                                ]
                                            }
                                        }
                                    },
                                    tsDeckParams: {
                                        options: {
                                            filter: {
                                              limit: 10,
                                              order: "createdDate DESC",
                                              where: tsDeckWhere,
                                              fields: [
                                                  'id',
                                                  'name',
                                                  'playerClass',
                                                  'heroName',
                                                  'premium',
                                                  'authorId',
                                                  'createdDate'
                                              ],
                                              include: [
                                                  {
                                                      relation: 'slugs',
                                                  },
                                                  {
                                                      relation: "author",
                                                      scope: {
                                                          fields: ['username']
                                                      }
                                                  },
                                                  {
                                                      relation: "votes",
                                                      scope: {
                                                          fields: ['authorId', 'direction']
                                                      }
                                                  }
                                              ]
                                            }
                                        }
                                    },
                                    comDeckParams: {
                                        options: {
                                            filter: {
                                              limit: 10,
                                              order: "createdDate DESC",
                                              where: comDeckWhere,
                                              fields: {
                                                id: true,
                                                name: true,
                                                playerClass: true,
                                                heroName: true,
                                                premium: true,
                                                authorId: true,
                                                slug: true,
                                                createdDate: true
                                              },
                                              include: [
                                                  {
                                                      relation: "slugs",
                                                  },
                                                  {
                                                      relation: "author",
                                                      scope: {
                                                          fields: ['username']
                                                      }
                                                  },
                                                  {
                                                      relation: "votes",
                                                      scope: {
                                                          fields: ['direction']
                                                      }
                                                  }
                                              ]
                                            }
                                        }
                                    }
                                };
                            }],
                            dataArticles: ['Article', 'filterParams', 'Util', function (Article, filterParams, Util) {
                                return Article.find(filterParams.articleParams.options)
                                .$promise
                                .then(function (articles) {
                                    _.each(articles, function (article) {
                                        article.slug = Util.setSlug(article);
                                    })

                                    return articles;
                                });
                            }],
                            dataDecksTempostorm: ['Deck', 'filterParams', 'Util', function (Deck, filterParams, Util) {
//                                console.log('filterParams.tsDeckParams', filterParams.tsDeckParams);
                                return Deck.find(filterParams.tsDeckParams.options)
                                .$promise
                                .then(function (tempoDecks) {
                                    _.each(tempoDecks, function(tempoDeck) {
                                        tempoDeck.voteScore = Util.tally(tempoDeck.votes, 'direction');
                                        tempoDeck.slug = Util.setSlug(tempoDeck);
                                    });

                                    return tempoDecks;
                                });
                            }],
                            dataDecksCommunity: ['Deck', 'filterParams', 'Util', function (Deck, filterParams, Util) {
                                return Deck.find(filterParams.comDeckParams.options)
                                .$promise
                                .then(function (comDecks) {
                                    _.each(comDecks, function(comDeck) {
                                        comDeck.voteScore = Util.tally(comDeck.votes, 'direction');
                                        comDeck.slug = Util.setSlug(comDeck);
                                    });
                                    return comDecks;
                                });
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
                url: '?tsp&comp&k&s',
                views: {
                    decks: {
                        templateUrl: tpl + 'views/frontend/hs.decks.list.html',
                        controller: 'DecksCtrl',
                        resolve: {
                            paginationParams: ['$stateParams', 'Hearthstone', 'StateParamHelper', function($stateParams, Hearthstone, StateParamHelper) {
                                var classFilters = angular.copy(Hearthstone.classes).splice(1, 9);

                                // if only 1 filter, parse into array
                                if (angular.isString($stateParams.k)) {
                                    var tmp = $stateParams.k;
                                    $stateParams.k = [];
                                    $stateParams.k.push(tmp);
                                }

                                // validate filters
                                StateParamHelper.validateFilters($stateParams.k, classFilters);

                                StateParamHelper.validatePage($stateParams.tsp);
                                StateParamHelper.validatePage($stateParams.comp);

                                var pattern = '/.*'+$stateParams.s+'.*/i',
                                tsWhere = {
                                    isFeatured: true
                                },
                                comWhere = {
                                    isFeatured: false,
                                    isPublic: true
                                };

                                if (!_.isEmpty($stateParams.s)) {
                                    tsWhere.or = [
                                        { name: { regexp: pattern } },
                                        { description: { regexp: pattern } },
                                        { deckType: { regexp: pattern } }
                                    ];

                                    comWhere.or = [
                                        { name: { regexp: pattern } },
                                        { description: { regexp: pattern } },
                                        { deckType: { regexp: pattern } }
                                    ];
                                }

                                if ($stateParams.k) {
                                    tsWhere.playerClass = {
                                        inq: $stateParams.k
                                    }

                                    comWhere.playerClass = {
                                        inq: $stateParams.k
                                    }
                                }

                                return {
                                    tsParams: {
                                        page: parseInt($stateParams.tsp) || 1,
                                        perpage: 4,
                                        total: 0,
                                        where: tsWhere,
                                        order: 'createdDate DESC',
                                        fields: {
                                            id: true,
                                            name: true,
                                            slug: true,
                                            heroName: true,
                                            authorId: true,
                                            playerClass: true,
                                            createdDate: true,
                                            premium: true,
                                        },
                                        include: [
                                            {
                                                relation: "author",
                                                scope: {
                                                    fields: [
                                                        'id',
                                                        'username'
                                                    ]
                                                }
                                            },
                                            {
                                                relation: "votes",
                                                scope: {
                                                    fields: ['direction']
                                                }
                                            },
                                            {
                                                relation: "slugs"
                                            }
                                        ]
                                    },
                                    comParams: {
                                        page: parseInt($stateParams.comp) || 1,
                                        perpage: 12,
                                        total: 0,
                                        where: comWhere,
                                        order: 'createdDate DESC',
                                        fields: {
                                            id: true,
                                            name: true,
                                            slug: true,
                                            heroName: true,
                                            authorId: true,
                                            playerClass: true,
                                            dust: true,
                                            createdDate: true,
                                            premium: true
                                        },
                                        include: [
                                            {
                                                relation: "author",
                                                scope: {
                                                    fields: [
                                                        'id',
                                                        'username'
                                                    ]
                                                }
                                            },
                                            {
                                                relation: "votes",
                                                scope: {
                                                    fields: ['id', 'direction', 'authorId']
                                                }
                                            },
                                            {
                                                relation: "slugs"
                                            }
                                        ]
                                    },
                                    search: $stateParams.s || '',
                                    klasses: $stateParams.k || [],
                                };
                            }],
                            tempostormDecks: ['paginationParams', 'Deck', 'Util', function (paginationParams, Deck, Util) {
                                return Deck.find({
                                    filter: {
                                        where: paginationParams.tsParams.where,
                                        fields: paginationParams.tsParams.fields,
                                        include: paginationParams.tsParams.include,
                                        order: paginationParams.tsParams.order,
                                        skip: (paginationParams.tsParams.page * paginationParams.tsParams.perpage) - paginationParams.tsParams.perpage,
                                        limit: paginationParams.tsParams.perpage
                                    }
                                })
                                .$promise
                                .then(function (data) {
                                    _.each(data, function (deck) {
                                        deck.voteScore = Util.tally(deck.votes, 'direction');
                                        deck.slug = Util.setSlug(deck);
                                    });

                                    return data;
                                });

                            }],
                            tempostormCount: ['paginationParams', '$state', 'StateParamHelper', 'Deck', function (paginationParams, $state, StateParamHelper,  Deck) {
                                return Deck.count({
                                    where: paginationParams.tsParams.where
                                })
                                .$promise
                                .then(function (tsCount) {

                                    StateParamHelper.validatePage(paginationParams.tsParams.page, tsCount.count, paginationParams.tsParams.perpage);

                                    paginationParams.tsParams.total = tsCount.count;

                                    return tsCount.count;
                                });

                            }],
                            communityDecks: ['paginationParams', 'Deck', 'Util', function (paginationParams, Deck, Util) {
                                return Deck.find({
                                    filter: {
                                        where: paginationParams.comParams.where,
                                        fields: paginationParams.comParams.fields,
                                        include: paginationParams.comParams.include,
                                        order: paginationParams.comParams.order,
                                        skip: (paginationParams.comParams.page * paginationParams.comParams.perpage) - paginationParams.comParams.perpage,
                                        limit: paginationParams.comParams.perpage
                                    }
                                })
                                .$promise
                                .then(function (data) {
                                    _.each(data, function (deck) {
                                        deck.voteScore = Util.tally(deck.votes, 'direction');
                                        deck.slug = Util.setSlug(deck);
                                    });

                                    return data;
                                });
                            }],
                            communityCount: ['paginationParams', 'StateParamHelper', 'Deck', function (paginationParams, StateParamHelper, Deck) {
                                return Deck.count({
                                    where: paginationParams.comParams.where,
                                })
                                .$promise
                                .then(function (comCount) {

                                    StateParamHelper.validatePage(paginationParams.comParams.page, comCount.count, paginationParams.comParams.perpage)

                                    paginationParams.comParams.total = comCount.count;
                                    return comCount.count;
                                });
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
                            userRoles: ['User', function(User) {
                                if (!User.isAuthenticated()) {
                                    return false;
                                } else {
                                    return User.isInRoles({
                                        uid: User.getCurrentId(),
                                        roleNames: ['$admin', '$contentProvider', '$premium']
                                    })
                                    .$promise
                                    .then(function (userRoles) {
                                        return userRoles;
                                    })
                                    .catch(function (roleErr) {
                                        console.log('roleErr: ', roleErr);
                                    });
                                }
                            }],
                            deck: ['$stateParams', '$state', 'Deck', 'Util', function ($stateParams, $state, Deck, Util) {
                                var slug = $stateParams.slug;
                                
                                return Deck.findOne({
                                    filter: {
                                        where: {
                                            slug: slug,
                                        },
                                        fields: [
                                            'id',
                                            'createdDate',
                                            'name',
                                            'description',
                                            'playerClass',
                                            'premium',
                                            'dust',
                                            'heroName',
                                            'authorId',
                                            'deckType',
                                            'isPublic',
                                            'chapters',
                                            'youtubeId',
                                            'gameModeType',
                                            'isActive',
                                            'isCommentable'
                                        ],
                                        include: [
                                            {
                                                relation: 'cards',
                                                scope: {
                                                    include: 'card',
                                                    scope: {
                                                        fields: [
                                                            'id',
                                                            'name',
                                                            'cardType',
                                                            'cost',
                                                            'dust',
                                                            'photoNames'
                                                        ]
                                                    }
                                                }
                                            },
                                            {
                                                relation: 'comments',
                                                scope: {
                                                    fields: [
                                                        'id',
                                                        'votes',
                                                        'authorId',
                                                        'createdDate'
                                                    ],
                                                    include: {
                                                        relation: 'author',
                                                        scope: {
                                                            fields: [
                                                                'id',
                                                                'username'
                                                            ]
                                                        }
                                                    }
                                                }
                                            },
                                            {
                                                relation: 'author',
                                                scope: {
                                                    fields: [
                                                        'id',
                                                        'username'
                                                    ]
                                                }
                                            },
                                            {
                                                relation: 'matchups',
                                                scope: {
                                                    fields: [
                                                        'forChance',
                                                        'deckName',
                                                        'className'
                                                    ]
                                                }
                                            },
                                            {
                                                relation: 'votes',
                                                fields: [
                                                    'id',
                                                    'direction',
                                                    'authorId'
                                                ]
                                            }
                                        ]
                                    }
                                })
                                .$promise
                                .then(function (data) {
                                    data.voteScore = Util.tally(data.votes, 'direction');

                                    return data;
                                })
                                .catch(function (err) {
                                    console.log("err: ", err);
                                    if (err.status === 404) {
                                        return throw404($state);
                                    }
                                });

                            }],
                            deckWithMulligans: ['Mulligan', 'deck', function(Mulligan, deck) {
                                var deckID = deck.id;

                                return Mulligan.find({
                                    filter: {
                                        where: {
                                            deckId: deckID
                                        },
                                        include: [
                                            {
                                                relation: 'mulligansWithCoin',
                                                scope: {
                                                    include: {
                                                        relation: 'card',
                                                        scope: {
                                                            fields: ['id', 'name', 'cardType', 'cost', 'photoNames']
                                                        }
                                                    }
                                                }
                                            },
                                            {
                                                relation: 'mulligansWithoutCoin',
                                                scope: {
                                                    include: {
                                                        relation: 'card',
                                                        scope: {
                                                            fields: ['id', 'name', 'cardType', 'cost', 'photoNames']
                                                        }
                                                    }
                                                }
                                            }
                                        ]
                                    }
                                })
                                .$promise
                                .then(function (mulligans) {
//                                    console.log('mullies: ', mulligans);
                                    deck.mulligans = mulligans;
                                    return deck;
                                })
                                .catch(function (err) {
                                    if (err) console.log('err: ', err);
                                });
                            }],
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
                            userRoles: ['User', function(User) {
                                if (!User.isAuthenticated()) {
                                    return false;
                                } else {
                                    return User.isInRoles({
                                        uid: User.getCurrentId(),
                                        roleNames: ['$admin', '$contentProvider']
                                    })
                                    .$promise
                                    .then(function (userRoles) {
                                        return userRoles;
                                    })
                                    .catch(function (roleErr) {
                                        console.log('roleErr: ', roleErr);
                                    });
                                }
                            }],
                            classCardsList: ['$stateParams', 'Card', function ($stateParams, Card) {
                                var perpage = 15,
                                    playerClass = $stateParams.playerClass;

                                return Card.find({
                                    filter: {
                                        fields: {
                                            artist: false,
                                            attack: false,
                                            durability: false,
                                            expansion: false,
                                            flavor: false,
                                            health: false,
                                            isActive: false,
                                            race: false,
                                            text: false,
                                            deckable: false
                                        },
                                        where: {
                                            playerClass: playerClass.slice(0,1).toUpperCase() + playerClass.substr(1),
                                            deckable: true
                                        },
                                        order: ["cost ASC", "name ASC"],
                                        limit: perpage,
                                    }
                                })
                                .$promise;
                            }],

                            neutralCardsList: ['Card', function (Card) {
                                return Card.find({
                                    filter: {
                                        fields: {
                                            artist: false,
                                            attack: false,
                                            durability: false,
                                            expansion: false,
                                            flavor: false,
                                            health: false,
                                            isActive: false,
                                            race: false,
                                            text: false,
                                            deckable: false
                                        },
                                        where: {
                                            playerClass: 'Neutral',
                                            deckable: true
                                        },
                                        order: ["cost ASC", "name ASC"],
                                        limit: 15
                                    }
                                })
                                .$promise;
                            }],

                            classCardsCount: ['$stateParams', 'Card', function ($stateParams, Card) {
                                var playerClass = $stateParams.playerClass;

                                return Card.count({
                                    where: {
                                        playerClass: playerClass.slice(0,1).toUpperCase() + playerClass.substr(1),
                                        deckable: true
                                    }
                                })
                                .$promise;
                            }],

                            neutralCardsCount: ['Card', function (Card) {
                                return Card.count({
                                    where: {
                                        playerClass: 'Neutral',
                                        deckable: true
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
                            userRoles: ['User', function(User) {
                                if (!User.isAuthenticated()) {
                                    return false;
                                } else {
                                    return User.isInRoles({
                                        uid: User.getCurrentId(),
                                        roleNames: ['$admin', '$contentProvider']
                                    })
                                    .$promise
                                    .then(function (userRoles) {
                                        return userRoles;
                                    })
                                    .catch(function (roleErr) {
                                        console.log('roleErr: ', roleErr);
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
                                            isPublic: true,
                                            chapters: true,
                                            youtubeId: true,
                                            gameModeType: true,
                                            isActive: true,
                                            isCommentable: true
                                        },
                                        include: [
                                            {
                                                relation: "cards",
                                                scope: {
                                                    include: [
                                                        {
                                                            relation: 'card',
                                                            scope: {
                                                                fields: ['id', 'cardType', 'cost', 'dust', 'mechanics', 'name', 'photoNames', 'playerClass', 'rarity']
                                                            }
                                                        }
                                                    ]
                                                }
                                            },
                                            {
                                                relation: 'author',
                                                scope: {
                                                    fields: ['id', 'username']
                                                }
                                            },
                                            {
                                                relation: 'matchups'
                                            }
                                        ]
                                    }
                                })
                                .$promise
                                .then(function (deck) {
                                    return deck;
                                });

                            }],

                            deck: ['Mulligan', 'deckNoMulligans', function(Mulligan, deckNoMulligans) {
                                var deckID = deckNoMulligans.id;

                                return Mulligan.find({
                                    filter: {
                                        where: {
                                            deckId: deckID
                                        },
                                        include: [
                                            {
                                                relation: 'mulligansWithCoin',
                                            },
                                            {
                                                relation: 'mulligansWithoutCoin',
                                            }
                                        ]
                                    }
                                })
                                .$promise
                                .then(function (mulligans) {
                                    deckNoMulligans.mulligans = mulligans;
                                    return deckNoMulligans;
                                })
                                .catch(function (err) {
                                    if (err) console.log('err: ', err);
                                });
                            }],

                              deckCardMulligans: ['deck', 'Card', '$q',  function(deck, Card, $q) {
                                var d = $q.defer();
                                async.each(deck.mulligans, function(mulligan, mulliganCB) {

                                  var mulliganIndex = deck.mulligans.indexOf(mulligan);

                                  async.each(mulligan.mulligansWithoutCoin, function(cardWithoutCoin, cardWithoutCoinCB) {
                                    Card.findById({
                                      id: cardWithoutCoin.cardId,
                                      filter: {
                                          fields: {
                                              id: true,
                                              photoNames: true,
                                              name: true
                                          }
                                      }
                                    }).$promise
                                    .then(function (cardFound) {
                                      var cardIndex = mulligan.mulligansWithoutCoin.indexOf(cardWithoutCoin);
                                      deck.mulligans[mulliganIndex].mulligansWithoutCoin[cardIndex] = cardFound;
                                      return cardWithoutCoinCB();
                                    })
                                    .catch(function (err) {
                                      return cardWithoutCoinCB(err);
                                    });

                                  });

                                  async.each(mulligan.mulligansWithCoin, function(cardWithCoin, cardWithCoinCB) {

                                    Card.findById({
                                      id: cardWithCoin.cardId,
                                      filter: {
                                          fields: {
                                              id: true,
                                              photoNames: true,
                                              name: true
                                          }
                                      }
                                    }).$promise
                                    .then(function (cardFound) {
                                      var cardIndex = mulligan.mulligansWithCoin.indexOf(cardWithCoin);
                                      deck.mulligans[mulliganIndex].mulligansWithCoin[cardIndex] = cardFound;
                                      return cardWithCoinCB();
                                    })
                                    .catch(function (err) {
                                      return cardWithCoinCB(err);
                                    });

                                  });

                                  mulliganCB();

                                }, function(err) {
                                  if (err) return d.resolve(err);
                                  d.resolve(deck);
                                });
                                return d.promise;
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
                                        order: ['cost ASC', 'name ASC'],
                                        limit: perpage
                                    }
                                }).$promise;
                            }],

                            classCardsCount: ['$stateParams', 'deckNoMulligans', 'Card', function ($stateParams, deckNoMulligans, Card) {
                                var deckID = $stateParams.deckID;
                                return Card.count({
                                    where: {
                                        playerClass: deckNoMulligans.playerClass,
                                        deckable: true
                                    }
                                }).$promise;
                            }],

                            neutralCardsCount: ['Card', function (Card) {
                                return Card.count({
                                    where: {
                                        playerClass: 'Neutral',
                                        deckable: true
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
                                        order: ["cost ASC", "name ASC"],
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
                                order: "createdDate DESC",
                                where: { isActive: true }
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
                        controller: 'HearthstoneSnapshotCtrl',
                        resolve: {
                            dataSnapshot: ['$stateParams', '$state', 'Snapshot', 'Util', function ($stateParams, $state, Snapshot, Util) {
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
                                            createdDate: true,
                                            isCommentable: true
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
                                                                    username: true,
                                                                    email: true
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
                                            },
                                            {
                                                relation: 'votes',
                                                scope: {
                                                    fields: {
                                                        id: true,
                                                        direction: true,
                                                        authorId: true
                                                    }
                                                }
                                            }
                                        ]
                                    }
                                }).$promise
                                .then(function (snapshot) {
                                    snapshot.voteScore = Util.tally(snapshot.votes, 'direction');
                                    return snapshot;
                                })
                                .catch(function (err) {
                                    if (err.status === 404) {
                                        return throw404($state);
                                    }
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
                url: '?r&u&h&m&s',
                views: {
                    hots: {
                        templateUrl: tpl + 'views/frontend/hots.home.html',
                        controller: 'HOTSHomeCtrl',
                        resolve: {
                            filterParams: ['$stateParams', 'StateParamHelper', '$q', 'Hero', 'Map', 'HOTS', function($stateParams, StateParamHelper, $q, Hero, Map, HOTS) {
                                if (angular.isString($stateParams.r) && !_.isEmpty($stateParams.r)) {
                                    $stateParams.r = new Array($stateParams.r);
                                }

                                if (angular.isString($stateParams.u) && !_.isEmpty($stateParams.u)) {
                                    $stateParams.u = new Array($stateParams.u);
                                }

                                if (angular.isString($stateParams.h) && !_.isEmpty($stateParams.h)) {
                                    $stateParams.h = new Array($stateParams.h);
                                }

                                // normalizing all params to arrays incase we want to allow people to select multiple
                                // maps/heroes down the road
                                if (angular.isString($stateParams.m) && !_.isEmpty($stateParams.m)) {
                                    $stateParams.m = new Array($stateParams.m);
                                }

                                var filters = {
                                    roles: $stateParams.r ? $stateParams.r : [],
                                    universes: $stateParams.u ? $stateParams.u : [],
                                    search: $stateParams.s ? $stateParams.s : '',
                                    heroes: $stateParams.h ? $stateParams.h : [],
                                    map: $stateParams.m || undefined
                                };

                                var possibleRoles = HOTS.roles;
                                var possibleUniverses = HOTS.universes;
                                var possibleHeroes;
                                var possibleMaps;

                                if (!_.isEmpty(filters.roles)) {
                                    StateParamHelper.validateFilters(filters.roles, possibleRoles);
                                }
                                if (!_.isEmpty(filters.universes)) {
                                    StateParamHelper.validateFilters(filters.universes, possibleUniverses);
                                }

                                var d = $q.defer();

                                async.waterfall([
                                    function (waterCB) {
                                        if (!_.isEmpty(filters.heroes)) {
                                            Hero.find({
                                                filter: {
                                                    fields: {
                                                        name: true
                                                    },
                                                    where: {
                                                        isActive: true
                                                    }
                                                }
                                            }).$promise
                                            .then(function (heros) {
                                                possibleHeroes = _.map(heros, function (hero) {
                                                    return hero.name;
                                                });
                                                StateParamHelper.validateFilters(filters.heroes, possibleHeroes);
                                                return waterCB();
                                            });
                                        } else {
                                            return waterCB();
                                        }
                                    },
                                    function (waterCB) {
                                        if (!_.isEmpty(filters.heroes)) {
                                            Hero.find({
                                                filter: {
                                                    where: {
                                                        name: {
                                                            inq: filters.heroes
                                                        }
                                                    }
                                                }
                                            }).$promise
                                            .then(function (heroes) {
                                                var heroArr = new Array(heroes[0]);
                                                filters.heroes = heroArr;
                                                return waterCB();
                                            })
                                            .catch(function (err) {
                                                return waterCB(err);
                                            });
                                        } else {
                                            return waterCB();
                                        }
                                    },
                                    function (waterCB) {
                                        if (filters.map) {
                                            Map.find({
                                                filter: {
                                                    fields: {
                                                        name: true
                                                    }
                                                }
                                            })
                                            .$promise
                                            .then(function (maps) {

                                                possibleMaps = _.map(maps, function(currentMap) {
                                                    return currentMap.name;
                                                });
                                                StateParamHelper.validateFilters(filters.map, possibleMaps);
                                                return waterCB();
                                            })
                                            .catch(function (err) {
                                                return waterCB(err);
                                            });
                                        } else {
                                            return waterCB();
                                        }
                                    },
                                    function (waterCB) {
                                        if (filters.map) {
                                            Map.findOne({
                                                filter: {
                                                    where: {
                                                        name: {
                                                            inq: filters.map
                                                        }
                                                    }
                                                }
                                            }).$promise
                                            .then(function (map) {
                                                filters.map = map;
                                                return waterCB();
                                            })
                                            .catch(function (err) {
                                                return waterCB(err);
                                            });
                                        } else {
                                            return waterCB();
                                        }
                                    },
                                ], function(err) {
                                    if (err) return d.reject(err);
                                    d.resolve(filters);
                                });

                                return d.promise;

                            }],
                            dataArticles: ['filterParams', '$q', 'HOTSGuideQueryService', function (filterParams, $q, HOTSGuideQueryService) {

                                var d = $q.defer();
                                // querying articles with empty obj due to promise not resolving
                                // if filterParams contains any roles/universes
                                if (!_.isEmpty(filterParams.heroes) && filterParams.map != undefined) {
                                    HOTSGuideQueryService.getArticles(filterParams, true, 6, function(err, articles) {
                                        if (err) return d.reject(err);
                                        d.resolve(articles);
                                    });
                                } else if (!_.isEmpty(filterParams.heroes) && filterParams.map == undefined) {
                                    HOTSGuideQueryService.getArticles(filterParams, true, 6, function(err, articles) {
                                        if (err) return d.reject(err);
                                        d.resolve(articles);
                                    });
                                } else if (filterParams.search != '') {
                                    HOTSGuideQueryService.getArticles(filterParams, true, 6, function(err, articles) {
                                        if (err) return d.reject(err);
                                        d.resolve(articles);
                                    });
                                } else if (_.isEmpty(filterParams.hero) && filterParams.map != undefined) {
                                    HOTSGuideQueryService.getArticles(filterParams, true, 6, function(err, articles) {
                                        if (err) return d.reject(err);
                                        d.resolve(articles);
                                    });
                                } else {
                                    HOTSGuideQueryService.getArticles(filterParams, true, 6, function(err, articles) {
                                        if (err) return d.reject(err);
                                        d.resolve(articles);
                                    });
                                }

                                return d.promise;

                            }],
                            dataGuidesCommunity: ['filterParams', '$q', 'HOTSGuideQueryService', function (filterParams, $q, HOTSGuideQueryService) {
                                var d = $q.defer();

                                if (!_.isEmpty(filterParams.heroes) && filterParams.map != undefined) {
                                    HOTSGuideQueryService.getHeroMapGuides(filterParams, false, 10, 1, function(err, guides) {
                                        if (err) return d.reject(err);
                                        d.resolve(guides);
                                    });
                                } else if (!_.isEmpty(filterParams.heroes) && filterParams.map == undefined) {
                                    HOTSGuideQueryService.getHeroGuides(filterParams, false, 10, 1, function (err, guides) {
                                        if (err) return d.reject(err);
                                        d.resolve(guides);
                                    });
                                } else if (filterParams.search != '') {
                                    HOTSGuideQueryService.getGuides(filterParams, false, filterParams.search, 10, 1, function(err, guides) {
                                        if (err) return d.reject(err);
                                        d.resolve(guides);
                                    });
                                } else if (_.isEmpty(filterParams.hero) && filterParams.map != undefined) {
                                    HOTSGuideQueryService.getMapGuides(filterParams, false, filterParams.search, 10, 1, function(err, guides) {
                                        if (err) return d.reject(err);
                                        d.resolve(guides);
                                    });
                                } else {
                                   HOTSGuideQueryService.getGuides(filterParams, false, filterParams.search, 10, 1, function(err, guides) {
                                       if (err) return d.reject(err);
                                        d.resolve(guides);
                                    });
                                }

                                return d.promise;
                            }],
                            dataGuidesFeatured: ['filterParams', '$q', 'HOTSGuideQueryService', function (filterParams, $q, HOTSGuideQueryService) {
                                var d = $q.defer();

                                if (!_.isEmpty(filterParams.heroes) && filterParams.map != undefined) {
                                    HOTSGuideQueryService.getHeroMapGuides(filterParams, true, 10, 1, function(err, guides) {
                                        if (err) return d.reject(err);
                                        d.resolve(guides);
                                    });
                                } else if (!_.isEmpty(filterParams.heroes) && filterParams.map == undefined) {
                                    HOTSGuideQueryService.getHeroGuides(filterParams, true, 10, 1, function (err, guides) {
                                        if (err) return d.reject(err);
                                        d.resolve(guides);
                                    });
                                } else if (filterParams.search != '') {
                                    HOTSGuideQueryService.getGuides(filterParams, true, filterParams.search, 10, 1, function(err, guides) {
                                        if (err) return d.reject(err);
                                        d.resolve(guides);
                                    });
                                } else if (_.isEmpty(filterParams.hero) && filterParams.map != undefined) {
                                    HOTSGuideQueryService.getMapGuides(filterParams, true, filterParams.search, 10, 1, function(err, guides) {
                                        if (err) return d.reject(err);
                                        d.resolve(guides);
                                    });
                                } else {
                                   HOTSGuideQueryService.getGuides(filterParams, true, filterParams.search, 10, 1, function(err, guides) {
                                       if (err) return d.reject(err);
                                        d.resolve(guides);
                                    });
                                }

                                return d.promise;
                            }],
                            dataHeroes: ['Hero', function (Hero) {
                              return Hero.find({
                                filter: {
                                    where: {
                                        isActive: true
                                    },
                                    order: "name ASC",
                                    fields: {
                                    isActive: true,
//                                    characters: true,
                                    className: true,
                                    name: true,
                                    title: true,
                                    orderNum: true,
                                    role: true,
                                    universe: true,
                                    id: true
                                  }
                                }
                              })
                              .$promise
                              .then(function (data) {
                                  return data;
                              })
                              .catch(function (err) {
                                  console.log(err);
                              });
                            }],

                            dataMaps: ['Map', function (Map) {
                              return Map.find({})
                              .$promise
                              .then(function (data) {
                                  return data;
                              })
                              .catch(function (err) {
                                  console.log(err);
                              });
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
                url: '?tsp&comp&r&h&u&m&s',
                views: {
                    guides: {
                        templateUrl: tpl + 'views/frontend/hots.guides.list.html',
                        controller: 'HOTSGuidesListCtrl',
                        resolve: {
                            paginationFilters: ['$stateParams', 'StateParamHelper', '$q', 'Hero', 'Map', 'HOTS', function($stateParams, StateParamHelper, $q, Hero, Map, HOTS) {
                                if (angular.isString($stateParams.r) && !_.isEmpty($stateParams.r)) {
                                    $stateParams.r = new Array($stateParams.r);
                                }

                                if (angular.isString($stateParams.u) && !_.isEmpty($stateParams.u)) {
                                    $stateParams.u = new Array($stateParams.u);
                                }

                                if (angular.isString($stateParams.h) && !_.isEmpty($stateParams.h)) {
                                    $stateParams.h = new Array($stateParams.h);
                                }

                                if (angular.isString($stateParams.m) && !_.isEmpty($stateParams.m)) {
                                    $stateParams.m = new Array($stateParams.m);
                                }

                                var filters = {
                                    roles: $stateParams.r ? $stateParams.r : [],
                                    universes: $stateParams.u ? $stateParams.u : [],
                                    search: $stateParams.s ? $stateParams.s : '',
                                    heroes: $stateParams.h ? $stateParams.h : [],
                                    map: $stateParams.m || undefined
                                };

                                var possibleRoles = HOTS.roles;
                                var possibleUniverses = HOTS.universes;
                                var possibleHeroes;
                                var possibleMaps;

                                StateParamHelper.validateFilters(filters.roles, possibleRoles);
                                StateParamHelper.validateFilters(filters.universes, possibleUniverses);

                                StateParamHelper.validatePage($stateParams.tsp); StateParamHelper.validatePage($stateParams.comp);

                                var d = $q.defer();

                                async.waterfall([
                                    function (waterCB) {
                                        if (!_.isEmpty(filters.heroes)) {
                                            Hero.find({
                                                filter: {
                                                    fields: {
                                                        name: true
                                                    },
                                                    where: {
                                                        isActive: true
                                                    }
                                                }
                                            }).$promise
                                            .then(function (heros) {

                                                possibleHeroes = _.map(heros, function (hero) {
                                                    return hero.name;
                                                });
                                                StateParamHelper.validateFilters(filters.heroes, possibleHeroes);
                                                return waterCB();
                                            })
                                            .catch(function (err) {
                                                return waterCB(err);
                                            });
                                        } else {
                                            return waterCB();
                                        }
                                    },
                                    function (waterCB) {
                                        if (!_.isEmpty(filters.heroes)) {
                                            Hero.find({
                                                filter: {
                                                    where: {
                                                        name: {
                                                            inq: filters.heroes
                                                        }
                                                    }
                                                }
                                            }).$promise
                                            .then(function (heroes) {
                                                var heroArr = new Array(heroes[0]);
                                                filters.heroes = heroArr;
                                                return waterCB();
                                            })
                                            .catch(function (err) {
                                                return waterCB(err);
                                            });
                                        } else {
                                            return waterCB();
                                        }
                                    },
                                    function (waterCB) {
                                        if (filters.map) {
                                            Map.find({
                                                filter: {
                                                    fields: {
                                                        name: true
                                                    },
                                                    where: {
                                                        isActive: true
                                                    }
                                                }
                                            }).$promise
                                            .then(function (maps) {

                                                possibleMaps = _.map(maps, function (map) {
                                                    return map.name;
                                                });
                                                StateParamHelper.validateFilters(filters.map, possibleMaps);
                                                return waterCB();
                                            })
                                            .catch(function (err) {
                                                return waterCB(err);
                                            });
                                        } else {
                                            return waterCB();
                                        }
                                    },
                                    function (waterCB) {
                                        if (filters.map) {
                                            Map.findOne({
                                                filter: {
                                                    where: {
                                                        name: {
                                                            inq: filters.map
                                                        }
                                                    }
                                                }
                                            }).$promise
                                            .then(function (map) {
                                                filters.map = map;
                                                return waterCB();
                                            })
                                            .catch(function (err) {
                                                return waterCB(err);
                                            });
                                        } else {
                                            return waterCB();
                                        }
                                    },
                                ], function(err) {
                                    if (err) return console.log('pagination query err: ', err);
                                    d.resolve(filters);
                                });

                                return d.promise;
                            }],
                            paginationParams: ['$stateParams', 'paginationFilters', 'Map', function($stateParams, paginationFilters, Map) {

                                var tsWhere = {
                                    isFeatured: true
                                },
                                comWhere = {
                                    isFeatured: false,
                                    isPublic: true
                                };

                                return {
                                    guideFilters: paginationFilters,
                                    tsParams: {
                                        page: parseInt($stateParams.tsp) || 1,
                                        perpage: 4,
                                        total: 0,
                                        where: tsWhere,
                                        order: 'createdDate DESC',
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
                                            fields: {username: true}
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
                                                  fields: {name: true, className: true}
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
                                      ]
                                    },
                                    comParams: {
                                        page: parseInt($stateParams.comp) || 1,
                                        perpage: 10,
                                        order: 'createdDate DESC',
                                        fields: [
                                            "name",
                                            "authorId",
                                            "slug",
                                            "voteScore",
                                            "guideType",
                                            "premium",
                                            "id",
                                            "talentTiers",
                                            "createdDate"
                                        ],
                                        include: [
                                        {
                                          relation: 'maps'
                                        },
                                        {
                                          relation: "author",
                                          scope: {
                                            fields: {username: true}

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
                                                  fields: {name: true, className: true}
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
                                      ]
                                    }
                                };
                            }],
                            dataCommunityGuides: ['paginationParams', 'HOTSGuideQueryService', '$q', 'Guide', function (paginationParams, HOTSGuideQueryService, $q, Guide) {

                                var d = $q.defer();

                                if (!_.isEmpty(paginationParams.guideFilters.heroes) && paginationParams.guideFilters.map != undefined) {
                                    HOTSGuideQueryService.getHeroMapGuides(paginationParams.guideFilters, false, paginationParams.comParams.perpage, paginationParams.comParams.page, function(err, data, count) {
                                        if (err) {
                                            return d.reject(err);
                                        }
                                        d.resolve(data);
                                    });

                                  } else if (!_.isEmpty(paginationParams.guideFilters.heroes) && paginationParams.guideFilters.map == undefined) {
                                      HOTSGuideQueryService.getHeroGuides(paginationParams.guideFilters, false, paginationParams.comParams.perpage, paginationParams.comParams.page, function(err, data, count) {
                                        if (err) {
                                           return d.reject(err);
                                        }
                                        d.resolve(data);
                                      });

                                  } else if (_.isEmpty(paginationParams.guideFilters.hero) && paginationParams.guideFilters.map != undefined) {
                                      HOTSGuideQueryService.getMapGuides(paginationParams.guideFilters, false, paginationParams.guideFilters.search, paginationParams.comParams.perpage, paginationParams.comParams.page, function (err, data, count) {
                                          if (err) {
                                             return d.reject(err);
                                          }
                                          d.resolve(data);
                                      });
//
                                  } else {

                                      HOTSGuideQueryService.getGuides(paginationParams.guideFilters, false, paginationParams.guideFilters.search, paginationParams.comParams.perpage, paginationParams.comParams.page, function(err, data, count) {
                                          if (err) {
                                             return d.reject(err);
                                          }
                                          d.resolve(data);
                                      });
                                  }

                                return d.promise;
                            }],
                            dataTopGuide: ['$stateParams', 'Guide', 'Util', '$q', 'paginationParams', function ($stateParams, Guide, Util, $q, paginationParams) {
                                var d = $q.defer();
                                
                                if ( 
                                !_.isEmpty(paginationParams.guideFilters.heroes[0]) ||
                                !_.isEmpty(paginationParams.guideFilters.universes) ||
                                !_.isEmpty(paginationParams.guideFilters.roles) ||
                                !_.isEmpty(paginationParams.guideFilters.search)
                                ) {
                                    var filter = { filters: {} };
                                    filter.filters['heroId']       = (!_.isEmpty(paginationParams.guideFilters.heroes[0])) ? paginationParams.guideFilters.heroes[0].id : undefined;
                                    filter.filters['mapClassName'] = (!_.isUndefined(paginationParams.guideFilters.map)) ? paginationParams.guideFilters.map.className : undefined;
                                    filter.filters['universes']    = paginationParams.guideFilters.universes;
                                    filter.filters['roles']        = paginationParams.guideFilters.roles;
                                    filter.filters['search']       = paginationParams.guideFilters.search;
                                } else {
                                    var filter = {}
                                }
                                
                                async.waterfall([
                                    function (seriesCb) {
                                        Guide.topGuide(filter)
                                        .$promise
                                        .then(function (data) {
                                            return seriesCb(undefined, data);
                                        })
                                        .catch(function (err) {
                                            console.log(err);
                                        })
                                    },
                                    function (guideId, seriesCb) {
                                        Guide.find({
                                            filter: {
                                                where: {
                                                    id: guideId.id
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
                                                                    relation: 'hero',
                                                                    scope: {
                                                                        fields: ['name', 'className'],
                                                                        include: [
                                                                            {
                                                                                relation: 'talents'
                                                                            }
                                                                        ]
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
                                                    }
                                                ]
                                            }
                                        })
                                        .$promise
                                        .then(function (data) {
                                            data[0].voteScore = Util.tally(data[0].votes, 'direction');
                                            return seriesCb(undefined, data);
                                        })
                                        .catch(function (err) {
                                            return seriesCb(err);
                                        })
                                    }
                                ], function (err, guide) {
                                    if (err) return console.log(err);
                                    d.resolve(guide);
                                });

                                return d.promise;

                            }],
                            communityGuideCount: ['paginationParams', 'HOTSGuideQueryService', '$q', 'StateParamHelper', 'Guide', function(paginationParams, HOTSGuideQueryService, $q, StateParamHelper, Guide) {

                                var d = $q.defer();

                                if (!_.isEmpty(paginationParams.guideFilters.heroes) && paginationParams.guideFilters.map != undefined) {

                                    HOTSGuideQueryService.getHeroMapGuides(paginationParams.guideFilters, false, paginationParams.comParams.perpage, paginationParams.comParams.page, function(err, data, count) {
                                        if (err) {
                                            return d.reject(err);
                                        }
                                        paginationParams.comParams.total = count.count;
                                        StateParamHelper.validatePage(paginationParams.comParams.page, paginationParams.comParams.total, paginationParams.comParams.perpage);

                                        d.resolve(count);
                                    });

                                  } else if (!_.isEmpty(paginationParams.guideFilters.heroes) && paginationParams.guideFilters.map == undefined) {

                                      HOTSGuideQueryService.getHeroGuides(paginationParams.guideFilters, false, paginationParams.comParams.perpage, paginationParams.comParams.page, function(err, data, count) {
                                        if (err) {
                                            return d.reject(err);
                                        }
                                        paginationParams.comParams.total = count.count;
                                        StateParamHelper.validatePage(paginationParams.comParams.page, paginationParams.comParams.total, paginationParams.comParams.perpage);

                                        d.resolve(count);
                                      });

                                  } else if (_.isEmpty(paginationParams.guideFilters.hero) && paginationParams.guideFilters.map != undefined) {

                                      HOTSGuideQueryService.getMapGuides(paginationParams.guideFilters, false, paginationParams.guideFilters.search, paginationParams.comParams.perpage, paginationParams.comParams.page, function (err, data, count) {
                                          if (err) {
                                              return d.reject(err);
                                          }

                                          paginationParams.comParams.total = count.count;
                                          StateParamHelper.validatePage(paginationParams.comParams.page, paginationParams.comParams.total, paginationParams.comParams.perpage);

                                          d.resolve(count);
                                      });
//
                                  } else {
                                      HOTSGuideQueryService.getGuides(paginationParams.guideFilters, false,  paginationParams.guideFilters.search, paginationParams.comParams.perpage, paginationParams.comParams.page, function(err, data, count) {
                                          if (err) {
                                              return d.reject(err);
                                          }
                                          paginationParams.comParams.total = count.count;
                                          StateParamHelper.validatePage(paginationParams.comParams.page, paginationParams.comParams.total, paginationParams.comParams.perpage);

                                          d.resolve(count);
                                      });
                                  }

                                return d.promise;
                            }],
                            dataTempostormGuides: ['paginationParams', '$q', 'HOTSGuideQueryService', 'Guide', function (paginationParams, $q, HOTSGuideQueryService, Guide) {

                                var d = $q.defer();

                                if (!_.isEmpty(paginationParams.guideFilters.heroes) && paginationParams.guideFilters.map != undefined) {
                                    HOTSGuideQueryService.getHeroMapGuides(paginationParams.guideFilters, true, paginationParams.tsParams.perpage, paginationParams.tsParams.page, function(err, data, count) {
                                        if (err) {
                                            return d.reject(err);
                                        }
                                        d.resolve(data);
                                    });

                                  } else if (!_.isEmpty(paginationParams.guideFilters.heroes) && paginationParams.guideFilters.map == undefined) {

                                      HOTSGuideQueryService.getHeroGuides(paginationParams.guideFilters, true, paginationParams.tsParams.perpage, paginationParams.tsParams.page, function(err, data, count) {
                                        if (err) {
                                            return d.reject(err);
                                        }
                                        d.resolve(data);
                                      });

                                  } else if (_.isEmpty(paginationParams.guideFilters.hero) && paginationParams.guideFilters.map != undefined) {

                                      HOTSGuideQueryService.getMapGuides(paginationParams.guideFilters, true, paginationParams.guideFilters.search, paginationParams.tsParams.perpage, paginationParams.tsParams.page, function (err, data, count) {
                                          if (err) {
                                              return d.reject(err);
                                          }
                                          d.resolve(data);
                                      });
//
                                  } else {
                                      HOTSGuideQueryService.getGuides(paginationParams.guideFilters, true, paginationParams.guideFilters.search, paginationParams.tsParams.perpage, paginationParams.tsParams.page, function(err, data, count) {
                                          if (err) {
                                              return d.reject(err);
                                          }
                                          d.resolve(data);
                                      });
                                  }

                                return d.promise;
                            }],
                            tempostormGuideCount: ['paginationParams', '$q', 'HOTSGuideQueryService', 'StateParamHelper', 'Guide', function(paginationParams, $q, HOTSGuideQueryService, StateParamHelper, Guide) {

                                var d = $q.defer();

                                if (!_.isEmpty(paginationParams.guideFilters.heroes) && paginationParams.guideFilters.map != undefined) {
                                    HOTSGuideQueryService.getHeroMapGuides(paginationParams.guideFilters, true, paginationParams.tsParams.perpage, paginationParams.tsParams.page, function(err, data, count) {
                                        if (err) {
                                            return d.reject(err);
                                        }
                                        paginationParams.tsParams.total = count.count;
                                        StateParamHelper.validatePage(paginationParams.tsParams.page, paginationParams.tsParams.total, paginationParams.tsParams.perpage);

                                        d.resolve(count);
                                    });

                                  } else if (!_.isEmpty(paginationParams.guideFilters.heroes) && paginationParams.guideFilters.map == undefined) {
                                      HOTSGuideQueryService.getHeroGuides(paginationParams.guideFilters, true, paginationParams.tsParams.perpage, paginationParams.tsParams.page, function(err, data, count) {
                                        if (err) {
                                            return d.reject(err);
                                        }
                                        paginationParams.tsParams.total = count.count;
                                        StateParamHelper.validatePage(paginationParams.tsParams.page, paginationParams.tsParams.total, paginationParams.tsParams.perpage);

                                        d.resolve(count);
                                      });

                                  } else if (_.isEmpty(paginationParams.guideFilters.hero) && paginationParams.guideFilters.map != undefined) {

                                      HOTSGuideQueryService.getMapGuides(paginationParams.guideFilters, true, paginationParams.guideFilters.search, paginationParams.tsParams.perpage, paginationParams.tsParams.page, function(err, data, count) {
                                        if (err) {
                                            return d.reject(err);
                                        }
                                        paginationParams.tsParams.total = count.count;
                                        StateParamHelper.validatePage(paginationParams.tsParams.page, paginationParams.tsParams.total, paginationParams.tsParams.perpage);

                                        d.resolve(count);
                                      });

                                  } else {

                                      HOTSGuideQueryService.getGuides(paginationParams.guideFilters, true, paginationParams.guideFilters.search, paginationParams.tsParams.perpage, paginationParams.tsParams.page, function(err, data, count) {
                                        if (err) {
                                            return d.reject(err);
                                        }

                                        paginationParams.tsParams.total = count.count;

                                        StateParamHelper.validatePage(paginationParams.tsParams.page, paginationParams.tsParams.total, paginationParams.tsParams.perpage);

                                        d.resolve(count);
                                      });

                                  }

                                return d.promise;
                            }],
                            dataHeroes: ['Hero', function (Hero) {
                              return Hero.find({
                                  filter: {
                                    where: {
                                        isActive: true
                                    },
                                    order: "name ASC",
                                    fields: {
                                      isActive: true,
//                                      characters: true,
                                      className: true,
                                      name: true,
                                      title: true,
                                      orderNum: true,
                                      role: true,
                                      universe: true,
                                      id: true
                                    }
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
                            userRoles: ['User', function(User) {
                                if (!User.isAuthenticated()) {
                                    return false;
                                } else {
                                    return User.isInRoles({
                                        uid: User.getCurrentId(),
                                        roleNames: ['$admin', '$contentProvider', '$premium']
                                    })
                                    .$promise
                                    .then(function (userRoles) {
                                        return userRoles;
                                    })
                                    .catch(function (roleErr) {
                                        console.log('roleErr: ', roleErr);
                                    });
                                }
                            }],
                            guide: ['$state', '$stateParams', 'Guide', 'Util', function ($state, $stateParams, Guide, Util) {
                                var slug = _.clone($stateParams.slug);
                                return Guide.findOne({
                                    filter: {
                                        where: {
                                            slug: slug,
                                        },
                                        fields: {
                                            against: true,
                                            authorId: true,
                                            comments: true,
                                            content: true,
                                            createdDate: true,
                                            description: true,
                                            guideType: true,
                                            id: true,
                                            isFeatured: true,
                                            isPublic: true,
                                            name: true,
                                            premium: true,
                                            synergy: true,
                                            viewCount: true,
                                            youtubeId: true,
                                            isCommentable: true
                                        },
                                        include: [
                                            {
                                                relation: 'author'
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
                                                                fields: [
                                                                    'className',
                                                                    'description',
                                                                    'universe',
                                                                    'heroType',
                                                                    'name',
                                                                    'role'
                                                                ],
                                                                include: [
                                                                    {
                                                                        relation: 'talents',
                                                                        scope: {
                                                                            include: {
                                                                                relation: 'talent',
                                                                                scope: {
                                                                                    fields: ['orderNum']
                                                                                }
                                                                            }
                                                                        }
                                                                    }
                                                                ]
                                                            }
                                                        }
                                                    ]
                                                }
                                            },
                                            {
                                                relation: 'guideTalents',
                                                scope: {
                                                    include: ['talent']
                                                }
                                            },
                                            {
                                                relation: 'maps'
                                            },
                                            {
                                                relation: 'comments',
                                                scope: {
                                                    include: [
                                                        {
                                                            relation: 'author',
                                                            scope: {
                                                                fields: {
                                                                    id: true,
                                                                    username: true,
                                                                    email: true
                                                                }
                                                            }
                                                        }
                                                    ]
                                                }
                                            },
                                            {
                                                relation: 'votes',
                                                scope: {
                                                    fields: {
                                                        id: true,
                                                        direction: true,
                                                        authorId: true
                                                    }
                                                }
                                            }
                                        ]
                                    }
                                })
                                .$promise
                                .then(function (data) {
                                    console.log('data:', data);
                                    data.slug = Util.setSlug(data);
                                    data.voteScore = Util.tally(data.votes, 'direction');
                                    return data;
                                })
                                .catch(function (err) {
                                    if (err.status === 404) {
                                        return throw404($state);
                                    }
                                });
                            }],
                            heroes: ['Hero', 'guide', function(Hero, guide) {
                                var synergy = Array.isArray(guide.synergy) ? guide.synergy : [];
                                var strong = guide.against && Array.isArray(guide.against.strong) ? guide.against.strong : [];
                                var weak = guide.against && Array.isArray(guide.against.weak) ? guide.against.weak : [];
                                var toLoad = _.union(synergy, strong, weak);

                                return Hero.find({
                                  filter: {
                                    where: {
                                      id: { inq: toLoad }
                                    },
                                    fields: {
                                      className: true,
                                      heroType: true,
                                      name: true,
                                      orderNum: true,
                                      role: true,
                                      universe: true,
                                      id: true,
                                      description: true
                                    }
                                  }
                                })
                                .$promise
                                .then(function (heroes) {
                                    return heroes;
                                })
                                .catch(function (err) {
                                    if (err.status === 404) {
                                        return throw404($state);
                                    }
                                });
                            }],
                            maps: ['Map', function(Map) {
                                return Map.find({})
                                .$promise
                                .then(function (maps) {
                                    return maps;
                                });
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
							             userRoles: ['User', function(User) {
                                if (!User.isAuthenticated()) {
                                    return false;
                                } else {
                                    return User.isInRoles({
                                        uid: User.getCurrentId(),
                                        roleNames: ['$admin', '$contentProvider']
                                    })
                                    .$promise
                                    .then(function (userRoles) {
                                        return userRoles;
                                    })
                                    .catch(function (roleErr) {
                                        console.log('roleErr: ', roleErr);
                                    });
                                }
                            }],
                            dataHeroes: ['Hero', 'HeroTalent', '$q', function (Hero, HeroTalent, $q) {
                              var d = $q.defer();
                              async.waterfall([
                                function(waterCB) {
                                  Hero.find({
                                    filter: {
                                        order: "name ASC",
                                        where: {
                                            isActive: true
                                        },
                                        fields: ['id', 'className', 'description', 'heroType', 'isActive', 'name', 'orderNum', 'role', 'universe']
                                    }
                                  }).$promise
                                  .then(function(heroData) {
                                    return waterCB(null, heroData);
                                  })
                                  .catch(function (err) {
                                    return waterCB();
                                  });
                                },
                              ], function(err, results) {
                                return d.resolve(results);
                              });

                              return d.promise;
                            }],
                            dataMaps: ['Map', function (Map) {
                                return Map.find({
                                    filter: {
                                        where: {
                                            isActive: true
                                        }
                                    }
                                }).$promise;
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
                           userRoles: ['User', function(User) {
                                if (!User.isAuthenticated()) {
                                    return false;
                                } else {
                                    return User.isInRoles({
                                        uid: User.getCurrentId(),
                                        roleNames: ['$admin', '$contentProvider']
                                    })
                                    .$promise
                                    .then(function (userRoles) {
                                        return userRoles;
                                    })
                                    .catch(function (roleErr) {
                                        console.log('roleErr: ', roleErr);
                                    });
                                }
                            }],
                            dataHeroes: ['Hero', function (Hero) {
                                return Hero.find({
                                    filter: {
                                        where: {
                                            isActive: true
                                        }
                                    }
                                }).$promise
                                .then(function (heroes) {
                                    return heroes;
                                });
                            }],
                            dataMaps: ['Map', function (Map) {
                                return Map.find({
                                    filter: {
                                        where: {
                                            isActive: true
                                        }
                                    }
                                }).$promise;
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
                            dataGuide: ['$stateParams', 'Guide', function ($stateParams, Guide) {
                                var slug = $stateParams.slug;
                                return Guide.findOne({
                                    filter: {
                                        where: {
                                            slug: slug
                                        },
                                        include: [
                                            {
                                                relation: 'maps'
                                            }
                                        ]
                                    }
                                }).$promise;
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
                            dataGuide: ['$stateParams', 'Guide', function ($stateParams, Guide) {
                                var slug = $stateParams.slug;
                                return Guide.findOne({
                                    filter: {
                                        where: {
                                            slug: slug
                                        },
                                        include: [
                                            {
                                                relation: 'maps'
                                            },
                                            {
                                                relation: 'guideTalents'
                                            },
                                            {
                                                relation: 'guideHeroes',
                                                scope: {
                                                    include: [
                                                        {
                                                            relation: 'hero',
                                                            scope: {
                                                                include: [
                                                                    {
                                                                        relation: 'talents',
                                                                        scope: {
                                                                            include: [
                                                                                {
                                                                                    relation: 'talent'
                                                                                }
                                                                            ]
                                                                        }
                                                                    }
                                                                ]
                                                            }
                                                        }
                                                    ]
                                                }
                                            }
                                        ]
                                    }
                                }).$promise
                                .then(function (guide) {
                                    return guide;
                                });
                            }],
                            userRoles: ['User', function(User) {
                                if (!User.isAuthenticated()) {
                                    return false;
                                } else {
                                    return User.isInRoles({
                                        uid: User.getCurrentId(),
                                        roleNames: ['$admin', '$contentProvider']
                                    })
                                    .$promise
                                    .then(function (userRoles) {
                                        return userRoles;
                                    })
                                    .catch(function (roleErr) {
                                        console.log('roleErr: ', roleErr);
                                    });
                                }
                            }],
                            dataHeroes: ['Hero', 'HeroTalent', '$q', function (Hero, HeroTalent, $q) {
                              var d = $q.defer();
                              async.waterfall([
                                function(waterCB) {
                                  Hero.find({
                                    filter: {
                                        order: "name ASC",
                                        where: {
                                            isActive: true
                                        },
                                        fields: ['id', 'className', 'description', 'heroType', 'isActive', 'name', 'orderNum', 'role', 'universe']
                                    }
                                  }).$promise
                                  .then(function(heroData) {
                                    return waterCB(null, heroData);
                                  })
                                  .catch(function (err) {
                                    return waterCB();
                                  });
                                },
                              ], function(err, results) {
                                return d.resolve(results);
                              });

                              return d.promise;
                            }],
                            dataMaps: ['Map', function (Map) {
                                return Map.find({}).$promise;
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
                            userRoles: ['User', function(User) {
                                if (!User.isAuthenticated()) {
                                    return false;
                                } else {
                                    return User.isInRoles({
                                        uid: User.getCurrentId(),
                                        roleNames: ['$admin', '$contentProvider', '$premium']
                                    })
                                    .$promise
                                    .then(function (userRoles) {
                                        return userRoles;
                                    })
                                    .catch(function (roleErr) {
                                        console.log('roleErr: ', roleErr);
                                    });
                                }
                            }],
                            dataGuide: ['$stateParams', 'Guide', function ($stateParams, Guide) {
                                var slug = $stateParams.slug;
                                return Guide.findOne({
                                    filter: {
                                        where: {
                                            slug: slug
                                        },
                                        include: [
                                            {
                                                relation: 'maps'
                                            }
                                        ]
                                    }
                                }).$promise
                                .then(function (guide) {
                                    return guide;
                                })
                                .catch(function (err) {
                                    if (err.status === 404) {
                                        return throw404($state);
                                    }
                                });
                            }],
                            dataHeroes: ['Hero', function (Hero) {
                                return Hero.find({
                                    filter: {
                                        order: "name ASC",
                                        where: {
                                            isActive: true
                                        }
                                    }
                                }).$promise
                                .then(function (heroes) {
                                    return heroes;
                                });
                            }],
                            dataMaps: ['Map', function (Map) {
                                return Map.find({
                                    filter: {
                                        where: {
                                            isActive: true
                                        }
                                    }
                                }).$promise;
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
                                        order: "name ASC",
                                        where: {
                                            isActive: true
                                        },
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
                                where: {
                                    isActive: true
                                },
                                fields: {
                                    className: true
                                }
                            }
                        }).$promise
                        .then(function (data) {
                            return data;
                        });
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
                                    className: hero,
                                    isActive: true
                                },
                                include: [
                                  {
                                    relation: 'talents',
                                    scope: {
                                      order: "orderNum ASC",
                                      include: [
                                        {
                                          relation: 'talent'
                                        },
                                        {
                                          relation: 'ability',
                                          scope: {
                                            fields: ['id']
                                          }
                                        }
                                      ]
                                    }
                                  },
                                  {
                                    relation: 'abilities'
                                  }
                                ]
                              }
                            })
                            .$promise
                            .then(function (hero) {
                              var sort = _.sortBy(hero.talents, 'orderNum');
                              hero.talents = sort;
                              return hero;
                            })
                            .catch(function(err) {
                                if (err.status === 404) {
                                    return throw404($state);
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
                            forumCategories: ['$q', 'ForumCategory', 'ForumThread', function($q, ForumCategory, ForumThread) {
								// Alex's Resolve
                                var d = $q.defer();
                                async.waterfall([
                                    function(waterCB) {

                                        ForumCategory.find({
                                            filter: {
                                                where: {
                                                    isActive: true
                                                },
                                                fields: {
                                                    id: true,
                                                    title: true
                                                },
                                                order: 'orderNum ASC'
                                            }
                                        }).$promise
                                        .then(function (forumCategories) {
                                            return waterCB(null, forumCategories);
                                        })
                                        .catch(function (err) {
                                            return waterCB(err);
                                        });

                                    },
                                    function(forumCategories, waterCB) {

                                        async.each(forumCategories, function (category, categoryCB) {

                                            ForumCategory.forumThreads({
                                                id: category.id,
                                                filter: {
                                                    fields: {
                                                        id: true,
                                                        title: true,
                                                        description: true,
                                                        slug: true
                                                    }
                                                }
                                            }).$promise
                                            .then(function (threads) {
                                                category.forumThreads = threads;

                                                async.each(category.forumThreads, function (thread, threadCB) {

                                                   async.parallel([
                                                       function (paraCB) {

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
                                                           }).$promise
                                                           .then(function (forumPost) {
                                                               thread.forumPosts = forumPost;
                                                               return paraCB();
                                                           })
                                                           .catch(function (err) {
                                                               return paraCB(err);
                                                           });

                                                       },
                                                       function (paraCB) {

                                                           ForumThread.forumPosts.count({
                                                                id: thread.id
                                                            }).$promise
                                                            .then(function (postCount) {
                                                                thread.forumPostsCount = postCount.count;
                                                                return paraCB();
                                                            })
                                                            .catch(function (err) {
                                                                return paraCB(err);
                                                            });

                                                       }
                                                   ], function(err, results) {
                                                       if (err) {
                                                           return threadCB(err);
                                                       }
                                                       return threadCB();
                                                   });

                                                }, function(err) {
                                                    if (err) {
                                                        return categoryCB(err);
                                                    }
                                                    return categoryCB();
                                                });

                                            })
                                            .catch(function (err) {
                                                return categoryCB(err);
                                            });

                                        }, function(err) {
                                            if (err) {
                                                return waterCB(err);
                                            }
                                            return waterCB(null, forumCategories);
                                        });

                                    }
                                ], function(err, results) {
                                    if (err) {
                                        return d.resolve(err);
                                    }
                                    return d.resolve(results);
                                });
                                return d.promise;

								// Martin's Resolve
//								var startTime = new Date().getMilliseconds();
//								var d = $q.defer();
//								ForumCategory.find({
//									where: {
//										isActive: true
//									},
//									fields: {
//										id: true,
//										title: true
//									}
//								}).$promise
//								.then(function (categories) {
//									async.forEach(categories, function (category, eachCategoryCallback) {
//										ForumCategory.forumThreads({
//											id: category.id,
//											filter: {
//												where: {
//													isActive: true
//												},
//												fields: {
//													id: true,
//													title: true,
//													description: true,
//													slug: true
//												},
//												order: 'orderNum ASC'
//											}
//										}).$promise.then(function (threads) {
//											category.forumThreads = threads;
//
//											async.forEach(threads, function (thread, eachThreadCallback) {
//												ForumThread.forumPosts({
//													id: thread.id,
//													filter: {
//														fields: {
//															title: true,
//															slug: true,
//															authorId: true
//														},
//														include: {
//															relation: 'author',
//															scope: {
//																fields: {
//																	username: true,
//																	email: true
//																}
//															}
//														},
//														order: 'createdDate DESC',
//														limit: 1
//													}
//												}).$promise.then(function (posts) {
//													thread.forumPosts = posts;
//													ForumThread.forumPosts.count({ id: thread.id }).$promise
//													.then(function (results) {
//														thread.forumPostsCount = results.count;
//														return eachThreadCallback();
//													});
//												});
//											}, function () {
//												return eachCategoryCallback();
//											});
//										});
//									}, function () {
////                                        console.log(categories);
//										var endTime = new Date().getMilliseconds();
//										var elapsedTime = startTime - endTime;
//										console.log('elapsedTime:', elapsedTime);
//										d.resolve(categories);
//									});
//								});
//								return d.promise;
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
                            forumPostCount: ['$q','$stateParams', 'ForumThread', function($q, $stateParams, ForumThread) {
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
                            forumThread: ['$state', '$q', '$stateParams', 'ForumThread', 'ForumPost', function($state, $q, $stateParams, ForumThread, ForumPost) {
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
                                .catch(function (err) {
                                    if (err.status === 404) {
                                        $q.reject();
                                        return throw404($state);
                                    }
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
                            forumPost: ['$state', '$stateParams', 'ForumPost', function($state, $stateParams, ForumPost) {
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
                                                    include: [
                                                        {
                                                            relation: 'author',
                                                            scope: {
                                                                fields: {
                                                                    id: true,
                                                                    username: true,
                                                                    email: true
                                                                }
                                                            }
                                                        }
                                                    ]
                                                }
                                            },
                                            {
                                                relation: 'author'
                                            }
                                        ]
                                    }
                                })
                                .$promise
                                .catch(function (err) {
                                    if (err.status === 404) {
                                        return throw404($state);
                                    }
                                });
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
                            teams: ['Team', function (Team) {
                              return Team.find({
                                    filter: {
                                        where: {
                                            isActive: true
                                        },
                                        fields: [
                                            'id', 
                                            'name', 
                                            'gameId', 
                                            'orderNum',
                                            'abbreviation'
                                        ],
                                        order: 'orderNum ASC',
                                        include: [
                                            {
                                                relation: 'teamMembers',
                                                scope: {
                                                    where: {
                                                        isActive: true
                                                    },
                                                    order: 'orderNum ASC',
                                                    fields: [
                                                      'fullName',
                                                      'screenName',
                                                      'description',
                                                      'photoName',
                                                      'screenName',
                                                      'social',
                                                      'orderNum',
                                                    ]
                                                }
                                            },
                                            {
                                                relation: 'game',
                                                scope: {
                                                    fields: ['id', 'name']
                                                }
                                            }
                                        ]
                                    }
                                })
                                .$promise;
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
                                        viewType: 'main'
                                    },
                                    include: ['items']
                                }
                            }).$promise;
                          }],
                          dataPollsSide: ['Poll', function (Poll) {
                            return Poll.find({
                                filter: {
                                    where: {
                                        viewType: 'side'
                                    },
                                    include: ['items']
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
                url: 'login',
                views: {
                    content: {
                        templateUrl: tpl + 'views/frontend/login.html',
                    }
                },
                params: { redirect: undefined },
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
                    userProfile: ['$state', '$stateParams', 'User', function ($state, $stateParams, User) {
                      var username = $stateParams.username;
                      return User.find({
                        filter: {
                            where: {
                                username: username
                            }
                        }
                      })
                      .$promise
                      .then(function (data) {
                          if (_.isEmpty(data)) {
                              return throw404($state);
                          }

                          return data[0];
                      })
                      .catch(function (err) {
                          if (err.stats === 404) {
                              return throw404($state);
                          }
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
                                                relation: 'deck',
                                                scope: {
                                                    fields: ['name','description','slug','id']
                                                }
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
                                        authorId: userProfile.id,
                                        isActive: true
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
                            articles: ['userProfile', 'User', 'Util', 'Article', function (userProfile, User, Util, Article) {
                                
                                var where = {
                                    authorId: userProfile.id
                                };
                                
                                if (User.getCurrentId() !== userProfile.id) {
                                    where.isActive = true;
                                }
                                
                                return Article.find({
                                    filter: {
                                        order: 'createdDate DESC',
                                        where: where,
                                        fields: {
                                            id: true,
                                            name: true,
                                            authorId: true,
                                            createdDate: true,
                                            description: true,
                                            premium: true,
                                            photoNames: true,
                                            slug: true,
                                            themeName: true,
                                            title: true,
                                            articleType: true,
                                            isActive: true
                                        },
                                        include: [
                                            {
                                                relation: 'author',
                                                scope: {
                                                    fields: ['id', 'username']
                                                }
                                            },
                                            {
                                                relation: 'votes',
                                                scope: {
                                                    fields: ['id', 'authorId', 'direction']
                                                }
                                            }
                                        ]
                                    }
                                })
                                .$promise
                                .then(function (articles) {
                                    _.each(articles, function(article) {
                                        article.voteScore = Util.tally(article.votes, 'direction');
                                    });

                                    return articles;
                                })
                                .catch(function (err) {
                                    console.log('err:', err);
                                });
                                
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
                            decks: ['User', 'userProfile', 'Util', 'Deck', 'AuthenticationService', function (User, userProfile, Util, Deck, AuthenticationService) {
                                var where = {
                                    authorId: userProfile.id
                                };
                                
                                if (User.getCurrentId() !== userProfile.id) {
                                    where.isPublic = true;
                                }
                                
                                return Deck.find({
                                    filter: {
                                        order: "createdDate DESC",
                                        where: where,
                                        fields: {
                                            id: true,
                                            name: true,
                                            createdDate: true,
                                            authorId: true,
                                            playerClass: true,
                                            heroName: true
                                        },
                                        include: [
                                            {
                                                relation: 'author',
                                                scope: {
                                                    fields: {
                                                        username: true
                                                    }
                                                }
                                            },
                                            {
                                                relation: 'votes',
                                                scope: {
                                                    fields: {
                                                        id: true,
                                                        authorId: true,
                                                        direction: true
                                                    }
                                                }
                                            },
                                            {
                                                relation: 'slugs',
                                                scope: {
                                                    fields: ['slug', 'linked']
                                                }
                                            }
                                        ]
                                    }
                                })
                                .$promise
                                .then(function (decks) {
                                    console.log('decks:', decks);
                                    _.each(decks, function(deck) {
                                        // init template vars
                                        deck.slug = Util.setSlug(deck);
                                        deck.voteScore = Util.tally(deck.votes, 'direction');
                                    });

                                    return decks;
                                })
                                .catch(function (err) {
                                    console.log('err:', err);
                                });

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
                            guides: ['userProfile', 'Guide', 'Util', 'AuthenticationService', 'User', function (userProfile, Guide, Util, AuthenticationService, User) {
                                
                                var where = {
                                    authorId: userProfile.id
                                };
                                
                                if (User.getCurrentId() !== userProfile.id) {
                                    where.isPublic = true;
                                }
                                
                                return Guide.find({
                                    filter: {
                                        order: "createdDate DESC",
                                        where: where,
                                        fields: {
                                            id: true,
                                            name: true,
                                            createdDate: true,
                                            premium: true,
                                            authorId: true,
                                            guideType: true
                                        },
                                        include: [
                                            {
                                                relation: 'author',
                                                scope: {
                                                    fields: ['id', 'username']
                                                }
                                            },
                                            {
                                                relation: 'guideHeroes',
                                                scope: {
                                                    include: [
                                                        {
                                                            relation: 'hero',
                                                            scope: {
                                                                fields: ['className', 'name', 'title'],
                                                            }
                                                        }
                                                    ]
                                                }
                                            },
                                            {
                                                relation: 'guideTalents',
                                                scope: {
                                                    include: [
                                                        {
                                                            relation: 'talent',
                                                            scope: {
                                                                fields: ['className', 'name']
                                                            }
                                                        }
                                                    ]
                                                }
                                            },
                                            {
                                                relation: 'maps',
                                                scope: {
                                                    fields: ['className']
                                                }
                                            },
                                            {
                                                relation: 'votes',
                                                scope: {
                                                    fields: ['authorId', 'direction']
                                                }
                                            },
                                            {
                                                relation: 'slugs',
                                                scope: {
                                                    fields: ['slug', 'linked']
                                                }
                                            }
                                        ]
                                    }
                                }).$promise
                                .then(function (guides) {
                                    _.each(guides, function(guide) {
                                        // init template values
                                        guide.slug = Util.setSlug(guide);
                                        guide.voteScore = Util.tally(guide.votes, 'direction');
                                    });

                                    return guides;
                                })
                                .catch(function (err) {
                                    console.log('err:', err);
                                });
                                
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
                            user: ['userProfile', function (userProfile) {
                                if (_.isUndefined(userProfile.subscription)) {
                                    userProfile.subscription = {
                                        isSubscribed: false,
                                        expiryDate: null
                                    }
                                }

                                return userProfile;
                            }],
                            isPremium: ['User', 'user', function (User, user) {
                                return User.isInRoles({
                                    uid: user.id,
                                    roleNames: ['$premium']
                                })
                                .$promise
                                .then(function (data) {
                                    return data.isInRoles.$premium;
                                })
                            }],
                            isLinked: ['User', function (User) {
                                var providers = ['twitch','bnet'];

                                return User.isLinked({
                                    providers: providers
                                })
                                .$promise
                                .then(function (data) {
                                    return data.isLinked;
                                })
                                .catch(function (err) {
                                    console.log(err);
                                });
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
                },
                access: { auth: true },
            })
            .state('app.profile.edit.connect', {
                url: '/connect',
                views: {
                    editProfile: {
                        templateUrl: tpl + 'views/frontend/profile.edit.connect.html'
                    }
                },
                access: { auth: true },
            })
            .state('app.profile.edit.social', {
                url: '/social',
                views: {
                    editProfile: {
                        templateUrl: tpl + 'views/frontend/profile.edit.social.html'
                    }
                },
                access: { auth: true },
            })
            .state('app.profile.edit.premium', {
                url: '/premium?plan',
                views: {
                    editProfile: {
                        templateUrl: tpl + 'views/frontend/profile.edit.premium.html',
                        controller: 'ProfileSubscriptionCtrl',
                        resolve: {
                            resolvePlan: ['$stateParams', function($stateParams) {
                                if ($stateParams.plan) {
                                    return $stateParams.plan;
                                } else {
                                    return false;
                                }
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
//            .state('app.profile.subscription', {
//                url: '/subscription?plan',
//                views: {
//                    profile: {
//                        templateUrl: tpl + 'views/frontend/profile.subscription.html',
//                        controller: 'ProfileSubscriptionCtrl',
//                        resolve: {
//                            user: ['userProfile', function (userProfile) {
//                                return userProfile;
//                            }]
//                        }
//                    }
//                },
//                access: { auth: true },
//                seo: { title: 'My Subscription', description: '', keywords: '' }
//            })
            .state('app.admin', {
                abstract: true,
                url: 'admin',
                views: {
                    content: {
                        templateUrl: tpl + 'views/admin/index.html',
                        resolve: {
                          admin: ['User', 'LoopBackAuth', '$state', function(User, LoopBackAuth, $state){
                            var currentUser = LoopBackAuth.currentUserData;
                                var roles = {};
                                User.isInRoles({uid:currentUser.id, roleNames:['$admin', '$redbullAdmin']}).$promise
                                    .then(function(val){
                                        roles = val.isInRoles;
                                        if (!!roles.none){
                                            $state.go('app.404');
                                        }
                                      return true;
                                    });
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
                                    total: 0,
                                    options: {
                                        filter: {
                                            fields: ['id', 'title', 'createdDate'],
                                            limit: 50,
                                            order: 'createdDate DESC'
                                        }
                                    }
                                };
                            }],
                            articlesCount: ['Article', 'StateParamHelper', 'paginationParams', function (Article, StateParamHelper, paginationParams) {
                                return Article.count({})
                                .$promise
                                .then(function (artCount) {
                                    StateParamHelper.validatePage(paginationParams.page, artCount.count, paginationParams.perpage);

                                    paginationParams.total = artCount.count;

                                    return artCount.count;
                                });
                            }],
                            articles: ['Article', 'paginationParams', function (Article, paginationParams) {
                                var options = {
                                    filter: {
                                        limit: paginationParams.perpage,
                                        order: paginationParams.options.filter.order,
                                        fields: paginationParams.options.filter.fields
                                    }
                                };

                                return Article.find(options)
                                .$promise
                                .then(function (data) {
                                    return data;
                                });
                            }],
                            authors: ['User', function(User) {
                                var options = {
                                    filter: {
                                        limit: 10,
                                        order: "createdDate DESC",
                                        fields: ["username", "id"],
                                        where: {
                                            isProvider: true
                                        }
                                    }
                                }

                                return User.find(options)
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
                            }],
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
                            article: ['$stateParams', 'Article', 'Util', function ($stateParams, Article, Util) {
                                var articleID = $stateParams.articleID;
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
                                            },
                                            {
                                                relation: 'slugs'
                                            }
                                        ]
                                    }
                                })
                                .$promise
                                .then(function (data) {
                                    data.slug = Util.setSlug(data);
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
                            }],
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
                                    total: 0,
                                    options: {
                                        filter: {
                                            fields: {
                                                id: true,
                                                name: true,
                                                playerClass: true,
                                                description: true
                                            }
                                        },
                                        where: {
                                            isPublic: true
                                        },
                                        order: "createdDate DESC",
                                    }
                                };
                            }],
                            decksCount: ['Deck', 'paginationParams', function(Deck, paginationParams) {
                                return Deck.count({}).$promise
                                .then(function (deckCount) {
                                    paginationParams.total = deckCount.count;

                                    return deckCount.count;
                                });
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
                                    }
                                })
                                .$promise
                                .then(function (deck) {
                                    return deck;
                                });
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
                            userRoles: ['User', function(User) {
                                if (!User.isAuthenticated()) {
                                    return false;
                                } else {
                                    return User.isInRoles({
                                        uid: User.getCurrentId(),
                                        roleNames: ['$admin', '$contentProvider']
                                    })
                                    .$promise
                                    .then(function (userRoles) {
                                        return userRoles;
                                    })
                                    .catch(function (roleErr) {
                                        console.log('roleErr: ', roleErr);
                                    });
                                }
                            }],
                            classCardsList: ['$stateParams', 'Card', function($stateParams, Card) {
                                var playerClass = $stateParams.playerClass.slice(0,1).toUpperCase() + $stateParams.playerClass.substr(1);

                                return Card.find({
                                    filter: {
                                        fields: {
                                            id: true,
                                            name: true,
                                            cost: true,
                                            rarity: true,
                                            playerClass: true,
                                            dust: true,
                                            mechanics: true,
                                            cardType: true,
                                            deckable: true,
                                            expansion: true,
                                            isActive: true,
                                            photoNames: true
                                        },
                                        // fields: {
                                        //     artist: false,
                                        //     attack: false,
                                        //     durability: false,
                                        //     expansion: false,
                                        //     flavor: false,
                                        //     health: false,
                                        //     isActive: false,
                                        //     race: false,
                                        //     text: false,
                                        //     deckable: false
                                        // },
                                        where: {
                                            playerClass: playerClass,
                                            deckable: true
                                        },
                                        order: ['cost ASC', 'name ASC'],
                                        limit: 15
                                    }
                                }).$promise
                                .then(function(classCards) {
                                  return classCards;
                                });
                            }],

                            classCardsCount: ['$stateParams', 'Card', function ($stateParams, Card) {
								                var playerClass = $stateParams.playerClass.slice(0,1).toUpperCase() + $stateParams.playerClass.substr(1);
                                return Card.count({
                                    where: {
                                        playerClass: playerClass,
                                        deckable: true
                                    }
                                }).$promise
                                .then(function (classCardCounts) {
                                  return classCardCounts;
                                });
                            }],

                            neutralCardsCount: ['Card', function (Card) {
                                return Card.count({
                                    where: {
                                        playerClass: 'Neutral',
                                        deckable: true
                                    }
                                }).$promise;
                            }],

                            neutralCardsList: ['Card', function (Card) {
                                return Card.find({
                                    filter: {
                                        fields: {
                                            artist: false,
                                            attack: false,
                                            durability: false,
                                            expansion: false,
                                            flavor: false,
                                            health: false,
                                            isActive: false,
                                            race: false,
                                            text: false,
                                            deckable: false
                                        },
                                        where: {
                                            playerClass: 'Neutral',
                                            deckable: true
                                        },
                                        order: ["cost ASC", "name ASC"],
                                        limit: 15
                                    }
                                }).$promise;
                            }],

							toStep: ['$stateParams', function ($stateParams) {
                                if ($stateParams.goTo) {
                                    return $stateParams.goTo;
                                }
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
                            userRoles: ['User', function(User) {
                                if (!User.isAuthenticated()) {
                                    return false;
                                } else {
                                    return User.isInRoles({
                                        uid: User.getCurrentId(),
                                        roleNames: ['$admin', '$contentProvider']
                                    })
                                    .$promise
                                    .then(function (userRoles) {
                                        return userRoles;
                                    })
                                    .catch(function (roleErr) {
                                        console.log('roleErr: ', roleErr);
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
                                                youtubeId: true,
                                                isCommentable: true
                                            },
                                            include: [
                                                {
                                                    relation: 'cards',
                                                    scope: {
                                                        include: {
                                                            relation: 'card',
                                                            scope: {
                                                                fields: ['id', 'name', 'cardType', 'cost', 'dust', 'mechanics', 'photoNames', 'playerClass', 'rarity']
                                                            }
                                                        }
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
                                                relation: 'mulligansWithCoin',
                                                scope: {
                                                  include: ['card'],
                                                    scope: {
                                                        fields: {
                                                            artist: false,
                                                            attack: false,
                                                            durability: false,
                                                            expansion: false,
                                                            flavor: false,
                                                            health: false,
                                                            isActive: false,
                                                            race: false,
                                                            text: false,
                                                            deckable: false
                                                        }
                                                    }
                                                }
                                            },
                                            {
                                                relation: 'mulligansWithoutCoin',
                                                scope: {
                                                    include: ['card'],
                                                    scope: {
                                                        fields: {
                                                            artist: false,
                                                            attack: false,
                                                            durability: false,
                                                            expansion: false,
                                                            flavor: false,
                                                            health: false,
                                                            isActive: false,
                                                            race: false,
                                                            text: false,
                                                            deckable: false
                                                        }
                                                    }
                                                }
                                            }
                                        ]
                                    }
                                }).$promise
                                .then(function (data) {
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
                                    return data;
                                })
                                .catch(function(err) {
                                    console.log('err: ', err);
                                });
                            }],

                          deckCardMulligans: ['deck', 'Card', '$q',  function(deck, Card, $q) {
                            var d = $q.defer();
                            async.each(deck.mulligans, function(mulligan, mulliganCB) {

                              var mulliganIndex = deck.mulligans.indexOf(mulligan);

                              async.each(mulligan.mulligansWithoutCoin, function(cardWithoutCoin, cardWithoutCoinCB) {
                                Card.findById({
                                  id: cardWithoutCoin.cardId,
                                  filter: {
                                      fields: {
                                          artist: false,
                                          attack: false,
                                          durability: false,
                                          expansion: false,
                                          flavor: false,
                                          health: false,
                                          isActive: false,
                                          race: false,
                                          text: false,
                                          deckable: false
                                      }
                                  }
                                }).$promise
                                .then(function (cardFound) {
                                  var cardIndex = mulligan.mulligansWithoutCoin.indexOf(cardWithoutCoin);
                                  deck.mulligans[mulliganIndex].mulligansWithoutCoin[cardIndex] = cardFound;
                                  return cardWithoutCoinCB();
                                })
                                .catch(function (err) {
                                  return cardWithoutCoinCB(err);
                                });

                              });

                              async.each(mulligan.mulligansWithCoin, function(cardWithCoin, cardWithCoinCB) {

                                    Card.findById({
                                      id: cardWithCoin.cardId,
                                        filter: {
                                            fields: {
                                                artist: false,
                                                attack: false,
                                                durability: false,
                                                expansion: false,
                                                flavor: false,
                                                health: false,
                                                isActive: false,
                                                race: false,
                                                text: false,
                                                deckable: false
                                            }
                                        }
                                    }).$promise
                                    .then(function (cardFound) {
                                      var cardIndex = mulligan.mulligansWithCoin.indexOf(cardWithCoin);
                                      deck.mulligans[mulliganIndex].mulligansWithCoin[cardIndex] = cardFound;
                                      return cardWithCoinCB();
                                    })
                                    .catch(function (err) {
                                      return cardWithCoinCB(err);
                                    });

                                  });

                                  mulliganCB();

                                }, function(err) {
                                  if (err) return d.resolve(err);
                                  d.resolve(deck);
                                });
                                return d.promise;
                              }],

                          classCardsList: ['$stateParams', 'deck', 'Card', function($stateParams, deck, Card) {
                                var perpage = 15,
                                    playerClass = deck.playerClass;

                                return Card.find({
                                    filter: {
                                        // fields: {
                                        //     artist: false,
                                        //     attack: false,
                                        //     durability: false,
                                        //     expansion: false,
                                        //     flavor: false,
                                        //     health: false,
                                        //     isActive: false,
                                        //     race: false,
                                        //     text: false,
                                        //     deckable: false
                                        // },
                                        fields: {
                                            id: true,
                                            name: true,
                                            cost: true,
                                            rarity: true,
                                            playerClass: true,
                                            dust: true,
                                            mechanics: true,
                                            cardType: true,
                                            deckable: true,
                                            expansion: true,
                                            isActive: true,
                                            photoNames: true
                                        },
                                        where: {
                                            playerClass: playerClass,
                                            deckable: true
                                        },
                                        order: ['cost ASC', 'name ASC'],
                                        limit: perpage
                                    }
                                }).$promise
                                .then(function (classCards) {
                                    return classCards;
                                });
                            }],

                            classCardsCount: ['$stateParams', 'deck', 'Card', function ($stateParams, deck, Card) {
                                var deckID = $stateParams.deckID;
                                return Card.count({
                                    where: {
                                        playerClass: deck.playerClass,
                                        deckable: true
                                    }
                                }).$promise;
                            }],

                            neutralCardsCount: ['Card', function (Card) {
                                return Card.count({
                                    where: {
                                        playerClass: 'Neutral',
                                        deckable: true
                                    }
                                }).$promise;
                            }],

                            neutralCardsList: ['Card', function (Card) {
                                return Card.find({
                                    filter: {
                                        // fields: {
                                        //     artist: false,
                                        //     attack: false,
                                        //     durability: false,
                                        //     expansion: false,
                                        //     flavor: false,
                                        //     health: false,
                                        //     isActive: false,
                                        //     race: false,
                                        //     text: false,
                                        //     deckable: false
                                        // },
                                        fields: {
                                            id: true,
                                            name: true,
                                            cost: true,
                                            rarity: true,
                                            playerClass: true,
                                            dust: true,
                                            mechanics: true,
                                            cardType: true,
                                            deckable: true,
                                            expansion: true,
                                            isActive: true,
                                            photoNames: true
                                        },
                                        where: {
                                            playerClass: 'Neutral',
                                            deckable: true
                                        },
                                        order: ["cost ASC", "name ASC"],
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
                            paginationParams: [function() {
                                return {
                                    page: 1,
                                    perpage: 50,
                                    total: 0,
                                    options: {
                                        filter: {
                                            fields: {
                                                id: true,
                                                name: true,
                                                rarity: true,

                                            },
                                            limit: 50,
                                            order: 'name ASC'
                                        }
                                    }
                                };
                            }],
                            cardsCount: ['Card', 'paginationParams', function(Card, paginationParams) {
                                return Card.count({})
                                .$promise
                                .then(function (cardCount) {
                                    paginationParams.total = cardCount.count;
                                    return cardCount;
                                })
                                .catch(function (err) {
                                    console.log('cardCount err: ', err);
                                });
                            }],
                            cards: ['Card', 'paginationParams', function (Card, paginationParams) {
                                return Card.find({
                                    filter: {
                                        limit: paginationParams.perpage,
                                        page: paginationParams.page,
                                        order: paginationParams.options.filter.order,
                                        fields: paginationParams.options.filter.fields
                                    }
                                })
                                .$promise
                                .then(function (cards) {
                                    return cards;
                                })
                                .catch(function (err) {
                                    console.log('Card.find err: ', err);
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
                            card: ['$stateParams', 'Card', function($stateParams, Card) {
                                var cardID = $stateParams.cardID;
                                return Card.findById({
                                    id: cardID
                                })
                                .$promise
                                .then(function (cardFound) {
                                    return cardFound;
                                })
                                .catch(function (err) {
                                    console.log('Card.findById err: ', err);
                                });
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
                            paginationParams: [function() {
                                return {
                                    page: 1,
                                    perpage: 50,
                                    total: 0,
                                    options: {
                                        filter: {
                                            fields: {
                                                id: true,
                                                name: true
                                            },
                                            limit: 50,
                                            order: 'name ASC'
                                        }
                                    }
                                };
                            }],
                            heroesCount: ['Hero', 'paginationParams', function (Hero, paginationParams) {
                                return Hero.count({})
                                .$promise
                                .then(function (data) {
                                    paginationParams.total = data.count;
                                    return data.count;
                                })
                            }],
                            heroes: ['Hero', 'paginationParams', function (Hero, paginationParams) {
                                return Hero.find(
                                    paginationParams.options
                                )
                                .$promise
                                .then(function(data) {
                                    return data;
                                });
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
                            hero: ['$stateParams', 'Hero', function ($stateParams, Hero) {
                                var heroID = $stateParams.heroID;
                                return Hero.findOne({
                                    filter: {
                                        where: {
                                            id: heroID
                                        },
                                        include: [
                                          {
                                            relation: 'talents',
                                            scope: {
                                              include: [
                                                {
                                                  relation: 'talent'
                                                },
                                                {
                                                  relation: 'ability',
                                                  scope: {
                                                    fields: ['name']
                                                  }
                                                }
                                              ]
                                            }
                                          },
                                          {
                                            relation: 'abilities'
                                          }
                                        ]
                                    }
                                })
                                .$promise
                                .then(function (data) {
                                  var tals = _.sortBy(data.talents, 'orderNum');
                                  var abils = _.sortBy(data.abilities, 'orderNum');

                                  data.talents = tals;
                                  data.abilities = abils;

                                  _.each(data.talents, function (tal) { if (tal.ability !== undefined) { var temp = tal.ability.name; tal.ability = temp; } })
                                  return data;
                                });
                            }]
                        }
                    }
                },
                access: { auth: true, admin: true },
                seo: { title: 'Admin', description: '', keywords: '' }
            })
            .state('app.admin.hots.talents', {
                abstract: true,
                url: '/talents',
                views: {
                    hots: {
                        templateUrl: tpl + 'views/admin/hots.talents.html'
                    }
                },
                access: { auth: true, admin: true },
                seo: { title: 'Admin', description: '', keywords: '' }
            })
            .state('app.admin.hots.talents.list', {
                url: '',
                views: {
                    talents: {
                        templateUrl: tpl + 'views/admin/hots.talents.list.html',
                        controller: 'AdminTalentsListCtrl',
                        resolve: {
                            paginationParams: function() {
                                return {
                                    page: 1,
                                    perpage: 50,
                                    options: {
                                        filter: {
                                            fields: {
                                                id: true,
                                                name: true
                                            },
                                            limit: 50,
                                            order: 'name ASC'
                                        }
                                    }
                                };
                            },
                            talents: ['Talent', 'paginationParams', function (Talent, paginationParams) {
                                return Talent.find(
                                    paginationParams.options
                                )
                                .$promise
                                .then(function(data) {
                                    return data;
                                });
                            }],
                            talentCount: ['Talent', 'paginationParams', function(Talent, paginationParams) {
                                return Talent.count()
                                .$promise
                                .then(function (talentCount) {
                                    paginationParams.total = talentCount.count;
                                    return talentCount.count;
                                });
                            }]
                        }
                    }
                }
            })
            .state('app.admin.hots.talents.add', {
              url: '/add',
              views: {
                talents: {
                  templateUrl: tpl + 'views/admin/hots.heroes.talents.add.page.html',
                  controller: 'AdminTalentsAddCtrl'
                }
              },
              access: { auth: true, admin: true },
              seo: { title: 'Admin', description: '', keywords: '' }
            })
            .state('app.admin.hots.talents.edit', {
              url: '/:talentId',
              views: {
                talents: {
                  templateUrl: tpl + 'views/admin/hots.heroes.talents.edit.page.html',
                  controller: 'AdminTalentsEditCtrl',
                  resolve: {
                    talent: ['$stateParams', 'Talent', function ($stateParams, Talent) {
                      var talentId = $stateParams.talentId;

                      return Talent.findOne({
                        filter: {
                          where: {
                            id: talentId
                          },
                            include: ['heroes']
                        }
                      })
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
                            paginationParams: [function() {
                                return {
                                    page: 1,
                                    perpage: 50,
                                    total: 0,
                                    options: {
                                        filter: {
                                            fields: {
//                                                id: true,
//                                                name: true
                                            },
                                            limit: 12,
                                            order: 'name ASC'
                                        }
                                    }
                                }
                            }],
                            maps: ['Map', 'paginationParams', function (Map, paginationParams) {
                                return Map.find(
                                    paginationParams.options.filter
                                )
                                .$promise
                                .then(function (data) {
                                    return data;
                                });
                            }],
                            mapCount: ['Map', 'paginationParams', function(Map, paginationParams) {
                                return Map.count()
                                .$promise
                                .then(function (mapCount) {
                                    paginationParams.total = mapCount.count;
                                    return mapCount.count;
                                });
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
                            map: ['$stateParams', 'Map', function ($stateParams, Map) {
                                var mapID = $stateParams.mapID;

                                return Map.findOne({
                                    filter: {
                                        where: {
                                            id: mapID
                                        }
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
							             paginationParams: [function() {
                                return {
                                    page: 1,
                                    perpage: 50,
                                    total: 0,
                                    options: {
                                        filter: {
                                            order: 'createdDate DESC',
                                            fields: {
//                                                id: true,
//                                                username: true
                                            },
                                            limit: 50,
                                        }
                                    }
                                };
                            }],
                            guides: ['Guide', 'paginationParams', function (Guide, paginationParams) {
                            return Guide.find(
                              paginationParams.options
                            )
                            .$promise;
                            }],
                            guideCount: ['Guide', 'paginationParams', function(Guide, paginationParams) {
                              return Guide.count()
                              .$promise
                              .then(function (guideCount) {
                                paginationParams.total = guideCount.count;
                                return guideCount.count;
                              });
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
                            userRoles: ['User', function(User) {
                                if (!User.isAuthenticated()) {
                                    return false;
                                } else {
                                    return User.isInRoles({
                                        uid: User.getCurrentId(),
                                        roleNames: ['$admin', '$contentProvider']
                                    })
                                    .$promise
                                    .then(function (userRoles) {
                                        return userRoles;
                                    })
                                    .catch(function (roleErr) {
                                        console.log('roleErr: ', roleErr);
                                    });
                                }
                            }],
                            dataHeroes: ['Hero', 'HeroTalent', '$q', function (Hero, HeroTalent, $q) {
                              var d = $q.defer();
                              async.waterfall([
                                function(waterCB) {
                                  Hero.find({
                                    where: {
                                      isActive: true
                                    },
                                    filter: {
                                      fields: ['id', 'className', 'description', 'heroType', 'isActive', 'name', 'orderNum', 'role', 'universe']
                                    }
                                  }).$promise
                                  .then(function(heroData) {
                                    return waterCB(null, heroData);
                                  })
                                  .catch(function (err) {
                                    return waterCB(err);
                                  });
                                }
                              ], function(err, results) {
                                return d.resolve(results);
                              });

                              return d.promise;
                            }],
                            dataMaps: ['Map', function (Map) {
                                return Map.find({}).$promise;
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
                        controller: 'HOTSGuideBuilderMapCtrl',
                        resolve: {
                            userRoles: ['User', function(User) {
                                if (!User.isAuthenticated()) {
                                    return false;
                                } else {
                                    return User.isInRoles({
                                        uid: User.getCurrentId(),
                                        roleNames: ['$admin', '$contentProvider']
                                    })
                                    .$promise
                                    .then(function (userRoles) {
                                        return userRoles;
                                    })
                                    .catch(function (roleErr) {
                                        console.log('roleErr: ', roleErr);
                                    });
                                }
                            }],
                            dataHeroes: ['Hero', function (Hero) {
                                return Hero.find({
                                    filter: {
                                        where: {
                                            isActive: true
                                        }
                                    }
                                }).$promise
                                .then(function (heroes) {
                                    return heroes;
                                });
                            }],
                            dataMaps: ['Map', function (Map) {
                                return Map.find({
                                    filter: {
                                        where: {
                                            isActive: true
                                        }
                                    }
                                }).$promise;
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
                            guide: ['$stateParams', 'Guide', function ($stateParams, Guide) {
                                var guideID = $stateParams.guideID;
                                return Guide.find({
                                    filter: {
                                        where: {
                                            id: guideID
                                        }
                                    }
                                }).$promise;
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
                          dataGuide: ['$stateParams', 'Guide', function ($stateParams, Guide) {
                                return Guide.findOne({
                                    filter: {
                                        where: {
                                            id: $stateParams.guideID
                                        },
                                        include: [
                                            {
                                                relation: 'maps'
                                            },
                                            {
                                                relation: 'guideTalents'
                                            },
                                            {
                                                relation: 'guideHeroes',
                                                scope: {
                                                    include: [
                                                        {
                                                            relation: 'hero',
                                                            scope: {
                                                                include: [
                                                                    {
                                                                        relation: 'talents',
                                                                        scope: {
                                                                            include: [
                                                                                {
                                                                                    relation: 'talent'
                                                                                }
                                                                            ]
                                                                        }
                                                                    }
                                                                ]
                                                            }
                                                        }
                                                    ]
                                                }
                                            }
                                        ]
                                    }
                                }).$promise;
                            }],
                            userRoles: ['User', function(User) {
                                if (!User.isAuthenticated()) {
                                    return false;
                                } else {
                                    return User.isInRoles({
                                        uid: User.getCurrentId(),
                                        roleNames: ['$admin', '$contentProvider']
                                    })
                                    .$promise
                                    .then(function (userRoles) {
                                        return userRoles;
                                    })
                                    .catch(function (roleErr) {
                                        console.log('roleErr: ', roleErr);
                                    });
                                }
                            }],
                            dataHeroes: ['Hero', 'HeroTalent', '$q', function (Hero, HeroTalent, $q) {
                              var d = $q.defer();
                              async.waterfall([
                                function(waterCB) {
                                  Hero.find({
                                    filter: {
                                      where: {
                                        isActive: true
                                      },
                                      fields: ['id', 'className', 'description', 'heroType', 'isActive', 'name', 'orderNum', 'role', 'universe']
                                    }
                                  }).$promise
                                  .then(function(heroData) {
                                    return waterCB(null, heroData);
                                  })
                                  .catch(function (err) {
                                    return waterCB();
                                  });
                                },
                              ], function(err, results) {
                                return d.resolve(results);
                              });

                              return d.promise;
                            }],
                            dataMaps: ['Map', function (Map) {
                                return Map.find({}).$promise;
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
                            userRoles: ['User', function(User) {
                                if (!User.isAuthenticated()) {
                                    return false;
                                } else {
                                    return User.isInRoles({
                                        uid: User.getCurrentId(),
                                        roleNames: ['$admin', '$contentProvider']
                                    })
                                    .$promise
                                    .then(function (userRoles) {
                                        return userRoles;
                                    })
                                    .catch(function (roleErr) {
                                        console.log('roleErr: ', roleErr);
                                    });
                                }
                            }],
                            dataGuide: ['$stateParams', 'Guide', function ($stateParams, Guide) {
                                var guideId = $stateParams.guideID;
                                return Guide.findById({
                                    id: guideId,
                                    filter: {
                                        include: [
                                            {
                                                relation: 'maps'
                                            }
                                        ]
                                    }
                                }).$promise;
                            }],
                            dataHeroes: ['Hero', function (Hero) {
                                return Hero.find({
                                    filter: {
                                        where: {
                                            isActive: true
                                        }
                                    }
                                }).$promise
                                .then(function (heroes) {
                                    return heroes;
                                });
                            }],
                            dataMaps: ['Map', function (Map) {
                                return Map.find({
                                    filter: {
                                        where: {
                                            isActive: true
                                        }
                                    }
                                }).$promise;
                            }]
                        }
                    }
                },
                access: { auth: true, admin: true },
                seo: { title: 'Admin', description: '', keywords: '' }
            })
            .state('app.admin.hots.snapshots', {
                abstract: true,
                url: '/snapshots',
                views: {
                    hots: {
                        templateUrl: tpl + 'views/admin/hots.snapshot.html'
                    }
                },
                access: { auth: true, admin: true },
                seo: { title: 'Admin', description: '', keywords: '' }
            })
            .state('app.admin.hots.snapshots.list', {
                url: '',
                views: {
                    snapshots: {
                        templateUrl: tpl + 'views/admin/hots.snapshot.list.html',
                        controller: 'AdminHOTSSnapshotListCtrl',
                        resolve: {
                            hotsSnapshots: ['HotsSnapshot', function (HotsSnapshot) {
                                return HotsSnapshot.find({
                                    filter: {
                                        order: "snapNum DESC"
                                    }
                                })
                                .$promise
                                .then(function (data) {
                                    console.log(data);
                                    return data;
                                })
                            }]
                        }
                    }
                }
            })
            .state('app.admin.hots.snapshots.snapshot', {
                abstract: true,
                url: '/snapshot/:snapshotId',
                views: {
                    snapshots: {
                        templateUrl: tpl + 'views/admin/hots.snapshot.build.html',
                        controller: 'AdminHOTSSnapshotBuildCtrl',
                        resolve: {
                            //cacheTemplates: ['$templateCache', function ($templateCache) {
                            //    $templateCache.put(tpl + 'views/admin/hots.snapshot.general.html');
                            //    $templateCache.put('authors', tpl + 'views/admin/hots.snapshot.authors.html');
                            //    $templateCache.put(tpl + 'views/admin/hots.snapshot.tierlist.html');
                            //}],
                            hotsSnapshot: ['HotsSnapshot', '$stateParams', function (HotsSnapshot, $stateParams) {
                                var snapshotId = $stateParams.snapshotId;
                                if (!snapshotId)
                                    return;

                                return HotsSnapshot.findById({
                                    id: snapshotId,
                                    filter: {
                                        include: [
                                            {
                                                relation: 'heroTiers',
                                                scope: {
                                                    include: [
                                                        {
                                                            relation: 'hero'
                                                        },
                                                        {
                                                            relation: 'guides',
                                                            scope: {
                                                                include: ['guide']
                                                            }
                                                        }
                                                    ],
                                                    order: 'orderNum ASC'
                                                }
                                            },
                                            {
                                                relation: 'authors',
                                                scope: {
                                                    include: ['user']
                                                }
                                            },
                                            {
                                                relation: 'slugs'
                                            }
                                        ]
                                    }
                                })
                                .$promise
                                .then(function (data) {
                                    return data;
                                })
                            }]
                        }
                    }
                }
            })
            .state('app.admin.hots.snapshots.snapshot.general', {
                url: '',
                views: {
                    "hots-admin-snapshot": {
                        template: "<hots-snapshot-general>"
                    }
                }
            })
            .state('app.admin.hots.snapshots.snapshot.authors', {
                url: '',
                views: {
                    "hots-admin-snapshot": {
                        template: "<hots-snapshot-authors>"
                    }
                }
            })
            .state('app.admin.hots.snapshots.snapshot.tierlist', {
                url: '',
                views: {
                    "hots-admin-snapshot": {
                        template: "<hots-snapshot-tierlist>"
                    }
                }
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
                            categories: ['$q', 'ForumCategory', 'ForumThread', function($q, ForumCategory, ForumThread) {
                                var d = $q.defer();
                                ForumCategory.find({
                                    filter: {
                                        fields: {
                                            id: true,
                                            title: true
                                        }
                                    }
                                }).$promise
                                .then(function (categories) {
                                    async.forEach(categories, function (category, eachCategoryCallback) {
                                        ForumCategory.forumThreads({
                                            id: category.id,
                                            filter: {
                                                fields: {
                                                    id: true,
                                                    title: true
                                                }
                                            }
                                        }).$promise.then(function (threads) {
                                            category.forumThreads = threads;

                                            async.forEach(threads, function (thread, eachThreadCallback) {
                                                ForumThread.forumPosts({
                                                    id: thread.id,
                                                    filter: {
                                                        fields: {
                                                            id: true
                                                        }
                                                    }
                                                }).$promise.then(function (posts) {
                                                    thread.forumPosts = posts;
                                                    return eachThreadCallback();
                                                });
                                            }, function () {
                                                return eachCategoryCallback();
                                            });
                                        });
                                    }, function () {
                                        d.resolve(categories);
                                    });
                                });
                                return d.promise;
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
                            category: ['ForumCategory', '$stateParams', function(ForumCategory, $stateParams) {
                                return ForumCategory.findById({
                                    id: $stateParams.categoryID
                                })
                                .$promise
                                .then(function (category) {
//                                    console.log('category: ', category);
                                    return category;
                                })
                                .catch(function (err) {
//                                    console.log('category: ', err);
                                });

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
                            categories: ['ForumCategory', function(ForumCategory) {
                                return ForumCategory.find({
                                    filter: {
                                        where: {
                                            isActive: true
                                        }
                                    }
                                })
                                .$promise
                                .then(function (allCategories) {
//                                    console.log('allCategories: ', allCategories);
                                    return allCategories;
                                })
                                .catch(function (err) {
                                    console.log('allCategories: ', err);
                                });

                            }]
//                            data: ['AdminForumService', function (AdminForumService) {
//                                return AdminForumService.getCategories();
//                            }]
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
                            thread: ['ForumThread', 'ForumCategory', '$stateParams', function(ForumThread, ForumCategory, $stateParams) {
                                var threadID = $stateParams.threadID;

                                return ForumThread.findById({
                                    id: threadID,
                                    filter: {

                                    }
                                })
                                .$promise
                                .then(function (forumThread) {
                                    return forumThread;
                                })
                                .catch(function (err) {
                                    console.log('err: ', err);
                                });
                            }],

                            categories: ['ForumCategory', function(ForumCategory) {
                                return ForumCategory.find({
                                    filter: {
                                        where: {
                                            isActive: true
                                        }
                                    }
                                })
                                .$promise
                                .then(function (allCategories) {
                                    return allCategories;
                                })
                                .catch(function (err) {
                                    console.log('ForumCategory.find: ', err);
                                });

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
                                    tota: 0,
                                    options: {
                                        filter: {
                                            fields: {
                                                id: true,
                                                username: true,
                                                email: true,
                                                isActive: true
                                            },
                                            limit: 50,
                                            order: 'createdDate DESC'
                                        }
                                    }
                                };
                            }],
                            usersCount: ['User', 'paginationParams', function (User, paginationParams) {
                                return User.count({})
                                .$promise
                                .then(function (usersCount) {
//                                    console.log('usersCount: ', usersCount);
                                    paginationParams.total = usersCount.count;
                                    return usersCount;
                                })
                                .catch(function (err) {
                                    console.log('Users.count err: ',err);
                                });
                            }],
                            users: ['User', 'paginationParams', function (User, paginationParams) {
                                return User.find(
                                    paginationParams.options
                                ).$promise
                                .then(function (allUsers) {
//                                    console.log('allUsers: ', allUsers);
                                    return allUsers;
                                })
                                .catch(function (err) {
                                    console.log('Snapshot.find err: ', err);
                                });
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
                            user: ['$stateParams', 'User', 'userRoles', function ($stateParams, User, userRoles) {
                                var userID = $stateParams.userID;
                                return User.findById({
                                    id: userID
                                })
                                .$promise
                                .then(function (userFound) {
//                                    console.log('userFound: ', userFound);
                                    // attach user roles
                                    userFound.isAdmin = userRoles.isInRoles.$admin;
                                    userFound.isActive = userRoles.isInRoles.$active;
                                    userFound.isProvider = userRoles.isInRoles.$contentProvider;
                                    return userFound;
                                })
                                .catch(function (err) {
//                                    console.log('User.findById err: ', err);
                                    return false;
                                });
                            }],

                            userRoles: ['User', '$stateParams', function(User, $stateParams) {
                                return User.isInRoles({
                                    uid: $stateParams.userID,
                                    roleNames: ['$admin', '$contentProvider', '$active']
                                })
                                .$promise
                                .then(function (userRoles) {
//                                        console.log('userRoles: ', userRoles);
                                    return userRoles;
                                })
                                .catch(function (err) {
//                                        console.log('User.isInRoles err: ', err);
                                });
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
                            paginationParams: [function() {
                                return {
                                    page: 1,
                                    perpage: 50,
                                    options: {
                                        filter: {
                                            fields: {
                                                id: true,
                                                title: true
                                            },
                                            limit: 50,
                                            order: 'createdDate DESC'
                                        }
                                    }
                                };
                            }],
                            pollsCount: ['Poll', 'paginationParams', function (Poll, paginationParams) {
                                return Poll.count({})
                                .$promise
                                .then(function (pollCount) {
                                    paginationParams.total = pollCount.count;
                                    return pollCount;
                                })
                                .catch(function (err) {
                                    console.log('Poll.count err: ',err);
                                });
                            }],
                            polls: ['Poll', 'paginationParams', function (Poll, paginationParams) {
                                return Poll.find(
                                    paginationParams.options
                                ).$promise
                                .then(function (allPolls) {
                                    return allPolls;
                                })
                                .catch(function (err) {
                                    console.log('Poll.find err: ', err);
                                });
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
                            poll: ['$stateParams', 'Poll', function($stateParams, Poll){
                                var pollID = $stateParams.pollID;
                                return Poll.findOne({
                                    filter: {
                                        where: {
                                            id: pollID
                                        },
										include: 'items'
                                    }
                                })
                                .$promise
                                .then(function (data) {
                                    return data;
                                })
                            }]

                        }
                    }
                },
                access: { auth: true, admin: true },
                seo: { title: 'Admin', description: '', keywords: '' }
            })
            .state('app.admin.hearthstone.snapshots', {
                abstract: true,
                url: '/snapshots',
                views: {
                    hearthstone: {
                        templateUrl: tpl + 'views/admin/hs.snapshots.html'
                    }
                },
                access: { auth: true, admin: true },
                seo: { title: 'Admin', description: '', keywords: '' }
            })
            .state('app.admin.hearthstone.snapshots.list', {
                url: '',
                views: {
                    snapshots: {
                        templateUrl: tpl + 'views/admin/hs.snapshots.list.html',
                        controller: 'AdminHearthstoneSnapshotListCtrl',
                        resolve: {
                            paginationParams: [function() {
                                return {
                                    page: 1,
                                    perpage: 50,
                                    total: 0,
                                    options: {
                                        filter: {
                                            limit: 50,
                                            order: 'createdDate DESC',
                                            fields: ['id', 'title', 'snapNum']
                                        }
                                    }
                                };
                            }],
                            snapshotsCount: ['Snapshot', 'paginationParams', 'StateParamHelper', function (Snapshot, paginationParams, StateParamHelper) {
                                return Snapshot.count({}).$promise
                                .then(function (hsSnapshotCount) {
                                    StateParamHelper.validatePage(paginationParams.page, hsSnapshotCount.count, paginationParams.perpage);

                                    paginationParams.total = hsSnapshotCount.count;

                                    return hsSnapshotCount.count;
                                });
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
            .state('app.admin.hearthstone.snapshots.add', {
                url: '/add',
                views: {
                    snapshots: {
                        templateUrl: tpl + 'views/admin/hs.snapshots.add.html',
                        controller: 'AdminHearthstoneSnapshotAddCtrl',
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
            .state('app.admin.hearthstone.snapshots.edit', {
                url: '/:snapshotID',
                views: {
                    snapshots: {
                        templateUrl: tpl + 'views/admin/hs.snapshots.edit.html',
                        controller: 'AdminHearthstoneSnapshotEditCtrl',
                        resolve: {
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

                                    snapshot.deckTiers.sort(function(a,b) { return (a.ranks[0] - b.ranks[0]) });

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
            .state('app.admin.teams', {
                abstract: true,
                url: '/team',
                views: {
                    admin: {
                        templateUrl: tpl + 'views/admin/teams.html'
                    }
                },
                access: { auth: true, admin: true },
                seo: { title: 'Admin', description: '', keywords: '' }
            })
            .state('app.admin.teams.list', {
                url: '',
                views: {
                    teamMembers: {
                        templateUrl: tpl + 'views/admin/teams.list.html',
                        controller: 'AdminTeamListCtrl',
                        resolve: {
                            teams: ['Team', function (Team) {
                                return Team.find({
                                    filter: {
                                        fields: ['id', 'name', 'gameId', 'orderNum'],
                                        order: 'orderNum ASC',
                                        include: [
                                            {
                                                relation: 'teamMembers',
                                                scope: {
                                                    fields: ['id', 'fullName', 'screenName', 'orderNum'],
                                                    order: 'orderNum ASC'
                                                }
                                            },
                                            {
                                                relation: 'game',
                                                scope: {
                                                    fields: ['id', 'name']
                                                }
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
            .state('app.admin.teams.add-team', {
                url: '/add-team',
                views: {
                    teamMembers: {
                        templateUrl: tpl + 'views/admin/teams.add-team.html',
                        controller: 'AdminTeamAddCtrl',
                        resolve: {
                            gameOptions: ['Game', function (Game) {
                                return Game.find({
                                    filter: {
                                        fields: ['id', 'name']
                                    }
                                })
                                .$promise
                                .then(function (games) {
                                    var gameOptions = _.map(games, function (game) {
                                        return {
                                            id: game.id,
                                            name: game.name
                                        };
                                    });
                                    return gameOptions;
                                })
                                .catch(function (err) {
                                    console.log('err:', err);
                                });
                            }]
                        }
                    }
                },
                access: { auth: true, admin: true },
                seo: { title: 'Admin', description: '', keywords: '' }
            })
            .state('app.admin.teams.edit-team', {
                url: '/edit-team/:teamId',
                views: {
                    teamMembers: {
                        templateUrl: tpl + 'views/admin/teams.edit-team.html',
                        controller: 'AdminTeamEditCtrl',
                        resolve: {
                            gameOptions: ['Game', function (Game) {
                                return Game.find({
                                    filter: {
                                        fields: ['id', 'name']
                                    }
                                })
                                .$promise
                                .then(function (games) {
                                    var gameOptions = _.map(games, function (game) {
                                        return {
                                            id: game.id,
                                            name: game.name
                                        };
                                    });
                                    return gameOptions;
                                })
                                .catch(function (err) {
                                    console.log('err:', err);
                                });
                            }],
                            team: ['Team', '$stateParams', function (Team, $stateParams) {
                                return Team.findById({
                                    id: $stateParams.teamId,
                                    filter: {
                                        include: [
                                            {
                                                relation: 'game',
                                                scope: {
                                                    fields: ['id', 'name']
                                                }
                                            }
                                        ]
                                    }
                                })
                                .$promise
                                .then(function (team) {
                                    return team;
                                })
                                .catch(function (err) {
                                    console.log('err:', err);
                                });
                            }]
                        }
                    }
                },
                access: { auth: true, admin: true },
                seo: { title: 'Admin', description: '', keywords: '' }
            })
            .state('app.admin.teams.add-team-member', {
                url: '/add-team-member',
                views: {
                    teamMembers: {
                        templateUrl: tpl + 'views/admin/teams.add-member.html',
                        controller: 'AdminTeamMemberAddCtrl',
                        resolve: {
                            teamOptions: ['Team', function (Team) {
                                return Team.find({
                                    filter: {
                                        fields: ['id', 'name', 'gameId'],
                                        include: [
                                            {
                                                relation: 'game',
                                                scope: {
                                                    fields: ['id', 'name']
                                                }
                                            }
                                        ]
                                    }
                                })
                                .$promise
                                .then(function (teams) {
                                    var teamOptions = _.map(teams, function (team) {
                                        var teamName = team.name ? ' ' + team.name : '',
                                            gameName = team.game.name + teamName;
                                        return {
                                            teamId: team.id,
                                            game: gameName
                                        };
                                    });
                                    return teamOptions;
                                })
                                .catch(function (err) {
                                    console.log('err:', err);
                                });
                            }]
                        }
                    }
                },
                access: { auth: true, admin: true },
                seo: { title: 'Admin', description: '', keywords: '' }
            })
            .state('app.admin.teams.edit-team-member', {
                url: '/edit-team-member/:memberID',
                views: {
                    teamMembers: {
                        templateUrl: tpl + 'views/admin/teams.edit-member.html',
                        controller: 'AdminTeamMemberEditCtrl',
                        resolve: {
                            teamOptions: ['Team', function (Team) {
                                return Team.find({
                                    filter: {
                                        fields: ['id', 'gameId', 'name'],
                                        include: [
                                            {
                                                relation: 'game',
                                                scope: {
                                                    fields: ['id', 'name']
                                                }
                                            }
                                        ]
                                    }
                                }).$promise
                                .then(function (teams) {
                                    var teamOptions = _.map(teams, function (team) {
                                        var teamName = team.name ? ' ' + team.name : '',
                                            gameName = team.game.name + teamName;
                                        return {
                                            teamId: team.id,
                                            game: gameName
                                        };
                                    });
                                    return teamOptions;
                                })
                                .catch(function (err) {
                                    console.log('err:', err);
                                });
                            }],
                            member: ['$stateParams', 'TeamMember', function ($stateParams, TeamMember) {
                                var memberID = $stateParams.memberID;
                                return TeamMember.findById({
                                    id: memberID,
                                })
                                .$promise;
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
                                    total: 0,
                                    options: {
                                        filter: {
                                            limit: perpage,
                                            order: 'createdDate DESC',
                                            fields: ['id', 'subtitle', 'createdDate', 'youtubeId', 'youtubeVars', 'displayDate']
                                        }
                                    }
                                };
                            }],
                            vodsCount: ['Vod', 'paginationParams', function (Vod, paginationParams) {
                                return Vod.count({}).$promise
                                .then(function (vodCount) {
                                    paginationParams.total = vodCount.count;
                                    return vodCount;
                                });
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
                                return Vod.findById({ id: id })
                                .$promise
                                .then(function(data) {
                                    return data;
                                })
                                .catch(function(err) {
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
            })
            .state('app.admin.overwatch.snapshots', {
                abstract: true,
                url: '/snapshots',
                views: {
                    overwatch: {
                        templateUrl: tpl + 'views/admin/overwatch.snapshots.html'
                    }
                },
                access: { auth: true, admin: true },
                seo: { title: 'Admin', description: '', keywords: '' }
            })
            .state('app.admin.overwatch.snapshots.list', {
                url: '',
                views: {
                    snapshots: {
                        templateUrl: tpl + 'views/admin/overwatch.snapshots.list.html',
                        controller: 'AdminOverwatchSnapshotListCtrl',
                        resolve: {
                            paginationParams: [function () {
                                return {
                                    page: 1,
                                    perpage: 50,
                                    total: 0,
                                    options: {
                                        filter: {
                                            limit: 50,
                                            order: 'createdDate DESC',
                                            fields: ['id', 'title', 'snapNum']
                                        }
                                    }
                                }
                            }],
                            owSnapshots: ['OverwatchSnapshot', 'paginationParams', function (OverwatchSnapshot, paginationParams) {
                                return OverwatchSnapshot.find(paginationParams.options)
                                .$promise;
                            }],
                            owSnapshotsCount: ['OverwatchSnapshot', 'paginationParams', function (OverwatchSnapshot, paginationParams) {
                                return OverwatchSnapshot.count().$promise
                                .then(function (snapCount) {
                                    paginationParams.total = snapCount.count;
                                    
                                    return snapCount.count;
                                });
                            }]
                        }
                    }
                },
                access: { auth: true, admin: true },
                seo: { title: 'Admin', description: '', keywords: '' }
            })
            .state('app.admin.overwatch.snapshots.add', {
                url: '/add',
                views: {
                    snapshots: {
                        templateUrl: tpl + 'views/admin/overwatch.snapshots.snapshot.html',
                        controller: 'AdminOverwatchSnapshotAddCtrl',
                        resolve: {
                            owHeroes: ['OverwatchHero', function (OverwatchHero) {
                                return OverwatchHero.find({
                                    filter: {
                                        where: {
                                            isActive: true
                                        },
                                        fields: [
                                            'heroName'
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
            .state('app.hots.guides.guide_new', {
                url: '/new/:slug',
                views: {
                    guides: {
                        templateUrl: tpl + 'views/frontend/hots.guides.guide_new.html',
                        controller: 'HOTSGuideCtrl',
                        resolve: {
                            userRoles: ['User', function(User) {
                                if (!User.isAuthenticated()) {
                                    return false;
                                } else {
                                    return User.isInRoles({
                                        uid: User.getCurrentId(),
                                        roleNames: ['$admin', '$contentProvider', '$premium']
                                    })
                                    .$promise
                                    .then(function (userRoles) {
                                        console.log('userRoles: ', userRoles);
                                        return userRoles;
                                    })
                                    .catch(function (roleErr) {
                                        console.log('roleErr: ', roleErr);
                                    });
                                }
                            }],
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
                                            relation: 'author'
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
                                                  include: [
                                                    {
                                                      relation: 'talents',
                                                      scope: {
                                                        include: {
                                                          relation: 'talent',
                                                          scope: {
                                                            fields: ['orderNum']
                                                          }
                                                        }
                                                      }
                                                    }
                                                  ]
                                                }
                                              }
                                            ]
                                          }
                                        },
                                        {
                                          relation: 'guideTalents',
                                          scope: {
                                            include: ['talent']
                                          }
                                        },
                                        {
                                          relation: 'maps'
                                        },
                                        {
                                          relation: 'comments',
                                          scope: {
                                            include: ['author']
                                          }
                                        }
                                      ]
                                    }
                                }).$promise.then(function (data) {
                                    console.log("tojson", data.toJSON());
                                    return data;
                                })
                                .catch(function (err) {
                                    console.log('err: ', err);
                                });
                            }],
                            heroes: ['Hero', function(Hero) {

                                return Hero.find({
                                  filter: {
                                    fields: {
                                      oldTalents: false,
                                      oldAbilities: false
                                    }
                                  }
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
                access: { auth: true, admin: true },
                seo: { title: 'Admin', description: '', keywords: '' },
                og: true
            })
            .state("app.otherwise", {
                url: "*path",
                views: {
                    content: {
                        templateUrl: tpl + 'views/frontend/404.html'
                    }
                }
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
