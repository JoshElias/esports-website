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
.directive('loginForm', ['$window', 'AuthenticationService', 'LoginModalService', 'UserService', 'SubscriptionService', function ($window, AuthenticationService, LoginModalService, UserService, SubscriptionService) {
    return {
        templateUrl: tpl + 'views/frontend/directives/login.form.html',
        scope: {
            callback: '&'
        },
        link: function (scope, el, attr) {
            
            scope.closeModal = function () {
                LoginModalService.hideModal();
            }
            
            scope.login = function login(email, password) {
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
                        LoginModalService.hideModal();
                        
                        scope.callback();
                    }).error(function() {
                        scope.showError = true;
                    });
                }
            }
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
            } else {
                element.removeClass('sticky');
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
        templateUrl: 'views/admin/articles.related.add.html',
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
        templateUrl: 'views/frontend/socialmedia/fblikebutton.html'
    }
}])
.directive("tweetButton", [function () {
    return {
        restrict: "A",
        replace: true,
        scope: {
            url: "=url"
        },
        templateUrl: 'views/frontend/socialmedia/tweetbutton.html'
    }
}])
.directive("redditButton", [function () {
    return {
        restrict: "A",
        replace: true,
        scope: {
            url: "=url"
        },
        templateUrl: 'views/frontend/socialmedia/redditbutton.html'
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
        templateUrl: 'views/frontend/directives/db.deck.html'
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
;