'use strict';

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
.directive('charAddForm', function () {
    return {
        templateUrl: 'views/admin/hots.heroes.char.add.html'
    };
})
.directive('charEditForm', function () {
    return {
        templateUrl: 'views/admin/hots.heroes.char.edit.html'
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
        templateUrl: 'views/frontend/activity/activity.forumPost.comment.html'
    };
})
.directive('activityGuide', function () {
    return {
        templateUrl: 'views/frontend/activity/activity.guide.html'
    };
})
.directive('activityGuideComment', function () {
    return {
        templateUrl: 'views/frontend/activity/activity.guide.comment.html'
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
;