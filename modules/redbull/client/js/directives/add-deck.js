angular.module('redbull.directives')
.directive('addDeck', [function () {
    return {
        restrict: 'E',
        replace: true,
        transclude: true,
        templateUrl: ((tpl !== './') ? tpl + 'views/redbull/client/views/' : 'dist/views/redbull/client/views/') + 'directives/add-deck.html',
        controller: ['$scope', function ($scope) {
            
            
            
        }]
    };
}]);