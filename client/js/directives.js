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
.directive('hsCard', ['$compile', function ($compile) {
    return {
        restrict: 'A',
		scope: {
            tooltipImg: '='
        },
        link: function (scope, el, attr) {
            scope.$watch('tooltipImg', function (newValue) {
                scope.tooltipImg = newValue;
                setTooltip();
            });

            var createUUID = function() {
              return"uuid-"+((new Date).getTime().toString(16)+Math.floor(1E7*Math.random()).toString(16));
            }
            
            var tmpUuid = createUUID();

            function setTooltip () {
                var content = $compile('<img ng-src="'+scope.tooltipImg+'" alt="">')(scope);
                var xPos = (attr['tooltipPos'] && attr['tooltipPos'] === 'left') ? -304 : 60;
                
                el.wTooltip({
                  delay: 500,
                  offsetX: xPos,
                  offsetY: -50,
                  content: content,
                  style: false,
                  className: 'hs-card-tooltip-' + tmpUuid
                });
            }

            scope.$on('$destroy', function () {
                $('.hs-card-tooltip-'+tmpUuid).remove();
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
                    default:       $scope.state = "login" ; $scope.title = "User Login"; break;
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
.directive('loginForm', ['$window', '$cookies', '$state', '$location', '$stateParams', 'LoginModalService', 'User', 'LoopBackAuth', 'LoginService', 'AlertService', 'Util',
    function ($window, $cookies, $state, $location, $stateParams, LoginModalService, User, LoopBackAuth, LoginService, AlertService, Util) {
        return {
            templateUrl: tpl + 'views/frontend/directives/login/login.form.html',
            scope: true,
            controller: ['$scope', function ($scope) {
                $scope.remember = false;
                $scope.loginInfo = {
                    email: "",
                    password: ""
                };
                $scope.loginText = "Login";
                $scope.loginBtnEnabled = true;

                var loginStatusList = {
                    0: "Login",
                    1: "Please Wait...",
                    2: "Success!"
                }

                $scope.setLoggingIn = function (status) {
                    $scope.loginText = loginStatusList[status];
                }

                $scope.login = function login(email, password) {
                    $scope.setLoggingIn(1);
                    if ($scope.loginInfo.email !== "undefined" && typeof $scope.loginInfo.password !== "undefined") {
                        LoginService.login(email, password, $scope.remember, function(err, data) {
                            if (err) {
                                AlertService.setError({ show: true, msg: "Error logging in" });

                                $scope.showError = true;
                                $scope.setLoggingIn(0);
                            } else {

                              LoginModalService.hideModal();
                              $scope.setLoggingIn(2);

                              if ($scope.callback) {
                                $scope.callback(LoopBackAuth);
                              } else if (!$scope.state) {
                                var goto = $stateParams.redirect || 'app.home';
                                $state.go(goto);
                              }
                            }
                        });

                    } else {
                      AlertService.setError({ show: true, msg: "Missing username and/or password" });
                    }
                };

                $scope.twitchLogin = function() {
                  LoginService.thirdPartyRedirect('login', 'twitch');
                };

                $scope.bnetLogin = function() {
                  LoginService.thirdPartyRedirect("login", "bnet");
                };
            }]
        }
    }
])
.directive('signupForm', ['$state', '$window', 'User', 'LoginModalService', 'AlertService', function ($state, $window, User, LoginModalService, AlertService) {
    return {
      templateUrl: tpl + 'views/frontend/directives/login/signup.form.html',
      scope: true,
      link: function ($scope, el, attr) {

//      // recaptcha
//      $scope.captchaKey = '6LeLJhQTAAAAAEnLKxtQmTkRkrGpqmbQGTRzu3u8';
      $scope.captchaToken = null;
//      $scope.widgetId = null;
//      $scope.captchaFailed = false;
//
//      $scope.setToken = function (token) {
//          $scope.captchaToken = token;
//      }
//
//      $scope.setWidgetId = function (widgetId) {
////        console.log('Created widget ID: %s', widgetId);
//
//        $scope.widgetId = widgetId;
//      }
//
//      $scope.cbExpiration = function () {
//          $scope.captchaToken = null;
//      }
//
//      $scope.getStyle = function () {
//          return (!$scope.setState) ? 'transform:scale(1.06);-webkit-transform:scale(1.06);transform-origin:0 0;-webkit-transform-origin:0 0;' : 'transform:scale(.99);-webkit-transform:scale(.99);transform-origin:0 0;-webkit-transform-origin:0 0;';
//      }



      $scope.verify = {
        email: "",
        code: ""
      }

      $scope.signup = function(email, username, password) {
        if (email !== undefined && username !== undefined && password !== undefined && cpassword !== undefined ) {
            
          User.create({
              email: email,
              username: username,
              password:password
          }, function (user) {
            $scope.verify.email = email;
            if ($scope.setState) {
                $scope.setState("verify");
            } else {
                $state.go('app.verify');
            }
          }, function(err) {
              $window.scrollTo(0, 0);
              AlertService.setError({
                  show: true,
                  msg: 'Unable to Create Account',
                  lbErr: err
              });
              
          });
        }
      }
    }
  }
}])
.directive('forgotPasswordForm', ['LoginModalService', 'User', 'AlertService', function (LoginModalService, User, AlertService) {
    return {
        templateUrl: tpl + 'views/frontend/directives/login/forgot.password.form.html',
        scope: true,
        link: function ($scope, el, attr) {

            $scope.forgotPassword = function () {
                User.resetPassword({ email: $scope.forgot.email })
                .$promise
                .then(function (data) {
                  AlertService.setSuccess({ show: true, msg: AlertService.messages.forgotPassword.success });
                  $scope.forgot.email = '';
                })
                .catch(function(err) {
                  AlertService.setError({ show: true, msg: AlertService.messages.forgotPassword.error + err.status + ": " + err.data.error.message });
                  $scope.showError = true;
                });
            };
        }
    }
}])
.directive('verifyForm', ['LoginModalService', 'AlertService', function (LoginModalService, AlertService) {
    return {
        templateUrl: tpl + 'views/frontend/directives/login/verify.form.html',
        scope: true,
        link: function ($scope, el, attr) {

            //TODO: VerifyForm: Do Verify

//            $scope.verifyEmail = function (email, code) {
//                User.confirm({
//                    uid
//                })
//                .$promise
//                .then(function (data) {
//
//                });
//            };
        }
    }
}])
.directive('commentSection', ['$sce', 'VoteService', 'LoginModalService', 'Comment', 'LoopBackAuth', function ($sce, VoteService, LoginModalService, Comment, LoopBackAuth) {
    return {
        restrict: "E",
        templateUrl: tpl + 'views/frontend/directives/comments/commentSection.html',
        scope: {
            commentable: "=",
            service:     "="
        },
        controller: ['$scope', function ($scope) {
            //TODO: FIX COMMENTING
            $scope.commentable;
            $scope.service;

            var defaultComment = '';
            $scope.comment = angular.copy(defaultComment);

            $scope.parseComment = function (c) {
                return $sce.trustAsHtml(c);
            }

            $scope.getCurrentEmail = function () {
                var userEmail = (LoopBackAuth.currentUserData) ? LoopBackAuth.currentUserData.email : undefined;
                return userEmail;
            }

            $scope.commentPost = function () {
                if (LoopBackAuth.currentUserData === null) {
                    LoginModalService.showModal('login', function () {
                        $scope.commentPost();
                    });
                } else {
                    $scope.service.comments.create({
                        id: $scope.commentable.id
                    }, {
                        text: $scope.comment,
                        authorId: LoopBackAuth.currentUserId,
                        createdDate: new Date(),
                        votes: [
                            {
                                userId: LoopBackAuth.currentUserId,
                                direction: 1
                            }
                        ],
                        votesCount: 1
                    })
                    .$promise
                    .then(function (com) {
                        com.author = LoopBackAuth.currentUserData;
                        $scope.commentable.comments.push(com);
                        $scope.comment = '';
                        updateCommentVotes();
                    }, function (err, a) {
                        console.log("failed!", err, a);
                    });
                }
            };

            $scope.calculateVotes = function (c) {
                var voteScore = 0;
                _.each(c.votes, function (vote) { voteScore = voteScore + vote.direction });

                return voteScore;
            }

            updateCommentVotes();
            function updateCommentVotes() {
                $scope.commentable.comments.forEach(checkVotes);

                function checkVotes (comment) {
                    var vote = comment.votes.filter(function (vote) {
                        return (LoopBackAuth.currentUserId === vote.userId);
                    })[0];

                    if (vote) {
                        comment.voted = vote.direction;
                    }
                }
            }

            $scope.voteComment = function (direction, comment) {
                var uniqueVote = false;
                if (LoopBackAuth.currentUserData === null) {
                    LoginModalService.showModal('login', function () {
                        $scope.voteComment(direction, comment);
                    });
                } else {
                    if (comment.author.id === LoopBackAuth.currentUserId) {
                        bootbox.alert("You can't vote for your own content.");
                        return false;
                    }

                    for(var i = 0; i < comment.votes.length; i++) {
                        if(comment.votes[i].userId === LoopBackAuth.currentUserId) {
                            uniqueVote = false;
                            var prevDirection = comment.votes[i].direction;
                            if(direction === prevDirection) {
                                // do nothing
                                return;
                            } else {
                                comment.votes[i].direction = direction;
                                Comment.upsert(comment)
                                .$promise.then(function (data) {
                                    comment.voted = direction;
                                    comment.votesCount = data.votesCount;
                                });
                                return;
                            }
                        } else {
                            uniqueVote = true;
                        }
                    }
                    
                    if(uniqueVote) {
                        comment.votesCount = comment.votesCount + direction;
                        comment.votes.push({
                            direction: direction,
                            userId: LoopBackAuth.currentUserId
                        });
                        
                        Comment.upsert(comment)
                        .$promise
                        .then(function (data) {
                            comment.voted = direction;
                            comment.votesCount = data.votesCount;
                        });
                    }
                }
                updateCommentVotes();
            }
        }],
        link: function ($scope, el, attr) {

            $scope.addAreaFocus = false;

        }
    }
}])
.directive('alertBox', ['AlertService', function (AlertService) {
    return {
        restrict: 'E',
        templateUrl: function (element, attrs) {
            var theme = attrs.theme || 'default';
            return tpl + 'views/frontend/directives/alertBox/' + theme + '.html';
        },
        controller: ['$scope', function ($scope) {
            var as = AlertService;

            $scope.show = function () {
                return as.getShow();
            }

            $scope.reset = function() {
                return as.reset();
            }

            $scope.getMessage = function (key) {
                var s = as.getSuccess();
                var e = as.getError();

                if (!_.isEmpty(s)) {
                    return s[key];
                } else if (!_.isEmpty(e)) {
//					console.log('e[key]:', e[key]);
                    return e[key];
                }
            }

            $scope.isSuccess = function () {
                if (!_.isEmpty(as.getSuccess())) {
                    return true;
                } else if (!_.isEmpty(as.getError())) {
                    return false;
                } else {
                    return null;
                }
            }
        }],
        link: function ($scope, el, attrs) {
            $scope.theme = attrs.theme || 'default';
        }
    }
}])
.directive('creditForm', function () {
    return {
        templateUrl: tpl + 'views/frontend/directives/credit.form.html',
        scope: {
            plan: '='
        },
        controller: function ($scope) {
                $scope.loading = false;

                $scope.updateCard = function (code, result) {

                $scope.loading = true;

                async.series([
                    function (sCb) {
                        if (result.error) {
//                            console.log(result);
                        } else {
                            User.setSubscriptionCard({}, { cctoken: result.id })
                            .$promise
                            .then(function (data) {
//                                console.log(data);

    //                                $scope.user.subscription.last4 = data.subscription.last4;
    //                                $scope.cardPlaceholder = 'xxxx xxxx xxxx ' + data.subscription.last4;
    //                                $scope.number = '';
    //                                $scope.cvc = '';
    //                                $scope.expiry = '';

                                return sCb(null);
                            })
                            .catch(function (err) {
                                sCb(err);
                            });
                        }
                    }
                ], function (err) {
                    if (err) { console.log("ERROR:", err); }

                    $scope.loading = false;
                });
            }
        }
    }
})
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
.directive("subNavStream", ['Twitchfeeds', '$timeout', 'Util', function (Twitchfeeds, $timeout, Util) {
    return {
        restrict: 'E',
        replace: true,
        scope: false,
        templateUrl: tpl+"views/frontend/directives/subnav.stream.html",
        controller: ['$scope', function ($scope) {
            $scope.subNavStreams = [];
            $scope.showSubNavStream = false;

            Twitchfeeds.find({
                filter: {
                    order: 'viewerCount DESC'
                }
            })
            .$promise
            .then(function(data) {
              data = _.sortBy(data[0].feed, 'viewerCount').reverse();
                for (var i = 0; i < data.length; i++) {
//                    var log = data[i].logoUrl;
//                    var sub = log.substr(4);
//                    var im = "https" + sub;
//                    data[i].logoUrl = im;

                    data[i].viewerCount = +data[i].viewerCount;
                }
                $scope.selectedStream = 0;
                $timeout(function() {
                    if (data.length) {
                        $scope.showSubNavStream = true;
                    }
                    $scope.subNavStreams = data;
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
.directive('subnavRedbull', ['$timeout', '$interval', function ($timeout, $interval) {
    return {
        templateUrl: tpl + 'views/frontend/directives/subnav.redbull.html',
        link: function (scope, el, attrs) {
            var startShake = null,
                shakeLoop = null,
                shakeInterval = 5000;
            // start shaking pack timer
            // shake pack
            function shakePack () {
                $('.sub-nav-pack').trigger('startRumble');
                $timeout(function() {
                    $('.sub-nav-pack').trigger('stopRumble');
                }, 750);
            }

            function startShakeTimer () {
                shakeLoop = $interval(shakePack, shakeInterval);
            }

            // stop shaking pack timer
            function stopShakeTimer () {
                $timeout.cancel(startShake);
                $interval.cancel(shakeLoop);
            }

            // init pack shaking timers
            startShake = $timeout(function() {
                shakePack();
                shakeLoop = $interval(shakePack, shakeInterval);
            }, shakeInterval);

            scope.$on('$destroy', function () {
                stopShakeTimer();
            });

            $('.sub-nav-pack').jrumble();

        }
    };
}])
.directive('voteWidget', ['LoopBackAuth', 'User', 'LoginModalService', 'Vote', 'EventService', function (LoopBackAuth, User, LoginModalService, Vote, EventService) {
    return {
        restrict: 'E',
        replace: true,
        scope: {
            votable: '='
        },
        templateUrl: function (element, attrs) {
            var theme = attrs.theme || 'multi';
            return tpl + 'views/frontend/directives/voteWidget/' + theme + '.html';
        },
        controller: ['$scope', '$element', '$attrs', 'EventService', function ($scope, $element, $attrs, EventService) {
//            console.log('$scope.votable:', $scope.votable);
            var loading = false;
            var objType = Object.keys($scope.votable)[0];
            var votable = $scope.votable[objType];
            var parentId = votable.id;
            var votableType = objType.toString() + 'Id';
            $scope.voteInfo = {};
            
            function getVoteInfo (cb) {
                async.waterfall([
                    getVotes,
                    calcVotes
                ], function (err, voteInfo) {
                    setLoading(false);
                    $scope.voteInfo = voteInfo;
                    if (!_.isUndefined(cb) && angular.isFunction(cb))
                        return cb();
                })
            }
            
            function getVotes (cb) {
                var voteOptions = {
                    filter: {
                        where: {
                            
                        }
                    }
                };
                
                voteOptions.filter.where[votableType] = parentId;
                Vote.find(voteOptions)
                .$promise
                .then(function (votes) {
//                    setLoading(false);
                    votable.votes = votes;
                    return cb(undefined, votes);
                });
            }
            
            function calcVotes (votes, cb) {
                var hasVoted,
                    voteScore = 0;
                
                Vote.hasVoted({
                    parentId: parentId,
                    uid: LoopBackAuth.currentUserId
                }).$promise
                .then(function (data) {
                    hasVoted = data.hasVoted;
                
                    _.each(votes, function(vote) {
                        voteScore += vote.direction;
                    });
                
                    var voteInfo = {
                        score: voteScore,
                        hasVoted: hasVoted
                    };
                    
                    return cb(undefined, voteInfo);
                });
            }
            
            //initial load
            getVoteInfo();

            function setLoading (bool) {
                loading = bool;
            }

            $scope.isLoading = function () {
                if (_.isEmpty($scope.voteInfo) || loading) {
                    return true;
                }

                return false;
            }

            $scope.hasVoted = function (direction) {
                return $scope.voteInfo.hasVoted == direction;
            }

            $scope.vote = function (direction) {
                if (loading)
                    return;

                if (_.isNull(LoopBackAuth.currentUserId)) {
                    LoginModalService.showModal('login', function (result) {
                        getVoteInfo(function() {
                            $scope.vote(direction);
                        });
                    });
                } else if ($attrs.theme === 'multi' && votable.authorId && LoopBackAuth.currentUserId === votable.authorId) {
                    return false;
                } else {
                    
                    if ($scope.voteInfo.hasVoted === direction) {
                        return;
                    } else if ($scope.voteInfo.hasVoted === 1 || $scope.voteInfo.hasVoted === -1) {
                        setLoading(true);
                        var where = {};
                            where[objType + "Id"] = votable.id;
                            where["authorId"] = LoopBackAuth.currentUserId;

                        Vote.findOne({
                            filter: {
                                where: where
                            }
                        })
                        .$promise
                        .then(function (vote) {
                            
                            vote.direction = direction;
                            
                            Vote.upsert({
                                id: vote.id
                            }, vote)
                            .$promise
                            .then(function(voteUpdated) {
                                
                                _.each(votable.votes, function(vote) {
                                    if (voteUpdated.id === vote.id) {
                                        vote.direction = direction;
                                    }
                                });
                                
                                getVoteInfo();
                            });
                        });
                        
                    } else {
                        setLoading(true);
                        var newVote = {};
                            newVote[objType + "Id"] = votable.id;
                            newVote["direction"] = direction;
                            newVote["authorId"] = LoopBackAuth.currentUserId;

                        Vote.create(newVote)
                        .$promise
                        .then(function (voteCreated) {
                            votable.votes.push(voteCreated);
                            getVoteInfo();
                        });
                    }
                }
            }

            EventService.registerListener(EventService.EVENT_LOGIN, getVoteInfo);
            EventService.registerListener(EventService.EVENT_LOGOUT, getVoteInfo);
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
            var tooltip;
            
            $timeout(function () {
                tooltip = $(element).tooltip();
            });
            
//            scope.$on('$destroy', function () {
//                if (tooltip.next()) {
//                    tooltip.next().remove();
//                }
//            });
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
.directive('talentForm', ['Talent', function () {
    return {
        templateUrl: tpl + 'views/admin/hots.talents.form.html',
    };
}])
.directive('talentHeroFormAdd', ['Talent', function () {
    return {
      templateUrl: tpl + 'views/admin/hots.heroes.talents.add.form.html',
      controller: ['$scope', 'Talent', function ($scope, Talent) {
        $scope.searchedTalents = [];
        $scope.searchTalents = function (search) {
            var pattern = '/.*'+search+'.*/i';

            Talent.find({
                filter: {
                  limit: 4,
                  where: { name: { regexp: pattern } }
                }
              })
              .$promise
              .then(function (data) {
                $scope.searchedTalents = (!_.isEmpty(pattern)) ? data : [];
              })
        }

        $scope.setCurrent = function (talent) {
          $scope.currentTalent.talent = talent;
        }
      }]
    };
}])
.directive('talentHeroFormEdit', ['Talent', function () {
    return {
        templateUrl: tpl + 'views/admin/hots.heroes.talents.edit.form.html',
    };
}])
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
.directive('articleDeckAdd', function () {
    return {
        templateUrl: tpl + 'views/admin/articles.deck.add.html',
    };
})
.directive('articleGuideAdd', function () {
    return {
        templateUrl: tpl + 'views/admin/articles.guide.add.html',
    };
})
.directive('articleAuthorAdd', function () {
    return {
        templateUrl: tpl + 'views/admin/articles.author.add.html',
    };
})
.directive('articleRelatedAdd', function () {
    return {
        templateUrl: tpl + 'views/admin/articles.related.add.html'
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
        templateUrl: tpl + "views/admin/hs.snapshot.add.author.html"
    };
}])
.directive('snapshotAddDeck', [function () {
    return {
        templateUrl: tpl + "views/admin/hs.snapshot.add.deck.html"
    }
}])
.directive('snapshotAddCard', [function () {
    return {
        templateUrl: tpl + "views/admin/hs.snapshot.add.card.html"
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
        controller: ['$scope', function ($scope) {

            $scope.cdn = $scope.$parent.$parent.$parent.$parent.$parent.app.cdn;

            $scope.getQty = function (id) {
                for(var i = 0; i < $scope.deck.cards.length; i++) {
                    if($scope.deck.cards[i].id == id) {
                        return $scope.deck.cards[i].cardQuantity;
                    }
                }
            };

            $scope.getDust = function () {
                var dust = 0;
                for (var i = 0; i < $scope.deck.cards.length; i++) {
                    dust += $scope.deck.cards[i].cardQuantity * $scope.deck.cards[i].card.dust;
                }
                return dust;
            };
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
            scope.searchHeroes = angular.copy(scope.filters.search);
            
            var initializing = true,
                randHeroIndex = randomIntFromInterval (0,scope.heroes.length - 1);

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
                
                scope.$parent.searchGuides();
            }
            
            scope.queryOnEmpty = function (str) {
                if (_.isEmpty(str)) {
                    scope.updateSearch();
                }
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
//                var index = scope.filters.heroes.indexOf(hero);
                var index = _.find(scope.filters.heroes, function (heroFilter) { return heroFilter.id === hero.id });
                
                if (!index) {
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
                var hasHero = _.find(scope.filters.heroes, function(heroFilter) {
                    return heroFilter.id === hero.id
                });
                return hasHero;
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
                if (scope.filters.map !== undefined) {
                    return (scope.filters.map.id === map.id);
                } else {
                    return false;
                }
                
            };

            scope.hasAnyFilterMap = function () {
                return (scope.filters.map !== false);
            };

            scope.toggleFilterMap = function (map) {
                if (scope.filters.map !== undefined) {
                    scope.filters.map = (scope.filters.map.id === map.id) ? undefined : map;
                } else {
                    scope.filters.map = map;
                }
                
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
.directive('hsFilterClassLarge', ['$filter', '$timeout', 'StateParamHelper', function ($filter, $timeout, StateParamHelper) {
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
                
                StateParamHelper.updateStateParams({
                    k: scope.filters.classes
                });
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
.directive('tempostormTv', ['Util', 'Twitchfeeds', function (Util, Twitchfeeds) {
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

            Twitchfeeds.find({})
            .$promise
            .then(function(data) {
                data = data[0].feed;

                for (var i = 0; i < data.length; i++) {
                    var log = data[i].screenshotUrl;
                    var sub = log.substr(4);
                    var im = "https" + sub;

                    data[i].screenshotUrl = im;
                    data[i].viewerCount = +data[i].viewerCount;
                }
                scope.streamWheel = true;
                scope.streams = data;
            });
        }
    };
}])
.directive('twitterFeed', ['$sce', 'Twitterfeeds', function ($sce, Twitterfeeds) {
    return {
        restrict: 'A',
        templateUrl: tpl + 'views/frontend/directives/twitter.tweets.html',
        link: function (scope, element, attrs) {
            scope.twitWheel = false;
            scope.tweets = undefined;
            var num = 6;

            Twitterfeeds.find({})
            .$promise
            .then(function(tweets) {
//                console.log(tweets);
                tweets = tweets[0].feed;

                scope.twitWheel = true;
                scope.tweets = tweets;
            });

            scope.getContent = function (c) {
                return $sce.trustAsHtml(c);
            };
        }
    };
}])
.directive('videoOfTheDay', ['Vod', function (Vod) {
    return {
        restrict: 'A',
        template: function () {
            return '<h3 class="sub-title m-b-md">{{vod.subtitle}}</h3><youtube-video class="home-vod" ng-if="vod.youtubeId" video-url="vod.youtubeId"></youtube-video><youtube-video class="home-vod" ng-if="vod.youtubeVars.list" player-vars="vod.youtubeVars"></youtube-video>';
        },
        link: function (scope, element, attrs) {
            Vod.find({
                filter: {
                    where: {
                        displayDate: { lte: new Date() }
                    },
                    order: "displayDate DESC",
                    limit: 1
                }
            }, function (vod) {
                scope.vod = vod[0];
            })
        }
    };
}])
.directive('overwatchAbilityAddForm', function () {
    return {
        templateUrl: tpl + 'views/admin/overwatch.heroes.ability.add.html'
    };
})
.directive('overwatchAbilityEditForm', function () {
    return {
        templateUrl: tpl + 'views/admin/overwatch.heroes.ability.edit.html'
    };
});
;
