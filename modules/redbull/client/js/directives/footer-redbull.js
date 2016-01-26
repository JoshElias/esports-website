angular.module('redbull.directives')
.directive('footerRedbull', [function () {
    return {
        restrict: 'E',
        templateUrl: ((tpl !== './') ? tpl + 'views/redbull/client/views/' : 'dist/views/redbull/client/views/') + 'directives/footer-redbull.html',
        controller: ['$scope', function ($scope) {
            
            
            
        }]
    };
}]);