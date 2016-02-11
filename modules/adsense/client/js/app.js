angular.module('tsAdSense', [])
.config(function () {
    var moduleTpl = (tpl !== './') ? tpl + 'views/redbull/client/views/' : 'dist/views/redbull/client/views/';
    
})
.controller('tsAdCtrl', ['$scope', '$state', '$timeout', '$window', function ($scope, $state, $timeout, $window) {
    var url = 'http://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js';
    var isAlreadyLoaded = !!document.getElementById("adCode");

    $scope.adClient = $scope.adClient || "ca-pub-6273013980199815";
    $scope.adSlot = $scope.adSlot || "1587568680";
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

    $timeout(function(){
        if(!$window.adsbygoogle) {
            $window.adsbygoogle = [];
        }

        $window.adsbygoogle.push({});
    });
}])
.directive('tsAdDouble', function () {
    return {
        restrict: 'E',
        replace: true,
        scope : {
            adClient : '@',
            adSlot : '@',
            inlineStyle : '@',
            region: '@',
            structure: '@'
        },
        templateUrl: 'views/adsense/client/views/directives/ad.double.html',
        controller: 'tsAdCtrl'
    }
})
;