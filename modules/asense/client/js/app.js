angular.module('tsAdSense', [])
.run(
    ['$rootScope', 'User',
        function ($rootScope, User) {
            $rootScope.$on("$stateChangeStart", function(event, toState, toParams, fromState, fromParams) {
                var s = document.getElementById('adCode');
                var e = $('.ad');

                //if (!_.isNull(s))
                //    s.parentNode.removeChild(s);

                //for (var i = 0; i < e.length; i++) {
                //    $(e[0]).parentNode.removeChild(e[0]);
                //}

                //Object.keys($window).filter(function(k) { return k.indexOf('google') >= 0 }).forEach(
                //    function(key) {
                //      delete($window[key]);
                //    }
                //);
            });

            $rootScope.$on("$stateChangeSuccess", function(event, toState, toParams, fromState, fromParams) {

                //User.isInRoles({
                //    uid: LoopBackAuth.currentUserId,
                //    roleNames: ['$admin', '$redbullAdmin']
                //})
                //.$promise
                //.then(function (data) {
                //    if (data.isInRoles.$admin !== true && data.isInRoles.$redbullAdmin !== true) {
                //        event.preventDefault();
                //        $state.transitionTo('app.home');
                //    }
                //});

            });
        }
    ]
)
.value('moduleTpl', (tpl !== './') ? tpl + 'views/asense/client/views/' : 'dist/views/asense/client/views/')
.controller('tsAdCtrl', ['$scope', '$state', '$window', 'User', 'EventService', '$timeout', 'UserRoleService', function ($scope, $state, $window, User, EventService, $timeout, UserRoleService) {
    var url = 'http://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js';
    //var window.googleAdsAlreadyLoaded = !!document.getElementById("adCode");
    var e = $(".ad");
    var r = UserRoleService.getRoles();
    console.log(r);
    var role = r.$premium;
    var canShowAds = !!window.canshowads;

    function checkPremium () {
        //if (canShowAds) {
        console.log('stuff', User.isAuthenticated(), role);
            if (User.isAuthenticated() && !role) {
                console.log('role', role);
                //role = data.isInRoles.$premium;

                var s = document.getElementById('adCode');
                var eLength = e.length;

                if (!role) {
                    $scope.showAds = true;
                    return doLoadAds();
                }

                if (window.googleAdsAlreadyLoaded && s !== null && s !== undefined) {
                    s.parentNode.removeChild(s);
                    window.googleAdsAlreadyLoaded = false;
                }

                for (var i = 0; i < eLength; i++) {
                    $(e[i]).remove();
                }

                $scope.showAds = false;
            } else {
                role = false;
                $scope.showAds = true;
                return doLoadAds();
            }
        //}
    }
    
    function doLoadAds () {
        $scope.adClient = $scope.adClient || "ca-pub-6273013980199815";
        $scope.adSlot = $scope.adSlot || "7575226683";
        $scope.theme = $state.theme || 'default';
        $scope.region = $state.current.name;
        $scope.w = (!_.isUndefined($scope.w)) ? $scope.w : '100%';
        $scope.h = (!_.isUndefined($scope.h)) ? $scope.h : '100%';

        if (!window.googleAdsAlreadyLoaded) {
            var s = document.createElement('script');
            s.type = 'text/javascript';
            s.id = "adCode";
            s.src = url;
            s.async = true;
            document.body.appendChild(s);

            window.googleAdsAlreadyLoaded = true;
        }

        $timeout(function () {
            for (var i = 0; i < e.length; i++) {
                $(e[i]).removeClass('hidden');
            }
        });
    }
    
    EventService.registerListener(EventService.EVENT_LOGIN, checkPremium);
    EventService.registerListener(EventService.EVENT_LOGOUT, checkPremium);
    checkPremium();
}])
.directive('ad', ['moduleTpl', '$timeout', '$window', function (moduleTpl, $timeout, $window) {
    return {
        restrict: 'E',
        replace: true,
        templateUrl: moduleTpl + 'directives/a.html',
        controller: ['$scope', function ($scope) {
            var adIter = 0;
            var adIterMax = 10;
            var canShowAds = !!window.canShowAds;

            if(!$window.adsbygoogle) {
                $window.adsbygoogle = [];
            }

            $scope.getCanShowAds = function () {
                return canShowAds;
            }

            function pushAd () {
                if (adIter < adIterMax) {

                    $timeout(function () {
                        try {
                            $window.adsbygoogle.push({});
                        } catch (e) {
                            adIter++;
                            return pushAd();
                        }
                    }, 500);
                } else {
                    var parent = $scope.el[0].parentNode;

                    while (!!parent['parentNode']) {
                        parent = parent['parentNode'];
                    }

                    $(parent).remove();
                }
            }

            pushAd();
        }],
        link: function (scope, el, attrs) {
            scope.el = el;
            scope.attrs = attrs;
            
            $timeout(function () {
                if (attrs.adSlot === "7575226683") {
                    $(el[0]).attr('data-ad-format', 'auto')
                }
            })
        }
    }
}])
.directive('tsAd', ['moduleTpl', '$compile', '$timeout', 'LoopBackAuth', function (moduleTpl, $compile, $timeout, LoopBackAuth) {
    return {
        restrict: 'E',
        replace: true,
        scope : {
            adClient : '@',
            adSlot : '@',
            inlineStyle : '@',
            region: '@',
            structure: '@',
            theme: '@',
            h: '@', //height
            w: '@'  //width
        },
        templateUrl: function (scope, attrs) {
            var tmp = attrs.structure || attrs.theme;
            
            return moduleTpl + 'directives/a.' + tmp + '.html';
        },
        controller: 'tsAdCtrl',
        link: function (scope, el, attrs) {

            //if (!!LoopBackAuth.isAuthenticated) {
            //    scope.user = LoopBackAuth.currentUserData.username;
            //}
        }
    }
}])
;