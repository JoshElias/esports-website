'use strict';

angular.module('app.controllers', ['ngCookies'])
  .controller('AppCtrl', ['$scope', '$localStorage', '$window', '$location', 'AuthenticationService', 'UserService', 
    function($scope, $localStorage, $window, $location, AuthenticationService, UserService) {
      var isIE = !!navigator.userAgent.match(/MSIE/i);
      isIE && angular.element($window.document.body).addClass('ie');
      isSmartDevice( $window ) && angular.element($window.document.body).addClass('smart');

      // config
      $scope.app = {
        name: 'TempoStorm',
        version: '0.0.1',
        copyright: new Date().getFullYear(),
        settings: {
            deck: null
        },
        user: {
            getUserID: function () {
                return $window.sessionStorage.userID;
            },
            getUsername: function () {
                return $window.sessionStorage.username;
            },
            isAdmin: AuthenticationService.isAdmin,
            isLogged: AuthenticationService.isLogged,
            logout: function () {
                if (AuthenticationService.isLogged()) {
                    AuthenticationService.setLogged(false);
                    AuthenticationService.setAdmin(false);
                    delete $window.sessionStorage.userID;
                    delete $window.sessionStorage.username;
                    delete $window.sessionStorage.token;
                }
                return $location.path("/login");
            }
        }
      };

      // save settings to local storage
      if ( angular.isDefined($localStorage.settings) ) {
        $scope.app.settings = $localStorage.settings;
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
.controller('UserCtrl', ['$scope', '$location', '$window', '$state', 'UserService', 'AuthenticationService', 'AlertService', 
    function ($scope, $location, $window, $state, UserService, AuthenticationService, AlertService) {
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
                    $window.sessionStorage.userID = data.userID;
                    $window.sessionStorage.username = data.username;
                    $window.sessionStorage.token = data.token;
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
.controller('UserVerifyCtrl', ['$scope', '$location', '$window', '$state', '$stateParams', 'UserService', 'AuthenticationService', 
    function ($scope, $location, $window, $state, $stateParams, UserService, AuthenticationService) {
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
                    $window.sessionStorage.userID = data.userID;
                    $window.sessionStorage.username = data.username;
                    $window.sessionStorage.token = data.token;
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
.controller('HomeCtrl', ['$scope', 'dataArticles', 'dataDecks', 'ArticleService', 'DeckService', 
    function ($scope, dataArticles, dataDecks, ArticleService, DeckService) {
        $scope.articles = dataArticles.articles;
        $scope.decks = dataDecks.decks;
        
        $scope.klass = 'all';
        
        $scope.setKlass = function (klass) {
            $scope.klass = klass;
            
            ArticleService.getArticles(klass).then(function (data) {
                $scope.articles = data.articles;
            });

            DeckService.getDecks(klass, 1, 10).then(function (data) {
                $scope.decks = data.decks;
            });
        };
    }
])
.controller('ProfileCtrl', ['$scope', 'dataProfile',  
    function ($scope, dataProfile) {
        $scope.user = dataProfile.user;
        
        if ($scope.user.social) {
            $scope.user.social.exists = (
                ($scope.user.social.twitter && $scope.user.social.twitter.length) || 
                ($scope.user.social.facebook && $scope.user.social.facebook.length) || 
                ($scope.user.social.twitch && $scope.user.social.twitch.length) || 
                ($scope.user.social.instagram && $scope.user.social.instagram.length) || 
                ($scope.user.social.youtube && $scope.user.social.youtube.length)
            );
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
        
        $scope.cardImg = $scope.deckImg = './img/blank.png';
        
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
        ];F
        
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
        
        $scope.cardImg = ($scope.card.photos.large.length) ? './photos/cards/' + $scope.card.photos.large : './img/blank.png';
        $scope.deckImg = ($scope.card.photos.small.length) ? './photos/cards/' + $scope.card.photos.small : './img/blank.png';
        
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
                    $state.go('app.admin.cards.list');
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
.controller('AdminArticleAddCtrl', ['$scope', '$state', '$window', '$upload', '$compile', 'bootbox', 'Hearthstone', 'Util', 'AlertService', 'AdminArticleService', 'dataDecks', 'dataArticles', 'dataAdmins', 
    function ($scope, $state, $window, $upload, $compile, bootbox, Hearthstone, Util, AlertService, AdminArticleService, dataDecks, dataArticles, dataAdmins) {
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
        
        // load admins
        $scope.admins = dataAdmins.users;
        
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
        
        // date picker options
        $scope.dateOptions = {};
        
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
.controller('AdminArticleEditCtrl', ['$scope', '$state', '$window', '$upload', '$compile', 'bootbox', 'Hearthstone', 'Util', 'AlertService', 'AdminArticleService', 'data', 'dataDecks', 'dataArticles', 'dataAdmins', 
    function ($scope, $state, $window, $upload, $compile, bootbox, Hearthstone, Util, AlertService, AdminArticleService, data, dataDecks, dataArticles, dataAdmins) {
        // load article
        $scope.article = data.article;
        
        // load decks
        $scope.decks = [{_id: undefined, name: 'No deck'}].concat(dataDecks.decks);
        
        // load articles
        $scope.articles = dataArticles.articles;

        // load admins
        $scope.admins = dataAdmins.users;
        
        $scope.setSlug = function () {
            if (!$scope.article.slug.linked) { return false; }
            $scope.article.slug.url = Util.slugify($scope.article.title);
        };
        
        $scope.toggleSlugLink = function () {
            $scope.article.slug.linked = !$scope.article.slug.linked;
            $scope.setSlug();
        };
        
        // photo
        $scope.cardImg = ($scope.article.photos.small && $scope.article.photos.small.length) ? './photos/articles/' + $scope.article.photos.small : './img/blank.png';
        
        // klass tags
        $scope.klassTags = ['Druid', 'Hunter', 'Mage', 'Paladin', 'Priest', 'Rogue', 'Shaman', 'Warlock', 'Warrior'];
        
        // select options
        $scope.articleFeatured =
        $scope.articlePremium =
        $scope.articleActive = [
            { name: 'Yes', value: true },
            { name: 'No', value: false }
        ];
        
        // make date object
        $scope.article.premium.expiryDate = new Date($scope.article.premium.expiryDate);
        
        // date picker options
        $scope.dateOptions = {};
        
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
        $scope.pagination = Pagination.new();
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
    
        // page flipping
        $scope.pagination = Pagination.new();
        $scope.pagination.results = function () {
            return ($scope.filtered) ? $scope.filtered.length : $scope.decks.length;
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
        if (!data || !data.success) { $state.transitionTo('app.admin.decks.add'); return false; }
        
        // set default tab page
        $scope.page = 'build';
        
        // summernote options
        $scope.options = {
          height: 300,
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

        $scope.imageUpload = function (files, editor, welEditable) {
            ImgurService.upload(files[0]).then(function (data) {
                editor.insertImage(welEditable, data.url);
            });
        };
        
        // load cards
        $scope.className = data.className;
        $scope.cards = data.cards;
        $scope.cards.current = $scope.cards.class;

        // page flipping
        $scope.pagination = Pagination.new(6);
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
        
        // deck types
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
                content: $scope.deck.content,
                cards: $scope.deck.cards,
                playerClass: $scope.deck.playerClass,
                arena: $scope.deck.arena,
                premium: {
                    isPremium: $scope.deck.premium.isPremium,
                    expiryDate: $scope.deck.premium.expiryDate
                },
                public: $scope.deck.public
            };
        }, true);

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
                    $state.go('app.admin.decks.list');
                }
            }).error(function (data) {
                console.log(data);
            });
        };
        
    }
])
.controller('AdminDeckEditCtrl', ['$state', '$scope', '$compile', '$window', 'Pagination', 'Hearthstone', 'DeckBuilder', 'ImgurService', 'AlertService', 'AdminDeckService', 'data', 
    function ($state, $scope, $compile, $window, Pagination, Hearthstone, DeckBuilder, ImgurService, AlertService, AdminDeckService, data) {
        // redirect back to class pick if no data
        if (!data || !data.success) { $state.transitionTo('app.admin.decks.list'); return false; }
        
        // set default tab page
        $scope.page = 'build';
        
        // summernote options
        $scope.options = {
          height: 300,
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

        $scope.imageUpload = function (files, editor, welEditable) {
            ImgurService.upload(files[0]).then(function (data) {
                editor.insertImage(welEditable, data.url);
            });
        };
        
        // load cards
        $scope.className = data.deck.playerClass;
        $scope.cards = data.cards;
        $scope.cards.current = $scope.cards.class;

        // page flipping
        $scope.pagination = Pagination.new(6);
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
        
        // deck types
        $scope.deckTypes = Hearthstone.deckTypes;
        
        // deck premium
        $scope.deckPremium = [
            { name: 'Yes', value: true },
            { name: 'No', value: false }
        ];
        
        // deck
        $scope.deck = DeckBuilder.new(data.playerClass, data.deck);
        
        // save deck
        $scope.saveDeck = function () {
            AdminDeckService.editDeck($scope.deck).success(function (data) {
                if (!data.success) {
                    $scope.errors = data.errors;
                    $scope.showError = true;
                    $window.scrollTo(0,0);
                } else {
                    AlertService.setSuccess({ show: true, msg: $scope.deck.name + ' has been updated successfully.' });
                    $state.go('app.admin.decks.list');
                }
            }).error(function (data) {
                console.log(data);
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

        // page flipping
        $scope.pagination = Pagination.new(50);
        $scope.pagination.results = function () {
            return ($scope.filtered) ? $scope.filtered.length : $scope.users.length;
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
            isAdmin: false,
            active: true
        };
        
        // load user
        $scope.user = angular.copy(defaultUser);
        
        // select options
        $scope.userSubscription =
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
            }).error(function (data) {
                console.log(data);
            });
        };
    }
])
.controller('AdminUserEditCtrl', ['$scope', '$state', '$window', 'AdminUserService', 'AlertService', 'data', 
    function ($scope, $state, $window, AdminUserService, AlertService, data) {
        if (!data || !data.success) { return $state.go('app.admin.users.list'); }
        
        console.log(data);
        
        // load user
        $scope.user = data.user;
        
        // select options
        $scope.userSubscription =
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
            }).error(function (data) {
                console.log(data);
            });
        };
    }
])
.controller('DeckBuilderCtrl', ['$state', '$scope', '$compile', '$window', 'Pagination', 'Hearthstone', 'DeckBuilder', 'ImgurService', 'UserService', 'AuthenticationService', 'data',
    function ($state, $scope, $compile, $window, Pagination, Hearthstone, DeckBuilder, ImgurService, UserService, AuthenticationService, data) {
        // redirect back to class pick if no data
        if (!data || !data.success) { $state.transitionTo('app.deckBuilder.class'); return false; }
        
        // set default tab page
        $scope.step = 1;
        
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
        $scope.currentMulligan = $scope.deck.mulligans[0];
        
        $scope.setMulligan = function (mulligan) {
            $scope.currentMulligan = mulligan;
        };
        
        $scope.isMulliganSet = function (mulligan) {
            return (mulligan.withCoin.cards.length || mulligan.withCoin.instructions.length || mulligan.withoutCoin.cards.length || mulligan.withoutCoin.instructions.length);
        };
        
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
                    $window.sessionStorage.userID = data.userID;
                    $window.sessionStorage.username = data.username;
                    $window.sessionStorage.token = data.token;
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
        $scope.currentMulligan = $scope.deck.mulligans[0];
        
        $scope.setMulligan = function (mulligan) {
            $scope.currentMulligan = mulligan;
        };
        
        $scope.isMulliganSet = function (mulligan) {
            return (mulligan.withCoin.cards.length || mulligan.withCoin.instructions.length || mulligan.withoutCoin.cards.length || mulligan.withoutCoin.instructions.length);
        };
        
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
            }).error(function (data) {
                console.log(data);
            });
        };
        
    }
])
.controller('ArticlesCtrl', ['$scope', 'ArticleService', 'data', 
    function ($scope, ArticleService, data) {
        // articles
        $scope.articles = data.articles;
        $scope.total = data.total;
        $scope.klass = data.klass;
        $scope.page = data.page;
        $scope.perpage = data.perpage;
        
        $scope.setKlass = function (klass) {
            $scope.klass = klass;
            $scope.page = 1;
            getDecks();
        };
        
        function getDecks () {
            ArticleService.getArticles($scope.klass, $scope.page, $scope.perpage).then(function (data) {
                $scope.articles = data.articles;
                $scope.total = data.total;
                
                $scope.klass = data.klass;
                $scope.page = data.page;
            });
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
                getDecks();
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
            
        };
    }
])
.controller('ArticleCtrl', ['$scope', '$sce', 'data', '$state', '$compile', '$window', 'bootbox', 'UserService', 'ArticleService', 'AuthenticationService', 'VoteService',  
    function ($scope, $sce, data, $state, $compile, $window, bootbox, UserService, ArticleService, AuthenticationService, VoteService) {
        $scope.article = data.article;
        
        console.log(data.article.comments);
        
        $scope.getContent = function () {
            return $sce.trustAsHtml($scope.article.content);
        };
        
        // deck dust
        $scope.getDust = function () {
            var dust = 0;
            for (var i = 0; i < $scope.article.deck.cards.length; i++) {
                dust += $scope.article.deck.cards[i].qty * $scope.article.deck.cards[i].card.dust;
            }
            return dust;
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
        
        // login for modal
        $scope.login = function login(email, password) {
            if (email !== undefined && password !== undefined) {
                UserService.login(email, password).success(function(data) {
                    AuthenticationService.setLogged(true);
                    AuthenticationService.setAdmin(data.isAdmin);
                    $window.sessionStorage.userID = data.userID;
                    $window.sessionStorage.username = data.username;
                    $window.sessionStorage.token = data.token;
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
.controller('DecksCtrl', ['$scope', '$state', 'DeckService', 'data', 
    function ($scope, $state, DeckService, data) {
        // decks
        $scope.decks = data.decks;
        $scope.total = data.total;
        $scope.klass = data.klass;
        $scope.page = data.page;
        $scope.perpage = data.perpage;
        
        $scope.setKlass = function (klass) {
            $scope.klass = klass;
            $scope.page = 1;
            getDecks();
        };
        
        function getDecks () {
            DeckService.getDecks($scope.klass, $scope.page, $scope.perpage).then(function (data) {
                $scope.decks = data.decks;
                $scope.total = data.total;
                
                $scope.klass = data.klass;
                $scope.page = data.page;
            });
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
                getDecks();
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
            
        };
    }
])
.controller('DeckCtrl', ['$scope', '$state', '$sce', '$compile', '$window', 'bootbox', 'UserService', 'DeckService', 'AuthenticationService', 'VoteService', 'data', 
    function ($scope, $state, $sce, $compile, $window, bootbox, UserService, DeckService, AuthenticationService, VoteService, data) {
        if (!data || !data.success) { return $state.go('app.decks.list'); }

        // load deck
        $scope.deck = data.deck;
        
        // mulligans
        $scope.coin = true;
        
        $scope.toggleCoin = function () {
            $scope.coin = !$scope.coin;
        }
        
        $scope.currentMulligan = $scope.deck.mulligans[0] || false;

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
        
        $scope.getMulliganInstructions = function () {
            var m = $scope.currentMulligan;
            return ($scope.coin) ? m.withCoin.instructions : m.withoutCoin.instructions;
        };
        
        $scope.getMulliganCards = function () {
            var m = $scope.currentMulligan;
            return ($scope.coin) ? m.withCoin.cards : m.withoutCoin.cards;
        };
        
        $scope.cardLeft = function ($index) {
            return ($scope.getMulliganCards().length - ($index + 1)) * 80;
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
        
        // login for modal
        $scope.login = function login(email, password) {
            if (email !== undefined && password !== undefined) {
                UserService.login(email, password).success(function(data) {
                    AuthenticationService.setLogged(true);
                    AuthenticationService.setAdmin(data.isAdmin);
                    $window.sessionStorage.userID = data.userID;
                    $window.sessionStorage.username = data.username;
                    $window.sessionStorage.token = data.token;
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
        
        console.log(data.categories);
    }
])
.controller('ForumThreadCtrl', ['$scope', 'Pagination', 'data', 
    function ($scope, Pagination, data) {
        $scope.thread = data.thread;
        
        console.log(data.thread);
        
        // page flipping
        $scope.pagination = Pagination.new(20);
        $scope.pagination.results = function () {
            return $scope.thread.posts.length;
        };
    }
])
.controller('ForumAddCtrl', ['$scope', '$location', '$window', '$compile', 'bootbox', 'ForumService', 'UserService', 'AuthenticationService', 'data', 
    function ($scope, $location, $window, $compile, bootbox, ForumService, UserService, AuthenticationService, data) {
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
                    $window.sessionStorage.userID = data.userID;
                    $window.sessionStorage.username = data.username;
                    $window.sessionStorage.token = data.token;
                    box.modal('hide');
                    callback();
                }).error(function() {
                    $scope.showError = true;
                });
            }
        }

    }
])
.controller('ForumPostCtrl', ['$scope', '$sce', '$compile', '$window', 'bootbox', 'ForumService', 'UserService', 'AuthenticationService', 'VoteService', 'data', 
    function ($scope, $sce, $compile, $window, bootbox, ForumService, UserService, AuthenticationService, VoteService, data) {
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
        
        // login for modal
        $scope.login = function login(email, password) {
            if (email !== undefined && password !== undefined) {
                UserService.login(email, password).success(function(data) {
                    AuthenticationService.setLogged(true);
                    AuthenticationService.setAdmin(data.isAdmin);
                    $window.sessionStorage.userID = data.userID;
                    $window.sessionStorage.username = data.username;
                    $window.sessionStorage.token = data.token;
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
;