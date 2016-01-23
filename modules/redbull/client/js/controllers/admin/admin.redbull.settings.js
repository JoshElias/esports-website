angular.module('redbull.controllers')
.controller('AdminRedbullSettingsCtrl', ['$scope', 'Hearthstone', function ($scope, Hearthstone){
    var expansions = ['Soulbound'].concat(Hearthstone.expansions);
    var rarities = Hearthstone.rarities;
    
    function Chances (rarity, percentage) {
        var rarity = rarity;
        var percentage = percentage;
        
        this.__defineGetter__("percentage", function () {
            return percentage;
        });

        this.__defineSetter__("percentage", function (val) {
            val = parseInt(val);
            percentage = val;
        });
        
        this.__defineGetter__("rarity", function () {
            return rarity;
        });

        this.__defineSetter__("rarity", function (val) {        
            rarity = val;
        });
    }
    
    $scope.settings = {
        expansions: []
    };
    
    for (var i = 0; i < expansions.length; i++) {
        var expansion = {
            packs: 1,
            isActive: false,
            name: expansions[i],
            chances: []
        };
        
        for (var j = 0; j < rarities.length; j++) {
            expansion.chances.push(new Chances(rarities[j], 0));
        }
        
        $scope.settings.expansions.push(expansion);
    }    
}]);