angular.module('tsAdSense', [])
.run(
    ['$rootScope', '$window',
        function ($rootScope, $window) {
            $rootScope.$on("$stateChangeSuccess", function(event, toState, toParams, fromState, fromParams) {
                var canShowAds = !!window.canshowads;
                var ai = $('.adblock-img');

                $timeout(function () {
                    if (!canShowAds) {
                        for (var i = 0; i < ai.length; i++) {
                            $(ai[i]).removeClass('hidden');
                        }
                    }
                }, 1000);
//              Object.keys($window).filter(function(k) { return k.indexOf('google') >= 0 }).forEach(
//                function(key) {
//                  delete($window[key]);
//                }
//              );
            });
        }
    ]
)
.value('moduleTpl', (tpl !== './') ? tpl + 'views/asense/client/views/' : 'dist/views/asense/client/views/')
.controller('tsAdCtrl', ['$scope', '$state', '$window', 'User', 'EventService', '$timeout', function ($scope, $state, $window, User, EventService, $timeout) {
    var url = 'http://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js';
    var isAlreadyLoaded = !!document.getElementById("adCode");
    var e = $(".ad");
    var role = undefined;
    var canShowAds = !!window.canshowads;

    function checkPremium () {
        //if (canShowAds) {
            if (User.isAuthenticated() && !role) {
                User.isInRoles({
                        uid: User.getCurrentId(),
                        roleNames: ['$premium']
                    })
                    .$promise
                    .then(function (data) {
                        role = data.isInRoles.$premium;

                        var s = document.getElementById('adCode');
                        var eLength = e.length;

                        if (!role) {
                            $scope.showAds = true;
                            return doLoadAds();
                        }

                        if (isAlreadyLoaded && s !== null && s !== undefined) {
                            s.parentNode.removeChild(s);
                            isAlreadyLoaded = false;
                        }

                        for (var i = 0; i < eLength; i++) {
                            $(e[i]).remove();
                        }

                        $scope.showAds = false;
                    })
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
        
        $timeout(function () {
            for (var i = 0; i < e.length; i++) {
                $(e[i]).removeClass('hidden');
            }
        });
        
        
        if (!isAlreadyLoaded) {
            var s = document.createElement('script');
            s.type = 'text/javascript';
            s.id = "adCode";
            s.src = url;
            s.async = true;
            document.body.appendChild(s);

            isAlreadyLoaded = true;
        }
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
.directive('tsAd', ['moduleTpl', '$compile', '$timeout', function (moduleTpl, $compile, $timeout) {
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
        controller: 'tsAdCtrl'
    }
}])
;