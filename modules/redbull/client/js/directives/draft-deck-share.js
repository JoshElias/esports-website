angular.module('redbull.directives')
.directive('draftDeckShare', [function () {
    return {
        restrict: 'E',
        replace: true,
        transclude: true,
        templateUrl: ((tpl !== './') ? tpl + 'views/redbull/client/views/' : 'dist/views/redbull/client/views/') + 'directives/draft-deck-share.html',
    };
}]);