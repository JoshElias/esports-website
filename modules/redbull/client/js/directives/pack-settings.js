angular.module('redbull.directives')
.directive('packSettings', [function () {
    return {
        restrict: 'E',
        replace: true,
        scope: {
            tournament: '='
        },
        templateUrl: ((tpl !== './') ? tpl + 'views/redbull/client/views/' : 'dist/views/redbull/client/views/') + 'directives/pack-settings.html',
        controller: ['$scope', function ($scope) {
            
            $scope.$watch(function () { return $scope.tournament; }, function (newValue) {
                $scope.tournament = newValue;
            }, true);
            
            
            $scope.hasRarity = function (expansion, rarity) {
                switch (expansion.expansion) {
                    case 'Soulbound':
                        return (rarity === 'basic');
                    case 'Blackrock Mountain':
                        return (rarity !== 'epic' && rarity !== 'basic');
                    default:
                        return (rarity !== 'basic');
                }
            };
            
        }]
    };
}]);