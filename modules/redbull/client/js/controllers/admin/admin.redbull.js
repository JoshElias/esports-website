angular.module('redbull.controllers')
.controller('AdminRedbullCtrl', ['$scope', 'Hearthstone', function ($scope, Hearthstone){
    var expansions = ['Soulbound'].concat(Hearthstone.expansions);
    var rarities = Hearthstone.rarities;
    
    $scope.settings = {
        expansions: []
    };
    
    for (var i = 0; i < expansions.length; i++) {
        var expansion = {
            name: expansions[i],
            chances: []
        };
        
        for (var j = 0; j < rarities.length; j++) {
            expansion.chances.push({
                rarity: rarities[j],
                percentage: 0
            });
        }
        
        $scope.settings.expansions.push(expansion);
    }
    
    
    
}]);