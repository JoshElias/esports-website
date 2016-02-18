angular.module('tsAdSense', [])
.run(
    ['$rootScope', '$window',
        function ($rootScope, $window) {
            $rootScope.$on("$stateChangeStart", function(event, toState, toParams, fromState, fromParams) {
                
                
                
            });
        }
    ]
)
.value('moduleTpl', (tpl !== './') ? tpl + 'views/adsense/client/views/' : 'dist/views/adsense/client/views/')
.controller('tsAdCtrl', ['$scope', '$state', '$window', 'User', 'EventService', '$timeout', function ($scope, $state, $window, User, EventService, $timeout) {
    var url = 'http://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js';
    var isAlreadyLoaded = !!document.getElementById("adCode");
    var role = undefined;
    
    $scope.showAds = false;
    $scope.adBlock = window.canShowAds;
    
    function checkPremium () {
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
                    e[0].parentNode.removeChild(e[0]);
                }
                
                $scope.showAds = false;
            })
        } else {
            role = false;
            $scope.showAds = true;
            return doLoadAds();
        }
    }
    
    function doLoadAds () {
        console.log($scope);
        $scope.adClient = $scope.adClient || "ca-pub-6273013980199815";
        $scope.adSlot = $scope.adSlot || "7575226683";
        $scope.theme = $state.theme || 'default';
        $scope.region = $state.current.name;
        $scope.w = (!_.isUndefined($scope.w)) ? $scope.w + 'px' : '100%';
        $scope.h = (!_.isUndefined($scope.h)) ? $scope.h + 'px' : '100%';
        var e = $(".ad");
        
        
        
        $timeout(function () {
            for (var i = 0; i < e.length; i++) {
                $(e[i]).removeClass('hidden');
            }
        })
        
        
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
        templateUrl: moduleTpl + 'directives/ad.html',
        controller: ['$scope', function ($scope) {
            var adIter = 0;
            var adIterMax = 10;
            
            if(!$window.adsbygoogle) {
                $window.adsbygoogle = [];
            }
            
            function pushAd () {
                if (adIter < adIterMax) {
                    $timeout(function () {
                        try {
                            $window.adsbygoogle.push({});
                        } catch (e) {
                            adIter++;
                            console.error(e.message);
                            console.error("Retrying");
                            return pushAd();
                        }
                    }, 500);
                } else {
                    console.log('timed out');
                }
            } 
            
            pushAd();
        }],
        link: function (scope, el, attrs) {
//            $(el[0]).attr();
            $timeout(function () {
                console.log(attrs);
                if (attrs.adSlot === "7575226683") {
                    $(el[0]).attr('data-ad-format', 'auto')
                }
            })
        }
    }
}])
.directive('tsAd', ['moduleTpl', '$compile', '$timeout', '$window', function (moduleTpl, $compile, $timeout, $window) {
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
            
            return moduleTpl + 'directives/ad.' + tmp + '.html';
        },
        controller: 'tsAdCtrl'
    }
}])
;