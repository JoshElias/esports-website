angular.module('tsAdSense', [])
.value('moduleTpl', (tpl !== './') ? tpl + 'views/adsense/client/views/' : 'dist/views/adsense/client/views/')
.controller('tsAdCtrl', ['$scope', '$state', '$window', function ($scope, $state, $window) {
    var url = 'http://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js';
    var isAlreadyLoaded = !!document.getElementById("adCode");
    
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
            
            return moduleTpl + 'directives/ad.' + tmp + '.html'
        },
        controller: 'tsAdCtrl'
    }
}])
;