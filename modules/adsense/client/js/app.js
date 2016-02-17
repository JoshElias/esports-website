angular.module('tsAdSense', [])
.value('moduleTpl', (tpl !== './') ? tpl + 'views/adsense/client/views/' : 'dist/views/adsense/client/views/')
.controller('tsAdCtrl', ['$scope', '$state', '$window', 'User', 'EventService', function ($scope, $state, $window, User, EventService) {
    var url = 'http://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js';
    var isAlreadyLoaded = !!document.getElementById("adCode");
    var role = undefined;
    
    $scope.showAds = true;
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
                
                if (!role) {
                    $scope.showAds = true;
                    return doLoadAds();
                }
                
                var s = document.getElementById('adCode');
                if (isAlreadyLoaded && (!_.isNull(s) || !_.isUndefined(s))) {
                    s.parentNode.removeChild(s);
                    isAlreadyLoaded = false;
                }
                
                var e = document.getElementsByClassName("ad");
                var eLength = e.length;
                console.log(e);
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
        $scope.adClient = $scope.adClient || "ca-pub-6273013980199815";
        $scope.adSlot = $scope.adSlot || "7575226683";
        $scope.theme = $state.theme || 'default';
        $scope.region = $state.current.name;
        
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
        controller: function () {
            $timeout(function() {
                if(!$window.adsbygoogle) {
                    $window.adsbygoogle = [];
                }

                $window.adsbygoogle.push({});
            }); 
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
            theme: '@'
        },
        templateUrl: function (scope, attrs) {
            var tmp = attrs.structure || attrs.theme;
            
            return moduleTpl + 'directives/ad.' + tmp + '.html';
        },
        controller: 'tsAdCtrl'
    }
}])
;