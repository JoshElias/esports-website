angular.module('redbull.controllers')
.controller('DraftBuildCtrl', ['$scope', 'Hearthstone', 'cards', function ($scope, Hearthstone, cards) {
    
    $scope.currentDeck = null;
    $scope.manaCosts = [0,1,2,3,4,5,6,7];
    $scope.cardMechanics = Hearthstone.mechanics;
    
    
    $scope.manaCount = function (cost) {
        if (!$scope.currentDeck) { return 0; }
        // TODO: ADD MANA CHECK FOR CURRENT DECK
    }
    
    $scope.manaCurve = function (cost) {
        if (!$scope.currentDeck) { return 0; }
        // TODO: ADD MANA CHECK FOR CURRENT DECK
    }
    
}]);
