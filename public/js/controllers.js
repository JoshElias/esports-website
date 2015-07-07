'use strict';

angular.module('app.controllers', ['ngCookies'])
  .controller('AppCtrl', ['$scope', '$localStorage', '$cookies', '$window', '$location', 'SubscriptionService', 'AuthenticationService', 'UserService', 
    function($scope, $localStorage, $cookies, $window, $location, SubscriptionService, AuthenticationService, UserService) {
      var isIE = !!navigator.userAgent.match(/MSIE/i);
      isIE && angular.element($window.document.body).addClass('ie');
      isSmartDevice( $window ) && angular.element($window.document.body).addClass('smart');

      // config
      $scope.app = {
        name: 'TempoStorm',
        version: '0.0.1',
        copyright: new Date().getFullYear(),
        cdn: (tpl && tpl.length) ? tpl : '.',
        settings: {
            token: $cookies.token || null,
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
                    delete $cookies.token;
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
.controller('404Ctrl', ['$scope', 'MetaService', function($scope, MetaService) {
    MetaService.setStatusCode(404);
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
.controller('HomeCtrl', ['$scope', '$sce', 'dataBanners', 'dataArticles', 'TwitchService', 'TwitterService',
    function ($scope, $sce, dataBanners, dataArticles, TwitchService, TwitterService) {
        // data
        $scope.articles = dataArticles.articles;
        $scope.streamWheel = false;
        $scope.twitWheel = false;
        $scope.streams = undefined;
        $scope.tweets = undefined;
        
        
        TwitchService.getStreams().then(function(data) {
            for (var i = 0; i < data.data.length; i++) {
                var log = data.data[i].logoUrl;
                var sub = log.substr(4);
                var im = "https" + sub;
                data.data[i].logoUrl = im;
            }
            $scope.streamWheel = true;
            $scope.streams = data.data;
        });
        
        TwitterService.getFeed().then(function(data) {
            $scope.twitWheel = true;
            $scope.tweets = data.data;
        });
        
        $scope.getContent = function (c) {
            return $sce.trustAsHtml(c);
        }
        
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
    }
])
.controller('HearthstoneHomeCtrl', ['$scope', 'dataBanners', 'dataArticles', 'dataDecks', 'dataDecksFeatured', 'ArticleService', 'DeckService', 
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
                        small: data.small
                    };
                    $scope.cardImg = $scope.app.cdn + data.path + data.small;
                    box.modal('hide');
                });
            }
        };
        
        
        $scope.getImage = function () {
            $scope.imgPath = '/articles/';
            if (!$scope.article) { return '/img/blank.png'; }
            return ($scope.article.photos && $scope.article.photos.small === '') ?  $scope.app.cdn + '/img/blank.png' : $scope.app.cdn + $scope.imgPath + $scope.article.photos.small;
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
        $scope.cardImg = ($scope.article.photos.small && $scope.article.photos.small.length) ? $scope.app.cdn + '/articles/' + $scope.article.photos.small : $scope.app.cdn + '/img/blank.png';
        
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
                        small: data.small
                    };
                    $scope.cardImg = $scope.app.cdn + data.path + data.small;
                    box.modal('hide');
                });
            }
        };
        
        $scope.getImage = function () {
            $scope.imgPath = '/articles/';
            if (!$scope.article) { return '/img/blank.png'; }
            return ($scope.article.photos && $scope.article.photos.small === '') ?  $scope.app.cdn + '/img/blank.png' : $scope.app.cdn + $scope.imgPath + $scope.article.photos.small;
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
.controller('AdminSnapshotAddCtrl', ['$scope', '$compile', '$timeout', 'bootbox', 'AdminDeckService', 'AdminSnapshotService', 'AdminUserService', 'AdminCardService',
    function ($scope, $compile, $timeout, bootbox, AdminDeckService, AdminSnapshotService, AdminUserService, AdminCardService) {
        
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
            active : false
        },
        defaultTier = {
            tier : 1,
            decks : []
        },
        defaultTierDeck = {
            explanation : "",
            weeklyNotes : "",
            deck : undefined,
            rank : {
                current : 1,
                last : 1
            },
            tech : []
        },
        defaultDeckMatch = {
            for : undefined,
            against : undefined,
            chance : 0
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

        
        
        $scope.search = "";
        $scope.decks = [];
        $scope.snapshot = angular.copy(defaultSnap);
        $scope.tierDeckMatch = angular.copy(defaultDeckMatch);
        $scope.matches = [];
        
        /* GET METHODS */
            function getDecks (page, num, search, callback) {
                AdminDeckService.getDecks(page, num, search).then(function (data) {
                    $timeout(function () {
                        callback(data);
                    });
                });
            }

            function getProviders (page, num, search, callback) {
                AdminUserService.getProviders(page, num, search).then(function (data) {
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
                
                console.log(tier, deck, tech);
                
                switch (type) {
                    case 'author' : //this is to display data in the bootbox for authors
                        getProviders(1, 10, $scope.search, function (data) {
                            $scope.authorData = data.users;
                            authorBox(data, type);
                        });
                    break;
                        
                    case 'deck' : //this is to display data in the bootbox for decks
                        getDecks(1, 10, $scope.search, function (data) {
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
            }
        /* BOOTBOX METHODS */
        
            
        /* AUTHOR METHODS */
            $scope.isAuthor = function (a) {
                for (var i = 0; i < $scope.snapshot.authors.length; i++) {
                    if (a._id == $scope.snapshot.authors[i]._id) {
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
                $scope.snapshot.authors.push(a);
            }
            
            $scope.removeAuthor = function (a) {
                for (var i = 0; i < $scope.snapshot.authors.length; i++) {
                    if (a._id === $scope.snapshot.authors[i]._id) {
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
                        console.log(result);    
                        $scope.$apply(function () {
                            $scope.removeTier(t);
                        });
                    }
                });
            }
            
            $scope.removeTier = function (t) {
                for (var i = 0; i < $scope.snapshot.tiers.length; i++) {
                    if (t.tier === $scope.snapshot.tiers[i].tier) {
                        $scope.snapshot.tiers.splice(i, 1);
                        for(var j = 0; j < $scope.snapshot.tiers.length; j++) {
                            $scope.snapshot.tiers[j].tier = (j + 1);
                        }
                    }
                }
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
            
            function updateMatches () {
                var tiers = $scope.snapshot.tiers,
                    tierLength = $scope.snapshot.tiers.length,
                    maxTierLength = (tierLength > 2) ? 2 : tierLength,
                    defaultMatch = angular.copy(defaultDeckMatch),
                    matches = [];

            
                for (var i = 0; i < maxTierLength; i++) {
                    for (var j = 0; j < tiers[i].decks.length; j++) {
                        for (var k = j; k < tiers[i].decks.length; k++) {
                            
                            
                            
                            matches.push({
                                'for': tiers[i].decks[j].deck,
                                'against': tiers[i].decks[k].deck,
                                'chance': 0
                            });
                        }
                    }
                }
                console.log(matches);
                $scope.matches = matches;
            }
            
            $scope.getMatches = function (deckID) {
                var matches = $scope.matches,
                    out = [];
                
                for (var i = 0; i < matches.length; i++) {
                    if (deckID == matches[i].for._id || deckID == matches[i].against._id) {
                        out.push(matches[i]);
                    }
                }
                return out;
            }

            $scope.addDeck = function (sel) {
                var tiers = $scope.snapshot.tiers,
                    decks = tiers[$scope.tierAbsolute].decks,
                    tierDeck = angular.copy(defaultTierDeck),
                    tierDeckMatch = angular.copy(defaultDeckMatch);
                    
                
                if (!$scope.isDeck(sel)) {
                    tierDeck.deck = sel;
                    tierDeckMatch.deck = sel;
                   // tempMatches.push(tierDeckMatch);
                    
                    decks.push(tierDeck);
                } else {
                    $scope.removeDeck(sel);
                }
                updateMatches();
                $scope.deckRanks();
            }
            
            $scope.isDeck = function (d) {
                for (var j = 0; j < $scope.snapshot.tiers[$scope.tierAbsolute].decks.length; j++) {
                    if (d._id == $scope.snapshot.tiers[$scope.tierAbsolute].decks[j].deck._id) {
                        return true;
                    }
                }
                return false;
            }
            
            $scope.removeDeck = function (d) {
                for (var k = 0; k < $scope.snapshot.tiers[$scope.tierAbsolute].decks.length; k++) {
                    if (d._id == $scope.snapshot.tiers[$scope.tierAbsolute].decks[k].deck._id) {
                        $scope.snapshot.tiers[$scope.tierAbsolute].decks.splice(k, 1);
                    }
                }
            }
            
                        
            $scope.searchDecks = function () {
                getDecks(1, 10, $scope.search, function (data) {
                    $scope.boxData = data.decks;
                });
            }
            //////////////////////////////////////////////////////////////////////
            
            $scope.addCard = function (c) {
                var tech = $scope.tech,
                    deck = $scope.deck,
                    tier = $scope.tier,
                    techCard = angular.copy(defaultTechCards);
                
                techCard.card = c;
                
                for (var i = 0; i < $scope.snapshot.tiers.length; i++) {
                    for (var k = 0; k < $scope.snapshot.tiers[i].decks.length; k++) {
                        for (var j = 0; j < $scope.snapshot.tiers[i].decks[k].tech.length; j++) {
                            if (tech.orderNum == $scope.snapshot.tiers[i].decks[k].tech[j].orderNum) {
                                if (!$scope.isCard(c)) {
                                    $scope.snapshot.tiers[i].decks[k].tech[j].cards.push(c);
                                } else {
                                    console.log('cant do that fag');
                                }
                            }
                        }
                    }
                }
            }
            
            $scope.isCard = function (c) {
                var tech = $scope.tech;
                if (tech) {
                    console.log(c, tech);
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
                            }
                        }
                    }
                }
            }
        /* TIERS METHODS */
            
        
        $scope.addSnapshot = function () {
            $scope.showError = false;
            AdminSnapshotService.addSnapshot($scope.snapshot).success(function (data) {
                if (!data.success) {
                    $scope.errors = data.errors;
                    $scope.showError = true;
                    $window.scrollTo(0,0);
                } else {
                    AlertService.setSuccess({ show: true, msg: $scope.snapshot.title + ' has been added successfully.' });
                    $state.go('app.admin.snapshot.list');
                }
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
        $scope.imgPath = '/polls/';
        
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
            return ($scope.currentItem.photos && $scope.currentItem.photos.thumb === '') ?  $scope.app.cdn + '/img/blank.png' : $scope.app.cdn + $scope.imgPath + $scope.currentItem.photos.thumb;
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
        $scope.imgPath = '/polls/';
        
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
            //console.log(list);
        };
        
        $scope.getImage = function () {
            if (!$scope.currentItem) { return '/img/blank.png'; }
            return ($scope.currentItem.photos && $scope.currentItem.photos.thumb === '') ?  $scope.app.cdn + '/img/blank.png' : $scope.app.cdn + $scope.imgPath + $scope.currentItem.photos.thumb;
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
            console.log(banner._id);
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
                                    console.log($scope.banners)
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
            console.log($scope.maxDescription - $scope.banner.description.length + ' ' + e);
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
        $scope.imgPath = '/banners/';
        
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
            $scope.imgPath = '/banners/';
            return ($scope.banner.photo === '') ?  $scope.app.cdn + '/img/blank.png' : $scope.app.cdn + $scope.imgPath + $scope.banner.photo;
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
            console.log($scope.banner.description.length);
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
        
        //console.log($scope.banner.description);
        
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
            $scope.imgPath = '/banners/';
            return ($scope.banner.photo === '') ?  $scope.app.cdn + '/img/blank.png' : $scope.app.cdn + $scope.imgPath + $scope.banner.photo;
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
.controller('DeckBuilderCtrl', ['$state', '$scope', '$compile', '$window', 'Pagination', 'Hearthstone', 'DeckBuilder', 'ImgurService', 'UserService', 'AuthenticationService', 'SubscriptionService', 'data',
    function ($state, $scope, $compile, $window, Pagination, Hearthstone, DeckBuilder, ImgurService, UserService, AuthenticationService, SubscriptionService, data) {
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
            if (!$scope.deck.validDeck() || !$scope.deck.validVideo()) { return false; }
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
        
        var ogImg = 'https://s3-us-west-2.amazonaws.com/ts-node2/articles/' + $scope.article.photos.small;
        $scope.metaservice.setOg('https://tempostorm.com/hearthstone/articles/' + data.article.slug.url, $scope.article.title, $scope.article.description, 'article', ogImg);
        
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
        if (!data.success) { return $state.transitionTo('app.hs.decks.list'); }
        
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
        
        
        $scope.metaservice.setOg('https://tempostorm.com/decks');
        
        
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
            $state.transitionTo('app.hs.decks.list', params);
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
        if (!data || !data.success) { return $state.go('app.hs.decks.list'); }

        // load deck
        $scope.deck = data.deck;
        
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
        
        var ogImg = 'https://s3-us-west-2.amazonaws.com/ts-node2/img/decks/' + $scope.deck.playerClass + '.png';
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
                
        // characters
        $scope.charAddWnd = function () {
            console.log('blah');
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
.controller('HOTSGuideCtrl', ['$scope', '$window', '$state', '$sce', '$compile', 'bootbox', 'VoteService', 'HOTSGuideService', 'data', 'dataHeroes', 'dataMaps', 'UserService', 'AuthenticationService', 'SubscriptionService', 'MetaService',
    function ($scope, $window, $state, $sce, $compile, bootbox, VoteService, HOTSGuideService, data, dataHeroes, dataMaps, UserService, AuthenticationService, SubscriptionService, MetaService) {
        $scope.guide = data.guide;
        $scope.currentHero = ($scope.guide.heroes.length) ? $scope.guide.heroes[0].hero : false;
        $scope.heroes = dataHeroes.heroes;
        $scope.maps = dataMaps.maps;
        
        
        $scope.metaservice = MetaService;
        $scope.metaservice.set($scope.guide.name + ' - Guides', $scope.guide.description);
        
        var ogImg = 'https://s3-us-west-2.amazonaws.com/ts-node2/img/hots/hots-logo.png';
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
.controller('HOTSGuideBuilderHeroCtrl', ['$scope', '$state', '$window', '$compile', 'HOTSGuideService', 'GuideBuilder', 'HOTS', 'dataHeroes', 'dataMaps', 'UserService', 'AuthenticationService', 'SubscriptionService',
    function ($scope, $state, $window, $compile, HOTSGuideService, GuideBuilder, HOTS, dataHeroes, dataMaps, UserService, AuthenticationService, SubscriptionService) {
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
                    $scope.saveGuide;
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
                box = bootbox.dialog({
                    title: 'Login Required',
                    message: $compile('<div login-form></div>')($scope)
                });
                box.modal('show');
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
.controller('HOTSGuideBuilderMapCtrl', ['$scope', '$state', '$window', '$compile', 'HOTS', 'HOTSGuideService', 'GuideBuilder', 'dataHeroes', 'dataMaps', 'UserService', 'AuthenticationService', 'SubscriptionService',
    function ($scope, $state, $window, $compile, HOTS, HOTSGuideService, GuideBuilder, dataHeroes, dataMaps, UserService, AuthenticationService, SubscriptionService) {
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
                    $scope.saveGuide();
                }).error(function() {
                    $scope.showError = true;
                });
            }
        }
        
        // save guide
        $scope.saveGuide = function () {
            if ( !$scope.guide.hasAnyMap() || !$scope.guide.hasAnyChapter() ) {
                return false;
            }
            if (!$scope.app.user.isLogged()) {
                box = bootbox.dialog({
                    title: 'Login Required',
                    message: $compile('<div login-form></div>')($scope)
                });
                box.modal('show');
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
.controller('HOTSGuideBuilderEditHeroCtrl', ['$scope', '$state', '$window', 'GuideBuilder', 'HOTSGuideService', 'HOTS', 'dataGuide', 'dataHeroes', 'dataMaps', 
    function ($scope, $state, $window, GuideBuilder, HOTSGuideService, HOTS, dataGuide, dataHeroes, dataMaps) {
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
                box = bootbox.dialog({
                    title: 'Login Required',
                    message: $compile('<div login-form></div>')($scope)
                });
                box.modal('show');
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
.controller('HOTSGuideBuilderEditMapCtrl', ['$scope', '$state', '$window', 'HOTS', 'GuideBuilder', 'HOTSGuideService', 'dataGuide', 'dataHeroes', 'dataMaps', 
    function ($scope, $state, $window, HOTS, GuideBuilder, HOTSGuideService, dataGuide, dataHeroes, dataMaps) {
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
            if ( !$scope.guide.hasAnyMap() || !$scope.guide.hasAnyChapter() ) {
                return false;
            }
            if (!$scope.app.user.isLogged()) {
                box = bootbox.dialog({
                    title: 'Login Required',
                    message: $compile('<div login-form></div>')($scope)
                });
                box.modal('show');
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
        
        var ogImg = 'https://s3-us-west-2.amazonaws.com/ts-node2/img/hots/hots-logo.png';
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
.controller('PollsCtrl', ['$scope', '$sce', '$cookies', '$compile', 'bootbox', 'PollService', 'dataPollsMain', 'dataPollsSide', 
    function ($scope, $sce, $cookies, $compile, bootbox, PollService, dataPollsMain, dataPollsSide) {
        
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
                message: $compile('<a ng-click="closeBox()"><img class="img-responsive" ng-src="https://s3-us-west-2.amazonaws.com/ts-node2/polls/' +img+ '" alt=""></a>')($scope),
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
.controller('TeamCtrl', ['$scope',
    function ($scope) {
        
    }
])
;