angular.module('redbull.directives')
.directive('footerRedbull', [function () {
    return {
        restrict: 'E',
        templateUrl: ((tpl !== './') ? tpl + 'views/redbull/client/views/' : 'dist/views/redbull/client/views/') + 'directives/footer-redbull.html',
        link: function (scope, el, attrs) {
            
            scope.small = false;
            
            scope.toggleSmall = function () {
                scope.small = !scope.small;
            }
            
        }
    };
}]);