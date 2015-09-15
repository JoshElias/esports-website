'use strict';
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
                            console.log(email);
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
.directive('forgotPasswordForm', ['LoginModalService', function (LoginModalService) {
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
            console.log($scope.verify.email);
            
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
.directive('commentSection', ['$rootScope', 'VoteService', 'LoginModalService', function ($rootScope, VoteService, LoginModalService) {
    return {
        restrict: "E",
        templateUrl: tpl + 'views/frontend/directives/comments/commentSection.html',
        scope: { 
            commentable: "=",
            service:     "=", 
        },
        controller: function ($scope) {
            $scope.commentable;
            $scope.service;
            $scope.app = $rootScope.app;
            
            console.log($scope);
            
            var defaultComment = '';
            $scope.comment = angular.copy(defaultComment);

            $scope.commentPost = function () {
                if (!$scope.app.user.isLogged()) {
                    LoginModalService.showModal('login', function () {
                        $scope.commentPost();
                    });
                } else {
                    $scope.service.addComment($scope.commentable, $scope.comment).success(function (data) {
                        console.log(data, $scope.comment.length);
                        if (data.success) {
                            $scope.commentable.comments.push(data.comment);
                            $scope.comment = '';
                        }
                    });
                }
                updateCommentVotes();
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
        },
        link: function ($scope, el, attr) {
            
            $scope.addAreaFocus = false;
            
            console.log(el);
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
        templateUrl: "views/admin/snapshot.add.author.html"
    };
}])
.directive('snapshotAddDeck', [function () {
    return {
        templateUrl: "views/admin/snapshot.add.deck.html"
    }
}])
.directive('snapshotAddCard', [function () {
    return {
        templateUrl: "views/admin/snapshot.add.card.html"
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
            console.log('viewable: ', scope.viewable());
            console.log('offset: ', scope.offset);
            console.log('size: ', scope.size);
            console.log('width: ', $('body').innerWidth());
            
            function updateWidth () {
                var newWidth = (((100 / scope.viewable()) * scope.size) / 100 * ($('body').innerWidth() - 20));
                console.log('width: ', $window.innerWidth);
                console.log('newWidth: ', newWidth);
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
                    console.log('viewable: ', newValue);
                    updateWidth();
                    updateOffset();
            });
            scope.$watch('offset', function(value){
                console.log('offset: ', value);
                updateOffset();
            });
            scope.$watch('size', function(value){
                console.log('size: ', value);
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
.directive('hotsGuide', function() {
    return {
        restrict: 'E',
        scope: { guide: "=guide" },
        replace: true,
        templateUrl: "views/frontend/directives/hots.guide.html",
        link: function(scope, element, attrs) {
            
            scope.getGuideCurrentHero = function (guide) {
                console.log(guide);
                return (guide.currentHero) ? guide.currentHero : guide.heroes[0];
            };

            scope.getGuideClass = function (guide) {
                console.log(guide);
                return (guide.guideType == 'hero') ? scope.getGuideCurrentHero(guide).hero.className : guide.maps[0].className;
            };
            
            scope.guidePrevHero = function ($event, guide) {
                $event.preventDefault();
                $event.stopPropagation();

                var currentHero = scope.getGuideCurrentHero(guide),
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

            scope.guideNextHero = function ($event, guide) {
                $event.preventDefault();
                $event.stopPropagation();

                var currentHero = scope.getGuideCurrentHero(guide),
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
            
        }
    };
})
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
                    scope.filters.heroes.push(hero);
                } else {
                    scope.filters.heroes.splice(index, 1);
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
                if (scope.filters.search.length && scope.hasFilterSearch(hero)) {
                    return true;
                }
                return false;
            };
            
            scope.hasFilterHero = function (hero) {
                return (scope.filters.heroes.indexOf(hero) !== -1);
            };

            scope.hasFilterSearch = function (hero) {
                var filtered = (scope.filters.search && scope.filters.search.length) ? $filter('filter')(scope.heroes, { name: scope.filters.search }) : scope.heroes;
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
.directive('tempostormTv', ['TwitchService', function (TwitchService) {
    return {
        restrict: 'A',
        templateUrl: tpl + 'views/frontend/directives/twitch.streams.html',
        link: function (scope, element, attrs) {
            scope.streamWheel = false;
            scope.streams = undefined;

            TwitchService.getStreams().then(function(data) {
                for (var i = 0; i < data.data.length; i++) {
                    var log = data.data[i].logoUrl;
                    var sub = log.substr(4);
                    var im = "https" + sub;
                    data.data[i].logoUrl = im;
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
                console.log(data.data);
            });

            scope.getContent = function (c) {
                return $sce.trustAsHtml(c);
            };

        }
    };
}])
;