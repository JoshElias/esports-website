angular.module('redbull.directives')
.directive('footerRedbull', ['$localStorage', function ($localStorage) {
    return {
        restrict: 'E',
        templateUrl: ((tpl !== './') ? tpl + 'views/redbull/client/views/' : 'dist/views/redbull/client/views/') + 'directives/footer-redbull.html',
        link: function (scope, el, attrs) {
            
            if ($localStorage.redbullFooter === undefined) {
                $localStorage.redbullFooter = false;                
            }
            
            scope.small = $localStorage.redbullFooter;
            
            scope.toggleSmall = function () {
                scope.small = !scope.small;
                $localStorage.redbullFooter = scope.small;
            }
            
        }
    };
}]);