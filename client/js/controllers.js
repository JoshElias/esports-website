'use strict';

angular.module('app.controllers', ['ngCookies'])
    .controller('AppCtrl', ['$scope', '$localStorage', '$cookies', '$window', '$location', 'User', '$rootScope',
        function($scope, $localStorage, $cookies, $window, $location, User, $rootScope) {

            // config
            $rootScope.app = {
                name : 'TempoStorm',
                version : "4.2.0",
                copyright : new Date().getFullYear(),
                cdn : (tpl && tpl.length) ? tpl : './',
                settings: {
                    deck: null,
                    show: {
                        deck: null,
                        article: null,
                        decks: null
                    },
                    secondaryPortrait: []
                }
            };
            $scope.app = $rootScope.app;


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
            $scope.$watch('app.settings', function() {
                $localStorage.settings = $scope.app.settings;
            }, true);

        }])
    .controller('RootCtrl', ['$scope', '$cookies', 'LoginModalService', 'LoopBackAuth', 'User', 'currentUser',
        function ($scope, $cookies, LoginModalService, LoopBackAuth, User, currentUser) {

        $scope.$watch(function() { return LoopBackAuth.currentUserData; }, function (newUserData) {
          $scope.currentUser = newUserData;
        }, true);


        $scope.loginModal = function (state) {
            LoginModalService.showModal(state, function (data) {
            });
        }

        $scope.logout = function() {
            User.logout(function() {
            }, function(err) {
                console.log("error logging out:", err);
            });
        }
    }])
    .controller('404Ctrl', ['$scope', 'MetaService', function($scope, MetaService) {
        MetaService.setStatusCode(404);
    }])
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
    .controller('UserResetPasswordCtrl', ['$scope', '$state', '$stateParams', '$location', 'User',
        function ($scope, $state, $stateParams, $location, User) {

            $scope.reset = {
                password: '',
                cpassword: ''
            };

            $scope.resetPassword = function() {
              var email = $location.search().email;
              var token = $location.search().token;
              User.changePassword({email: email, token: token, password: $scope.reset.password})
                .$promise
                .then(function (data) {
                  AlertService.setSuccess({show: true, msg: 'Your password has been reset successfully.'});
                  $state.transitionTo('app.login', {});
                })
                .catch(function (err) {
                  $scope.errors = err;
                  $scope.showError = true;
                });
            }
        }
    ])
    .controller('HomeCtrl', ['$scope', '$sce', 'articles', 'articlesTotal', 'Article',
        function ($scope, $sce, articles, articlesTotal, Article) {
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
                total: articlesTotal.count,
                data: articles
            };

            // articles
            $scope.getArticleDesc = function (desc, limit) {
                var words = desc.split(' ');
                return desc;//(words.length > limit) ? words.slice(0, limit).join(' ') + '...' : words.join(' ');
            };

            $scope.isArticleActive = function (index) {
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

                        Article.find({
                            filter: {
                                where: {
                                    isActive: true
                                },
                                fields: {
                                    content: false,
                                    votes: false
                                },
                                order: "createdDate DESC",
                                skip: $scope.articles.data.length,
                                limit: num
                            }
                        }).$promise.then(function (data) {
                                $scope.articles.data = $scope.articles.data.concat(data);
                                $scope.articles.offset += num;
                                $scope.articles.loading = false;
                            });
                    }
                }
            };
        }
    ])
    .controller('HearthstoneHomeCtrl', ['$scope', '$timeout', 'dataArticles', 'dataDecksCommunity', 'dataDecksTempostorm', 'Article', 'Deck', 'Hearthstone',
        function ($scope, $timeout, dataArticles, dataDecksCommunity, dataDecksTempostorm, Article, Deck, Hearthstone) {
            // data
            $scope.articles = dataArticles;
            $scope.tempostormDecks = dataDecksTempostorm;
            $scope.communityDecks = dataDecksCommunity;
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
                var options = {
                    filter: {
                        limit: 6,
                        where: {
                            articleType: ['hs']
                        },
                        fields: {
                            content: false
                        }
                    }
                };

                if($scope.filters.classes.length > 0) {
                    options.filter.where.classTags = {
                        inq: $scope.filters.classes
                    }
                } else {
                    options.filter.where.classTags = {
                        inq: ['Druid', 'Hunter', 'Mage', 'Paladin', 'Priest', 'Rogue', 'Shaman', 'Warlock', 'Warrior']
                    }
                }

                Article.find(options).$promise.then(function (data) {
                    $timeout(function () {
                        $scope.articles = data;
                    });
                });
            }

            // update decks
            function updateTempostormDecks (page, perpage) {

                var options = {
                    filter: {
                        limit: 10,
                        where: {
                            isFeatured: true
                        },
                        fields: {
                            name: true,
                            authorId: true,
                            description: true,
                            playerClass: true,
                            premium: true,
                            voteScore: true,
                            heroName: true
                        },
                        include: ['author']
                    }
                };

                if($scope.filters.classes.length > 0) {
                    options.filter.where.playerClass = {
                        inq: $scope.filters.classes
                    }
                } else {
                    options.filter.where.playerClass = {
                        inq: ['Druid', 'Hunter', 'Mage', 'Paladin', 'Priest', 'Rogue', 'Shaman', 'Warlock', 'Warrior']
                    }
                }

                Deck.find(options).$promise.then(function (data) {
                    $timeout(function () {
                        $scope.tempostormDecks = data;
                    });
                });
            }

            function updateCommunityDecks (page, perpage) {
                var options = {
                    filter: {
                        limit: 10,
                        where: {
                            isFeatured: false
                        },
                        fields: {
                            name: true,
                            authorId: true,
                            description: true,
                            playerClass: true,
                            premium: true,
                            voteScore: true,
                            heroName: true
                        },
                        include: ['author']
                    }
                };

                if($scope.filters.classes.length > 0) {
                    options.filter.where.playerClass = {
                        inq: $scope.filters.classes
                    }
                } else {
                    options.filter.where.playerClass = {
                        inq: ['Druid', 'Hunter', 'Mage', 'Paladin', 'Priest', 'Rogue', 'Shaman', 'Warlock', 'Warrior']
                    }
                }

                Deck.find(options).$promise.then(function (data) {
                    $timeout(function () {
                        $scope.communityDecks = data;
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
    .controller('ProfileCtrl', ['$scope', 'profile', 'postCount', 'deckCount', 'guideCount', 'MetaService', 'HOTSGuideService', 'LoopBackAuth',
        function ($scope, profile, postCount, deckCount, guideCount, MetaService, HOTSGuideService, LoopBackAuth) {
            $scope.user = profile;

            $scope.postCount = postCount.count;
            $scope.deckCount = deckCount.count;
            $scope.guideCount = guideCount.count;



            function isMyProfile() {
                if(LoopBackAuth.currentUserId == $scope.user.username) {
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
    .controller('ProfileEditCtrl', ['$scope', '$state', '$cookies', 'AlertService', 'user',
        function ($scope, $state, $cookies, AlertService, user) {
            console.log(user);
            
            $scope.user = user;
            
            $scope.testString = function (str) {
                var pattern = /[.*/.*,.*\s+$.*]/,
                    word = $scope.user.social[str];
                
                console.log(pattern.test(word));
                return pattern.test(word);
            }
            
            $scope.linkTwitch = function () {
                var ip = location.host;
            }
            
            $scope.twitchLink = function () {
                  thirdPartyLogin('twitch');
                };

            $scope.bnetLink = function () {
              thirdPartyLogin("bnet");
            };

            function thirdPartyLogin(provider) {
                var redirectObj = {
                    name: $state.current.name,
                    params: $state.params
                }
                var ip = location.host;
                
                $cookies.put("redirectStateString", JSON.stringify(redirectObj));
                window.location.replace(ip + "/link/" + provider);
            }
//
//            // grab alerts
//            if (AlertService.hasAlert()) {
//                $scope.success = AlertService.getSuccess();
//                AlertService.reset();
//            }

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
.controller('ProfileActivityCtrl', ['$scope', '$sce', 'activities', 'activityCount', 'Activity', 'HOTSGuideService', 'DeckService', 'LoopBackAuth',
    function ($scope, $sce, activities, activityCount, Activity, HOTSGuideService, DeckService, LoopBackAuth) {

        $scope.activities = activities;
        $scope.total = activityCount.count;
        $scope.filterActivities = ['comments','articles','decks','guides','forumposts'];
        $scope.LoopBackAuth = LoopBackAuth;
        var queryFilter = [],
            filters = {
                comments: [
                    'articleComment',
                     'deckComment',
                     'forumComment',
                     'guideComment',
                     'snapshotComment'
                ],
                articles: ['createArticle'],
                decks: ['createDeck'],
                guides: ['createGuide'],
                forumposts: ['createPost']
            }
        
        console.log($scope.activities);

//        $scope.getActivityType = function (activity) {
//            switch (activity.activityType) {
//                case 'articleComment':
//                case 'deckComment':
//                case 'forumComment':
//                case 'guideComment':
//                case 'snapshotComment':
//                    return 'comments'; break;
//                case 'createArticle':
//                    return 'articles'; break;
//                case 'createDeck':
//                    return 'decks'; break;
//                case 'createGuide':
//                    return 'guides'; break;
//                case 'forumPost':
//                    return 'forumposts'; break;
//            }
//        }

        $scope.isFiltered = function (type) {
            for (var i = 0; i < $scope.filterActivities.length; i++) {
                if ($scope.filterActivities[i] == type) {
                    return true;
                }
            }
            return false;
        }

        $scope.toggleFilter = function (filter) {
            
            
            for (var i = 0; i < $scope.filterActivities.length; i++) {
                if (filter == $scope.filterActivities[i]) {
                    $scope.filterActivities.splice(i,1);
                    buildFilter();
                    $scope.loadActivities(true);
                    console.log("TRUE toggle filter", filter, $scope.filterActivities);
                    return;
                }
            }
            $scope.filterActivities.push(filter);
            buildFilter();
            console.log("FALSE toggle filter", filter, $scope.filterActivities);
            $scope.loadActivities(true);
        }

        var buildFilter = function () {
            queryFilter = [];
            for (var i = 0; i < $scope.filterActivities.length; i++) {
                for (var j = 0; j < filters[$scope.filterActivities[i]].length; j++) {
                    queryFilter.push(filters[$scope.filterActivities[i]][j]);
                }
            }
        }

        $scope.loadActivities = function (isFilter) {
            var options = {
                    filter: {
                        order: "createdDate DESC",
                        limit: (!isFilter) ? 3 : $scope.activities.length,
                        skip: $scope.activities.length,
                        where: {
                            authorId: $scope.user.id,
                            isActive: true
                        },
                        include: [
                            {
                                relation: 'article'
                            },
                            {
                                relation: 'deck'
                            }
                        ]
                    }
                }

            if (isFilter) {
                options.filter.where = {
                    authorId: $scope.user.id,
                    isActive: true,
                    activityType: { inq : queryFilter }
                }
            }

            Activity.find(options)
            .$promise
            .then(function (data) {
                console.log(data);
                $scope.activities = $scope.activities.concat(data);
            });
        }

        $scope.activities.forEach(function (activity) {
            activity.getActivity = function () {
                return $sce.trustAsHtml(activity.activity);
            };
        });

//            $scope.loadActivities = function () {
//                Activity.find({
//                    filter: {
//                        order: "createdDate DESC",
//                        limit: 3,
//                        skip: $scope.activities.length,
//                        where: {
//                            authorId: $scope.user.id,
//                            active: true
//                        },
//                        include: [
//                            {
//                                relation: 'article'
//                            },
//                            {
//                                relation: 'deck'
//                            }
//                        ]
//                    }
//                })
//                .$promise
//                .then(function (data) {
//                    console.log("activity data:", data);
//                    $scope.activities = $scope.activities.concat(data);
//                })
//                .catch(function (err) {
//                    console.log("err loading activity data:", err);
//                });
//            }

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
    .controller('ProfileArticlesCtrl', ['$scope', 'articles',
        function ($scope, articles) {
            $scope.articles = articles;
        }
    ])
    .controller('ProfileDecksCtrl', ['$scope', '$state', 'bootbox', 'DeckService', 'decks',
        function ($scope, $state, bootbox, DeckService, decks) {
            $scope.decks = decks;

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
    .controller('ProfileGuidesCtrl', ['$scope', '$state', 'bootbox', 'HOTSGuideService', 'guides',
        function ($scope, $state, bootbox, HOTSGuideService, guides) {
            $scope.guides = guides;

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
    .controller('AdminCardListCtrl', ['$scope', 'bootbox', 'Util', 'Hearthstone', 'AdminCardService', 'AlertService', 'Pagination', 'cards',
        function ($scope, bootbox, Util, Hearthstone, AdminCardService, AlertService, Pagination, cards) {

            // grab alerts
            if (AlertService.hasAlert()) {
                $scope.success = AlertService.getSuccess();
                AlertService.reset();
            }

            // load cards
            $scope.cards = cards;

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
    .controller('AdminArticleAddCtrl', ['$scope', '$state', '$window', '$compile', 'bootbox', 'Hearthstone', 'Util', 'AlertService', 'heroes', 'LoopBackAuth', 'Guide', 'Article', 'User', 'Hero', 'Deck', 'ArticleArticle',
        function ($scope, $state, $window, $compile, bootbox, Hearthstone, Util, AlertService, heroes, LoopBackAuth, Guide, Article, User, Hero, Deck, ArticleArticle) {
            // default article
            var d = new Date();
            d.setMonth(d.getMonth()+1);
            console.log("date", d, typeof d);
            var defaultArticle = {
                    author: LoopBackAuth.currentUserData,
                    title : '',
                    slug: {
                        url: '',
                        linked: true
                    },
                    description: '',
                    content: '',
                    photoNames: {
                        large: '',
                        medium: '',
                        small: '',
                        square: ''
                    },
                    deck: undefined,
                    guide: undefined,
                    related: [],
                    classTags: [],
                    themeName: 'none',
                    isFeatured: false,
                    premium: {
                        isPremium: false,
                        expiryDate: d
                    },
                    articleType: [],
                    isActive: true
                },
                deckID,
                itemAddBox;

            $scope.search = '';


            //search functions
            function escapeStr( str ) {
                return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
            }


            //search functions
            $scope.getDecks = function (cb) {
                console.log($scope.search);
                
                var options = {
                    filter: {
                        limit: 10,
                        order: "createdDate DESC",
                        fields: ["name", "id"]
                    }
                }
                
                if($scope.search) {
                    console.log("yep");
                    options.filter.where = {
                        or: [
                            {name: { regexp: $scope.search }},
                            {slug: { regexp: $scope.search }}
                        ]
                    }
                }
                
                Deck.find(options)
                    .$promise
                    .then(function (data) {
                    console.log(data);
                    
                    $scope.decks = data;
                    if (cb !== undefined) { return cb(); }
                });
            }

            $scope.getArticles = function (cb) {
                var options = {
                    filter: {
                        limit: 10,
                        order: "createdDate DESC",
                        fields: ["title", "id", "photoNames"]
                    }
                }
                
                if($scope.search) {
                    options.filter.where = {
                        or: [
                            {title: { regexp: $scope.search }},
                            {slug: { regexp: $scope.search }}
                        ]
                    }
                }
                
                Article.find(options)
                    .$promise
                    .then(function (data) {
                    console.log(data);
                    $scope.articles = data;
                    if (cb !== undefined) { return cb(); }
                });
            }

            $scope.getGuides = function (cb) {
                var options = {
                    filter: {
                        limit: 10,
                        order: "createdDate DESC",
                        fields: ["name", "id"]
                    }
                }
                
                if($scope.search) {
                    options.filter.where = {
                        or: [
                            {name: { regexp: $scope.search }},
                            {slug: { regexp: $scope.search }}
                        ]
                    }
                }
                
                Guide.find(options)
                    .$promise
                    .then(function (data) {
                    $scope.guides = data;
                    if (cb !== undefined) { return cb(); }
                });
            }
            
            $scope.getUsers = function (cb) {
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
                
                if($scope.search) {
                    options.filter.where = {
                        or: [
                            {username: { regexp: $scope.search }}
                        ]
                    }
                }
                
                User.find(options)
                    .$promise
                    .then(function (data) {
                    console.log(data);
                    $scope.users = data;
                    if (cb !== undefined) { return cb(); }
                });
            }
            //!search functions
            
            $scope.openAuthors = function () {
                $scope.getUsers(function () {
                    itemAddBox = bootbox.dialog({
                        message: $compile('<div article-author-add></div>')($scope),
                        closeButton: true,
                        animate: true,
                    });
                    itemAddBox.modal('show');
                    itemAddBox.on('hidden.bs.modal', function () { //We want to clear the search results when we close the bootbox
                        $scope.search = '';
                    });
                });
            }
            
            $scope.setAuthor = function (user) {
                $scope.article.author = (user) ? user : undefined;
                $scope.search = '';
                itemAddBox.modal('hide');
            }
            
            
            $scope.openDecks = function () {
                $scope.getDecks(function () {
                    itemAddBox = bootbox.dialog({
                        message: $compile('<div article-deck-add></div>')($scope),
                        closeButton: true,
                        animate: true,
                    });
                    itemAddBox.modal('show');
                    itemAddBox.on('hidden.bs.modal', function () { //We want to clear the search results when we close the bootbox
                        $scope.search = '';
                    });
                });
            }
            
            $scope.setDeck = function (deck) {
                $scope.article.deck = (deck) ? deck : undefined;
            }
            
            
            $scope.openGuides = function () {
                $scope.getGuides(function () {
                    itemAddBox = bootbox.dialog({
                        message: $compile('<div article-guide-add></div>')($scope),
                        closeButton: true,
                        animate: true,
                    });
                    itemAddBox.modal('show');
                    itemAddBox.on('hidden.bs.modal', function () { //We want to clear the search results when we close the bootbox
                        $scope.search = '';
                    });
                });
            }
            
            $scope.setGuide = function (guide) {
                $scope.article.guide = (guide) ? guide : undefined;
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
                $scope.getArticles(function () {
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
                });
            }

            $scope.isRelated = function (a) {
                for (var i = 0; i < $scope.article.related.length; i++) {
                    if (a.id == $scope.article.related[i].id) {
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
                    if (a.id === $scope.article.related[i].id) {
                        $scope.article.related.splice(i, 1);
                    }
                }
            }

            // load article
            $scope.article = angular.copy(defaultArticle);

            // load decks
//            $scope.decks = dataDecks.decks;

            // load guides
//            $scope.guides = [{_id: undefined, name: 'No Guide'}].concat(dataGuides.guides);

            // load articles
//            $scope.articles = dataArticles.articles;

            // load providers
//            $scope.providers = dataProviders.users;

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
                    for (var i = 0; i < heroes.length; i++) {
                        out.push(heroes[i].name);
                    }
                    return out;
                }
            };

            // article types
            $scope.articleTypes = [
                { name: 'Tempo Storm', value: 'ts' },
                { name: 'Hearthstone', value: 'hs' },
                { name: 'Heroes of the Storm', value: 'hots' },
                { name: 'Overwatch', value: 'overwatch' }
            ];

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

//            // photo upload
//            $scope.photoUpload = function ($files) {
//                if (!$files.length) return false;
//                var box = bootbox.dialog({
//                    message: $compile('<div class="progress progress-striped active" style="margin-bottom: 0px;"><div class="progress-bar" role="progressbar" aria-valuenow="{{uploading}}" aria-valuemin="0" aria-valuemax="100" style="width: {{uploading}}%;"><span class="sr-only">{{uploading}}% Complete</span></div></div>')($scope),
//                    closeButton: false,
//                    animate: false
//                });
//                $scope.uploading = 0;
//                box.modal('show');
//                for (var i = 0; i < $files.length; i++) {
//                    var file = $files[i];
//                    $scope.upload = $upload.upload({
//                        url: '/api/admin/upload/article',
//                        method: 'POST',
//                        file: file
//                    }).progress(function(evt) {
//                        $scope.uploading = parseInt(100.0 * evt.loaded / evt.total);
//                    }).success(function(data, status, headers, config) {
//                        $scope.article.photos = {
//                            large: data.large,
//                            medium: data.medium,
//                            small: data.small,
//                            square: data.square
//                        };
//                        $scope.cardImg = $scope.app.cdn + data.path + data.small;
//                        box.modal('hide');
//                    });
//                }
//            };


            $scope.getImage = function () {
                $scope.imgPath = 'articles/';
                if (!$scope.article.photoNames) { return 'img/blank.png'; }
                return ($scope.article.photoNames && $scope.article.photoNames.small === '') ?  $scope.app.cdn + 'img/blank.png' : $scope.app.cdn + $scope.imgPath + $scope.article.photoNames.small;
            };


            $scope.addArticle = function () {
                console.log($scope.article);
                var date = new Date();
                
                $scope.article.createdDate = d.toISOString();
                
                $scope.article.authorId = $scope.article.author.id;
                $scope.article.createdDate = new Date
                if($scope.article.deck) {
                    $scope.article.deckId = $scope.article.deck.id;
                } else if ($scope.article.guide) {
                    $scope.article.guideId = $scope.article.guide.id;
                }
                
                $scope.showError = false;
                Article.upsert({}, $scope.article)
                .$promise
                .then(function (data) {
                    async.each($scope.article.related, function (related, relatedCb) {
                        var relatedClean = {};
                        
                        relatedClean.parentArticleId = data.id;
                        relatedClean.childArticleId = related.id;
                        
                        ArticleArticle.upsert({}, relatedClean)
                        .$promise
                        .then(function () {
                            return relatedCb();
                        });
                    });
                    
                    AlertService.setSuccess({ show: true, msg: $scope.article.title + ' has been added successfully.' });
                    $state.go('app.admin.articles.list');
                });
            };
        }
    ])
    .controller('AdminArticleEditCtrl', ['$scope', '$state', '$window', '$compile', '$filter', 'bootbox', 'Hearthstone', 'Util', 'AlertService', 'Article', 'Deck', 'Guide', 'article',
        function ($scope, $state, $window, $compile, $filter, bootbox, Hearthstone, Util, AlertService, Article, Deck, Guide, article) {
            var itemAddBox,
                deckID;
            
            console.log(article);

            // load article
            $scope.article = article;

//            // load decks
//            $scope.decks = [{_id: undefined, name: 'No deck'}].concat(dataDecks.decks);
//
//            // load guides
//            $scope.guides = [{_id: undefined, name: 'No Guide'}].concat(dataGuides.guides);
//
//            // load articles
//            $scope.articles = dataArticles.articles;
//
//            // load providers
//            $scope.providers = dataProviders.users;

            $scope.search = '';

            //search functions
            function escapeStr( str ) {
                return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
            }


            //search functions
            $scope.getDecks = function (cb) {
                var options = {
                    filter: {
                        limit: 10,
                        order: "createdDate DESC",
                        fields: ["name", "id"]
                    }
                }
                
                if($scope.search) {
                    options.where = {
                        or: [
                            {name: { regexp: $scope.search }},
                            {slug: { regexp: $scope.search }}
                        ]
                    }
                }
                
                Deck.find(options)
                    .$promise
                    .then(function (data) {
                    $scope.decks = data;
                    if (cb !== undefined) { return cb(); }
                });
            }

            $scope.getArticles = function (cb) {
                var options = {
                    filter: {
                        limit: 10,
                        order: "createdDate DESC",
                        fields: ["title", "id", "photoNames"]
                    }
                }
                
                if($scope.search) {
                    options.where = {
                        or: [
                            {title: { regexp: $scope.search }},
                            {slug: { regexp: $scope.search }}
                        ]
                    }
                }
                
                Article.find(options)
                    .$promise
                    .then(function (data) {
                    $scope.articles = data;
                    if (cb !== undefined) { return cb(); }
                });
            }

            $scope.getGuides = function (cb) {
                var options = {
                    filter: {
                        limit: 10,
                        order: "createdDate DESC",
                        fields: ["name", "id"]
                    }
                }
                
                if($scope.search) {
                    options.where = {
                        or: [
                            {name: { regexp: $scope.search }},
                            {slug: { regexp: $scope.search }}
                        ]
                    }
                }
                
                Guide.find(options)
                    .$promise
                    .then(function (data) {
                    $scope.guides = data;
                    if (cb !== undefined) { return cb(); }
                });
            }
            
            $scope.getUsers = function (cb) {
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
                
                if($scope.search) {
                    options.where = {
                        or: [
                            {name: { regexp: $scope.search }},
                            {slug: { regexp: $scope.search }}
                        ]
                    }
                }
                
                User.find(options)
                    .$promise
                    .then(function (data) {
                    $scope.users = data;
                    if (cb !== undefined) { return cb(); }
                });
            }
            //!search functions
            
            $scope.openAuthors = function () {
                $scope.getUsers(function () {
                    itemAddBox = bootbox.dialog({
                        message: $compile('<div article-author-add></div>')($scope),
                        closeButton: true,
                        animate: true,
                    });
                    itemAddBox.modal('show');
                    itemAddBox.on('hidden.bs.modal', function () { //We want to clear the search results when we close the bootbox
                        $scope.search = '';
                    });
                });
            }
            
            $scope.setAuthor = function (user) {
                $scope.article.author = (user) ? user : undefined;
                $scope.search = '';
                itemAddBox.modal('hide');
            }
            
            
            $scope.openDecks = function () {
                $scope.getDecks(function () {
                    itemAddBox = bootbox.dialog({
                        message: $compile('<div article-deck-add></div>')($scope),
                        closeButton: true,
                        animate: true,
                    });
                    itemAddBox.modal('show');
                    itemAddBox.on('hidden.bs.modal', function () { //We want to clear the search results when we close the bootbox
                        $scope.search = '';
                    });
                });
            }
            
            $scope.setDeck = function (deck) {
                $scope.article.deck = (deck) ? deck : undefined;
            }
            
            
            $scope.openGuides = function () {
                $scope.getDecks(function () {
                    itemAddBox = bootbox.dialog({
                        message: $compile('<div article-guide-add></div>')($scope),
                        closeButton: true,
                        animate: true,
                    });
                    itemAddBox.modal('show');
                    itemAddBox.on('hidden.bs.modal', function () { //We want to clear the search results when we close the bootbox
                        $scope.search = '';
                    });
                });
            }
            
            $scope.setGuide = function (guide) {
                $scope.article.guide = (guide) ? guide : undefined;
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
                    if (a.id == $scope.article.related[i].id) {
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
                    if (a.id === $scope.article.related[i].id) {
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
            $scope.cardImg = getCardImg();
            
            function getCardImg () {
                if (!$scope.article.photoNames) {
                   return $scope.app.cdn + 'img/blank.png'
                } else if ($scope.article.photoNames.small && $scope.article.photoNames.small.length) {
                    return $scope.app.cdn + 'articles/' + $scope.article.photoNames.small;
                }
            }
            
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
                    for (var i = 0; i < heroes.length; i++) {
                        out.push(heroes[i].name);
                    }
                    return out;
                }
            };

            // article types
            $scope.articleTypes = [
                    { name: 'Tempo Storm', value: 'ts' },
                    { name: 'Hearthstone', value: 'hs' },
                    { name: 'Heroes of the Storm', value: 'hots' },
                    { name: 'Overwatch', value: 'overwatch' }
                ];

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

//            // photo upload
//            $scope.photoUpload = function ($files) {
//                if (!$files.length) return false;
//                var box = bootbox.dialog({
//                    message: $compile('<div class="progress progress-striped active" style="margin-bottom: 0px;"><div class="progress-bar" role="progressbar" aria-valuenow="{{uploading}}" aria-valuemin="0" aria-valuemax="100" style="width: {{uploading}}%;"><span class="sr-only">{{uploading}}% Complete</span></div></div>')($scope),
//                    closeButton: false,
//                    animate: false
//                });
//                $scope.uploading = 0;
//                box.modal('show');
//                for (var i = 0; i < $files.length; i++) {
//                    var file = $files[i];
//                    $scope.upload = $upload.upload({
//                        url: '/api/admin/upload/article',
//                        method: 'POST',
//                        file: file
//                    }).progress(function(evt) {
//                        $scope.uploading = parseInt(100.0 * evt.loaded / evt.total);
//                    }).success(function(data, status, headers, config) {
//                        $scope.article.photos = {
//                            large: data.large,
//                            medium: data.medium,
//                            small: data.small,
//                            square: data.square
//                        };
//                        $scope.cardImg = $scope.app.cdn + data.path + data.small;
//                        box.modal('hide');
//                    });
//                }
//            };

            $scope.getImage = function () {
                $scope.imgPath = 'articles/';
                if (!$scope.article.photoNames) { return 'img/blank.png'; }
                return ($scope.article.photoNames && $scope.article.photoNames.small === '') ?  $scope.app.cdn + 'img/blank.png' : $scope.app.cdn + $scope.imgPath + $scope.article.photoNames.small;
            };

            $scope.editArticle = function () {
                $scope.showError = false;
                Article.upsert({}, $scope.article)
                .$promise
                .then(function (data) {
                    AlertService.setSuccess({ show: true, msg: $scope.article.title + ' has been updated successfully.' });
                    $state.go('app.admin.articles.list');
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
    .controller('AdminArticleListCtrl', ['$scope', '$q', '$timeout', 'AdminArticleService', 'AlertService', 'AjaxPagination', 'paginationParams', 'articles', 'articlesCount', 'Article',
        function ($scope, $q, $timeout, AdminArticleService, AlertService, AjaxPagination, paginationParams, articles, articlesCount, Article) {

            // grab alerts
            if (AlertService.hasAlert()) {
                $scope.success = AlertService.getSuccess();
                AlertService.reset();
            }

            // load articles
            $scope.articles = articles;
            $scope.page = paginationParams.page;
            $scope.perpage = paginationParams.perpage;
            $scope.total = articlesCount.count;
            $scope.search = '';

            $scope.searchArticles = function() {
                updateArticles(1, $scope.perpage, $scope.search, false);
            };

            // pagination
            function updateArticles (page, perpage, search, callback) {
                $scope.fetching = true;

                var options = {},
                    countOptions = {};

                options.filter = {
                    fields: paginationParams.options.filter.fields,
                    order: "createdDate DESC",
                    skip: ((page*perpage)-perpage),
                    limit: perpage
                };

                if ($scope.search.length > 0) {
                    options.filter.where = {
                        or: [
                            { title: { regexp: search } },
                            { description: { regexp: search } },
                            { content: { regexp: search } }
                        ]
                    }
                    countOptions.where = {
                        or: [
                            { title: { regexp: search } },
                            { description: { regexp: search } },
                            { content: { regexp: search } }
                        ]
                    }
                }

                Article.count(countOptions, function (count) {
                    Article.find(options, function (articles) {
                        $scope.articlePagination.total = count.count;
                        $scope.articlePagination.page = page;
                        $scope.articlePagination.perpage = perpage;

                        $timeout(function () {
                            $scope.articles = articles;
                            $scope.fetching = false;
                            if (callback) {
                                return callback(count.count);
                            }
                        });
                    });
                });
            }

            // page flipping
            $scope.articlePagination = AjaxPagination.new($scope.perpage, $scope.total,
                function (page, perpage) {
                    var d = $q.defer();

                    updateArticles(page, perpage, $scope.search, function (data) {
                        d.resolve(data);
                    });
                    return d.promise;
                }
            );

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
                                Article.deleteById({ id: article.id }).$promise.then(function (data) {
                                    if (data.$resolved) {
                                        var indexToDel = $scope.articles.indexOf(article);
                                        if (indexToDel !== -1) {
                                            $scope.articles.splice(indexToDel, 1);
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
            };

        }
    ])
    .controller('AdminSnapshotListCtrl', [ '$scope', '$q', '$timeout', 'snapshotsCount', 'snapshots', 'paginationParams', 'AlertService', 'Snapshot', 'AjaxPagination', 'DeckTier', 'DeckTech', 'CardTech',
        function ($scope, $q, $timeout, snapshotsCount, snapshots, paginationParams, AlertService, Snapshot, AjaxPagination, DeckTier, DeckTech, CardTech) {

            // grab alerts
            if (AlertService.hasAlert()) {
                $scope.success = AlertService.getSuccess();
                AlertService.reset();
            }

            // load snapshots
            $scope.snapshots = snapshots;
            $scope.page = paginationParams.page;
            $scope.perpage = paginationParams.perpage;
            $scope.total = snapshotsCount.count;
            $scope.search = '';

            $scope.searchSnapshots = function() {
                updateSnapshots(1, $scope.perpage, $scope.search, false);
            };

            // pagination
            function updateSnapshots (page, perpage, search, callback) {
                $scope.fetching = true;

                var options = {},
                    countOptions = {};

                options.filter = {
                    fields: paginationParams.options.filter.fields,
                    order: "createdDate DESC",
                    skip: ((page*perpage)-perpage),
                    limit: paginationParams.perpage
                };

                if ($scope.search.length > 0) {
                    options.filter.where = {
                        or: [
                            { title: { regexp: search } },
                            { content: { regexp: search } }
                        ]
                    }
                    countOptions.where = {
                        or: [
                            { title: { regexp: search } },
                            { content: { regexp: search } }
                        ]
                    }
                }

                Snapshot.count(countOptions, function (count) {
                    Snapshot.find(options, function (snapshots) {
                        $scope.snapshotPagination.total = count.count;
                        $scope.snapshotPagination.page = page;
                        $scope.snapshotPagination.perpage = perpage;

                        $timeout(function () {
                            $scope.snapshots = snapshots;
                            $scope.fetching = false;
                            if (callback) {
                                return callback(count.count);
                            }
                        });
                    });
                });
            }

            // page flipping
            $scope.snapshotPagination = AjaxPagination.new($scope.perpage, $scope.total,
                function (page, perpage) {
                    var d = $q.defer();

                    updateSnapshots(page, perpage, $scope.search, function (data) {
                        d.resolve(data);
                    });
                    return d.promise;
                }
            );

            // delete snapshot
            $scope.deleteSnapshot = function deleteSnapshot(snapshot) {
                var box = bootbox.dialog({
                    title: 'Delete Meta Snapshot: ' + snapshot.title + '?',
                    message: 'Are you sure you want to delete the Meta Snapshot <strong>' + snapshot.title + '</strong>?',
                    buttons: {
                        delete: {
                            label: 'Delete',
                            className: 'btn-danger',
                            callback: function () {
                                Snapshot.findOne({
                                    filter: {
                                        limit: 1,
                                        order: "createdDate DESC",
                                        include: [
                                            {
                                                relation: "authors",
                                            },
                                            {
                                                relation: "deckTiers",
                                                scope: {
                                                    include: [
                                                        {
                                                            relation: "deckTech",
                                                            scope: {
                                                                include: {
                                                                    relation: "cardTech",
                                                                }
                                                            }
                                                        }
                                                    ]
                                                }
                                            },
                                            {
                                                relation: "deckMatchups"
                                            }
                                        ]
                                    }
                                })
                                .$promise
                                .then(function (data) {
                                    async.each(data.deckTiers, function(deckTier, deckEachCb) {
                                        async.each(deckTier.deckTech, function(deckTech, techEachCb) {
                                            async.each(deckTech.cardTech, function(cardTech, cardTechCb) {
                                                
                                                CardTech.deleteById({
                                                    id: cardTech.id
                                                }, function() {
                                                    console.log("CARDTECH REMOVAL");
                                                    return cardTechCb();
                                                }, function (err) {
                                                    console.log("There was an error removing CARDTECH, carrying on with removal:", err);
                                                    return cardTechCb();
                                                });
                                                
                                            }, function () { 
                                                DeckTech.deleteById({
                                                    id: deckTech.id
                                                }, function () {
                                                    console.log("DECKTECH REMOVAL");
                                                    return techEachCb(); 
                                                }, function (err) {
                                                    console.log("There was an error removing DECKTECH, carrying on with removal:", err);
                                                    return techEachCb();
                                                });
                                                
                                            });
                                            
                                        }, function () { 
                                            DeckTier.deleteById({
                                                id: deckTier.id
                                            }, function () {
                                                console.log("DECKTIER REMOVAL");
                                                return deckEachCb();
                                            }, function (err) {
                                                console.log("there was an error removing DECKTIER, carrying on with removal:", err);
                                            });
                                        });
                                    }, function () {
                                        Snapshot.deleteById({ id: snapshot.id }).$promise.then(function (data) {
                                            console.log("SNAPSHOT REMOVAL");
                                            if (data.$resolved) {
                                                var indexToDel = $scope.snapshots.indexOf(snapshot);
                                                if (indexToDel !== -1) {
                                                    $scope.snapshots.splice(indexToDel, 1);
                                                }
                                                $scope.success = {
                                                    show: true,
                                                    msg: snapshot.title + ' deleted successfully.'
                                                };
                                            }
                                        });
                                    });
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
    .controller('AdminSnapshotEditCtrl', ['$scope', '$compile', '$timeout', '$state', '$window', 'snapshot', 'AlertService', 'Util', 'bootbox', 'Deck', 'Snapshot', 'User', 'Card', 'SnapshotAuthor', 'DeckMatchup', 'DeckTier', 'DeckTech', 'CardTech',
        function ($scope, $compile, $timeout, $state, $window, snapshot, AlertService, Util, bootbox, Deck, Snapshot, User, Card, SnapshotAuthor, DeckMatchup, DeckTier, DeckTech, CardTech) {

            $scope.snapshot = snapshot;
            $scope.search = "";
            $scope.decks = [];
            $scope.matches = populateMatches();
            $scope.matching = false;
            $scope.selectedDecks = [];
            $scope.removedDecks = [];
            
            // special
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
                    ranks : [ 0,0,0,0,0,0,0,0,0,0,0,0,0 ],
                    deckTech : [],
                    snapshotId : $scope.snapshot.id
                },
                defaultAuthor = {
                    user: undefined,
                    description: "",
                    klass: []
                },
                defaultDeckMatch = {
                    forDeck : undefined,
                    againstDeck : undefined,
                    forChance : 0,
                    againstChance : 0
                },
                defaultDeckTech = {
                    title : "",
                    cardTech : [],
                    orderNum : 1
                },
                defaultTechCards = {
                    card : undefined,
                    toss : false,
                    orderNum : 1
                };

//            // photo upload
//            $scope.photoUpload = function ($files) {
//                if (!$files.length) return false;
//                var box = bootbox.dialog({
//                    message: $compile('<div class="progress progress-striped active" style="margin-bottom: 0px;"><div class="progress-bar" role="progressbar" aria-valuenow="{{uploading}}" aria-valuemin="0" aria-valuemax="100" style="width: {{uploading}}%;"><span class="sr-only">{{uploading}}% Complete</span></div></div>')($scope),
//                    closeButton: false,
//                    animate: false
//                });
//                $scope.uploading = 0;
//                box.modal('show');
//                for (var i = 0; i < $files.length; i++) {
//                    var file = $files[i];
//                    $scope.upload = $upload.upload({
//                        url: '/api/admin/upload/snapshot',
//                        method: 'POST',
//                        file: file
//                    }).progress(function(evt) {
//                        $scope.uploading = parseInt(100.0 * evt.loaded / evt.total);
//                    }).success(function(data, status, headers, config) {
//                        $scope.snapshot.photos = {
//                            large: data.large,
//                            medium: data.medium,
//                            small: data.small,
//                            square: data.square
//                        };
//                        $scope.cardImg = $scope.app.cdn + data.path + data.small;
//                        box.modal('hide');
//                    });
//                }
//            }

            //REMOVE METHODS
            function removeAuthorAJAX(obj, cb) {
                if (!obj.id) { return cb(); }
                
                Snapshot.authors.destroyById({
                    id: $scope.snapshot.id,
                    fk: obj.id
                })
                .$promise
                .then(function () {
                    console.log("successfully removed author from db");
                    return cb();
                })
                .catch(function (err) {
                    console.log("error removing author from db:", err);
                    return cb();
                })
            }

            function removeTierAJAX(id, obj, cb) {

                removeDeckAJAX(id, obj, function () {
                    return cb();
                });
            }

            function removeDeckAJAX(id, obj, cb) {
//                if (!obj.id) { return cb(); }
                
                console.log(obj);

                if (id === undefined) {
                    async.each(obj.decks, function (deck, eachCb) {
                        removeDeckTechAJAX(deck.id, deck, function () {
                            DeckTier.destroyById({
                                id: deck.id
                            })
                            .$promise
                            .then(function(data) {
                                console.log("succesfully removed ALL deckTier:", data);
                                return eachCb();
                            }).catch(function(err) {
                                return eachCb(err);
                            });
                        });
                    }, function () {
                        return cb();
                    });
                } else {
                    removeDeckTechAJAX(id, obj, function () {
                        DeckTier.destroyById({
                            id: id
                        })
                        .$promise
                        .then(function(data) {
                            console.log("successfully removed deckTier:", data);
                            return cb();
                        }).catch(function(err) {
                            return cb(err);
                        });
                    });
                }
            }

            function removeDeckTechAJAX(id, obj, cb) {
                if (!obj.id) { return cb(); }

                if (obj.deckTech) {
                    async.each(obj.deckTech, function (deckTech, eachCb) {
                        removeCardTechAJAX(deckTech.id, deckTech, function () {
                            DeckTier.deckTech.destroyAll({
                                id: id
                            })
                            .$promise
                            .then(function(data) {
                                console.log("successfully removed ALL deckTech:::", data);
                                return eachCb();
                            }).catch(function(err) {
                                return eachCb(err);
                            });
                        });
                    }, function () {
                        return cb();
                    });
                } else {
                    removeCardTechAJAX(id, obj, function () {
                        DeckTech.destroyById({
                            id: id
                        })
                        .$promise
                        .then(function(data) {
                            console.log("successfully removed deckTech:", data);
                            return cb();
                        }).catch(function(err) {
                            return cb(err);
                        });
                    });
                }
            }

            function removeCardTechAJAX(id, obj, cb) {
                if (!obj.id) { return cb(); }

                if (obj.cardTech) {
                    DeckTech.cardTech.destroyAll({
                        id: id
                    })
                    .$promise
                    .then(function(data) {
                        console.log("successfully removed cardTech:", data);
                        return cb();
                    }).catch(function(err) {
                        return cb(err);
                    });
                } else {
                    CardTech.destroyById({
                        id: id
                    })
                    .$promise
                    .then(function(data) {
                        console.log("successfully removed cardTech:", data);
                        return cb();
                    }).catch(function(err) {
                        return eachCb();
                    });
                }
            }
            //REMOVE METHODS

            $scope.getImage = function () {
                $scope.imgPath = 'snapshots/';
                if (!$scope.snapshot) { return '/img/blank.png'; }
                return ($scope.snapshot.photoNames && $scope.snapshot.photoNames.small === '') ?  $scope.app.cdn + '/img/blank.png' : $scope.app.cdn + $scope.imgPath + $scope.snapshot.photoNames.small;
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
                        if ($scope.snapshot.tiers[i].decks[j].deck.id == d.deck.id) {
                            for (var k = 0; k < $scope.snapshot.matches.length; k++) {
                                if ($scope.snapshot.matches[k].forDeck.id == d.deck.id || $scope.snapshot.matches[k].againstDeck.id == d.deck.id) {
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
                var where = {};

                if(!_.isEmpty($scope.search)) {
                    where['name'] = { regexp: $scope.search }
                }

                Deck.find({
                    filter: {
                        limit: 10,
                        where: where
                    }
                })
                .$promise
                .then(function (data) {
                    $timeout(function () {
                        callback(data);
                    });
                });
            }

            function getProviders (callback) {
                var where = {
                    isProvider: true
                }

                if(!_.isEmpty($scope.search)) {
                    where['username'] = { regexp: $scope.search }
                }

                User.find({
                    filter: {
                        limit: 10,
                        where: where
                    }
                })
                .$promise
                .then(function (data) {
                    $timeout(function () {
                        return callback(data);
                    });
                });
            }

            function getCards (callback) {
                Card.find({
                    filter: {
                        where: {
                            deckable: true
                        }
                    }
                })
                .$promise
                .then(function (data) {
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
                            $scope.authorData = data;
                            authorBox(data, type);
                        });
                        break;

                    case 'deck' : //this is to display data in the bootbox for decks
                        getDecks(function (data) {
                            $scope.deckData = data;
                            $scope.tierAbsolute = (tier-1);
                            deckBox(data, type);
                        });
                        break;

                    case 'card' :
                        getCards(function (data) {
                            $scope.cardData = data;
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

            function authorBox (data) {
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
                    if (a.id == $scope.snapshot.authors[i].user.id) {
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
                async.each($scope.snapshot.authors, function(author, eachCb) {
                    if (a.id === author.user.id) {
                        removeAuthorAJAX(author, function () {
                            $scope.snapshot.authors.splice($scope.snapshot.authors.indexOf(author), 1);
                        });
                    }
                    return eachCb();
                })
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
                removeTierAJAX(undefined, t, function () {
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
                });
            }
            ///////////////////////////////////////////////////////////////////////////////////
            $scope.deckRanks = function () {
                var curRank = 1;
                for (var i = 0; i < $scope.snapshot.tiers.length; i++) {
                    for (var j = 0; j < $scope.snapshot.tiers[i].decks.length; j++) {
                        $scope.snapshot.tiers[i].decks[j].ranks[0] = curRank++;
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
                
//                console.log($scope.selectedDecks);
                for (var i = 0; i < $scope.selectedDecks.length; i++) {
                    if ($scope.tier < 3) {
                        
                        $scope.matches.push($scope.selectedDecks[i]);
                        for (var j = 0; j < $scope.matches.length; j++) {
                            $scope.snapshot.matches.push({
                                'snapshotId': $scope.snapshot.id,
                                'forDeck': $scope.selectedDecks[i].deck,
                                'forDeckId': $scope.selectedDecks[i].deck.id,
                                'againstDeck': $scope.matches[j].deck,
                                'againstDeckId': $scope.matches[j].deck.id,
                                'forChance': ($scope.selectedDecks[i].deck.id === $scope.matches[j].deck.id) ? 50 : 0,
                                'againstChance': ($scope.selectedDecks[i].deck.id === $scope.matches[j].deck.id) ? 50 : 0
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

                _.each(matches, function(match) {
                    if (deckID == match.forDeckId || deckID == match.againstDeckId) {
                        out.push(match);
                    }
                })
                return out;
            }

            function trimDeck (deck) {
                deck.deck = {
                    id: deck.deck.id,
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
                        if (sel.id == $scope.removedDecks[l].id) {
                            $scope.removedDecks.splice(l,1);
                        }
                    }
                    tierDeck.deck = sel;
                    decks.push(trimDeck(tierDeck));
                } else {
                    for(var i = 0; i < $scope.selectedDecks.length; i++) {
                        if (sel.id == $scope.selectedDecks[i].deck.id) {
                            $scope.selectedDecks.splice(i,1);
                        }
                    }
                    for(var k = 0; k < $scope.matches.length; k++) {
                        if (sel.id == $scope.matches[k].deck.id) {
                            $scope.matches.splice(k,1);
                        }
                    }
                    $scope.removeDeck(sel);
                }
                console.log($scope.selectedDecks);
                $scope.deckRanks();
            }

            $scope.isDeck = function (d) {
//                console.log(d);
                for (var j = 0; j < $scope.matches.length; j++) {
                    if (d.id == $scope.matches[j].deck.id) {
                        return 'true';
                    }
                }
                for (var i = 2; i < $scope.snapshot.tiers.length; i++) {
                    for (var j = 0; j < $scope.snapshot.tiers[i].decks.length; j++) {
                        if (d.id == $scope.snapshot.tiers[i].decks[j].deck.id) {
                            return true;
                        }
                    }
                }
                return false;
            }

            $scope.isSelected = function (d) {
                for (var j = 0; j < $scope.selectedDecks.length; j++) {
                    
                    if (d.id == $scope.selectedDecks[j].deck.id) {
                        return true;
                    }
                }
                return false;
            }

            $scope.removeDeckPrompt = function (d, tierDeck) {
                var alertBox = bootbox.confirm("Are you sure you want to remove deck " + d.name + "? All the data for this deck will be lost!", function (result) {
                    if (result) {
                        $scope.$apply(function () {
                            $scope.removeDeck(d, tierDeck);
                        });
                    }
                });
            }

            $scope.removeDeck = function (d, tierDeck) {
                var indexesToRemove = {};
                async.each($scope.snapshot.tiers, function (tier, eachCb1) {
                    async.each(tier.decks, function (deck, eachCb2) {
                        if (d.id == deck.deck.id) {
                            removeDeckAJAX(tierDeck.id, deck, function () {
                                var t = $scope.snapshot.tiers.indexOf(tier);
                                console.log(t);

                                if(indexesToRemove[t] == undefined) {
                                    indexesToRemove[t] = [];
                                }

                                indexesToRemove[t].push(tier.decks.indexOf(deck));

//                                tier.decks.splice(k, 1);
                                return eachCb2();
                            });
                        } else {
                            return eachCb2();
                        }
                    }, function () {
                        removeMatch(d);
                        return eachCb1();
                    });
                }, function (err) {
                    async.forEachOf(indexesToRemove, function(i, index, eachCb3) {
                        console.log(i, index);
                        _.each(i, function (j) {
                            console.log(j);
                            $scope.snapshot.tiers[index].decks.splice(j, 1);
                        })
                        return eachCb3();
                    }, function () {
                        $scope.deckRanks();
                    })
                });
            }

            function removeMatch(d) {
                console.log(d);
                for (var j = 0; j < $scope.snapshot.matches.length; j++) {
                    if (d.id == $scope.snapshot.matches[j].forDeck.id || d.id == $scope.snapshot.matches[j].againstDeck.id) {
                        $scope.snapshot.matches.splice(j,1);
                        j--;
                    }
                }

                for (var l = 0; l < $scope.matches.length; l++) {
                    if (d.id == $scope.matches[l].deck.id) {
                        $scope.matches.splice(l,1);
                        l--;
                    }
                }
            }

            $scope.searchDecks = function (s) {
                $scope.search = s;
                getDecks(function (data) {
                    $scope.deckData = data;
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
                        for (var j = 0; j < $scope.snapshot.tiers[i].decks[k].deckTech.length; j++) {
                            $scope.snapshot.tiers[i].decks[k].deckTech
                            if (tech.orderNum == $scope.snapshot.tiers[i].decks[k].deckTech[j].orderNum) {
                                if (!$scope.isCard(c)) {
                                    techCard.orderNum = $scope.snapshot.tiers[i].decks[k].deckTech[j].cardTech.length;
                                    $scope.snapshot.tiers[i].decks[k].deckTech[j].cardTech.push(techCard);
                                }
                            }
                        }
                    }
                }
            }

            $scope.isCard = function (c) {
                var tech = $scope.tech;
                console.log("tech",tech);
                if (tech) {
                    for (var i = 0; i < tech.cardTech.length; i++) {
                        if (c.id == tech.cardTech[i].id) {
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
                        if (d.ranks[0] == $scope.snapshot.tiers[i].decks[k].ranks[0]) {
                            $scope.snapshot.tiers[i].decks[k].deckTech.push(deckTech);
                        }
                        for (var j = 0; j < $scope.snapshot.tiers[i].decks[k].deckTech.length; j++) {
                            $scope.snapshot.tiers[i].decks[k].deckTech[j].orderNum = ++curNum;
                        }
                    }
                }
            }

            $scope.removeTech = function (t) {
                removeDeckTechAJAX(t.id, t, function (err) {
                    if (err) { console.log("ERR REMOVING DECKTECH:", err); }
                    
                    for (var i = 0; i < $scope.snapshot.tiers.length; i++) {
                        for (var k = 0; k < $scope.snapshot.tiers[i].decks.length; k++) {
                            for (var j = 0; j < $scope.snapshot.tiers[i].decks[k].deckTech.length; j++) {
                                if (t.orderNum == $scope.snapshot.tiers[i].decks[k].deckTech[j].orderNum) {
                                    $scope.snapshot.tiers[i].decks[k].deckTech.splice(j, 1);
                                    return;
                                }
                            }
                        }
                    }
                });
            }

            $scope.removeTechCard = function (tech, c) {
                console.log(tech, c);
                removeCardTechAJAX(c.id, c, function (err) {
                    if (err) { console.log("ERR REMOVING CARDTECH:", err); }
                    
                    for (var card in tech.cardTech) {
                        if (c.id == tech.cardTech[card].id) {
                            tech.cardTech.splice(card,1);
                            break;
                        }
                    }
                });
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
                console.log($scope.snapshot);

                async.waterfall([
                    function (seriesCallback) {
                        var stripped = {};

                        stripped['authors'] = _.map($scope.snapshot.authors, function (author) { return author });
                        stripped.decks = _.flatten(stripped.authors, true);

                        stripped['matches'] = _.map($scope.snapshot.matches, function (matchup) { return matchup });
                        stripped.matches = _.flatten(stripped.matches, true);

                        stripped['decks'] = _.map($scope.snapshot.tiers, function (tier) { return tier.decks; });
                        stripped.decks = _.flatten(stripped.decks, true);

                        stripped['deckTech'] = _.map(stripped.decks, function (deck) { return deck.deckTech });
                        stripped.deckTech = _.flatten(stripped.deckTech, true);

                        stripped['cardTech'] = _.map(stripped.deckTech, function (deckTech) { return deckTech.cardTech });
                        stripped.cardTech = _.flatten(stripped.cardTech, true);

                        return seriesCallback(undefined, stripped);
                    }, function (stripped, seriesCallback) {
                        async.each(stripped.decks, function(deck, deckTierCB) {
                            console.log("deck:",deck);
                            DeckTier.upsert({}, deck)
                            .$promise
                            .then(function (dataDeck) {
                                async.each(deck.deckTech, function(deckTech, deckTechCB) {
                                    deckTech.deckTierId = dataDeck.id;
                                    DeckTech.upsert({}, deckTech)
                                    .$promise
                                    .then(function (dataDeckTech) {
                                        async.each(deckTech.cardTech, function(cardTech, cardTechCB) {
                                            cardTech.deckTechId = dataDeckTech.id;
                                            CardTech.upsert({}, cardTech)
                                            .$promise
                                            .then(function() {
                                                console.log("CardTech was successful");
                                                return cardTechCB();
                                            })
                                            .catch(function (err) {
                                                console.log("CardTech errored out!", err);
                                                return seriesCallback(err);
                                            });
                                        }, function() {
                                            console.log("DeckTech was successful");
                                            return deckTechCB();
                                        });
                                    }).catch(function(err) {
                                        console.log("DeckTech errored out!", err);
                                        return seriesCallback(err);
                                    });
                                }, function () {
                                    return deckTierCB();
                                });
                            })
                            .catch(function(err) {
                                console.log("DeckTier errored out!", err);
                                return seriesCallback(err);
                            });
                        }, function() {
                            return seriesCallback(undefined, stripped);
                        });
                    }, function (stripped, seriesCallback) {
                        async.each(stripped.authors, function (author, authorCB) {
                            
                            author.authorId = author.user.id;
                            author.snapshotId = $scope.snapshot.id;
                            SnapshotAuthor.upsert({}, author)
                            .$promise
                            .then(function () {
                                console.log("SnapshotAuthor was successful!");
                                return authorCB();
                            })
                            .catch(function (err) {
                                console.log("SnapshotAuthor errored out!", err);
                                return seriesCallback(err);
                            });
                        }, function () {
                            return seriesCallback(undefined);
                        });
                    }, function (seriesCallback) {
                        Snapshot.deckMatchups.destroyAll({
                            id: $scope.snapshot.id
                        })
                        .$promise
                        .then(function (data) {
                            console.log("SnapshotMatchups DELETE successful!");
                            
                            Snapshot.deckMatchups.createMany({
                                id: $scope.snapshot.id
                            }, $scope.snapshot.matches)
                            .$promise
                            .then(function () {
                                console.log("SnapshotMatchups CREATE successful!");
                                return seriesCallback(undefined);
                            })
                            .catch(function (err) {
                                console.log("SnapshotMatchups CREATE failed!", err);
                                return seriesCallback(err);
                            });
                        })
                        .catch(function (err) {
                            console.log("SnapshotMatchups DELETE failed!");
                            return seriesCallback(err);
                        });
                    }, function (seriesCallback) {
                        console.log("deleting: authors");
                        delete $scope.snapshot.authors;
                        console.log("deleting: matches");
                        delete $scope.snapshot.matches;
                        console.log("deleting: deckMatches");
                        delete $scope.snapshot.deckMatches;
                        console.log("deleting: tiers");
                        delete $scope.snapshot.tiers;
                        Snapshot.upsert({}, $scope.snapshot)
                        .$promise
                        .then(function () {
                            console.log("Snapshot was successful!");
                            return seriesCallback(undefined);
                        })
                        .catch(function (err) {
                            console.log("snapshot errored out!", err);
                            return seriesCallback(err);
                        });
                    }
                ], function (err) {
                    if (err) { console.log("Fatal error snapshot NOT saved!"); console.error(err); return; }
                    
                    AlertService.setSuccess({ show: true, msg: $scope.snapshot.title + ' has been edited successfully.' });
                    $state.go('app.admin.snapshots.list');
                });
            };
        }
    ])
    .controller('AdminSnapshotAddCtrl', ['$scope', '$compile', '$timeout', '$state', '$window', 'AlertService', 'Util', 'bootbox', 'Deck', 'Snapshot', 'User', 'Card', 'SnapshotAuthor', 'DeckMatchup', 'DeckTier', 'DeckTech', 'CardTech',
        function ($scope, $compile, $timeout, $state, $window, AlertService, Util, bootbox, Deck, Snapshot, User, Card, SnapshotAuthor, DeckMatchup, DeckTier, DeckTech, CardTech) {

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
                    photoNames: {
                        large: "",
                        medium: "",
                        small: "",
                        square: ""
                    },
                    votes: 0,
                    active : false
                },
                defaultTierDeck = {
                    name: "",
                    explanation : "",
                    weeklyNotes : "",
                    deck : undefined,
                    ranks : [ 0,0,0,0,0,0,0,0,0,0,0,0,0 ],
                    deckTech : []
                },
                defaultAuthor = {
                    user: undefined,
                    description: "",
                    klass: []
                },
                defaultDeckMatch = {
                    forDeck : undefined,
                    againstDeck : undefined,
                    forChance : 0,
                    againstChance : 0
                },
                defaultDeckTech = {
                    title : "",
                    cardTech : [],
                    orderNum : 1
                },
                defaultTechCards = {
                    card : undefined,
                    toss : false,
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
                        if ($scope.snapshot.tiers[i].decks[j].deck.id == d.deck.id) {
                            for (var k = 0; k < $scope.snapshot.matches.length; k++) {
                                if ($scope.snapshot.matches[k].forDeck.id == d.deck.id || $scope.snapshot.matches[k].againstDeck.id == d.deck.id) {
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

//            // photo upload
//            $scope.photoUpload = function ($files) {
//                if (!$files.length) return false;
//                var box = bootbox.dialog({
//                    message: $compile('<div class="progress progress-striped active" style="margin-bottom: 0px;"><div class="progress-bar" role="progressbar" aria-valuenow="{{uploading}}" aria-valuemin="0" aria-valuemax="100" style="width: {{uploading}}%;"><span class="sr-only">{{uploading}}% Complete</span></div></div>')($scope),
//                    closeButton: false,
//                    animate: false
//                });
//                $scope.uploading = 0;
//                box.modal('show');
//                for (var i = 0; i < $files.length; i++) {
//                    var file = $files[i];
//                    $scope.upload = $upload.upload({
//                        url: '/api/admin/upload/snapshot',
//                        method: 'POST',
//                        file: file
//                    }).progress(function(evt) {
//                        $scope.uploading = parseInt(100.0 * evt.loaded / evt.total);
//                    }).success(function(data, status, headers, config) {
//                        $scope.snapshot.photos = {
//                            large: data.large,
//                            medium: data.medium,
//                            small: data.small,
//                            square: data.square
//                        };
//                        $scope.cardImg = $scope.app.cdn + data.path + data.small;
//                        box.modal('hide');
//                    });
//                }
//            };
            function removeAuthorAJAX(obj, cb) {
                if (!obj.id) { return cb(); }
                
                Snapshot.authors.destroyById({
                    id: $scope.snapshot.id,
                    fk: obj.id
                })
                .$promise
                .then(function () {
                    console.log("successfully removed author from db");
                    return cb();
                })
                .catch(function (err) {
                    console.log("error removing author from db:", err);
                    return cb();
                })
            }

            function removeTierAJAX(id, obj, cb) {

                removeDeckAJAX(id, obj, function () {
                    return cb();
                });
            }

            function removeDeckAJAX(id, obj, cb) {
//                if (!obj.id) { return cb(); }

                if (id === undefined) {
                    async.each(obj.decks, function (deck, eachCb) {
                        removeDeckTechAJAX(deck.id, deck, function () {
                            DeckTier.destroyById({
                                id: deck.id
                            })
                            .$promise
                            .then(function(data) {
                                console.log("succesfully removed ALL deckTier:", data);
                                return eachCb();
                            }).catch(function(err) {
                                return eachCb(err);
                            });
                        });
                    }, function () {
                        return cb();
                    });
                } else {
                    removeDeckTechAJAX(id, obj, function () {
                        DeckTier.destroyById({
                            id: id
                        })
                        .$promise
                        .then(function(data) {
                            console.log("successfully removed deckTier:", data);
                            return cb();
                        }).catch(function(err) {
                            return cb(err);
                        });
                    });
                }
            }

            function removeDeckTechAJAX(id, obj, cb) {
                if (!obj.id) { return cb(); }

                if (obj.deckTech) {
                    async.each(obj.deckTech, function (deckTech, eachCb) {
                        removeCardTechAJAX(deckTech.id, deckTech, function () {
                            DeckTier.deckTech.destroyAll({
                                id: id
                            })
                            .$promise
                            .then(function(data) {
                                console.log("successfully removed ALL deckTech:::", data);
                                return eachCb();
                            }).catch(function(err) {
                                return eachCb(err);
                            });
                        });
                    }, function () {
                        return cb();
                    });
                } else {
                    removeCardTechAJAX(id, obj, function () {
                        DeckTech.destroyById({
                            id: id
                        })
                        .$promise
                        .then(function(data) {
                            console.log("successfully removed deckTech:", data);
                            return cb();
                        }).catch(function(err) {
                            return cb(err);
                        });
                    });
                }
            }

            function removeCardTechAJAX(id, obj, cb) {
                if (!obj.id) { return cb(); }
                
                if (obj.cardTech) {
                    DeckTech.cardTech.destroyAll({
                        id: id
                    })
                    .$promise
                    .then(function(data) {
                        console.log("successfully removed cardTech:", data);
                        return cb();
                    }).catch(function(err) {
                        return cb();
                    });
                } else {
                    CardTech.destroyById({
                        id: id
                    })
                    .$promise
                    .then(function(data) {
                        console.log("successfully removed cardTech:", data);
                        return cb();
                    }).catch(function(err) {
                        return cb(err);
                    });
                }
            }
            
            $scope.getImage = function () {
                $scope.imgPath = 'snapshots/';
                if (!$scope.snapshot) { return '/img/blank.png'; }
                return ($scope.snapshot.photoNames && $scope.snapshot.photoNames.small === '') ?  $scope.app.cdn + '/img/blank.png' : $scope.app.cdn + $scope.imgPath + $scope.snapshot.photoNames.small;
            };

            function escapeStr( str ) {
                return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
            }

            /* GET METHODS */
            function getDecks (callback) {
                var where = {};

                if(!_.isEmpty($scope.search)) {
                    where['name'] = { regexp: $scope.search }
                }

                Deck.find({
                    filter: {
                        limit: 10,
                        where: where
                    }
                })
                .$promise
                .then(function (data) {
                    $timeout(function () {
                        callback(data);
                    });
                });
            }

            function getProviders (callback) {
                var where = {
                    isProvider: true
                }

                if(!_.isEmpty($scope.search)) {
                    where['username'] = { regexp: $scope.search }
                }

                User.find({
                    filter: {
                        limit: 10,
                        where: where
                    }
                })
                .$promise
                .then(function (data) {
                    $timeout(function () {
                        return callback(data);
                    });
                });
            }

            function getCards (callback) {
                Card.find({
                    filter: {
                        where: {
                            deckable: true
                        }
                    }
                })
                .$promise
                .then(function (data) {
                    $timeout(function () {
                        callback(data);
                    })
                });
            }
            /* GET METHODS */


            /* BOOTBOX METHODS */
            $scope.openAddBox = function (type, tier, deck, tech) {
                console.log(tier, deck,tech);
                
                $scope.tier = tier;
                $scope.deck = deck;
                $scope.tech = tech;

                switch (type) {
                    case 'author' : //this is to display data in the bootbox for authors
                        getProviders(function (data) {
                            $scope.authorData = data;
                            authorBox(data, type);
                        });
                        break;

                    case 'deck' : //this is to display data in the bootbox for decks
                        getDecks(function (data) {
                            $scope.deckData = data;
                            $scope.tierAbsolute = (tier-1);
                            deckBox(data, type);
                        });
                        break;

                    case 'card' :
                        getCards(function (data) {
                            $scope.cardData = data;
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

            function authorBox (data) {
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
                    if (a.id == $scope.snapshot.authors[i].user.id) {
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
                var toDelete = undefined;
                _.each($scope.snapshot.authors, function(author, eachCb) {
                    if (a.id === author.user.id) {
                        removeAuthorAJAX(author, function () {
                            toDelete = $scope.snapshot.authors.indexOf(author);
                        });
                    }
                });
                $scope.snapshot.authors.splice(toDelete, 1);
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
                removeTierAJAX(undefined, t, function (err) {
                    if (err) { console.log("ERR REMOVING TIER:", err); }
                    
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
                });
            }
            ///////////////////////////////////////////////////////////////////////////////////
            $scope.deckRanks = function () {
                var curRank = 1;
                for (var i = 0; i < $scope.snapshot.tiers.length; i++) {
                    for (var j = 0; j < $scope.snapshot.tiers[i].decks.length; j++) {
                        $scope.snapshot.tiers[i].decks[j].tier = (i+1);
                        $scope.snapshot.tiers[i].decks[j].ranks[0] = curRank++;
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
                console.log("whats all this then?", $scope.tier);
                
                var tiers = $scope.snapshot.tiers,
                    tierLength = tiers.length,
                    maxTierLength = (tierLength > 2) ? 2 : tierLength;
                
//                console.log($scope.selectedDecks);
                for (var i = 0; i < $scope.selectedDecks.length; i++) {
                    if ($scope.tier < 3) {
                        console.log("updating matches", $scope);
                        $scope.matches.push($scope.selectedDecks[i]);
                        for (var j = 0; j < $scope.matches.length; j++) {
                            $scope.snapshot.matches.push({
                                'snapshotId': $scope.snapshot.id,
                                'forDeck': $scope.selectedDecks[i].deck,
                                'forDeckId': $scope.selectedDecks[i].deck.id,
                                'againstDeck': $scope.matches[j].deck,
                                'againstDeckId': $scope.matches[j].deck.id,
                                'forChance': ($scope.selectedDecks[i].deck.id === $scope.matches[j].deck.id) ? 50 : 0,
                                'againstChance': ($scope.selectedDecks[i].deck.id === $scope.matches[j].deck.id) ? 50 : 0
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

                _.each(matches, function(match) {
                    if (deckID == match.forDeckId || deckID == match.againstDeckId) {
                        out.push(match);
                    }
                })
                return out;
            }

            function trimDeck (deck) {
                deck.deck = {
                    id: deck.deck.id,
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
                        if (sel.id == $scope.removedDecks[l].id) {
                            $scope.removedDecks.splice(l,1);
                        }
                    }
                    tierDeck.deck = sel;
                    decks.push(trimDeck(tierDeck));
                } else {
                    for(var i = 0; i < $scope.selectedDecks.length; i++) {
                        if (sel.id == $scope.selectedDecks[i].deck.id) {
                            $scope.selectedDecks.splice(i,1);
                        }
                    }
                    for(var k = 0; k < $scope.matches.length; k++) {
                        if (sel.id == $scope.matches[k].deck.id) {
                            $scope.matches.splice(k,1);
                        }
                    }
                    $scope.removeDeck(sel);
                }
                console.log($scope.selectedDecks);
                $scope.deckRanks();
            }

            $scope.isDeck = function (d) {
//                console.log(d);
                for (var j = 0; j < $scope.matches.length; j++) {
                    if (d.id == $scope.matches[j].deck.id) {
                        return 'true';
                    }
                }
                for (var i = 2; i < $scope.snapshot.tiers.length; i++) {
                    for (var j = 0; j < $scope.snapshot.tiers[i].decks.length; j++) {
                        if (d.id == $scope.snapshot.tiers[i].decks[j].deck.id) {
                            return true;
                        }
                    }
                }
                return false;
            }

            $scope.isSelected = function (d) {
                for (var j = 0; j < $scope.selectedDecks.length; j++) {
                    
                    if (d.id == $scope.selectedDecks[j].deck.id) {
                        return true;
                    }
                }
                return false;
            }

            $scope.removeDeckPrompt = function (d, tierDeck) {
                var alertBox = bootbox.confirm("Are you sure you want to remove deck " + d.name + "? All the data for this deck will be lost!", function (result) {
                    if (result) {
                        $scope.$apply(function () {
                            $scope.removeDeck(d, tierDeck);
                        });
                    }
                });
            }

            $scope.removeDeck = function (d, tierDeck) {
                var indexesToRemove = {};
                async.each($scope.snapshot.tiers, function (tier, eachCb1) {
                    async.each(tier.decks, function (deck, eachCb2) {
                        if (d.id == deck.deck.id) {
                            removeDeckAJAX(tierDeck.id, deck, function (err) {
                                if (err) { console.log("ERR REMOVING DECK:", err); }
                                
                                var t = $scope.snapshot.tiers.indexOf(tier);
                                console.log(t);
                                
                                if(indexesToRemove[t] == undefined) {
                                    indexesToRemove[t] = [];
                                }
                                
                                indexesToRemove[t].push(tier.decks.indexOf(deck));
                                
//                                tier.decks.splice(k, 1);
                                return eachCb2();
                            });
                        } else {
                            return eachCb2();
                        }
                    }, function () {
                        removeMatch(d);
                        return eachCb1();
                    });
                }, function (err) {
                    async.forEachOf(indexesToRemove, function(i, index, eachCb3) {
                        _.each(i, function (j) {
                            console.log(j);
                            $scope.snapshot.tiers[index].decks.splice(j, 1);
                        })
                        return eachCb3();
                    }, function () {
                        $scope.deckRanks();
                    })
                });
            }

            function removeMatch(d) {
                console.log(d);
                for (var j = 0; j < $scope.snapshot.matches.length; j++) {
                    if (d.id == $scope.snapshot.matches[j].forDeck.id || d.id == $scope.snapshot.matches[j].againstDeck.id) {
                        $scope.snapshot.matches.splice(j,1);
                        j--;
                    }
                }

                for (var l = 0; l < $scope.matches.length; l++) {
                    if (d.id == $scope.matches[l].deck.id) {
                        $scope.matches.splice(l,1);
                        l--;
                    }
                }
            }

            $scope.searchDecks = function (s) {
                $scope.search = s;
                getDecks(function (data) {
                    $scope.deckData = data;
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
                        for (var j = 0; j < $scope.snapshot.tiers[i].decks[k].deckTech.length; j++) {
                            $scope.snapshot.tiers[i].decks[k].deckTech
                            if (tech.orderNum == $scope.snapshot.tiers[i].decks[k].deckTech[j].orderNum) {
                                if (!$scope.isCard(c)) {
                                    techCard.orderNum = $scope.snapshot.tiers[i].decks[k].deckTech[j].cardTech.length;
                                    $scope.snapshot.tiers[i].decks[k].deckTech[j].cardTech.push(techCard);
                                }
                            }
                        }
                    }
                }
            }

            $scope.isCard = function (c) {
                var tech = $scope.tech;
                console.log("tech",tech);
                if (tech) {
                    for (var i = 0; i < tech.cardTech.length; i++) {
                        if (c.id == tech.cardTech[i].id) {
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
                        if (d.ranks[0] == $scope.snapshot.tiers[i].decks[k].ranks[0]) {
                            $scope.snapshot.tiers[i].decks[k].deckTech.push(deckTech);
                        }
                        for (var j = 0; j < $scope.snapshot.tiers[i].decks[k].deckTech.length; j++) {
                            $scope.snapshot.tiers[i].decks[k].deckTech[j].orderNum = ++curNum;
                        }
                    }
                }
            }

            $scope.removeTech = function (t) {
                removeDeckTechAJAX(t.id, t, function (err) {
                    if (err) { console.log("ERR REMOVING DECK:", err); }
                    
                    for (var i = 0; i < $scope.snapshot.tiers.length; i++) {
                        for (var k = 0; k < $scope.snapshot.tiers[i].decks.length; k++) {
                            for (var j = 0; j < $scope.snapshot.tiers[i].decks[k].deckTech.length; j++) {
                                if (t.orderNum == $scope.snapshot.tiers[i].decks[k].deckTech[j].orderNum) {
                                    $scope.snapshot.tiers[i].decks[k].deckTech.splice(j, 1);
                                    return;
                                }
                            }
                        }
                    }
                });
            }

            $scope.removeTechCard = function (tech, c) {
                console.log(tech, c);
                removeCardTechAJAX(c.id, c, function (err) {
                    if (err) { console.log("ERR REMOVING CARD TECH:", err); }
                    
                    for (var card in tech.cardTech) {
                        if (c.id == tech.cardTech[card].id) {
                            tech.cardTech.splice(card,1);
                            break;
                        }
                    }
                });
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
                Snapshot.findOne({
                    filter: {
                        limit: 1,
                        order: "createdDate DESC",
                        fields: {
                            votes: false,
                            voteScore: false
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
                    console.log(snapshot);
                    snapshot.id = undefined;
                    
                    snapshot.deckTiers.sort(function(a,b) { return (a.ranks[0] - b.ranks[0]) });
                    
                    var stripped = {};
                    stripped['authors'] = _.map(snapshot.authors, function (author) { author.id = undefined; return author });
                    stripped['matches'] = _.map(snapshot.deckMatchups, function (matchup) { matchup.id = undefined; return matchup });
                    console.log(snapshot.deckTiers);
                    stripped['decks'] = _.map(snapshot.deckTiers, function (deck) { 
                        deck.id = undefined;
                        deck.deckTech = _.map(deck.deckTech, function(deckTech) {
                            deckTech.id = undefined;
                            deckTech.cardTech = _.map(deckTech.cardTech, function (cardTech) {
                                cardTech.id = undefined;
                                return cardTech;
                            });
                            return deckTech;
                        });
                        return deck; 
                    });
                    console.log(stripped['decks']);
                    stripped['decks'] = _.flatten(stripped['decks'], false);
                    stripped['matchDecks'] = _.filter(stripped['decks'], function(deck) { return deck.tier <= 2; })
                    stripped['deckTech'] = _.map(stripped.decks, function (deck) { return deck.deckTech });
                    
                    console.log(stripped);
//                    stripped['cardTech'] = _.map(stripped.deckTech, function (deckTech) { return deckTech.cardTech });
                    
//                    console.log(newArr);
                    
                    
                    //BUILD TIERS//
                    snapshot.tiers = [];
                    _.each(stripped['decks'], function (deck) {
                        if (snapshot.tiers[deck.tier-1] === undefined) {
                            snapshot.tiers[deck.tier-1] = { decks: [], tier: deck.tier }; 
                        }
                        deck.ranks.splice(0,0,deck.ranks[0]);
                        deck.ranks.pop();

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
                    
                    var d = new Date();
                    snapshot.createdDate = d.toISOString();

                    //BUILD MATCHES//
                    
                    snapshot.matches = stripped['matches'];
                    $scope.loaded = true;
                    
                    snapshot.comments = [];
                    snapshot.snapNum++;
                    snapshot.votes = [];
                    snapshot.voteScore = 0;
                    
                    $scope.matches = stripped['matchDecks'];
                    $scope.snapshot = snapshot;
                    
                    $scope.deckRanks();
                    $scope.setSlug();
                });
            }


            $scope.addSnapshot = function () {
                

                async.waterfall([
                    function (waterfallCb) {
                        var stripped = {};
                        
                        console.log("step 1");

                        stripped['authors'] = _.map($scope.snapshot.authors, function (author) { return author });
                        stripped.decks = _.flatten(stripped.authors, true);

                        stripped['matches'] = _.map($scope.snapshot.matches, function (matchup) { return matchup });
                        stripped.matches = _.flatten(stripped.matches, true);

                        stripped['decks'] = _.map($scope.snapshot.tiers, function (tier) { return tier.decks; });
                        stripped.decks = _.flatten(stripped.decks, true);

                        stripped['deckTech'] = _.map(stripped.decks, function (deck) { return deck.deckTech });
                        stripped.deckTech = _.flatten(stripped.deckTech, true);

                        stripped['cardTech'] = _.map(stripped.deckTech, function (deckTech) { return deckTech.cardTech });
                        stripped.cardTech = _.flatten(stripped.cardTech, true);

                        return waterfallCb(undefined, stripped);
                    }, function (stripped, waterfallCb) {
                        
                        console.log("step 2", stripped);
                        
                        Snapshot.upsert({}, $scope.snapshot)
                        .$promise
                        .then(function (dataSnapshot) {
                            console.log("wat:", dataSnapshot);
                            async.each(stripped.decks, function(deck, deckTierCB) {
                                deck.snapshotId = dataSnapshot.id;
                                DeckTier.upsert({}, deck)
                                .$promise
                                .then(function (dataDeck) {
                                    async.each(deck.deckTech, function(deckTech, deckTechCB) {
                                        deckTech.deckTierId = dataDeck.id;
                                        DeckTech.upsert({}, deckTech)
                                        .$promise
                                        .then(function (dataDeckTech) {
                                            async.each(deckTech.cardTech, function(cardTech, cardTechCB) {
                                                cardTech.deckTechId = dataDeckTech.id;
                                                CardTech.upsert({}, cardTech)
                                                .$promise
                                                .then(function() {
                                                    console.log("CardTech was successful");
                                                    return cardTechCB();
                                                })
                                                .catch(function (err) {
                                                    console.log("CardTech errored out!", err);
                                                    return waterfallCb(err);
                                                });
                                            }, function() {
                                                console.log("DeckTech was successful");
                                                return deckTechCB();
                                            });
                                        }).catch(function(err) {
                                            console.log("DeckTech errored out!", err);
                                            return waterfallCb(err);
                                        });
                                    }, function () {
                                        return deckTierCB();
                                    });
                                })
                                .catch(function(err) {
                                    console.log("DeckTier errored out!", err);
                                    return waterfallCb(err);
                                });
                            }, function() {
                                async.series([
                                    
                                    function(seriesCallback) {
                                        Snapshot.deckMatchups.createMany({
                                            id: dataSnapshot.id
                                        }, $scope.snapshot.matches)
                                        .$promise
                                        .then(function () {
                                            console.log("SnapshotMatchups CREATE successful!");
                                            return seriesCallback();
                                        })
                                        .catch(function (err) {
                                            console.log("SnapshotMatchups CREATE failed!", err);
                                            return seriesCallback(err);
                                        });
                                    }, function (seriesCallback) {
                                        async.each(stripped.authors, function (author, authorCb) {

                                            author.authorId = author.user.id;
                                            author.snapshotId = dataSnapshot.id;
                                            
                                            SnapshotAuthor.upsert({}, author)
                                            .$promise
                                            .then(function () {
                                                console.log("SnapshotAuthor was successful!");
                                                return authorCb();
                                            })
                                            .catch(function (err) {
                                                console.log("SnapshotAuthor errored out!", err);
                                                return seriesCallback(err);
                                            });
                                        }, function () {
                                            return seriesCallback();
                                        });
                                    }
                                ], function (err) {
                                    if(err) return waterfallCb(err);
                                    
                                    return waterfallCb(undefined);
                                });
                                
                            }); 
                        })
                        .catch(function (err) {
                            console.log("snapshot errored out!", err);
                            return waterfallCb(err);
                        });
                    }
                ], function (err) {
                    console.log("step 3");
                    
                    if (err) { console.log("Fatal error snapshot NOT saved!"); console.error(err); return; }

                    AlertService.setSuccess({ show: true, msg: $scope.snapshot.title + ' has been added successfully.' });
                    $state.go('app.admin.snapshots.list');
                });
            };
        }
    ])
    .controller('AdminTeamListCtrl', ['$scope', 'data', 'AdminTeamService', 'AlertService',
        function ($scope, data, AdminTeamService, AlertService) {

            $scope.members = data.members;
            $scope.hsMembers = data.hsMembers;
            $scope.hotsMembers = data.hotsMembers;
            $scope.csMembers = data.csMembers;
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
    .controller('TeamCtrl', ['$scope', '$compile', '$timeout', '$location', '$anchorScroll', '$sce', 'hsTeam', 'hotsTeam', 'wowTeam', 'fgcTeam', 'fifaTeam',
        function ($scope, $compile, $timeout, $location, $anchorScroll, $sce, hsTeam, hotsTeam, wowTeam, fgcTeam, fifaTeam) {

            $scope.hsMembers = hsTeam;
            $scope.hotsMembers = hotsTeam;
            $scope.wowMembers = wowTeam;
            $scope.fgcMembers = fgcTeam;
            $scope.fifaMembers = fifaTeam;


            if ($location.hash()) {
                $timeout(function () {
                    $anchorScroll();
                });
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
                    message: $compile('<button type="button" class="bootbox-close-button close" data-dismiss="modal" aria-hidden="true">×</button><img class="responsive" src="https://cdn-tempostorm.netdna-ssl.com/team/{{member.photoName}}" /><div class="wrapper-md content-wrapper "><h1 class="m-b-xs">{{member.screenName}}</h1><span class="btn-team-wrapper-modal"><a href="#" target="_blank" ng-click="openLink($event, \'https://twitter.com/\' + member.social.twitter)" ng-if="member.social.twitter" class="m-r-xs btn-team"><div class="btn-team-inner"><i class="fa fa-twitter"></i></div></a><a href="#" target="_blank" ng-click="openLink($event, \'https://twitch.tv/\' + member.social.twitch)" ng-if="member.social.twitch" class="m-r-xs btn-team"><div class="btn-team-inner"><i class="fa fa-twitch"></i></div></a><a href="#" target="_blank" ng-click="openLink($event, \'https://youtube.com/\' + member.social.youtube)" ng-if="member.social.youtube" class="m-r-xs btn-team"><div class="btn-team-inner"><i class="fa fa-youtube"></i></div></a><a href="#" target="_blank" ng-click="openLink($event, \'https://facebook.com/\' + member.social.facebook)" ng-if="member.social.facebook" class="m-r-xs btn-team"><div class="btn-team-inner"><i class="fa fa-facebook"></i></div></a><a href="#" target="_blank" ng-click="openLink($event, \'https://instagram.com/\' + member.social.instagram)" ng-if="member.social.instagram" class="m-r-xs btn-team"><div class="btn-team-inner"><i class="fa fa-instagram"></i></div></a></span><h3>{{member.fullName}}</h3><p>{{member.description}}</p></div>')($scope)
                });
            }
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
    .controller('AdminVodListCtrl', ['$scope', '$q', '$timeout', 'paginationParams', 'vodsCount', 'vods', 'AlertService', 'Vod', 'AjaxPagination',
        function ($scope, $q, $timeout,  paginationParams, vodsCount, vods, AlertService, Vod, AjaxPagination) {

            // grab alerts
            if (AlertService.hasAlert()) {
                $scope.success = AlertService.getSuccess();
                AlertService.reset();
            }

            console.log('vods: ', vods);

            // load vods
            $scope.vods = vods;
            $scope.page = paginationParams.page;
            $scope.perpage = paginationParams.perpage;
            $scope.total = vodsCount.count;
            $scope.search = '';

            $scope.searchVods = function() {
                updateVods(1, $scope.perpage, $scope.search, false);
            };

            // pagination
            function updateVods (page, perpage, search, callback) {
                $scope.fetching = true;

                var options = {},
                    countOptions = {};

                options.filter = {
                    fields: paginationParams.options.filter.fields,
                    order: "createdDate DESC",
                    skip: ((page*perpage)-perpage),
                    limit: perpage
                };

                if ($scope.search.length > 0) {
                    options.filter.where = {
                        or: [
                            { subtitle: { regexp: search } },
                            { displayDate: { regexp: search } },
                        ]
                    }
                    countOptions.where = {
                        or: [
                            { subtitle: { regexp: search } },
                            { displayDate: { regexp: search } },
                        ]
                    }
                }

                Vod.count(countOptions, function (count) {
                    Vod.find(options, function (vods) {
                        $scope.vodPagination.total = count.count;
                        $scope.vodPagination.page = page;
                        $scope.vodPagination.perpage = perpage;

                        $timeout(function () {
                            $scope.vods = vods;
                            $scope.fetching = false;
                            if (callback) {
                                return callback(count.count);
                            }
                        });
                    });
                });
            }

            // page flipping
            $scope.vodPagination = AjaxPagination.new($scope.perpage, $scope.total,
                function (page, perpage) {
                    var d = $q.defer();

                    updateVods(page, perpage, $scope.search, function (data) {
                        d.resolve(data);
                    });
                    return d.promise;
                }
            );

            // delete vod
            $scope.deleteVod = function deleteVod(vod) {
                var box = bootbox.dialog({
                    title: 'Delete VOD: ' + vod.subtitle + '?',
                    message: 'Are you sure you want to delete the VOD <strong>' + vod.subtitle + '</strong>?',
                    buttons: {
                        delete: {
                            label: 'Delete',
                            className: 'btn-danger',
                            callback: function () {
                                Vod.deleteById({ id: vod.id }, function (data) {
                                    if (data.$resolved) {
                                        var indexToDel = $scope.vods.indexOf(vod);
                                        if (indexToDel !== -1) {
                                            $scope.vods.splice(indexToDel, 1);
                                        }
                                        $scope.success = {
                                            show: true,
                                            msg: vod.subtitle + ' deleted successfully.'
                                        };
                                    }
                                }, function (error) {
                                    if(error) console.log('error: ', error);
                                });
                                $scope.vodPagination.total -= 1;
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
    .controller('AdminVodAddCtrl', ['$scope', '$window', '$state', 'AdminVodService', 'AlertService', 'Vod',
        function ($scope, $window, $state, AdminVodService, AlertService, Vod) {

            var defaultVod = {
                displayDate: '',
                createdDate: new Date(),
                youtubeId: '',
                subtitle: '',
                youtubeVars: {
                    list: ''
                }
            };

            $scope.isPlaylist = true;
            $scope.vod = angular.copy(defaultVod);

            // save VOD
            $scope.saveVod = function (vod) {
                Vod.create({}, vod, function (data) {
                    if (data.$resolved) {
                        $scope.success = {
                            show: true,
                            msg: vod.subtitle + ' created successfully.'
                        };
                        $scope.vod = angular.copy(defaultVod);
                    }
                }, function (err) {
                    if(err) console.log('error: ',err);
                    $scope.success = {
                        show: true,
                        msg: vod.subtitle + ' could not be created.'
                    };
                });
            };

        }
    ])
    .controller('AdminVodEditCtrl', ['$scope', '$state', '$window', 'vod', 'AdminVodService', 'AlertService', 'Vod',
        function ($scope, $state, $window, vod, AdminVodService, AlertService, Vod) {
            console.log('vod: ',vod);
            $scope.vod = vod;
            console.log('is playlist: ', $scope.vod.youtubeId == "");
            $scope.isPlaylist = ($scope.vod.youtubeId == "") ? true : false;

            // update VOD
            $scope.updateVod = function (vod) {
                Vod.update({
                    where: {
                        id: vod.id
                    }
                }, vod, function(data) {
                    if(data.$resolved) {
                        $scope.success = {
                            show: true,
                            msg: vod.subtitle + ' was edited successfully.'
                        };
                    }
                    $window.scrollTo(0,0);
                }, function(err) {
                    if(err) console.log('error: ',err);
                });
            };
        }
    ])
    .controller('AdminDeckListCtrl', ['$scope', '$q', '$timeout', 'AdminDeckService', 'AlertService', 'Pagination', 'decks', 'paginationParams', 'decksCount', 'Deck', 'AjaxPagination',
        function ($scope, $q, $timeout, AdminDeckService, AlertService, Pagination, decks, paginationParams, decksCount, Deck, AjaxPagination) {
            // grab alerts
            if (AlertService.hasAlert()) {
                $scope.success = AlertService.getSuccess();
                AlertService.reset();
            }

            // load decks
            $scope.decks = decks;
            $scope.page = paginationParams.page;
            $scope.perpage = paginationParams.perpage;
            $scope.total = decksCount.count;
            $scope.search = paginationParams.search;

            // search on keyup
            $scope.searchDecks = function() {
                updateDecks(1, $scope.perpage, $scope.search, false);
            };

            // pagination
            function updateDecks (page, perpage, search, callback) {
                $scope.fetching = true;

                var options = {},
                    countOptions = {};

                options.filter = {
                    fields: paginationParams.options.filter.fields,
                    order: "createdDate DESC",
                    skip: ((page*perpage) - perpage),
                    limit: perpage
                };

                if ($scope.search.length > 0) {
                    options.filter.where = {
                        or: [
                            { title: { regexp: search } },
                            { description: { regexp: search } },
                            { name: { regexp: search } }
                        ]
                    }
                    countOptions.where = {
                        or: [
                            { title: { regexp: search } },
                            { description: { regexp: search } },
                            { name: { regexp: search } }
                        ]
                    }
                }

                Deck.count(countOptions, function (count) {
                    Deck.find(options, function (decks) {
                        $scope.deckPagination.total = count.count;
                        $scope.deckPagination.page = page;
                        $scope.deckPagination.perpage = perpage;

                        $timeout(function() {
                            $scope.decks = decks;
                            $scope.fetching = false;

                            if (callback) {
                                return callback(count.count);
                            }
                        });
                    });
                });
            }

            // page flipping
            $scope.deckPagination = AjaxPagination.new($scope.perpage, $scope.total, function(page, perpage) {
                var d = $q.defer();

                updateDecks(page, perpage, $scope.search, function (data) {
                    d.resolve(data);
                });
                return d.promise;
            });

            // delete deck
            $scope.deleteDeck = function deleteDeck (deck) {
                var box = bootbox.dialog({
                    title: 'Delete deck: ' + deck.name + '?',
                    message: 'Are you sure you want to delete the deck <strong>' + deck.name + '</strong>?',
                    buttons: {
                        delete: {
                            label: 'Delete',
                            className: 'btn-danger',
                            callback: function () {
//                                Deck.deleteById({ id: deck.id }).$promise.then(function (data) {
//                                    if (data.$resolved) {
//                                        var indexToDel = $scope.decks.indexOf(deck);
//                                        if (indexToDel !== -1) {
//                                            $scope.articles.splice(indexToDel, 1);
//                                        }
//                                        $scope.success = {
//                                            show: true,
//                                            msg: article.title + ' deleted successfully.'
//                                        };
//                                    }
//                                });

                                // todo errors
//                                Deck.deleteById({ id: deck.id }, function (deletedDeck) {
//                                    console.log('deleted deck: ', deletedDeck);
//                                }, function(err) {
//                                });
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
    .controller('AdminDeckBuilderClassCtrl', ['$scope', 'Hearthstone', function ($scope, Hearthstone) {
        // deck adder ctrl
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

        for (var i = 0; i < $scope.app.settings.secondaryPortrait.length; i++) {
            if ($scope.getName(i, true) == undefined || $scope.getName(i, true) == '') {
                $scope.app.settings.secondaryPortrait[i] = 0;
                portraitSettings[i] = 0;
            }
        }
    }])
    .controller('AdminDeckAddCtrl', ['$state', '$scope', '$compile', '$q', '$timeout', '$window', 'AjaxPagination', 'Hearthstone', 'DeckBuilder', 'ImgurService', 'AlertService', 'AdminDeckService', 'classCardsList', 'classCardsCount', 'neutralCardsList', 'neutralCardsCount', '$stateParams',
        function ($state, $scope, $compile, $q, $timeout, $window, AjaxPagination, Hearthstone, DeckBuilder, ImgurService, AlertService, AdminDeckService, classCardsList, classCardsCount, neutralCardsList, neutralCardsCount, $stateParams) {
            // redirect back to class pick if no data
//            if (!data || !data.success) { $state.transitionTo('app.hs.deckBuilder.class'); return false; }
            // find me simple
            // set default tab page
            $scope.step = 1;
            $scope.showManaCurve = false;
            $scope.classes = angular.copy(Hearthstone.classes).splice(1, 9);

            $scope.className = $stateParams.className;

            $scope.cards = {
                neutral: neutralCardsList,
                class: classCardsList,
                current: classCardsList
            };

            $scope.deck = DeckBuilder.new($stateParams.className);
//            $scope.deck = ($scope.app.settings.deck && $scope.app.settings.deck !== null && data.className === $scope.app.settings.deck.playerClass) ? DeckBuilder.new(data.className, $scope.app.settings.deck) : DeckBuilder.new(data.className);
            $scope.$watch('deck', function(){
                $scope.app.settings.deck = {
                    name: $scope.deck.name,
                    deckType: $scope.deck.deckType,
                    description: $scope.deck.description,
                    chapters: $scope.deck.chapters,
                    cards: $scope.deck.cards,
                    matches: $scope.deck.matchups,
                    playerClass: $scope.deck.playerClass,
                    type: $scope.deck.type,
                    basic: $scope.deck.basic,
                    mulligans: $scope.deck.mulligans,
                    video: $scope.deck.video,
                    public: $scope.deck.public
                };
            }, true);

            // filters
            $scope.filters = {
                search: '',
                mechanics: [],
                mana: 'all'
            };

            $scope.type = 1;
            $scope.basic = false;

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

            // steps
            $scope.stepDesc = {
                1: 'Select the cards for your deck.',
                2: 'Select which cards to mulligan for.',
                3: 'Provide a description for how to play your deck.',
                4: 'Select how your deck preforms against other classes.',
                5: 'Provide a synopsis and title for your deck.'
            };

            $scope.getDust = function (cards) {
                var dust = 0;
                for (var i = 0; i < cards.length; i++) {
                    dust += cards[i].card.dust * cards[i].cardQuantity;
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
                return Hearthstone.heroNames[$stateParams.ClassName][$scope.isSecondary($scope.deck.playerClass.toLowerCase())];
            }

            $scope.prevStep = function () {
                if ($scope.step > 1) $scope.step = $scope.step - 1;
            }
            $scope.nextStep = function () {
                if ($scope.step < 5) $scope.step = $scope.step + 1;
            }

            // load cards
            var classCards = true;

            $scope.isClassCards = function () {
                return classCards;
            }

            $scope.search = function() {
                updateCards(1, 15, $scope.filters.search, $scope.filters.mechanics, $scope.filters.mana);
            }

            function updateCards (page, perpage, search, mechanics, mana, callback) {
                console.log('search: ', search);
                $scope.fetching = true;

                var options = {
                    filter: {
                        where: {
                            playerClass: ($scope.isClassCards()) ? $scope.className : 'Neutral',
                            deckable: true
                        },
                        order: ['cost ASC', 'cardType ASC', 'name ASC'],
                        skip: ((page * perpage) - perpage),
                        limit: perpage
                    }
                }
                var countOptionsClass = {
                    where: {
                        playerClass: $scope.className,
                        deckable: true
                    }
                }
                var countOptionsNeutral = {
                    where: {
                        playerClass: 'Neutral',
                        deckable: true
                    }
                }

                if ($scope.search.length > 0) {
                    options.filter.where.or = [
                        { name: { regexp: search } },
                        { text: { regexp: search } },
                        { content: { regexp: search } }
                    ]

                    countOptionsClass.where.or = [
                        { name: { regexp: search } },
                        { text: { regexp: search } },
                        { content: { regexp: search } }
                    ]
                }

                if (mechanics.length == 1) {
                    options.filter.where.mechanics = {
                        inq: mechanics
                    }

                    countOptionsClass.where.mechanics = {
                        inq: mechanics
                    }

                    countOptionsNeutral.where.mechanics = {
                        inq: mechanics
                    }
                } else if (mechanics.length > 1) {
                    options.filter.where.mechanics = mechanics;
                    countOptionsClass.where.mechanics = mechanics;
                    countOptionsNeutral.where.mechanics = mechanics;
                }

                if (mana != 'all' && mana != '7+') {
                    options.filter.where.cost = mana;
                    countOptionsClass.where.cost = mana;
                    countOptionsNeutral.where.cost = mana;
                } else if (mana == '7+') {
                    options.filter.where.cost = { gte: 7 };
                    countOptionsClass.where.cost = { gte: 7 };
                    countOptionsNeutral.where.cost = { gte: 7 };
                }

                Card.count(countOptionsClass)
                .$promise
                .then(function (classCount) {
                    Card.count(countOptionsNeutral)
                    .$promise
                    .then(function (classCount) {
                        Card.count(countOptionsNeutral)
                        .$promise
                        .then(function (neutralCount) {
                            Card.find(options)
                            .$promise
                            .then(function (data) {
                                $scope.classPagination.total = classCount.count;
                                $scope.classPagination.page = page;
                                $scope.neutralPagination.total = neutralCount.count;
                                $scope.neutralPagination.page = page;

                                $timeout(function() {
                                    $scope.cards.current = data;
                                    console.log('new cards: ', $scope.cards.current);
                                    $scope.fetching = false;
                                    if(callback) {
                                        return callback([classCount.count, neutralCount.count]);
                                    }
                                });
                            });
                        });
                    });
                });
            }

            // page flipping
            $scope.classPagination = AjaxPagination.new(15, classCardsCount.count,
                function (page, perpage) {
                    var d = $q.defer();

                    updateCards(page, perpage, $scope.filters.search, $scope.filters.mechanics, $scope.filters.mana, function (data) {
                        d.resolve(data[0]);
                    });

                    return d.promise;
                }
            );

            $scope.neutralPagination = AjaxPagination.new(15, neutralCardsCount.count,
                function (page, perpage) {

                    var d = $q.defer();
                    updateCards(page, perpage, $scope.filters.search, $scope.filters.mechanics, $scope.filters.mana, function (data) {
                        d.resolve(data[1]);
                    });

                    return d.promise;
                }
            );

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

            // current mulligan
            $scope.currentMulligan = $scope.deck.getMulligan('Druid');

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
                className: '',
                forChance: 0,
                deckId: ''
            };

            $scope.deck.matchups = [];

            $scope.newMatch = function (klass) {
                var m = angular.copy(defaultMatchUp);
                m.className = klass;
                $scope.deck.matchups.push(m);
            }

            $scope.removeMatch = function (index) {
                $scope.deck.matchups.splice(index,1);
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
                var featured = $scope.deck.isFeatured;
                for (var i = 0; i < $scope.featuredTypes.length; i++) {
                    if ($scope.featuredTypes[i].value === featured) {
                        return $scope.featuredTypes[i].text;
                    }
                }
            }

            // save deck
            var box;
            $scope.saveDeck = function (deck) {
//                if (!$scope.deck.validDeck() || !$scope.deck.validVideo()) { return false; }
//                if (!$scope.app.user.isLogged()) {
//                    LoginModalService.showModal('login');
//                } else {
//                    $scope.deck.heroName = $scope.getName();
//                    DeckBuilder.saveDeck($scope.deck).success(function (data) {
//                        if (data.success) {
//                            $scope.app.settings.deck = null;
//                            $state.transitionTo('app.hs.decks.deck', { slug: data.slug });
//                        } else {
//                            $scope.errors = data.errors;
//                            $scope.showError = true;
//                            $window.scrollTo(0,0);
//                        }
//                    });
//                }
            };
        }
    ])
    .controller('AdminDeckEditCtrl', ['$state', '$filter', '$stateParams', '$q', '$scope', '$compile', '$timeout', '$window', 'AjaxPagination', 'Hearthstone', 'DeckBuilder', 'ImgurService', 'AlertService', 'AdminDeckService', 'classCardsCount', 'Card', 'neutralCardsList', 'classCardsList', 'neutralCardsCount', 'toStep', 'deck', 'resolveParams', 'Deck', 'User', 'Mulligan', 'CardWithCoin', 'CardWithoutCoin', 'DeckCard', 'DeckMatchup', 'LoginModalService', 'isUserAdmin', 'isUserContentProvider',
        function ($state, $filter, $stateParams, $q, $scope, $compile, $timeout, $window, AjaxPagination, Hearthstone, DeckBuilder, ImgurService, AlertService, AdminDeckService, classCardsCount, Card, neutralCardsList, classCardsList, neutralCardsCount, toStep, deck, resolveParams, Deck, User, Mulligan, CardWithCoin, CardWithoutCoin, DeckCard, DeckMatchup, LoginModalService, isUserAdmin, isUserContentProvider) {
            console.log('init deck: ',deck);
            
//            console.log('isUserAdmin: ', isUserAdmin)
//            console.log('isUserContentProvider: ', isUserContentProvider);
            
            $scope.isUserAdmin = isUserAdmin;
            $scope.isUserContentProvider = isUserContentProvider;
            
            $scope.testing = function() {
                console.log('hi');
            };

            $scope.cards = {
                neutral: neutralCardsList,
                class: classCardsList,
                current: classCardsList
            };
            
//            console.log('class cards: ',classCardsList);
//            console.log('neutral cards: ',neutralCardsList);
//            console.log('class card count: ',classCardsCount);
//            console.log('neutral card count: ',neutralCardsCount);
//            console.log('deck cards: ', deckCards);
//              console.log('HS Service: ', Hearthstone);

            // redirect back to class pick if no data
//            if (!data || !data.success == 1) { $state.transitionTo('app.hs.deckBuilder.class'); return false; }

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

//            console.log('classes: ', $scope.classes);

            //get the hero name based on the index of portraitSettings' index
            $scope.getName = function (index, klass) {
                try {
                    return Hearthstone.heroNames[klass][$scope.isSecondary(klass.toLowerCase())];
                } catch(err) {
                    $scope.app.settings.secondaryPortrait = [0,0,0,0,0,0,0,0,0];
                    $scope.getName(index, caps);
                }
            }

            // steps
            $scope.stepDesc = {
                1: 'Select the cards for your deck.',
                2: 'Select which cards to mulligan for.',
                3: 'Provide a description for how to play your deck.',
                4: 'Select how your deck preforms against other classes.',
                5: 'Provide a synopsis and title for your deck.'
            };

            $scope.getDust = function (cards) {
                var dust = 0;
                for (var i = 0; i < cards.length; i++) {
                    dust += cards[i].card.dust * cards[i].cardQuantity;
                }
                return dust
            }

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

            $scope.className = deck.playerClass;

            // filters
            $scope.filters = {
                search: '',
                mechanics: [],
                mana: 'all'
            };

            $scope.setClassCards = function (b) {
                updateCards(1, 15, $scope.filters.search, $scope.filters.mechanics, $scope.filters.mana);
                $timeout(function () {
                    classCards = b;
                });
            }

//            console.log('all cards: ', $scope.cards);
//        $scope.cards.current = $scope.cards.class;

            $scope.search = function() {
                updateCards(1, 15, $scope.filters.search, $scope.filters.mechanics, $scope.filters.mana, false);
            }

            function updateCards (page, perpage, search, mechanics, mana, callback) {
                $scope.fetching = true;

                var options = {
                    filter: {
                        where: {
                            playerClass: ($scope.isClassCards()) ? $scope.className : 'Neutral',
                            deckable: true
                        },
                        order: ["cost ASC", "cardType ASC", "name ASC"],
                        skip: ((page * perpage) - perpage),
                        limit: perpage
                    }
                }
                var countOptionsClass = {
                    where: {
                        playerClass: $scope.className,
                        deckable: true
                    }
                }
                var countOptionsNeutral = {
                    where: {
                        playerClass: 'Neutral',
                        deckable: true
                    }
                }

                if (search.length > 0) {
                    options.filter.where.or = [
                        { name: { regexp: search } },
                        { text: { regexp: search } },
                        { rarity: { regexp: search } },
                        { cardType: { regexp: search } }
                    ]

                    countOptionsClass.where.or = [
                        { name: { regexp: search } },
                        { text: { regexp: search } },
                        { rarity: { regexp: search } },
                        { cardType: { regexp: search } }
                    ]

                    countOptionsNeutral.where.or = [
                        { name: { regexp: search } },
                        { text: { regexp: search } },
                        { rarity: { regexp: search } },
                        { cardType: { regexp: search } }
                    ]
                }

                if (mechanics.length == 1) {
                    options.filter.where.mechanics = {
                        inq: mechanics
                    }

                    countOptionsClass.where.mechanics = {
                        inq: mechanics
                    }

                    countOptionsNeutral.where.mechanics = {
                        inq: mechanics
                    }
                } else if (mechanics.length > 1) {
                    options.filter.where.mechanics = mechanics
                    countOptionsClass.where.mechanics = mechanics
                    countOptionsNeutral.where.mechanics = mechanics
                }

                if (mana != 'all' && mana != '7+') {
                    options.filter.where.cost = mana;
                    countOptionsClass.where.cost = mana;
                    countOptionsNeutral.where.cost = mana;
                } else if (mana == '7+') {
                    options.filter.where.cost = { gte: 7 };
                    countOptionsClass.where.cost = { gte: 7 };
                    countOptionsNeutral.where.cost = { gte: 7 };
                }
                
                Card.count(countOptionsClass)
                    .$promise
                    .then(function (classCount) {
                        Card.count(countOptionsNeutral)
                            .$promise
                            .then(function (neutralCount) {
                                Card.find(options)
                                    .$promise
                                    .then(function (data) {

                                        $scope.classPagination.total = classCount.count;
                                        $scope.classPagination.page = page;
                                        $scope.neutralPagination.total = neutralCount.count;
                                        $scope.neutralPagination.page = page;

                                        $timeout(function () {
                                            $scope.cards.current = data;
                                            $scope.fetching = false;
                                            if (callback) {
                                                return callback([classCount.count, neutralCount.count]);
                                            }
                                        });
                                    });
                            });
                    });
            }

            // page flipping
            $scope.classPagination = AjaxPagination.new(15, classCardsCount.count,
                function (page, perpage) {
                    var d = $q.defer();

                    updateCards(page, perpage, $scope.filters.search, $scope.filters.mechanics, $scope.filters.mana, function (data) {
                        d.resolve(data[0]);
                    });

                    return d.promise;
                }
            );

            $scope.neutralPagination = AjaxPagination.new(15, neutralCardsCount.count,
                function (page, perpage) {

                    var d = $q.defer();
                    updateCards(page, perpage, $scope.filters.search, $scope.filters.mechanics, $scope.filters.mana, function (data) {
                        d.resolve(data[1]);
                    });

                    return d.promise;
                }
            );

            $scope.setClassCards = function (b) {
                classCards = b;
                updateCards(1, 15, $scope.filters.search, $scope.filters.mechanics, $scope.filters.mana);
            }

            $scope.mechanics = Hearthstone.mechanics;
//            console.log('mechanics: ', $scope.mechanics);
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
                updateCards(1,15,$scope.filters.search, $scope.filters.mechanics, $scope.filters.mana);
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
            
//            $scope.deck = DeckBuilder.new($scope.className, deck);
            
            $scope.deck = ($scope.app.settings.deck && $scope.app.settings.deck !== null && $scope.app.settings.deck.id === deck.id) ? DeckBuilder.new($scope.className, $scope.app.settings.deck) : DeckBuilder.new($scope.className, deck);

            $scope.$watch('deck', function() {
                $scope.app.settings.deck = {
                    id: $scope.deck.id,
                    name: $scope.deck.name,
                    slug: $scope.deck.slug,
                    deckType: $scope.deck.deckType,
                    gameModeType: $scope.deck.gameModeType,
                    description: $scope.deck.description,
                    playerClass: $scope.deck.playerClass,
                    createdDate: $scope.deck.createdDate,
                    chapters: $scope.deck.chapters,
                    basic: $scope.deck.basic,
                    matchups: $scope.deck.matchups,
                    cards: $scope.deck.cards,
                    heroName: $scope.deck.heroName,
                    dust: $scope.deck.dust,
                    youtubeId: $scope.deck.youtubeId,
                    premium: $scope.deck.premium,
                    isFeatured: $scope.deck.isFeatured,
                    isPublic: $scope.deck.isPublic,
                    mulligans: $scope.deck.mulligans
                };
                console.log('deck: ', $scope.deck);
            }, true);

            // current mulligan
            $scope.currentMulligan = $scope.deck.getMulligan('Druid');

            $scope.setMulligan = function (mulligan) {
                $scope.currentMulligan = mulligan;
//                console.log('current mulligan: ', $scope.currentMulligan);
            };

            $scope.isMulliganSet = function (mulligan) {
                return (mulligan.cardsWithCoin.length || mulligan.instructionsWithCoin.length || mulligan.cardsWithoutCoin.length || mulligan.instructionsWithoutCoin.length);
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
                className: '',
                forChance: 0
            };

            $scope.newMatch = function (klass) {
                var m = angular.copy(defaultMatchUp);
                m.className = klass;
                $scope.deck.matchups.push(m);
            }

            $scope.removeMatch = function (index, destroyMatchups) {
                if (angular.isDefined($scope.deck.matchups[index].id)) {
                    destroyMatchups.push($scope.deck.matchups[index]);
                }
                $scope.deck.matchups.splice(index,1);
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
                return (coin) ? m.cardsWithCoin : m.cardsWithoutCoin;
            };

            $scope.cardLeft = function ($index, coin) {
                var cardMulligans = $scope.getMulliganCards(coin);
                if(cardMulligans) {
                    var pixels = ((80 / cardMulligans.length) * $index);
                    return pixels;
                }
            };
            
            $scope.isMulliganCard = function (coin, card) {
                if (coin) {
                    for (var i = 0; i < $scope.currentMulligan.cardsWithCoin.length; i++) {
                        if ($scope.currentMulligan.cardsWithCoin[i].id === card.card.id) {
                            return true;
                        }
                    }
                } else {
                    for (var i = 0; i < $scope.currentMulligan.cardsWithoutCoin.length; i++) {
                        if ($scope.currentMulligan.cardsWithoutCoin[i].id === card.card.id) {
                            return true;
                        }
                    }
                }
            };

            // featured
            $scope.featuredTypes = [
                { text: 'No', value: false },
                { text: 'Yes', value: true }
            ];

            $scope.isFeatured = function () {
                var featured = $scope.deck.isFeatured;
                for (var i = 0; i < $scope.featuredTypes.length; i++) {
                    if ($scope.featuredTypes[i].value === featured) {
                        return $scope.featuredTypes[i].text;
                    }
                }
            }

            updateCards(1, 15, $scope.filters.search, $scope.filters.mechanics, $scope.filters.mana);

            // update Hearthstone deck
            $scope.updateDeck = function (deck) {
                console.log('deck to upsert: ', deck);
                $scope.deckSubmitting = true;
                
                if(!deck.validDeck()) {
                    $scope.errors = 'Deck must have exactly 30 cards.';
                    $scope.showError = true;
                    $window.scrollTo(0, 0);
                    $scope.deckSubmitting = false;
                    return false;
                }
                
                console.log('User.isAuthenticated(): ', User.isAuthenticated());
                if(!User.isAuthenticated()) {
                    LoginModalService.showModal('login', function () {
                        $scope.updateDeck(deck);
                    });
                    $scope.deckSubmitting = false;
                    return false;
                }
                
                if(deck.basic) {
                    var hasMulligan = false,
                        hasChapter = false,
                        hasMatchup = false;
                    
                    for(var i = 0; i < deck.mulligans.length; i++) {
                        if(deck.mulligans[i].instructionsWithCoin.length > 0) {
                            hasMulligan = true;
                            break;
                        }
                        if(deck.mulligans[i].instructionsWithoutCoin.length > 0) {
                            hasMulligan = true;
                            break;
                        }
                        if(deck.mulligans[i].cardsWithCoin.length > 0) {
                            hasMulligan = true;
                            break;
                        }
                        if(deck.mulligans[i].cardsWithoutCoin.length > 0) {
                            hasMulligan = true;
                            break;
                        }
                    }
                    
                    if(deck.chapters.length > 0) {
                        hasChapter = true;
                    }
                    
                    if(deck.matchups.length > 0) {
                        hasMatchup = true;
                    }
                    
                    if(hasMulligan || hasChapter || hasMatchup) {
                        var box = bootbox.dialog({
                            title: 'Are you sure you want <strong>' + deck.name + '</strong>' + ' to be a basic deck?',
                            message: 'Any previous mulligans, chapters and matchups will be lost.',
                            buttons: {
                                delete: {
                                    label: 'Continue',
                                    className: 'btn-danger',
                                    callback: function () {
                                        for(var i = 0; i < deck.mulligans.length; i++) {
                                            deck.mulligans[i].instructionsWithCoin = '';
                                            deck.mulligans[i].instructionsWithoutCoin = '';
                                            deck.mulligans[i].cardsWithCoin = [];
                                            deck.mulligans[i].cardsWithoutcoin = [];
                                        }
                                        deck.chapters = [];
                                        deck.matchups = [];
                                        updateDeck(deck);
                                    }
                                },
                                cancel: {
                                    label: 'Cancel',
                                    className: 'btn-default pull-left',
                                    callback: function () {
                                        $scope.$apply($scope.deckSubmitting = false);
                                        box.modal('hide');
                                    }
                                }
                            },
                            closeButton: false
                        });
                        box.modal('show');
                        return false;
                    }
                    updateDeck(deck);
                    return false;
                }
                updateDeck(deck);
                return false;
            };
            
            // Updates Deck, Mulligan, and Matchup Models
            function updateDeck(deck) {
                async.series([
                    function (seriesCallback) {
                        Deck.upsert({
                            where: {
                                id: deck.id
                            }
                        }, deck)
                        .$promise
                        .then(function (deckUpdated) {
                            console.log('deck upserted: ',deckUpdated);
                            seriesCallback(null, 'deck updated');
                        })
                        .catch(function (err) {
                            if(err) {
                                console.log('deck upsert err: ', err);
                                seriesCallback(err);
                            }
                        });
                    },
                    function(seriesCallback) {
                        // Destroy all cards
                        Deck.cards.destroyAll({
                            id: deck.id
                        })
                        .$promise
                        .then(function (allCardsDeleted) {
                            // now create new deck
                            async.each(deck.cards, function(deckCard, deckCardCB) {
                                var deckId = deck.id;
                                deckCard.deckId = deckId;
                                
                                DeckCard.create(deckCard)
                                .$promise
                                .then(function (newCard) {
                                    console.log('newCard: ', newCard);
                                    
                                    // goto next card
                                    deckCardCB();
                                })
                                .catch(function (err) {
                                    if (err) {
                                        console.log('deckCard create err: ', err);
                                        deckCardCB(err);
                                    }
                                });
                            }, function(err) {
                                if (err) {
                                    console.log('deckCard destroy err: ', err);
                                    seriesCallback(err);
                                }
                                seriesCallback(null, 'new deck created');
                            });
                        })
                        .catch(function (err) {
                            if (err) {
                                console.log('allCardsDestroy err: ',err);
                                seriesCallback(err);
                            }
                        });
                    },
                    function (seriesCallback) {
                        // cycle through each mulligan
                        async.each(deck.mulligans, function(mulligan, mulliganCB) {
                            // Update all mulligan instruction info
                            Mulligan.upsert(mulligan)
                            .$promise
                            .then(function (currentMulligan) {
                                console.log('currentMulligan: ', mulligan);
                                
                                
                                
                                // Destroy all cards with coin and recreate them
                                Mulligan.cardsWithCoin.destroyAll({
                                    id: mulligan.id
                                })
                                .$promise
                                .then(function (deleted) {
                                    console.log('deleted: ', deleted);
                                    
                                    async.each(mulligan.cardsWithCoin, function(cardWithCoin, cardWithCoinCB) {
                                        var realCardWithCoin = {
                                            cardId: cardWithCoin.id,
                                            mulliganId: currentMulligan.id,
                                            card: cardWithCoin
                                        };
        //                                    console.log('realCardWithCoin: ', realCardWithCoin);

                                        CardWithCoin.create(realCardWithCoin)
                                        .$promise
                                        .then(function (cardWithCoinCreated) {
        //                                        console.log('cardWithCoin created: ', cardWithCoinCreated);

                                            // goto next cardWithCoin
                                            cardWithCoinCB();
                                        })
                                        .catch(function (err) {
                                            if (err) {
                                                console.log('err: ', err);
                                                cardWithCoinCB(err);
                                            }
                                        });
                                    });
                                })
                                .catch(function (err) {
                                    if (err) {
                                        console.log('cardWithCoin destroyAll err: ', err);
                                        mulliganCB(err);
                                    }
                                });
                                
                                // Destroy all cards without coin and recreate them
                                Mulligan.cardsWithoutCoin.destroyAll({
                                    id: mulligan.id
                                })
                                .$promise
                                .then(function (deleted) {
                                    console.log('deleted: ', deleted);
                                    
                                    async.each(mulligan.cardsWithoutCoin, function(cardWithoutCoin, cardWithoutCoinCB) {
                                        var realCardWithoutCoin = {
                                            cardId: cardWithoutCoin.id,
                                            mulliganId: currentMulligan.id,
                                            card: cardWithoutCoin
                                        };
        //                                    console.log('realCardWithoutCoin: ', realCardWithoutCoin);

                                        CardWithoutCoin.create(realCardWithoutCoin)
                                        .$promise
                                        .then(function (cardWithoutCoinCreated) {
        //                                        console.log('cardWithoutCoin created: ', cardWithoutCoinCreated);

                                            // goto next cardWithCoin
                                            cardWithoutCoinCB();
                                        })
                                        .catch(function (err) {
                                            if (err) {
                                                console.log('err: ', err);
                                                cardWithoutCoinCB(err);
                                            }
                                        });
                                    });
                                })
                                .catch(function (err) {
                                    if (err) {
                                        console.log('mulligan upsert err: ', err);
                                        mulliganCB(err);
                                    }
                                });
                                
                                // next mulligan
                                mulliganCB();
                                
                            })
                            .catch(function (err) {
                                if (err) {
                                    console.log('mulligan upsert err: ', err);
                                    mulliganCB(err);
                                }
                            });
                            
                        }, function(err) {
                            if (err) {
                                console.log('err: ', err);
                                seriesCallback(err);
                            }
                            seriesCallback(null, 'deck mulligans done');
                        }); 
                    },
                    function (seriesCallback) {
                        // destroy deck matchups, then recreate
                        Deck.matchups.destroyAll({
                            id: deck.id
                        })
                        .$promise
                        .then(function (deleted) {
                            console.log('deleted: ', deleted);
                            
                            async.each(deck.matchups, function(matchup, matchupCB) {
                                matchup.forDeckId = deck.id;
                                
                                DeckMatchup.upsert(matchup)
                                .$promise
                                .then(function (newMatchup) {
                                    console.log('newMatchup: ', newMatchup);
                                    matchupCB();
                                })
                                .catch(function (err) {
                                    if (err) {
                                        console.log('matchup upsert err: ', err);
                                        matchupCB(err);
                                    }
                                });
                            }, function (err) {
                                if (err) {
                                    seriesCallback(err);
                                }
                                seriesCallback(null, 'matchups destroyed then updated');
                            });
                            
                        })
                        .catch(function (err) {
                            if (err) {
                                console.log('matchup destroyAll err: ', err);
                                seriesCallback(err);
                            }
                        });
                    }
                ], 
                function(err, results) {
                    if (err) {
                        console.log('series err: ', err);
                        $scope.errors = err.data.error.message;
                        $scope.showError = true;
                        $window.scrollTo(0,0);
                        $scope.deckSubmitting = false;
                        return false;
                    }
                    console.log('series results: ', results);
                    $scope.deckSubmitting = false;
                    $state.transitionTo('app.hs.decks.deck', { slug: deck.slug });
                });
            }
        }
    ])
    .controller('AdminUserListCtrl', ['$scope', 'bootbox', 'Pagination', 'AlertService', 'AdminUserService', 'users',
        function ($scope, bootbox, Pagination, AlertService, AdminUserService, users) {
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
    .controller('DeckBuilderCtrl', ['$stateParams', '$q', '$state', '$scope', '$timeout', '$compile', '$window', 'LoginModalService', 'AjaxPagination', 'Hearthstone', 'DeckBuilder', 'ImgurService', 'UserService', 'AuthenticationService', 'SubscriptionService', 'Card', 'neutralCardsList', 'classCardsList', 'classCardsCount', 'neutralCardsCount', 'toStep', 'Deck', 'User', 'Util', 'Mulligan', 'CardWithCoin', 'CardWithoutCoin', 'DeckMatchup', 'isUserAdmin', 'isUserContentProvider',
        function ($stateParams, $q, $state, $scope, $timeout, $compile, $window, LoginModalService, AjaxPagination, Hearthstone, DeckBuilder, ImgurService, UserService, AuthenticationService, SubscriptionService, Card, neutralCardsList, classCardsList, classCardsCount, neutralCardsCount, toStep, Deck, User, Util, Mulligan, CardWithCoin, CardWithoutCoin, DeckMatchup, isUserAdmin, isUserContentProvider) {
            // redirect back to class pick if no data
//        if (!data || !data.success) { $state.transitionTo('app.hs.deckBuilder.class'); return false; }

            $scope.className = $stateParams.playerClass.slice(0,1).toUpperCase() + $stateParams.playerClass.substr(1);
            
            $scope.isUserAdmin = isUserAdmin;
            $scope.isUserContentProvider = isUserContentProvider;
            
            // deck
            $scope.deckTypes = Hearthstone.deckTypes;

            $scope.deck = ($scope.app.settings.deck && $scope.app.settings.deck !== null && $scope.app.settings.deck.playerClass === $scope.className) ? DeckBuilder.new($scope.className, $scope.app.settings.deck) : DeckBuilder.new($scope.className);

            $scope.$watch('deck', function() {
                $scope.app.settings.deck = {
                    id: $scope.deck.id,
                    name: $scope.deck.name,
                    slug: $scope.deck.slug,
                    deckType: $scope.deck.deckType,
                    gameModeType: $scope.deck.gameModeType,
                    description: $scope.deck.description,
                    playerClass: $scope.className,
                    createdDate: $scope.deck.createdDate,
                    chapters: $scope.deck.chapters,
                    basic: $scope.deck.basic,
                    matchups: $scope.deck.matchups,
                    cards: $scope.deck.cards,
                    heroName: $scope.deck.heroName,
                    dust: $scope.deck.dust,
                    youtubeId: $scope.deck.youtubeId,
                    premium: $scope.deck.premium,
                    isFeatured: $scope.deck.isFeatured,
                    isPublic: $scope.deck.isPublic,
                    mulligans: $scope.deck.mulligans
                };
                console.log('deck: ', $scope.deck);
            }, true);
            
            //match-ups
            var defaultMatchUp = {
                deckName: '',
                className: '',
                forChance: 0,
                deckId: ''
            };

            $scope.newMatch = function (klass) {
                var m = angular.copy(defaultMatchUp);
                m.className = klass;
                $scope.deck.matchups.push(m);
            }

            $scope.cards = {
                neutral: neutralCardsList,
                class: classCardsList,
                current: classCardsList
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

            $scope.getActiveDeckName = function () {
                return Hearthstone.heroNames[$stateParams.playerClass.slice(0,1).toUpperCase() + $stateParams.playerClass.substr(1)][$scope.isSecondary($stateParams.playerClass)];
            }
            // deck hero name
            $scope.deck.heroName = $scope.getActiveDeckName();

            //get the hero name based on the index of portraitSettings' index
            $scope.getName = function (index, klass) {
                try {
                    return Hearthstone.heroNames[klass][$scope.isSecondary(klass.toLowerCase())];
                } catch(err) {
                    $scope.app.settings.secondaryPortrait = [0,0,0,0,0,0,0,0,0];
                    $scope.getName(index, caps);
                }
            }

            // set default tab page
            $scope.step = 1;
            $scope.showManaCurve = false;
            $scope.classes = angular.copy(Hearthstone.classes).splice(1, 9);

            $scope.getDust = function (cards) {
                var dust = 0;
                for (var i = 0; i < cards.length; i++) {
                    dust += cards[i].card.dust * cards[i].cardQuantity;
                }
                return dust
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

            $scope.search = function() {
                updateCards(1, 15, $scope.filters.search, $scope.filters.mechanics, $scope.filters.mana, false);
            }

            function updateCards (page, perpage, search, mechanics, mana, callback) {
                $scope.fetching = true;

                var options = {
                    filter: {
                        where: {
                            playerClass: ($scope.isClassCards()) ? $scope.className : 'Neutral',
                            deckable: true
                        },
                        order: ["cost ASC", "cardType ASC", "name ASC"],
                        skip: ((page * perpage) - perpage),
                        limit: perpage
                    }
                }
                var countOptionsClass = {
                    where: {
                        playerClass: $scope.className,
                        deckable: true
                    }
                }
                var countOptionsNeutral = {
                    where: {
                        playerClass: 'Neutral',
                        deckable: true
                    }
                }

                if (search.length > 0) {
                    options.filter.where.or = [
                        { name: { regexp: search } },
                        { text: { regexp: search } },
                        { rarity: { regexp: search } },
                        { cardType: { regexp: search } }
                    ]

                    countOptionsClass.where.or = [
                        { name: { regexp: search } },
                        { text: { regexp: search } },
                        { rarity: { regexp: search } },
                        { cardType: { regexp: search } }
                    ]

                    countOptionsNeutral.where.or = [
                        { name: { regexp: search } },
                        { text: { regexp: search } },
                        { rarity: { regexp: search } },
                        { cardType: { regexp: search } }
                    ]
                }

                if (mechanics.length == 1) {
                    options.filter.where.mechanics = {
                        inq: mechanics
                    }

                    countOptionsClass.where.mechanics = {
                        inq: mechanics
                    }

                    countOptionsNeutral.where.mechanics = {
                        inq: mechanics
                    }
                } else if (mechanics.length > 1) {
                    options.filter.where.mechanics = mechanics
                    countOptionsClass.where.mechanics = mechanics
                    countOptionsNeutral.where.mechanics = mechanics
                }

                if (mana != 'all' && mana != '7+') {
                    options.filter.where.cost = mana;
                    countOptionsClass.where.cost = mana;
                    countOptionsNeutral.where.cost = mana;
                } else if (mana == '7+') {
                    options.filter.where.cost = { gte: 7 };
                    countOptionsClass.where.cost = { gte: 7 };
                    countOptionsNeutral.where.cost = { gte: 7 };
                }
                
                Card.count(countOptionsClass)
                    .$promise
                    .then(function (classCount) {
                        Card.count(countOptionsNeutral)
                            .$promise
                            .then(function (neutralCount) {
                                Card.find(options)
                                    .$promise
                                    .then(function (data) {

                                        $scope.classPagination.total = classCount.count;
                                        $scope.classPagination.page = page;
                                        $scope.neutralPagination.total = neutralCount.count;
                                        $scope.neutralPagination.page = page;

                                        $timeout(function () {
                                            $scope.cards.current = data;
                                            $scope.fetching = false;
                                            if (callback) {
                                                return callback([classCount.count, neutralCount.count]);
                                            }
                                        });
                                    });
                            });
                    });
            };

            // page flipping
            $scope.classPagination = AjaxPagination.new(15, classCardsCount.count,
                function (page, perpage) {
                    var d = $q.defer();

                    updateCards(page, perpage, $scope.filters.search, $scope.filters.mechanics, $scope.filters.mana, function (data) {
                        d.resolve(data[0]);
                    });

                    return d.promise;
                }
            );

            $scope.neutralPagination = AjaxPagination.new(15, neutralCardsCount.count,
                function (page, perpage) {

                    var d = $q.defer();
                    updateCards(page, perpage, $scope.filters.search, $scope.filters.mechanics, $scope.filters.mana, function (data) {
                        d.resolve(data[1]);
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
                var index = $scope.filters.mechanics.indexOf(mechanic);
                if (index === -1) {
                    $scope.filters.mechanics.push(mechanic);
                } else {
                    $scope.filters.mechanics.splice(index, 1);
                }
                updateCards(1,15,$scope.filters.search, $scope.filters.mechanics, $scope.filters.mana);
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

            // current mulligan
            $scope.currentMulligan = $scope.deck.getMulligan('Druid');

            $scope.setMulligan = function (mulligan) {
                $scope.currentMulligan = mulligan;
            };

            $scope.isMulliganSet = function (mulligan) {
                return (mulligan.cardsWithCoin.length || mulligan.cardsWithCoin.instructions.length || mulligan.cardsWithoutCoin.length || mulligan.cardsWithoutCoin.instructions.length);
            };

            $scope.isMulliganCard = function (coin, card) {
                if (coin) {
                    for (var i = 0; i < $scope.currentMulligan.cardsWithCoin.length; i++) {
                        if ($scope.currentMulligan.cardsWithCoin[i].id === card.card.id) {
                            return true;
                        }
                    }
                } else {
                    for (var i = 0; i < $scope.currentMulligan.cardsWithoutCoin.length; i++) {
                        if ($scope.currentMulligan.cardsWithoutCoin[i].id === card.card.id) {
                            return true;
                        }
                    }
                }
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

            $scope.getMulliganCards = function (coin) {
                if (!$scope.currentMulligan) { return false; }
                var m = $scope.currentMulligan;
                return (coin) ? m.cardsWithCoin : m.cardsWithoutCoin;
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

            // save Hearthstone deck
            $scope.saveDeck = function (deck) {
                console.log('deck to create: ', deck);
                $scope.deckSubmitting = true;
                
                if(!deck.validDeck()) {
                    $scope.errors = 'Deck must have exactly 30 cards.';
                    $scope.showError = true;
                    $window.scrollTo(0, 0);
                    $scope.deckSubmitting = false;
                    return false;
                }
                
                console.log('User.isAuthenticated(): ', User.isAuthenticated());
                if(!User.isAuthenticated()) {
                    LoginModalService.showModal('login', function () {
                        $scope.saveDeck(deck);
                    });
                    $scope.deckSubmitting = false;
                    return false;
                }
                
                if(deck.basic) {
                    var hasMulligan = false,
                        hasChapter = false,
                        hasMatchup = false;
                    
                    for(var i = 0; i < deck.mulligans.length; i++) {
                        if(deck.mulligans[i].instructionsWithCoin.length > 0) {
                            hasMulligan = true;
                            break;
                        }
                        if(deck.mulligans[i].instructionsWithoutCoin.length > 0) {
                            hasMulligan = true;
                            break;
                        }
                        if(deck.mulligans[i].cardsWithCoin.length > 0) {
                            hasMulligan = true;
                            break;
                        }
                        if(deck.mulligans[i].cardsWithoutCoin.length > 0) {
                            hasMulligan = true;
                            break;
                        }
                    }
                    
                    if(deck.chapters.length > 0) {
                        hasChapter = true;
                    }
                    
                    if(deck.matchups.length > 0) {
                        hasMatchup = true;
                    }
                    
                    if(hasMulligan || hasChapter || hasMatchup) {
                        var box = bootbox.dialog({
                            title: 'Are you sure you want <strong>' + deck.name + '</strong>' + ' to be a basic deck?',
                            message: 'Any previous mulligans, chapters and matchups will be lost.',
                            buttons: {
                                delete: {
                                    label: 'Continue',
                                    className: 'btn-danger',
                                    callback: function () {
                                        for(var i = 0; i < deck.mulligans.length; i++) {
                                            deck.mulligans[i].instructionsWithCoin = '';
                                            deck.mulligans[i].instructionsWithoutCoin = '';
                                            deck.mulligans[i].cardsWithCoin = [];
                                            deck.mulligans[i].cardsWithoutcoin = [];
                                        }
                                        deck.chapters = [];
                                        deck.matchups = [];
                                        saveDeck(deck);
                                    }
                                },
                                cancel: {
                                    label: 'Cancel',
                                    className: 'btn-default pull-left',
                                    callback: function () {
                                        $scope.$apply($scope.deckSubmitting = false);
                                        box.modal('hide');
                                    }
                                }
                            },
                            closeButton: false
                        });
                        box.modal('show');
                        return false;
                    }
                    saveDeck(deck);
                    return false;
                }
                saveDeck(deck);
                return false;
            };
            
            function saveDeck(deck) {
//                deck.slug = Util.slugify(deck.name);
                console.log('saving deck: ', deck);
                async.waterfall([
                    function (seriesCallback) {
                        Deck.create(deck)
                        .$promise
                        .then(function (deckCreated) {
                            console.log('deck created: ',deckCreated);
                            var deckId = deckCreated.id;
                            var deckSlug = deckCreated.slug;
                            seriesCallback(null, deckId, deckSlug);
                        })
                        .catch(function (err) {
                            if(err) {
                                console.log('deck upsert err: ', err);
                                seriesCallback(err);
                            }
                        });
                    },
                    function(deckId, deckSlug, seriesCallback) {
                        // Create cards for deck
//                        console.log('deckCard deckId: ', deckId);
                        async.each(deck.cards, function(deckCard, deckCardCB) {
                            // add deckId
                            deckCard.deckId = deckId;
//                            console.log('deckCard: ', deckCard);
                            
                            Deck.cards.create({
                                id: deckId
                            }, deckCard)
                            .$promise
                            .then(function (cardCreated) {
//                                console.log('card created: ', cardCreated);
                                
                                // goto next deckCard
                                return deckCardCB();
                            })
                            .catch(function (err) {
                                if (err) {
                                    deckCardCB(err);
                                }
                            });
                        }, function(err) {
                            if (err) {
                                seriesCallback(err);
                            }
                            seriesCallback(null, deckId, deckSlug);
                        });
                    },
                    function (deckId, deckSlug, seriesCallback) {
//                        console.log('mulligan deckId: ', deckId);
                        async.each(deck.mulligans, function(mulligan, mulliganCB) {
                            // add deckId
                            mulligan.deckId = deckId;
                            Deck.mulligans.create({
                                id: deckId
                            }, mulligan)
                            .$promise
                            .then(function (mulliganCreated) {
//                                console.log('mulligan created: ', mulliganCreated);
                                
                                async.each(mulligan.cardsWithCoin, function(cardWithCoin, cardWithCoinCB) {
//                                    console.log('cardWithCoin: ', cardWithCoin);
                                    var realCardWithCoin = {
                                        cardId: cardWithCoin.id,
                                        mulliganId: mulliganCreated.id,
                                        card: cardWithCoin
                                    };
//                                    console.log('realCardWithCoin: ', realCardWithCoin);
                                    
                                    CardWithCoin.create(realCardWithCoin)
                                    .$promise
                                    .then(function (cardWithCoinCreated) {
//                                        console.log('cardWithCoin created: ', cardWithCoinCreated);
                                        
                                        // goto next cardWithCoin
                                        cardWithCoinCB();
                                    })
                                    .catch(function (err) {
                                        if (err) {
                                            console.log('err: ', err);
                                            cardWithCoinCB(err);
                                        }
                                    });
                                });
                                
                                async.each(mulligan.cardsWithoutCoin, function(cardWithoutCoin, cardWithoutCoinCB) {
//                                    console.log('cardWithoutCoin: ', cardWithoutCoin);
                                    var realCardWithoutCoin = {
                                        cardId: cardWithoutCoin.id,
                                        mulliganId: mulliganCreated.id,
                                        card: cardWithoutCoin
                                    };
//                                    console.log('realCardWithoutCoin: ', realCardWithoutCoin);
                                    CardWithoutCoin.create(realCardWithoutCoin)
                                    .$promise
                                    .then(function (cardWithoutCoinCreated) {
//                                        console.log('cardWithCoin created: ', cardWithoutCoinCreated);
                                        
                                        // goto next cardWithCoin
                                        cardWithoutCoinCB();
                                    })
                                    .catch(function (err) {
                                        if (err) {
                                            console.log('err: ', err);
                                            cardWithoutCoinCB(err);
                                        }
                                    });
                                });
                                
                                // goto next mulligan
                                mulliganCB();
                            })
                            .catch(function (err) {
                                if (err) {
                                    mulliganCB(err);
                                }
                            });
                        }, function(err) {
                            if (err) {
                                seriesCallback(err);
                            }
                            seriesCallback(null, deckId, deckSlug);
                        });
                    },
                    function (deckId, deckSlug, seriesCallback) {
                        console.log('matchup deckId: ', deckId);
                        console.log('deck.matchups: ', deck.matchups);
                        console.log('deckSlug: ', deckSlug);
                        async.each(deck.matchups, function(matchup, matchupCB) {
//                            console.log('matchup: ', matchup);
                            matchup.forDeckId = deckId;
                            
                            Deck.matchups.create({
                                id: deckId
                            }, matchup)
                            .$promise
                            .then(function (matchupCreated) {
//                                console.log('matchup created: ', matchupCreated);
                                
                                // goto next
                                matchupCB();
                            })
                            .catch(function (err) {
                                if (err) {
                                    matchupCB(err);
                                }
                            });
                        }, function(err) {
                            if (err) {
                                seriesCallback(err);
                            }
                            seriesCallback(null, deckSlug);
                        });
                    }
                ], 
                function(err, results) {
                    if (err) {
                        console.log('series err: ', err);
                        $scope.errors = err.data.error.message;
                        $scope.showError = true;
                        $window.scrollTo(0,0);
                        $scope.deckSubmitting = false;
                        return false;
                    }
                    console.log('Deck Created!');
                    $scope.deckSubmitting = false;
                    $state.transitionTo('app.hs.decks.deck', { slug: results });
                });
            }

            var box;
//            $scope.saveDeck = function () {
//                if (!$scope.deck.validDeck() || !$scope.deck.validVideo()) { return false; }
//                if (!$scope.app.user.isLogged()) {
//                    LoginModalService.showModal('login');
//                } else {
//                    $scope.deck.heroName = $scope.getActiveDeckName();
//                    DeckBuilder.saveDeck($scope.deck).success(function (data) {
//                        if (data.success) {
//                            $scope.app.settings.deck = null;
//                            $state.transitionTo('app.hs.decks.deck', { slug: data.slug });
//                        } else {
//                            $scope.errors = data.errors;
//                            $scope.showError = true;
//                            $window.scrollTo(0,0);
//                        }
//                    });
//                }
//            };

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
            $scope.currentMulligan = $scope.deck.getMulligan('Druid');

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
                className: '',
                forChance: 0,
                deckId: ''
            };

            $scope.newMatch = function (klass) {
                var m = angular.copy(defaultMatchUp);
                m.className = klass;
                $scope.deck.matchups.push(m);
            }

            $scope.removeMatch = function (index) {
                $scope.deck.matchups.splice(index,1);
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
//            $scope.updateDeck = function () {
//                if (!$scope.deck.validDeck() || !$scope.deck.validVideo()) { return false; }
//                DeckBuilder.updateDeck($scope.deck).success(function (data) {
//                    if (data.success) {
//                        $state.transitionTo('app.hs.decks.deck', { slug: data.slug });
//                    } else {
//                        $scope.errors = data.errors;
//                        $scope.showError = true;
//                        $window.scrollTo(0,0);
//                    }
//                });
//            };
            $scope.saveDeck = function(deck) {
                console.log('deck to save: ', deck);
            };

        }
    ])
    .controller('SnapshotCtrl', ['$scope', '$state', '$rootScope', '$compile', '$window', 'dataSnapshot', 'LoginModalService', 'User', 'Snapshot', 'LoopBackAuth',
        function ($scope, $state, $rootScope, $compile, $window, dataSnapshot, LoginModalService, User, Snapshot, LoopBackAuth) {

            console.log('snapshot: ', dataSnapshot);
            $scope.snapshot = dataSnapshot;
            // New decktiers array from snapshot.deckTiers
            $scope.deckTiers = getAllDecksByTier();

            $scope.SnapshotService = Snapshot;

            console.log('new deckTiers: ', $scope.deckTiers);

            $scope.show = [];
            $scope.matchupName = [];
            $scope.voted = false;
//            $scope.hasVoted = checkVotes();

            function getAllDecksByTier() {
                var uniqueTiers = {};
                var outArr = [];

                // loop through all deck tiers
                // create an object for each tier
                // determine the tier of the deck
                // push the deck to the corresponding tier obj

                for(var i = 0, j = $scope.snapshot.deckTiers.length; i < j; i++) {
                    var currentDeckTier = $scope.snapshot.deckTiers[i].tier;
                    var uniqueTier = true;
                    for(var k = 0, l = outArr.length; k < l; k++) {
                        if(outArr[k].tier === currentDeckTier) {
                            uniqueTier = false;
                            outArr[k].decks.push($scope.snapshot.deckTiers[i]);
                        }
                    }

                    if(uniqueTier) {
                        var newTier = {
                            id: $scope.snapshot.deckTiers[i].id,
                            tier: currentDeckTier,
                            decks: [$scope.snapshot.deckTiers[i]],
                        };
                        outArr.push(newTier);
                    }
                }

                return outArr;

            }

//        $scope.show.comments = SnapshotService.getStorage();
//        $scope.$watch('User.isAuthenticated()', function() {
//            $scope.hasVoted();
//        });

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

            console.log('square: ', $scope.snapshot.photoNames.square);

            var ogImg = ($scope.snapshot.photoNames.square == "") ? $scope.app.cdn + 'snapshots/default-banner-square.jpg' : $scope.app.cdn + 'snapshots/' + $scope.snapshot.photoNames.square;
            $scope.metaservice.setOg('https://tempostorm.com/hearthstone/meta-snapshot/' + $scope.snapshot.slug.url, $scope.snapshot.title, $scope.snapshot.content.intro, 'article', ogImg);

            for (var i = 0; i < $scope.deckTiers.length; i++) {
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

//        $scope.getTier = function (tier) {
//            for (var i = 0; i < $scope.snapshot.tiers.length; i++) {
//                if ($scope.snapshot.tiers[i].tier == tier) {
//                    return $scope.snapshot.tiers[i];
//                }
//            }
//            return false;
//        }

            $scope.getTier = function (tier) {
                for (var i = 0; i < $scope.deckTiers.length; i++) {
                    if ($scope.deckTiers[i].tier == tier) {
                        return $scope.deckTiers[i];
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

                return out;
            };

            // init tier ranges
            for (var i = 0; i < $scope.deckTiers.length; i++) {
                var tierNum = $scope.deckTiers[i].tier;
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
                var ranks = deck.ranks;
                return ranks;
            };

            $scope.getRankIndex = function (tierNum, rank) {
                var range = $scope.tierRange[tierNum];
                return range.indexOf(rank);
            };

            $scope.getNextRank = function (deck, index) {
                return deck.ranks[index + 1];
            };

            $scope.hasNextRank = function (deck, index) {
                return (deck.ranks[index + 1]);
            };

//            function checkVotes () {
//                for (var i = 0; i < $scope.snapshot.votes.length; i++) {
//                    if (typeof($scope.snapshot.votes[i]) === 'object') {
//                        if ($scope.snapshot.votes[i].userID == LoopBackAuth.currentUserId) {
//                            $scope.hasVoted = true;
//                            break;
//                        }
//                    } else {
//                        if ($scope.snapshot.votes[i] == LoopBackAuth.currentUserId) {
//                            $scope.hasVoted = true;
//                            break;
//                        }
//                    }
//                }
//                return $scope.hasVoted
//            }
//            console.log(LoopBackAuth.currentUserId);
//            $scope.voteSnapshot = function (snapshot) {
//
//                if (!LoopBackAuth.currentUserId) {
//                    LoginModalService.showModal('login', function() {
//                        vote(snapshot);
//                    });
//                } else {
//                    if (!$scope.hasVoted) {
//                        console.log(snapshot);
//                        $scope.processingVote = true;
//                        Snapshot.findOne({
//                            filter: {
//                                where: {
//                                    id: $scope.snapshot.id
//                                },
//                                fields: ["votes", "votesCount"]
//                            }
//                        })
//                        .$promise
//                        .then(function (snapshot) {
//                            async.waterfall([
//                                function(seriesCallback) {
//                                    snapshot.votes.push(LoopBackAuth.currentUserId);
//                                    snapshot.votesCount += 1;
//                                    return seriesCallback(undefined, snapshot)
//                                },
//                                function(snapshot, seriesCallback) {
//
//                                    Snapshot.update({
//                                        where: {
//                                            id: $scope.snapshot.id
//                                        }
//                                    }, {
//                                        votes: snapshot.votes,
//                                        votesCount: snapshot.votesCount
//                                    }, function (data) {
//                                        $scope.snapshot.votes = data.votes;
//                                        $scope.snapshot.votesCount = data.votesCount;
//                                        checkVotes();
//                                        $scope.processingVote = false;
//                                    });
//                                }
//                            ]);
//                        });
//                    }
//                }
//            };

            // check for custom deck name or load normal name
//        function getDeckName (deckID) {
//            for (var i = 0; i < $scope.snapshot.tiers.length; i++) {
//                for (var j = 0; j < $scope.snapshot.tiers[i].decks.length; j++) {
//                    if ($scope.snapshot.tiers[i].decks[j].deck._id == deckID) {
//                        return ($scope.snapshot.tiers[i].decks[j].name.length) ? $scope.snapshot.tiers[i].decks[j].name : $scope.snapshot.tiers[i].decks[j].deck.name;
//                    }
//                }
//            }
//            return false;
//        }

            // check for custom deck name or load normal name
            function getDeckName (deckID) {
                for (var i = 0; i < $scope.deckTiers.length; i++) {
                    for (var j = 0; j < $scope.deckTiers[i].decks.length; j++) {
                        if ($scope.deckTiers[i].decks[j].deck.id == deckID) {
                            return ($scope.deckTiers[i].decks[j].name.length) ? $scope.deckTiers[i].decks[j].name : $scope.deckTiers[i].decks[j].deck.name;
                        }
                    }
                }
                return false;
            }

//        function init () {
//            var tierLength = $scope.snapshot.tiers.length,
//                maxTierLength = (tierLength > 2) ? 2 : tierLength;
//
//            /******************************************* HAS VOTED *******************************************/
//
//
//
//            /******************************************* BUILD TIER MATCHES *******************************************/
//            for (var j = 0; j < maxTierLength; j++) {
//                for (var k = 0; k < $scope.snapshot.tiers[j].decks.length; k++) {
//                    var matches = [];
//                    for (var i = 0; i < $scope.snapshot.matches.length; i++) {
//                        if($scope.snapshot.tiers[j].decks[k].deck._id == $scope.snapshot.matches[i].for._id || $scope.snapshot.tiers[j].decks[k].deck._id == $scope.snapshot.matches[i].against._id) {
//                            var newObj = {
//                                against: ($scope.snapshot.tiers[j].decks[k].deck._id == $scope.snapshot.matches[i].against._id) ? $scope.snapshot.matches[i].for._id : $scope.snapshot.matches[i].against._id,
//                                chance: ($scope.snapshot.tiers[j].decks[k].deck._id == $scope.snapshot.matches[i].against._id) ? $scope.snapshot.matches[i].forChance : $scope.snapshot.matches[i].againstChance,
//                                playerClass: ($scope.snapshot.tiers[j].decks[k].deck._id == $scope.snapshot.matches[i].against._id) ? $scope.snapshot.matches[i].for.playerClass : $scope.snapshot.matches[i].against.playerClass,
//                                //name: ($scope.snapshot.tiers[j].decks[k].deck._id == $scope.snapshot.matches[i].against._id) ? $scope.snapshot.matches[i].for.name : $scope.snapshot.matches[i].against.name
//                                name: ($scope.snapshot.tiers[j].decks[k].deck._id == $scope.snapshot.matches[i].against._id) ? getDeckName($scope.snapshot.matches[i].for._id) : getDeckName($scope.snapshot.matches[i].against._id)
//                            };
//                            matches.push(newObj);
//                        }
//                    }
//                    charts[$scope.snapshot.tiers[j].decks[k].deck._id] = matches;
//                }
//            }
//
//        }

            function init () {
                var tierLength = $scope.deckTiers.length,
                    maxTierLength = (tierLength > 2) ? 2 : tierLength;

                /******************************************* HAS VOTED *******************************************/



                /******************************************* BUILD TIER MATCHES *******************************************/
                for (var j = 0; j < maxTierLength; j++) {
                    for (var k = 0; k < $scope.deckTiers[j].decks.length; k++) {
                        var matches = [];
                        for (var i = 0; i < $scope.snapshot.deckMatchups.length; i++) {
                            if($scope.deckTiers[j].decks[k].deck.id == $scope.snapshot.deckMatchups[i].forDeckId || $scope.deckTiers[j].decks[k].deck.id == $scope.snapshot.deckMatchups[i].againstDeckId) {
                                var newObj = {
                                    against: ($scope.deckTiers[j].decks[k].deck.id == $scope.snapshot.deckMatchups[i].againstDeckId) ? $scope.snapshot.deckMatchups[i].forDeckId : $scope.snapshot.deckMatchups[i].againstDeckId,
                                    chance: ($scope.deckTiers[j].decks[k].deck.id == $scope.snapshot.deckMatchups[i].againstDeckId) ? $scope.snapshot.deckMatchups[i].forChance : $scope.snapshot.deckMatchups[i].againstChance,
                                    playerClass: ($scope.deckTiers[j].decks[k].deck.id == $scope.snapshot.deckMatchups[i].againstDeckId) ? $scope.snapshot.deckMatchups[i].forDeck.playerClass : $scope.snapshot.deckMatchups[i].againstDeck.playerClass,
                                    name: ($scope.deckTiers[j].decks[k].deck.id == $scope.snapshot.deckMatchups[i].againstDeckId) ? getDeckName($scope.snapshot.deckMatchups[i].forDeck.id) : getDeckName($scope.snapshot.deckMatchups[i].againstDeck.id)
                                };
                                matches.push(newObj);
                            }
                        }
                        charts[$scope.deckTiers[j].decks[k].deck.id] = matches;
                    }
                }

            }

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
    .controller('ArticlesCtrl', ['$scope', '$state', '$q', '$timeout', 'Article', 'articles', 'articlesTotal', 'MetaService', 'AjaxPagination',
        function ($scope, $state, $q, $timeout, Article, articles, articlesTotal, MetaService, AjaxPagination) {
            //if (!data.success) { return $state.transitionTo('app.articles.list'); }

            // articles
            $scope.articles = articles;
            $scope.total = articlesTotal.count;
            $scope.page = parseInt(articles.page);
            $scope.perpage = articles.perpage;
            $scope.search = "";
            $scope.fetching = false;
            $scope.metaservice = MetaService;
            $scope.metaservice.setOg('https://tempostorm.com/articles');

            // article filtering
            $scope.articleTypes = ['ts', 'hs', 'hots', 'overwatch'];
            $scope.articleFilter = [];
            $scope.toggleArticleFilter = function (type) {
                if ($scope.isArticleFilter(type)) {
                    var index = $scope.articleFilter.indexOf(type);
                    $scope.articleFilter.splice(index, 1);
                } else {
                    $scope.articleFilter.push(type);
                }

                $scope.getArticles();
            };

            $scope.isArticleFilter = function (type) {
                return ($scope.articleFilter.indexOf(type) !== -1);
            };

            $scope.getArticles = function() {
                updateArticles(1, $scope.perpage, $scope.search);
            }

            // pagination
            function updateArticles (page, perpage, search, callback) {
                $scope.fetching = true;

                var options = {},
                    countOptions = {};

                countOptions['where'] = {
                    isActive: true,
                    articleType: {
                        inq: ($scope.articleFilter.length) ? $scope.articleFilter : $scope.articleTypes
                    }
                };

                options.filter = {
                    where: {
                        isActive: true,
                        articleType: {
                            inq: ($scope.articleFilter.length) ? $scope.articleFilter : $scope.articleTypes
                        }
                    },
                    fields: {
                        content: false,
                        votes: false
                    },
                    order: "createdDate DESC",
                    skip: ((page*perpage)-perpage),
                    limit: 12
                };

                if ($scope.search.length > 0) {
                    options.filter.where['or'] = [
                        { title: { regexp: search } },
                        { description: { regexp: search } },
                        { content: { regexp: search } }
                    ];
                    countOptions.where.or = [
                        { title: { regexp: search } },
                        { description: { regexp: search } },
                        { content: { regexp: search } }
                    ];
                }

                Article.count(countOptions, function (count) {
                    Article.find(options, function (articles) {
                        $scope.articlePagination.total = count.count;
                        $scope.articlePagination.page = page;
                        $scope.articlePagination.perpage = perpage;

                        $timeout(function () {
                            $scope.articles = articles;
                            $scope.fetching = false;
                            if (callback) {
                                return callback(count.count);
                            }
                        });
                    });
                });
            }

            // page flipping
            $scope.articlePagination = AjaxPagination.new($scope.perpage, $scope.total,
                function (page, perpage) {
                    var d = $q.defer();

                    updateArticles(page, perpage, $scope.search, function (data) {
                        d.resolve(data);
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
    .controller('ArticleCtrl', ['$scope', '$parse', '$sce', 'Article', 'article', '$state', '$compile', '$window', 'bootbox', 'VoteService', 'MetaService', 'LoginModalService', 'LoopBackAuth',
        function ($scope, $parse, $sce, Article, article, $state, $compile, $window, bootbox, VoteService, MetaService, LoginModalService, LoopBackAuth) {

            console.log(LoopBackAuth);

            $scope.ArticleService = Article;
            $scope.article = article;
            $scope.authorEmail = article.author.email;
            $scope.hasVoted = checkVotes();
//        $scope.ArticleService = ArticleService;
//        $scope.$watch('app.user.isLogged()', function() {
//            for (var i = 0; i < $scope.article.votes.length; i++) {
//                if ($scope.article.votes[i] == LoopBackAuth.currentUserData()) {
//                    checkVotes();
//                    updateCommentVotes();
//                }
//            }
//        });

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

            var ogImg = ($scope.article.photoNames.square != undefined) ? $scope.app.cdn + 'articles/' + $scope.article.photoNames.square : $scope.app.cdn + 'articles/' + $scope.article.photoNames.large;
            $scope.metaservice.setOg('https://tempostorm.com/articles/' + article.slug.url, $scope.article.title, $scope.article.description, 'article', ogImg);

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
                var related = $scope.article.relatedArticles;
                if (!related || !related.length) { return false; }
                for (var i = 0; i < related.length; i++) {
                    if (related[i].isActive) { return true; }
                }
                return false;
            };

            $scope.getType = function (item) {
                if (!item.articleType[1]) {
                    switch (item.articleType[0]) {
                        case 'hs' : return 'hearthstone'; break;
                        case 'ts' : return 'tempostorm'; break;
                        case 'hots' : return 'heroes'; break;
                        case 'overwatch' : return 'overwatch'; break;
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
                        if ($scope.article.votes[i].userID == LoopBackAuth.currentUserId) {
                            $scope.hasVoted = true;
                            break;
                        }
                    } else {
                        if ($scope.article.votes[i] == LoopBackAuth.currentUserId) {
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
                if (!LoopBackAuth.currentUserId) {
                    LoginModalService.showModal('login', function() {
                        vote(article);
                    });
                } else {
                    if (!$scope.hasVoted) {
                        $scope.processingVote = true;
                        Article.findOne({
                            filter: {
                                where: {
                                    id: $scope.article.id
                                },
                                fields: ["votes", "votesCount"]
                            }
                        })
                        .$promise
                        .then(function (article) {
                            async.waterfall([
                                function(seriesCallback) {
                                    article.votes.push({
                                        userID: LoopBackAuth.currentUserId,
                                        direction: 1
                                    });
                                    article.votesCount += 1;
                                    return seriesCallback(undefined, article)
                                },
                                function(article, seriesCallback) {
                                    Article.update({
                                        where: {
                                            id: $scope.article.id
                                        }
                                    }, {
                                        votes: article.votes,
                                        votesCount: article.votesCount
                                    }, function (data) {
                                        $scope.article.votes = data.votes;
                                        $scope.article.votesCount = data.votesCount;
                                        checkVotes();
                                        $scope.processingVote = false;
                                    });
                                }
                            ]);
                        });
                    }
                }
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
    .controller('DecksCtrl', ['$scope', '$state', '$timeout', '$q', 'AjaxPagination', 'Hearthstone', 'Util', 'Deck', 'tempostormDecks', 'tempostormCount', 'communityDecks', 'communityCount',
        function ($scope, $state, $timeout, $q, AjaxPagination, Hearthstone, Util, Deck, tempostormDecks, tempostormCount, communityDecks, communityCount) {
            $scope.metaservice.setOg('https://tempostorm.com/hearthstone/decks');

            // decks
            $scope.deckSearch = '';
            $scope.tempostormDecks = tempostormDecks;
            $scope.communityDecks = communityDecks;

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
            
            function getQuery (featured, page, perpage) {
                console.log("getting query");
                var options = {
                    filter: {
                        where: {
                            isFeatured: featured
                        },
                        fields: {
                            name: true,
                            description: true,
                            slug: true,
                            heroName: true,
                            authorId: true,
                            voteScore: true,
                            playerClass: true,
                            dust: true
                        },
                        include: ["author"],
                        order: "createdDate DESC",
                        skip: (page * perpage) - perpage,
                        limit: perpage
                    }
                }
                
                if (!_.isEmpty($scope.filters.classes)) {
                    options.filter.where.playerClass = {
                        inq: $scope.filters.classes
                    }
                }

                if ($scope.filters.search.length > 0) {
                    console.log("search:", $scope.filters.search);
                    var pattern = new RegExp('.*'+$scope.filters.search+'.*', "i");

                    options.filter.where.or = [
                        { name: { like: pattern } },
                        { description: { like: pattern } },
                        { deckType: { like: pattern } }
                    ]
                }
                
                console.log(options);
                return options;
            }

            // pagination
            function updateTempostormDecks (page, perpage, callback) {
                Deck.find(getQuery(true, page, perpage))
                .$promise
                .then(function (data) {
                    $scope.tempostormPagination.total = data.total;
                    $scope.tempostormPagination.page = page;
                    $timeout(function () {
                        $scope.tempostormDecks = data;

                        if (callback) {
                            return callback(data);
                        }
                    });
                })
                .then(function (err) {
                    console.log("There's been an error:", err);
                });
            }

            $scope.tempostormPagination = AjaxPagination.new(4, tempostormCount,
                function (page, perpage) {
                    var d = $q.defer();

                    updateTempostormDecks(page, perpage, function (data) {
                        d.resolve(data.total);
                    });

                    return d.promise;
                }
            );
            //TODO: MAKE CASE-INSENSITIVE QUERY WORK
            function updateCommunityDecks (page, perpage, callback) {
                Deck.find(getQuery(false, page, perpage))
                .$promise
                .then(function (data) {
                    $scope.communityPagination.total = data.total;
                    $scope.communityPagination.page = page;
                    $timeout(function () {
                        $scope.communityDecks = data;

                        if (callback) {
                            return callback(data);
                        }
                    });
                }).then(function (err) {
                    console.log("There's been an error:", err);
                });;
            }

            $scope.communityPagination = AjaxPagination.new(12, communityCount,
                function (page, perpage) {
                    var d = $q.defer();

                    updateCommunityDecks(page, perpage, function (data) {
                        d.resolve(data.total);
                    });

                    return d.promise;
                }
            );

            //is premium
//        $scope.isPremium = function (guide) {
//            if (!guide.premium.isPremium) { return false; }
//            var now = new Date().getTime(),
//                expiry = new Date(guide.premium.expiryDate).getTime();
//            if (expiry > now) {
//                return true;
//            } else {
//                return false;
//            }
//        }
        }
    ])
    .controller('DeckCtrl', ['$scope', '$state', '$sce', '$compile', '$window', 'bootbox', 'Hearthstone', 'VoteService', 'Deck', 'MetaService', 'LoginModalService', 'LoopBackAuth', 'deckWithMulligans',
        function ($scope, $state, $sce, $compile, $window, bootbox, Hearthstone, VoteService, Deck, MetaService, LoginModalService, LoopBackAuth, deckWithMulligans) {
//        if (!data || !data.success) { return $state.go('app.hs.decks.list'); }
            
            // load deck
            $scope.deck = deckWithMulligans;
            console.log('deck: ', deckWithMulligans);
            
//            console.log('currentMulligan: ', $scope.currentMulligan);
            
            $scope.deckService = Deck;

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
            console.log($scope.show);
            $scope.$watch('show', function(){ $scope.app.settings.show.deck = $scope.show; }, true);

            $scope.getUserInfo = function () {
                console.log(LoopBackAuth);
                if (LoopBackAuth.currentUserData) {
                    return LoopBackAuth;
                } else {
                    return false;
                }
            }

            // mulligans
            $scope.coin = true;

            $scope.toggleCoin = function () {
                $scope.coin = !$scope.coin;
            }

            $scope.getFirstMulligan = function () {
                var mulligans = $scope.deck.mulligans;
                for (var i = 0; i < mulligans.length; i++) {
                    if ($scope.isMulliganSet(mulligans[i])) {
                        return mulligans[i];
                    }
                }
                return false;
            }

            $scope.getMulligan = function (klass) {
                var mulligans = $scope.deck.mulligans;
                for (var i = 0; i < mulligans.length; i++) {
                    if (mulligans[i].className === klass) {
                        return mulligans[i];
                    }
                }
                return false;
            }

            $scope.setMulligan = function (mulligan) {
                $scope.currentMulligan = mulligan;
                console.log('mulligan: ', mulligan);
            };
            
            $scope.isMulliganSet = function (mulligan) {
//                console.log('mulligan: ',mulligan);
                return (mulligan.cardsWithCoin.length > 0 
                        || mulligan.instructionsWithCoin.length > 0 
                        || mulligan.cardsWithoutCoin.length > 0 
                        || mulligan.instructionsWithoutCoin.length > 0);
            };

            $scope.anyMulliganSet = function () {
                var mulligans = $scope.deck.mulligans;
                for (var i = 0; i < mulligans.length; i++) {
                    if ($scope.isMulliganSet(mulligans[i])) {
                        return true;
                    }
                }
                return false;
            };
            
            $scope.currentMulligan = $scope.getFirstMulligan(deckWithMulligans.mulligans);

            $scope.mulliganHide = function (card) {
                if (!$scope.anyMulliganSet()) { return false; }
                if (!$scope.currentMulligan) { return false; }
//                console.log('coin: ', $scope.coin);
                var cards = ($scope.coin) ? $scope.currentMulligan.cardsWithCoin : $scope.currentMulligan.cardsWithoutCoin;
                
//                console.log('cards: ', cards);
//                console.log('card: ', card);

                for (var i = 0; i < cards.length; i++) {
                    if (cards[i].id === card.card.id) { return false; }
                }

                return true;
            }
            
            // find me easy
            $scope.getMulliganInstructions = function () {
                if (!$scope.currentMulligan) { return false; }
                var m = $scope.currentMulligan;
                return ($scope.coin) ? m.instructionsWithCoin : m.instructionsWithoutCoin;
            };

            $scope.getMulliganCards = function () {
                if (!$scope.currentMulligan) { return false; }
                var m = $scope.currentMulligan;
                return ($scope.coin) ? m.cardsWithCoin : m.cardsWithoutCoin;
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
                    dust += $scope.deck.cards[i].cardQuantity * $scope.deck.cards[i].card.dust;
                }
                return dust;
            };

//            // mana curve
//            $scope.deck.manaCurve = function (mana) {
//                var big = 0,
//                    cnt;
//                // figure out largest mana count
//                for (var i = 0; i <= 7; i++) {
//                    cnt = $scope.deck.manaCount(i);
//                    if (cnt > big) big = cnt;
//                }
//
//                if (big === 0) return 0;
//
//                return Math.ceil($scope.deck.manaCount(mana) / big * 98);
//            };
//
//            // mana count
//            $scope.deck.manaCount = function (mana) {
//                var cnt = 0;
//                for (var i = 0; i < $scope.deck.cards.length; i++) {
//                    if ($scope.deck.cards[i].card.cost === mana || (mana === 7 && $scope.deck.cards[i].card.cost >= 7)) {
//                        cnt += $scope.deck.cardQuantities[$scope.deck.cards[i].id];
//                    }
//                }
//                return cnt;
//            };
            
            $scope.deck.manaCurve = function (mana) {
                var big = 0,
                    cnt;
                // figure out largest mana count
                for (var i = 0; i <= 7; i++) {
                    cnt = $scope.deck.manaCount(i);
                    if (cnt > big) big = cnt;
                }

                if (big === 0) return 0;

                return Math.ceil($scope.deck.manaCount(mana) / big * 100);
            };

            $scope.deck.manaCount = function (mana) {
                var cnt = 0;
                for (var i = 0; i < $scope.deck.cards.length; i++) {
                    if ($scope.deck.cards[i].card.cost === mana || (mana === 7 && $scope.deck.cards[i].cost >= 7)) {
                        cnt += $scope.deck.cards[i].cardQuantity;
                    }
                }
                return cnt;
            };

            // voting
            $scope.voteDown = function (deck) {
                vote(-1, deck);
            };

            $scope.voteUp = function (deck) {
                vote(1, deck);
            };

            var box,
                callback;
            
            $scope.activeVote = function (deck, direction) {
                var isActive = false;
                for(var i = 0; i < deck.votes.length; i++) {
                    if((deck.votes[i].userID === LoopBackAuth.currentUserData.id)
                      && (deck.votes[i].direction === direction)) {
                        isActive = true;
                        break;
                    } else {
                        isActive = false;
                    }
                }
                return isActive;
            };
            
            function vote(direction, deck) {
                if (!$scope.getUserInfo()) {
                    LoginModalService.showModal('login', function () {
                        vote(direction, deck);
                    });
                } else {
                    if (deck.author.id === LoopBackAuth.currentUserData.id) {
                        bootbox.alert("You can't vote for your own content.");
                        return false;
                    }
//                    VoteService.voteDeck(direction, deck).then(function (data) {
//                        if (data.success) {
//                            deck.voted = direction;
//                            deck.votesCount = data.votesCount;
//                        }
//                    });
                    
                    // check if user has already voted and edit direction if so
                    var alreadyVoted = false;
                    for(var i = 0; i < deck.votes.length; i++) {
                        if(deck.votes[i].userID === LoopBackAuth.currentUserData.id) {
                            alreadyVoted = true;
                            if(deck.votes[i].direction === direction) {
                                return false;
                            } else {
                                deck.votes[i].direction = direction;
                            }
                        }
                    }
                    
                    if(!alreadyVoted) {
                        deck.votes.push({
                            userID: LoopBackAuth.currentUserData.id,
                            direction: direction
                        });
                    }
                    
                    return Deck.upsert({
                        where: {
                            id: deck.id
                        }
                    }, deck, function(data) {
                        $scope.deck.voteScore = updateVotes();
                    }, function(err) {
                        if(err) console.log('error: ',err);
                    });
                }
                
                //            function updateVotes() {
//                checkVotes($scope.deck);
//
//                function checkVotes (d) {
//                    console.log(d.votes);
//                    var vote = d.votes.filter(function (vote) {
//                        return (LoopBackAuth.currentUserData.id === vote.userID);
//                    })[0];
//
//                    if (vote) {
//                        d.voted = vote.direction;
//                    }
//                }
//            }
            };
            
            function updateVotes() {
                var voteScore = 0;
                for(var i = 0; i < $scope.deck.votes.length; i++) {
                    voteScore += $scope.deck.votes[i].direction;
                }
                return voteScore;
            }
            
            $scope.deck.voteScore = updateVotes();

            // get premium
            //TODO: This is using old stuff
//            $scope.getPremium = function (plan) {
//                if ($scope.app.user.isLogged()) {
//                    if (!$scope.app.user.isSubscribed()) {
//                        $state.transitionTo('app.profile.subscription', { username: $scope.app.user.getUsername(), plan: plan });
//                    }
//                } else {
//                    LoginModalService.showModal('login', function () {
//                        if (!$scope.app.user.isSubscribed() && !$scope.app.user.isAdmin() && !$scope.app.user.isProvider()) {
//                            $scope.getPremium(plan);
//                        }
//                    });
//                }
//            }
        }
    ])
    .controller('ForumCategoryCtrl', ['$scope', 'forumCategories', 'MetaService',
        function ($scope, forumCategories, MetaService) {
            $scope.categories = forumCategories;
            $scope.metaservice.setOg('https://tempostorm.com/forum');
        }
    ])
    .controller('ForumThreadCtrl', ['$scope', '$q', '$timeout', 'Pagination', 'forumThread', 'MetaService', 'AjaxPagination', 'ForumPost', 'forumPostCount',
        function ($scope, $q, $timeout, Pagination, forumThread, MetaService, AjaxPagination, ForumPost, forumPostCount) {
            $scope.perpage = 20;
            $scope.total = forumPostCount.count;
            $scope.thread = forumThread;

            console.log(forumThread);

            $scope.metaservice = MetaService;
            $scope.metaservice.set($scope.thread.title + ' - Forum');

            $scope.metaservice.setOg('https://tempostorm.com/forum/' + $scope.thread.slug.url, $scope.thread.title);

            // pagination
            function updateForumPosts (page, perpage, search, callback) {
                $scope.fetching = true;

                var options = {},
                    countOptions = {
                        where: {
                            forumThreadId: $scope.thread.id
                        }
                    };

                options.filter = {
                    where: {
                        forumThreadId: $scope.thread.id
                    },
                    fields: {
                        id: true,
                        slug: true,
                        title: true,
                        authorId: true,
                        viewCount: true,
                        createdDate: true
                    },
                    include: {
                        relation: 'author',
                        scope: {
                            fields: ['email', 'username']
                        }
                    },
                    order: "createdDate DESC",
                    skip: ((page*perpage)-perpage),
                    limit: 20
                };

                async.waterfall([
                    function (seriesCallback) {
                        ForumPost.count(countOptions).$promise
                        .then(function (postCount) {
                            return seriesCallback(null, postCount);
                        });
                    },
                    function (postCount, seriesCallback) {
                        ForumPost.find(options).$promise
                        .then(function (posts) {
                            return seriesCallback(null, postCount, posts);
                        });
                    },
                    function (postCount, posts, seriesCallback) {
                        async.each(posts, function (post, eachCallback) {
                            ForumPost.comments.count({ id: post.id }).$promise
                            .then(function (commentCount) {
                                post.commentCount = commentCount.count;
                                return eachCallback();
                            });
                        }, function () {
                            $scope.forumPagination.total = postCount.count;
                            $scope.forumPagination.page = page;
                            $scope.forumPagination.perpage = perpage;

                            $timeout(function () {
                                $scope.thread.forumPosts = posts;
                                $scope.fetching = false;
                                if (callback) {
                                    return callback(postCount.count);
                                }
                            });
                        });
                    }
                ]);
            }

            // page flipping
            $scope.forumPagination = AjaxPagination.new($scope.perpage, $scope.total,
                function (page, perpage) {
                    var d = $q.defer();

                    updateForumPosts(page, perpage, $scope.search, function (data) {
                        d.resolve(data);
                    });
                    return d.promise;
                }
            );
        }
    ])
    .controller('ForumAddCtrl', ['$scope', '$state', '$window', '$compile', 'LoginModalService', 'bootbox', 'UserService', 'AuthenticationService', 'SubscriptionService', 'thread', 'User', 'ForumPost', 'Util',
        function ($scope, $state, $window, $compile, LoginModalService, bootbox, UserService, AuthenticationService, SubscriptionService, thread, User, ForumPost, Util) {
            // thread
            $scope.thread = thread;

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

            // create post
            var box;
            $scope.addPost = function () {
                if (!User.isAuthenticated()) {
                    LoginModalService.showModal('login', function () {
                        $scope.addPost();
                    });
                } else {
                    // post
                    var newPost = {
                        title: $scope.post.title,
                        content: $scope.post.content,
                        createdDate: new Date().toISOString(),
                        slug: {
                            url: Util.slugify($scope.post.title),
                            linked: true
                        },
                        forumThreadId: $scope.thread.id,
                        authorId: User.getCurrentId(),
                        votes: [],
                        voteScore: 0,
                        viewCount: 0
                    };

                    ForumPost.create(newPost).$promise
                    .then(function (results) {
                        return $state.transitionTo('app.forum.threads', { thread: $scope.thread.slug.url });
                    })
                    .catch(function (HttpResponse) {
                        console.log("err from froum post:", HttpResponse);
                        $scope.errors = HttpResponse.data;
                        $scope.showError = true;
                        $window.scrollTo(0, 0);
                    });
                }
            };
        }
    ])
    .controller('ForumPostCtrl', ['$scope', '$sce', '$compile', '$window', 'bootbox', 'forumPost', 'MetaService', 'User', 'ForumPost',
        function ($scope, $sce, $compile, $window, bootbox, forumPost, MetaService, User, ForumPost) {

            $scope.post = forumPost;
            $scope.ForumService = ForumPost;

            $scope.thread = $scope.post.forumThread;

            $scope.metaservice = MetaService;
            $scope.metaservice.set($scope.post.title + ' - ' + $scope.thread.title);

            $scope.metaservice.setOg('https://tempostorm.com/forum/' + $scope.thread.slug.url + '/' + $scope.post.slug.url, $scope.post.title, $scope.post.content);

            // inc post on load
            $scope.post.viewCount++;
            ForumPost.upsert($scope.post);

            var defaultComment = {
                comment: ''
            };
            $scope.comment = angular.copy(defaultComment);

            $scope.post.getContent = function () {
                return $sce.trustAsHtml($scope.post.content);
            };
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
    .controller('HOTSHomeCtrl', ['$scope', '$filter', '$timeout', 'dataHeroes', 'dataMaps', 'dataArticles', 'dataGuidesCommunity', 'dataGuidesFeatured', 'Article', 'HOTSGuideQueryService', 'featuredTalentDict', 'communityTalentDict',
        function ($scope, $filter, $timeout, dataHeroes, dataMaps, dataArticles, dataGuidesCommunity, dataGuidesFeatured, Article, HOTSGuideQueryService, featuredTalentDict, communityTalentDict) {

            // data
            $scope.heroes = dataHeroes;
            $scope.maps = dataMaps;
            $scope.articles = dataArticles;
            $scope.guidesCommunity = dataGuidesCommunity;
            $scope.guidesFeatured = dataGuidesFeatured;

            $scope.filters = {
                roles: [],
                universes: [],
                search: '',
                heroes: [],
                map: undefined
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

            function getDict (guides) {
                var dict = {};
                for (var i = 0; i < guides.length; i++) {
                    for (var k = 0; k < guides[i].heroes.length; k++) {
                        for (var l = 0; l < guides[i].heroes[k].talents.length; l++) {
                            var temp = guides[i].heroes[k].talents[l].id;
                            dict[temp] = guides[i].heroes[k].talents[l];
                        }
                    }
                }
                return dict;
            }

            var initializing = true;
            $scope.$watch(function(){ return $scope.filters; }, function (value) {
                if (initializing) {
                    $timeout(function () {
                        initializing = false;
                    });
                } else {
//                    initializing = true;
                    // article filters
                    var articleFilters = [];
                    for (var i = 0; i < $scope.heroes.length; i++) {
                        if (!isFiltered($scope.heroes[i])) {
                            articleFilters.push($scope.heroes[i].name);
                        }
                    }

                     if (!_.isEmpty($scope.filters.heroes) && $scope.filters.map != undefined) {
                        async.parallel([
                            function () {
                                HOTSGuideQueryService.getHeroMapGuides($scope.filters, true, 10, function(err, guides) {
                                    featuredTalentDict = getDict(guides);

                                    $timeout(function () {
                                        $scope.guidesFeatured = guides;
                                        initializing = false;
                                    });
                                });
                            },
                            function () {
                                HOTSGuideQueryService.getHeroMapGuides($scope.filters, false, 10, function(err, guides) {
                                    communityTalentDict = getDict(guides);

                                    $timeout(function () {
                                        $scope.guidesCommunity = guides;
                                        initializing = false;
                                    });
                                });
                            }
                        ]);
                    } else if (!_.isEmpty($scope.filters.heroes) && $scope.filters.map == undefined) {
                        async.parallel([
                            function () {
                                HOTSGuideQueryService.getArticles($scope.filters, true, 6, function(err, articles) {
                                    $timeout(function () {
                                        $scope.articles = articles;
                                        initializing = false;
                                    });
                                });
                            },
                            function () {
                                HOTSGuideQueryService.getHeroGuides($scope.filters, true, 10, function (err, guides) {
                                    featuredTalentDict = getDict(guides);

                                    $timeout(function () {
                                        $scope.guidesFeatured = guides;
                                        initializing = false;
                                    });
                                });
                            },
                            function () {
                                HOTSGuideQueryService.getHeroGuides($scope.filters, false, 10, function (err, guides) {
                                    communityTalentDict = getDict(guides);

                                    $timeout(function () {
                                        $scope.guidesCommunity = guides;
                                        initializing = false;
                                    });
                                });
                            }
                        ])
                    } else if ($scope.filters.search != '') {
                        console.log("search");
                        async.parallel([
                            function () {
                                HOTSGuideQueryService.getGuides($scope.filters, true, 10, function(err, guides) {
                                    featuredTalentDict = getDict(guides);

                                    $timeout(function () {
                                        $scope.guidesFeatured = guides;
                                        initializing = false;
                                    });
                                });
                            },
                            function () {
                                HOTSGuideQueryService.getGuides($scope.filters, false, 10, function(err, guides) {
                                    communityTalentDict = getDict(guides);

                                    $timeout(function () {
                                        $scope.guidesCommunity = guides;
                                        initializing = false;
                                    });
                                });
                            }
                        ]);
                    } else if (_.isEmpty($scope.filters.hero) && $scope.filters.map != undefined) {
                        async.parallel([
                            function () {
                                HOTSGuideQueryService.getMapGuides($scope.filters, true, 10, function(err, guides) {
                                    $timeout(function () {
                                        $scope.guidesFeatured = guides;
                                        initializing = false;
                                    });
                                });
                            },
                            function () {
                                HOTSGuideQueryService.getMapGuides($scope.filters, false, 10, function(err, guides) {
                                    $timeout(function () {
                                        $scope.guidesCommunity = guides;
                                        initializing = false;
                                    });
                                });
                            }
                        ]);
                    } else {
                        async.parallel([
                            function () {
                               HOTSGuideQueryService.getArticles($scope.filters, true, 6, function (err, articles) {
                                   $timeout(function () {
                                       $scope.articles = articles;
                                       initializing = false;
                                   })
                               });
                            },
                            function () {
                                HOTSGuideQueryService.getGuides($scope.filters, true, 10, function(err, guides) {
                                    featuredTalentDict = getDict(guides);

                                    $timeout(function () {
                                        $scope.guidesFeatured = guides;
                                        initializing = false;
                                    });
                                });
                            },
                            function () {
                               HOTSGuideQueryService.getGuides($scope.filters, false, 10, function(err, guides) {
                                    communityTalentDict = getDict(guides);

                                    $timeout(function () {
                                        $scope.guidesCommunity = guides;
                                        initializing = false;
                                    });
                                });
                            }
                        ]);
                    }
                }
            }, true);

            // guides
            $scope.getGuideCurrentHero = function (guide) {
                return (guide.currentHero) ? guide.currentHero : guide.heroes[0];
            };

            $scope.getGuideClass = function (guide) {
                return (guide.guideType == 'hero') ? $scope.getGuideCurrentHero(guide).className : guide.maps[0].className;
            };

            $scope.getTierTalent = function (hero, guide, tier, isFeatured) {
                if (isFeatured) {
                    return (featuredTalentDict[guide.talentTiers[hero.id][tier]] == undefined) ? { className: 'missing', name: "Missing Talent" } : featuredTalentDict[guide.talentTiers[hero.id][tier]];
                } else {
                    return (communityTalentDict[guide.talentTiers[hero.id][tier]] == undefined) ? { className: 'missing', name: "Missing Talent" } : communityTalentDict[guide.talentTiers[hero.id][tier]];
                }

            }

            $scope.guidePrevHero = function ($event, guide) {
                $event.preventDefault();
                $event.stopPropagation();

                var currentHero = $scope.getGuideCurrentHero(guide),
                    index = 0;

                // get index of current hero
                for (var i = 0; i < guide.heroes.length; i++) {
                    if (currentHero.id == guide.heroes[i].id) {
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
                    if (currentHero.id == guide.heroes[i].id) {
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
    .controller('HOTSGuidesListCtrl', ['$q', '$scope', '$state', '$timeout', '$filter', 'AjaxPagination', 'dataCommunityGuides', 'dataTopGuide', 'dataTempostormGuides', 'dataHeroes', 'dataMaps', 'communityTalents', 'tempostormTalents', 'topGuideTalents', 'Guide', 'tempostormGuideCount', 'communityGuideCount', 'HOTSGuideQueryService',
        function ($q, $scope, $state, $timeout, $filter, AjaxPagination, dataCommunityGuides, dataTopGuide, dataTempostormGuides, dataHeroes, dataMaps, communityTalents, tempostormTalents, topGuideTalents, Guide, tempostormGuideCount, communityGuideCount, HOTSGuideQueryService) {

            $scope.tempostormGuides = dataTempostormGuides;
            $scope.tempostormGuideTalents = tempostormTalents;

            $scope.communityGuides = dataCommunityGuides;
            $scope.communityGuideTalents = communityTalents;

            $scope.topGuides = dataTopGuide ? dataTopGuide : false;
            $scope.topGuidesTalents = topGuideTalents;

            // filtering
            $scope.heroes = dataHeroes;
            $scope.maps = dataMaps;

            $scope.filters = {
                roles: [],
                universes: [],
                search: '',
                heroes: [],
                map: undefined
            };

            function getDict (guides) {
                var dict = {};
                for (var i = 0; i < guides.length; i++) {
                    for (var k = 0; k < guides[i].heroes.length; k++) {
                        for (var l = 0; l < guides[i].heroes[k].talents.length; l++) {
                            var temp = guides[i].heroes[k].talents[l].id;
                            dict[temp] = guides[i].heroes[k].talents[l];
                        }
                    }
                }
                return dict;
            }

            var initializing = true;
            $scope.$watch(function(){ return $scope.filters; }, function (value) {
                if (initializing) {
                    $timeout(function () {
                        initializing = false;
                    });
                } else {
                    initializing = true;
                    // generate filters
                    var guideFilters = [];
                    for (var i = 0; i < $scope.filters.heroes.length; i++) {
                        guideFilters.push($scope.filters.heroes[i].id);
                    }
                    if ($scope.filters.map) {
                        guideFilters.push($scope.filters.map.id);
                    }

                     if (!_.isEmpty($scope.filters.heroes) && $scope.filters.map != undefined) {
                        async.series([
                            function (seriesCallback) {
                                HOTSGuideQueryService.getHeroMapGuides($scope.filters, null, 1, function(err, guides) {
                                    $scope.topGuidesTalents = getDict(guides);

                                    $timeout(function () {
                                        $scope.topGuides = guides;
                                        initializing = false;
                                        return seriesCallback();
                                    });
                                });
                            }, function (seriesCallback) {
                                HOTSGuideQueryService.getHeroMapGuides($scope.filters, true, 4, function(err, guides) {
                                    $scope.tempostormGuideTalents = getDict(guides);

                                    $timeout(function () {
                                        $scope.tempostormGuides = guides;
                                        initializing = false;
                                        return seriesCallback();
                                    });
                                });
                            }, function (seriesCallback) {
                                HOTSGuideQueryService.getHeroMapGuides($scope.filters, false, 10, function(err, guides) {
                                    $scope.communityGuideTalents = getDict(guides);

                                    $timeout(function () {
                                        $scope.communityGuides = guides;
                                        initializing = false;
                                        return seriesCallback();
                                    });
                                });
                            }
                        ]);
                    } else if (!_.isEmpty($scope.filters.heroes) && $scope.filters.map == undefined) {
                        async.series([
                            function (seriesCallback) {
                                HOTSGuideQueryService.getHeroGuides($scope.filters, null, 1, function (err, guides) {
                                    $scope.topGuidesTalents = getDict(guides);

                                    $timeout(function () {
                                        $scope.topGuides = guides;
                                        initializing = false;
                                        return seriesCallback();
                                    });
                                });
                            }, function (seriesCallback) {
                                HOTSGuideQueryService.getHeroGuides($scope.filters, true, 4, function (err, guides) {
                                    $scope.tempostormGuideTalents = getDict(guides);

                                    $timeout(function () {
                                        $scope.tempostormGuides = guides;
                                        initializing = false;
                                        return seriesCallback();
                                    });
                                });
                            }, function (seriesCallback) {
                                HOTSGuideQueryService.getHeroGuides($scope.filters, false, 10, function (err, guides) {
                                    $scope.communityGuideTalents = getDict(guides);

                                    $timeout(function () {
                                        $scope.communityGuides = guides;
                                        initializing = false;
                                        return seriesCallback();
                                    });
                                });
                            }
                        ])
                    } else if (_.isEmpty($scope.filters.hero) && $scope.filters.map != undefined) {
                        async.series([
                            function (seriesCallback) {
                                $scope.topGuides = null;
                                initializing = false;
                                return seriesCallback();
                            }, function (seriesCallback) {
                                HOTSGuideQueryService.getMapGuides($scope.filters, true, 4, function(err, guides) {
                                    $timeout(function () {
                                        $scope.tempostormGuides = guides;
                                        initializing = false;
                                        return seriesCallback();
                                    });
                                });
                            }, function (seriesCallback) {
                                HOTSGuideQueryService.getMapGuides($scope.filters, false, 10, function(err, guides) {
                                    $timeout(function () {
                                        $scope.communityGuides = guides;
                                        initializing = false;
                                        return seriesCallback();
                                    });
                                });
                            }
                        ]);
                    } else {
                        async.series([
                            function (seriesCallback) {
                                HOTSGuideQueryService.getGuides($scope.filters, null, 1, function(err, guides) {
                                    $scope.topGuidesTalents = getDict(guides);

                                    $timeout(function () {
                                        $scope.topGuides = guides;
                                        initializing = false;
                                        return seriesCallback();
                                    });
                                });
                            }, function (seriesCallback) {
                                HOTSGuideQueryService.getGuides($scope.filters, true, 4, function(err, guides) {
                                    $scope.tempostormGuideTalents = getDict(guides);

                                    $timeout(function () {
                                        $scope.tempostormGuides = guides;
                                        initializing = false;
                                        return seriesCallback();
                                    });
                                });
                            },
                            function (seriesCallback) {
                               HOTSGuideQueryService.getGuides($scope.filters, false, 10, function(err, guides) {
                                    $scope.communityGuideTalents = getDict(guides);

                                   $timeout(function () {
                                        $scope.communityGuides = guides;
                                        initializing = false;
                                        return seriesCallback();
                                    });
                                });
                            }
                        ]);
                    }
                }
            }, true);

            // top guide
            $scope.getTopGuideHeroBg = function (guide) {
                return ($scope.app.bootstrapWidth !== 'xs') ? $scope.getGuideCurrentHero(guide).className : '';
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
                return (guide.guideType == 'hero') ? $scope.getGuideCurrentHero(guide).className : guide.maps[0].className;
            };

            $scope.getHeroId = function (guide) {
                return $scope.getGuideCurrentHero(guide).id;
            };

            $scope.getTalent = function (hero, guide, tier, isFeatured) {
                if (isFeatured === true) {
                    return ($scope.tempostormGuideTalents[guide.talentTiers[hero.id][tier]] === undefined) ? { className: 'missing', name: "Missing Talent" } : $scope.tempostormGuideTalents[guide.talentTiers[hero.id][tier]];
                } else if (isFeatured === false) {
                    return ($scope.communityGuideTalents[guide.talentTiers[hero.id][tier]] === undefined) ? { className: 'missing', name: "Missing Talent" } : $scope.communityGuideTalents[guide.talentTiers[hero.id][tier]];
                };
                return ($scope.topGuidesTalents[guide.talentTiers[hero.id][tier]] === undefined) ? { className: 'missing', name: "Missing Talent" } : $scope.topGuidesTalents[guide.talentTiers[hero.id][tier]];
            }

            $scope.guidePrevHero = function ($event, guide) {
                $event.preventDefault();
                $event.stopPropagation();

                var currentHero = $scope.getGuideCurrentHero(guide),
                    index = 0;

                // get index of current hero
                for (var i = 0; i < guide.heroes.length; i++) {
                    if (currentHero.id == guide.heroes[i].id) {
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
                    if (currentHero.id == guide.heroes[i].id) {
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

            $scope.getTopGuideTierTalents = function (tier, hero) {
                var talents = [];
                _.each(hero.talentTiers, function(value, key) { if (value == tier) { talents.push(key) } });
                return talents;
            }

            $scope.activeTalent = function (guide, tier, talent) {
                var hero = $scope.getGuideCurrentHero(guide);
                var heroId = hero.id;
                return guide.talentTiers[heroId][tier] === talent;
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

//        function updateTopGuide () {
//            HOTSGuideService.getGuides('hero', getFilters(), 1, 1, $scope.filters.search).then(function (data) {
//                $timeout(function () {
//                    $scope.topGuides = (data.total) ? data.guides : false;
//                });
//            });
//        }

            $scope.tempostormPagination = AjaxPagination.new(4, tempostormGuideCount.count,
                function (page, perpage) {
                    var d = $q.defer();

                    updateTempostormGuides(page, perpage, $scope.search, function (data) {
                        d.resolve(data);
                    });
                    return d.promise;
                }
            );

            $scope.communityPagination = AjaxPagination.new(10, communityGuideCount.count,
                function (page, perpage) {
                    var d = $q.defer();

                    console.log('page: ', page);
                    console.log('perpag: ', perpage);

                    updateCommunityGuides(page, perpage, $scope.search, function (data) {
                        d.resolve(data);
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
    .controller('HOTSGuideCtrl', ['$scope', '$window', '$state', '$sce', '$compile', 'bootbox', 'VoteService', 'Guide', 'guide', 'heroes', 'maps', 'guideTalents', 'LoginModalService', 'MetaService', 'LoopBackAuth', 'User',
        function ($scope, $window, $state, $sce, $compile, bootbox, VoteService, Guide, guide, heroes, maps, guideTalents, LoginModalService, MetaService, LoopBackAuth, User) {

            $scope.guide = guide;
            $scope.Guide = Guide;
            $scope.currentHero = ($scope.guide.heroes.length) ? $scope.guide.heroes[0] : false;
            console.log($scope.currentHero);
            $scope.heroes = heroes;
            $scope.maps = maps;

            $scope.metaservice = MetaService;
            $scope.metaservice.set($scope.guide.name + ' - Guides', $scope.guide.description);

            var ogImg = $scope.app.cdn + 'img/hots/hots-logo.png';
            $scope.metaservice.setOg('https://tempostorm.com/heroes-of-the-storm/guides/' + $scope.guide.slug, $scope.guide.name, $scope.guide.description, 'article', ogImg);

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
                console.log("setCurrentHero:", hero);
                $scope.currentHero = hero;
                $scope.currentTalents = getCurrentTalents();
            };
            
            $scope.getCurrentHero = function () {
                for (var i = 0; i < $scope.guide.heroes.length; i++) {
                    if ($scope.guide.heroes[i].id === $scope.currentHero.id) {
                        return $scope.guide.heroes[i];
                    }
                }
                return false;
            };

            $scope.justHeroes = function () {
                var out = [];

                for (var i = 0; i < $scope.guide.heroes.length; i++) {
                    out.push($scope.guide.heroes[i]);
                }

                return out;
            };

            $scope.getTiers = function () {
                return [1, 4, 7, 10, 13, 16, 20];
            };

            function getCurrentTalents () {
                var levels = $scope.getTiers(),
                    out = [],
                    missing = { className: "missing" };

                for (var i = 0; i < levels.length; i++) {
                    var talent = guideTalents[$scope.guide.talentTiers[$scope.currentHero.id][levels[i]]];
                    (talent !== undefined) ? out[i] = talent : out[i] = { className: "missing", name: "Missing Talent" };
                    out[i].tier = levels[i];
                }
                return out;
            }
            
            if($scope.guideType == "hero") {
                $scope.currentTalents = getCurrentTalents();
            }

            $scope.getTalents = function (hero, tier) {
                var out = [];
                for (var i = 0; i < hero.talents.length; i++) {
                    if (hero.talentTiers[hero.talents[i].id] === tier) {
                        out.push(hero.talents[i]);
                    }
                }
                return out;
            };

            $scope.selectedTalent = function (hero, tier, talent) {
                return ($scope.guide.talentTiers[hero.id][tier] == talent.id);
            };

            // matchups
            $scope.hasSynergy = function (hero) {
                return ($scope.guide.synergy.indexOf(hero.id) !== -1);
            };
            $scope.hasStrong = function (hero) {
                return ($scope.guide.against.strong.indexOf(hero.id) !== -1);
            };
            $scope.hasWeak = function (hero) {
                return ($scope.guide.against.weak.indexOf(hero.id) !== -1);
            };

            // maps
            $scope.hasMap = function (map) {
                for (var i = 0; i < $scope.guide.maps.length; i++) {
                    if ($scope.guide.maps[i].id === map.id) {
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
            
            if ($scope.guide.guideType === 'hero') {
                console.log('sup');
                $scope.setCurrentHero($scope.guide.heroes[0]);
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
    .controller('HOTSGuideBuilderHeroCtrl', ['$scope', '$state', '$timeout', '$window', '$compile', 'HOTSGuideService', 'GuideBuilder', 'HOTS', 'dataHeroes', 'dataMaps', 'LoginModalService', 'User', 'Guide', 'Util',
        function ($scope, $state, $timeout, $window, $compile, HOTSGuideService, GuideBuilder, HOTS, dataHeroes, dataMaps, LoginModalService, User, Guide, Util) {
            var box;

            // create guide
            $scope.guide = ($scope.app.settings.guide && $scope.app.settings.guide.guideType === 'hero') ? GuideBuilder.new('hero', $scope.app.settings.guide) : GuideBuilder.new('hero');

            console.log('guide: ', $scope.guide);

            $scope.$watch('guide', function() {
                $scope.app.settings.guide = $scope.guide;
            }, true);

            // heroes
            $scope.heroes = dataHeroes;

            // maps
            $scope.maps = dataMaps;

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
                    if (dataHeroes[index]) {
                        heroes.push(dataHeroes[index]);
                    } else {
                        heroes.push({});
                    }
                    index++;
                }
                $scope.heroRows.push(heroes);
            }

            console.log('hero row: ',$scope.heroRows);

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
                    if (dataMaps[index]) {
                        maps.push(dataMaps[index]);
                    }
                    index++;
                }
                $scope.mapRows.push(maps);
            }

            // talents
            $scope.getTalents = function (hero) {
                console.log(hero);
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
            };

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
            };

            // save guide
            $scope.saveGuide = function () {

                
                if (!$scope.guide.hasAnyHero() || !$scope.guide.allTalentsDone() ) {
                    return false;
                }
                if (!User.isAuthenticated()) {
                    LoginModalService.showModal('login', function () {
                        $scope.saveGuide();
                    });
                } else {
                    $scope.guide.slug = Util.slugify($scope.guide.name);
//                    $scope.authorId = LoopBackAuth.currentUserId;

                    var tiers = {
                        tier1: 1,
                        tier4: 4, 
                        tier7: 7,
                        tier10: 10,
                        tier13: 13,
                        tier16: 16,
                        tier20: 20
                    }

                    _.each($scope.guide.heroes, function (hero) {
                        $scope.guide.talentTiers[hero.hero.id] = {};
                        _.each(hero.talents, function (talent, key) {
                            $scope.guide.talentTiers[hero.hero.id][tiers[key]] = talent;
                        });
                    });
                    
                    Guide.upsert({}, $scope.guide)
                    .$promise
                    .then(function(data) {
                        console.log("Guide add successful!");
                        async.series([
                            function (seriesCb) {
                                async.each($scope.guide.heroes, function (hero, eachCb) {
                                    Guide.heroes.link({
                                        id: data.id,
                                        fk: hero.hero.id
                                    }, null)
                                    .$promise
                                    .then(function(hData) {
                                        console.log("hero link:", hData);
                                        return eachCb();
                                    })
                                    .catch(function(err) {
                                        console.log("hero link FAILED:", err);
                                        return seriesCb(err);
                                    });
                                }, function () {
                                    return seriesCb(null);
                                });
                            }, function (seriesCb) {
                                async.each($scope.guide.maps, function (map, eachCb) {
                                    Guide.maps.link({
                                        id: data.id,
                                        fk: map
                                    }, null)
                                    .$promise
                                    .then(function (mData) {
                                        console.log("map link:", mData);
                                        return eachCb();
                                    })
                                    .catch(function (err) {
                                        console.log("map link FAILED:", err);
                                    });
                                }, function () {
                                    return seriesCb(null);
                                });
                            }
                        ], function (err) {
                            if (err) { console.log("Something went wrong!", err); return; }

                            console.log("YEP");
                            $state.go('app.hots.guides.guide', { slug: data.slug });
                        });
                    })
                    .catch(function (err) {
                        console.log("Guide add FAILED:",err);
                    });
                }
            };
        }
    ])
    .controller('HOTSGuideBuilderMapCtrl', ['$scope', '$state', '$window', '$compile', 'HOTS', 'Guide', 'User', 'GuideBuilder', 'dataHeroes', 'dataMaps', 'LoginModalService', 'Util',
        function ($scope, $state, $window, $compile, HOTS, Guide, User, GuideBuilder, dataHeroes, dataMaps, LoginModalService, Util) {
            var box;

            // create guide
            $scope.guide = ($scope.app.settings.guide && $scope.app.settings.guide.guideType === 'map') ? GuideBuilder.new('map', $scope.app.settings.guide) : GuideBuilder.new('map');
            $scope.$watch('guide', function(){
                $scope.app.settings.guide = $scope.guide;
            }, true);

            // heroes
            $scope.heroes = dataHeroes;

            // maps
            $scope.maps = dataMaps;

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
                    if (dataMaps[index]) {
                        maps.push(dataMaps[index]);
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
                if (!User.isAuthenticated()) {
                    LoginModalService.showModal('login', function () {
                        $scope.saveGuide();
                    });
                } else {
                    $scope.guide.slug = Util.slugify($scope.guide.name);
//                    $scope.authorId = LoopBackAuth.currentUserId;
                    
                    Guide.upsert({}, $scope.guide)
                    .$promise
                    .then(function (data) {
                        
                        Guide.maps.link({
                            id: data.id,
                            fk: $scope.guide.maps[0]
                        })
                        .$promise
                        .catch(function () {
                            console.log("yeah this isn't working out...");
                        })
                        
                    })
                    .catch(function () {
                        console.log("what are you doing with your life");
                    })
                
                
                
//                if ( !$scope.guide.hasAnyMap() || !$scope.guide.hasAnyChapter() ) {
//                    return false;
//                }
//                if (!$scope.app.user.isLogged()) {
//                    LoginModalService.showModal('login');
//                } else {
//                    console.log('guide: ', $scope.guide);
//                    console.log('name: ',$scope.guide.name);
//                    $scope.guide.slug = Util.slugify($scope.guide.name);
//                    console.log('slug: ',$scope.guide.slug);
//                    HOTSGuideService.addGuide($scope.guide).success(function (data) {
//                        if (!data.success) {
//                            $scope.errors = data.errors;
//                            $scope.showError = true;
//                            $window.scrollTo(0,0);
//                        } else {
//                            $scope.app.settings.guide = null;
//                            $state.go('app.hots.guides.guide', { slug: data.slug });
//                        }
//                    });
//                }
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
    .controller('HOTSTalentCalculatorCtrl', ['$scope', 'heroes',
        function ($scope, heroes) {
          console.log("heroes:", heroes);
            $scope.heroes = heroes;

            $scope.currentHero = false;

            $scope.setCurrentHero = function (hero) {
                $scope.currentHero = hero;
            }

            $scope.getCurrentHero = function () {
                return $scope.currentHero;
            };
        }
    ])
    .controller('HOTSTalentCalculatorHeroCtrl', ['$scope', '$state', '$stateParams', '$location', '$window', 'HOTS', 'Base64', 'hero', 'MetaService',
        function ($scope, $state, $stateParams, $location, $window, HOTS, Base64, hero, MetaService) {
//        if (!dataHero.success) { return $state.go('app.hots.talentCalculator.hero', { hero: $scope.heroes[0].className }); }

            console.log(hero);

            $scope.setCurrentHero(hero);
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
            $scope.metaservice.set(hero.name + ' - Talent Calculator', hero.description);

            var ogImg = $scope.app.cdn + 'img/hots/hots-logo.png';
            $scope.metaservice.setOg($location.absUrl(), hero.name, hero.description, 'article', ogImg);

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
                    hero.talents[i].tier = parseInt(hero.talentTiers[hero.talents[i].id]);

                    if (hero.talents[i].tier === tier) {
                        talents.push(hero.talents[i]);
                    }
                }
                return talents;
            };

            $scope.hasTalent = function (talent) {
                return ($scope.currentTalents['tier'+talent.tier] == talent.id) ? ' active' : '';
            }

            $scope.hasAnyTalent = function (talent) {
                return ($scope.currentTalents['tier'+talent.tier] !== null) ? ' tier-selected' : '';
            }

            $scope.toggleTalent = function (talent, tierIndex, talentIndex) {
                if ($scope.hasTalent(talent)) {
                    $scope.currentTalents['tier'+talent.tier] = null;
                } else {
                    $scope.currentTalents['tier'+talent.tier] = talent.id;
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
                        out['tier' + $scope.tiers[i - 1]] = (num > 1) ? $scope.talentsByTier($scope.tiers[i - 1])[num - 2].id : null;
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
                    if (hero.talents[i].id == id) {
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
            $scope.pollsMain = dataPollsMain;
            $scope.pollsSide = dataPollsSide;

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
    .controller('OverwatchHomeCtrl', ['$scope', 'articles', 'heroes',
        function ($scope, articles, heroes) {
            // load vars
            $scope.articles = articles;
            $scope.heroes = heroes;
            $scope.heroHover = 'neutral';

            $scope.setHeroHover = function (hero) {
                $scope.heroHover = hero;
            };

            $scope.getHeroHover = function () {
                return $scope.heroHover;
            };
        }
    ])
    .controller('OverwatchHeroCtrl', ['$scope', 'MetaService', 'hero', 'heroes',
        function ($scope, MetaService, hero, heroes) {
            // load vars
            $scope.heroes = heroes;
            $scope.hero = hero;

            // seo
            $scope.metaservice = MetaService;
            $scope.metaservice.set($scope.hero.heroName + ' - Overwatch', 'Informaton about the Overwatch hero ' + $scope.hero.heroName);

            // arrows
            function getCurrentHeroIndex () {
                for (var i = 0; i < $scope.heroes.length; i++) {
                    if ($scope.heroes[i].className == $scope.hero.className) {
                        return i;
                    }
                }
                return false;
            }

            $scope.getNextHero = function () {
                var index = getCurrentHeroIndex();
                if (index === false) { return $scope.heroes[0].className; }
                return (index < ($scope.heroes.length - 1)) ? $scope.heroes[index + 1].className : $scope.heroes[0].className;
            }

            $scope.getPrevHero = function () {
                var index = getCurrentHeroIndex();
                if (index === false) { return $scope.heroes[0].className; }
                return (index > 0) ? $scope.heroes[index - 1].className : $scope.heroes[$scope.heroes.length - 1].className;
            }
        }
    ])
    .controller('AdminOverwatchHeroListCtrl', ['$scope', '$window', '$timeout', 'bootbox', 'AlertService', 'OverwatchHero', 'heroes',
        function ($scope, $window, $timeout, bootbox, AlertService, OverwatchHero, heroes) {
            // load vars
            $scope.heroes = heroes;

            // other vars
            $scope.search = '';
            $scope.saving = false;

            // grab alerts
            if (AlertService.hasAlert()) {
                $scope.success = AlertService.getSuccess();
                AlertService.reset();
            }

            function updateOrder (list) {
                for (var i = 0; i < list.length; i++) {
                    list[i].orderNum = i + 1;
                }
                $scope.saving = true;
                async.forEach(list, function (hero, eachCallback) {
                    OverwatchHero.upsert(hero).$promise
                    .then(function () {
                        return eachCallback();
                    })
                    .catch(function (httpResponse) {
                        return eachCallback(httpResponse);
                    });
                }, function (httpResponse) {
                    if (httpResponse) {
                        console.log('httpResponse: ', httpResponse);

                        $scope.errors = ['An error occurred while trying to save the hero order.'];
                        $scope.showError = true;
                        $window.scrollTo(0,0);
                    }
                    $scope.saving = false;
                });
            }

            // drag and drop for abilities
            $scope.updateDND = function (list, index) {
                list.splice(index, 1);
                updateOrder(list);
            }

            // delete hero and abilities
            $scope.deleteHero = function (hero) {
                function done () {
                    $timeout(function () {
                        var index = $scope.heroes.indexOf(hero);
                        $scope.heroes.splice(index, 1);
                        //updateOrder($scope.heroes);
                    });
                }

                var box = bootbox.dialog({
                    title: 'Delete Hero?',
                    message: 'Are you sure you want to delete the hero <strong>' + hero.heroName + '</strong>?',
                    buttons: {
                        delete: {
                            label: 'Delete',
                            className: 'btn-danger',
                            callback: function () {
                                if (!hero.id) { return done(); }

                                OverwatchHero.overwatchAbilities.destroyAll({ id: hero.id }).$promise
                                .then(function () {
                                    OverwatchHero.destroyById({ id: hero.id }).$promise
                                    .then(done)
                                    .catch(function (httpResponse) {
                                        console.log('httpResponse: ', httpResponse);

                                        $scope.errors = ['An error occurred while trying to delete the hero.'];
                                        $scope.showError = true;
                                        $window.scrollTo(0,0);
                                    });
                                })
                                .catch(function (httpResponse) {
                                    console.log('httpResponse: ', httpResponse);

                                    $scope.errors = ['An error occurred while trying to delete the hero abilities.'];
                                    $scope.showError = true;
                                    $window.scrollTo(0,0);
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
            };
        }
    ])
    .controller('AdminOverwatchHeroAddCtrl', ['$scope', '$compile', '$timeout', '$state', '$window', 'bootbox', 'OVERWATCH', 'AlertService', 'OverwatchHero', 'OverwatchAbility',
        function ($scope, $compile, $timeout, $state, $window, bootbox, OVERWATCH, AlertService, OverwatchHero, OverwatchAbility) {
            // defaults
            var defaultHero = {
                    heroName : '',
                    heroRole: OVERWATCH.roles[0],
                    realName : '',
                    occupation : '',
                    location : '',
                    organization : '',
                    description: '',
                    youtubeId : '',
                    abilities: [],
                    className: '',
                    isActive: true,
                    orderNum: 1
                },
                defaultAbility = {
                    name: '',
                    description: '',
                    className: '',
                    orderNum: 1
                };

            // load vars
            $scope.hero = angular.copy(defaultHero);
            $scope.roles = OVERWATCH.roles;

            // select options
            $scope.heroActive = [
                { name: 'Yes', value: true },
                { name: 'No', value: false }
            ];

            // abilities
            var box;
            $scope.abilityAddWnd = function () {
                $scope.currentAbility = angular.copy(defaultAbility);
                box = bootbox.dialog({
                    title: 'Add Ability',
                    message: $compile('<div overwatch-ability-add-form></div>')($scope)
                });
            };

            $scope.abilityEditWnd = function (ability) {
                $scope.currentAbility = ability;
                box = bootbox.dialog({
                    title: 'Edit Ability',
                    message: $compile('<div overwatch-ability-edit-form></div>')($scope)
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
                box = bootbox.dialog({
                    title: 'Delete Ability?',
                    message: 'Are you sure you want to delete the ability <strong>' + ability.name + '</strong>?',
                    buttons: {
                        delete: {
                            label: 'Delete',
                            className: 'btn-danger',
                            callback: function () {
                                $timeout(function () {
                                    var index = $scope.hero.abilities.indexOf(ability);
                                    $scope.hero.abilities.splice(index, 1);

                                    for (var i = 0; i < $scope.hero.abilities.length; i++) {
                                        $scope.hero.abilities[i].orderNum = i + 1;
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
            };

            // drag and drop for abilities
            $scope.updateDND = function (list, index) {
                list.splice(index, 1);
                for (var i = 0; i < list.length; i++) {
                    list[i].orderNum = i + 1;
                }
            }

            $scope.addHero = function () {
                $scope.showError = false;

                OverwatchHero.create($scope.hero).$promise
                .then(function (heroValue) {
                    _.each($scope.hero.abilities, function (ability) {
                        ability.heroId = heroValue.id;
                    });

                    OverwatchHero.overwatchAbilities.createMany({ id: heroValue.id }, $scope.hero.abilities).$promise
                    .then(function (abilityValue) {
                        AlertService.setSuccess({ show: true, msg: $scope.hero.heroName + ' has been added successfully.' });
                        $state.go('app.admin.overwatch.heroes.list');
                    })
                    .catch(function (httpResponse) {
                        console.log('httpResponse: ', httpResponse);

                        $scope.errors = _.omit(httpResponse.data.error, ['message', 'status']);
                        $scope.showError = true;
                        $window.scrollTo(0,0);
                    });
                })
                .catch(function (httpResponse) {
                    console.log('httpResponse: ', httpResponse);

                    $scope.errors = _.omit(httpResponse.data.error, ['message', 'status']);
                    $scope.showError = true;
                    $window.scrollTo(0,0);
                });
            };
        }
    ])
    .controller('AdminOverwatchHeroEditCtrl', ['$scope', '$compile', '$timeout', '$state', '$window', 'bootbox', 'OVERWATCH', 'AlertService', 'OverwatchHero', 'OverwatchAbility', 'hero',
        function ($scope, $compile, $timeout, $state, $window, bootbox, OVERWATCH, AlertService, OverwatchHero, OverwatchAbility, hero) {
            // defaults
            var defaultAbility = {
                    name: '',
                    description: '',
                    className: '',
                    orderNum: 1
                };

            // load vars
            $scope.hero = hero;
            $scope.roles = OVERWATCH.roles;

            // select options
            $scope.heroActive = [
                { name: 'Yes', value: true },
                { name: 'No', value: false }
            ];

            // abilities
            var box;
            $scope.abilityAddWnd = function () {
                $scope.currentAbility = angular.copy(defaultAbility);
                box = bootbox.dialog({
                    title: 'Add Ability',
                    message: $compile('<div overwatch-ability-add-form></div>')($scope)
                });
            };

            $scope.abilityEditWnd = function (ability) {
                $scope.currentAbility = ability;
                box = bootbox.dialog({
                    title: 'Edit Ability',
                    message: $compile('<div overwatch-ability-edit-form></div>')($scope)
                });
            };

            $scope.addAbility = function () {
                $scope.currentAbility.orderNum = $scope.hero.overwatchAbilities.length + 1;
                $scope.hero.overwatchAbilities.push($scope.currentAbility);
                box.modal('hide');
                $scope.currentAbility = false;
            };

            $scope.editAbility = function (ability) {
                box.modal('hide');
                $scope.currentAbility = false;
            };

            $scope.deleteAbility = function (ability) {
                function done () {
                    $timeout(function () {
                        var index = $scope.hero.overwatchAbilities.indexOf(ability);
                        $scope.hero.overwatchAbilities.splice(index, 1);
                        updateOrder($scope.hero.overwatchAbilities);
                    });
                }

                box = bootbox.dialog({
                    title: 'Delete Ability?',
                    message: 'Are you sure you want to delete the ability <strong>' + ability.name + '</strong>?',
                    buttons: {
                        delete: {
                            label: 'Delete',
                            className: 'btn-danger',
                            callback: function () {
                                if (!ability.id) { return done(); }

                                OverwatchHero.overwatchAbilities.destroyById({ id: ability.heroId, fk: ability.id }).$promise
                                .then(done)
                                .catch(function (httpResponse) {
                                    console.log('httpResponse: ', httpResponse);

                                    $scope.errors = [httpResponse.data.error.message];
                                    $scope.showError = true;
                                    $window.scrollTo(0,0);
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
            };

            function updateOrder (list) {
                for (var i = 0; i < list.length; i++) {
                    list[i].orderNum = i + 1;
                }
            }

            // drag and drop for abilities
            $scope.updateDND = function (list, index) {
                list.splice(index, 1);
                updateOrder(list);
            }

            // edit hero
            $scope.editHero = function () {
                OverwatchHero.upsert($scope.hero).$promise
                .then(function (heroValue) {

                    _.each($scope.hero.overwatchAbilities, function (ability) {
                        ability.heroId = heroValue.id;
                    });

                    async.forEach($scope.hero.overwatchAbilities, function(ability, eachCallback) {
                        OverwatchAbility.upsert(ability).$promise
                        .then(function (abilityValue) {
                            return eachCallback();
                        })
                        .catch(function (httpResponse) {
                            console.log('httpResponse: ', httpResponse);
                            return eachCallback(httpResponse);
                        });
                    }, function (httpResponse) {
                        if (httpResponse) {
                            console.log('httpResponse: ', httpResponse);

                            $scope.errors = ['An error occurred while trying to update an ability.'];
                            $scope.showError = true;
                            $window.scrollTo(0,0);
                            return;
                        }
                        AlertService.setSuccess({ show: true, msg: $scope.hero.heroName + ' has been updated successfully.' });
                        return $state.go('app.admin.overwatch.heroes.list');
                    });

                })
                .catch(function (httpResponse) {
                    console.log('httpResponse: ', httpResponse);

                    $scope.errors = ['An error occurred while trying to update the hero.'];
                    $scope.showError = true;
                    $window.scrollTo(0,0);
                });
            }
        }
    ])
;
