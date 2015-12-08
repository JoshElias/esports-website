angular.module('redbull.controllers')
.controller('DraftPacksCardCtrl', ['$scope', '$timeout', function ($scope, $timeout){
    var vm = this;
    var playAudio = $scope.$parent.playAudio;
    
    // watch for card change to reset clicked / turned
    $scope.$watch(function () { return $scope.$parent.cards(); }, function () {
        $scope.init();
    });
    
    // init clicked / turned
    $scope.init = function () {
        vm.turned = false;
        vm.clicked = false;
    };
    $scope.init();
    
    // card mouse enter
    $scope.cardMouseEnter = function ($event, card) {
        if (!vm.turned) {
            playAudio('card_hover');
        }
    };

    // card mouse leave
    $scope.cardMouseLeave = function ($event, card) {
        if (!vm.turned) {
            playAudio('card_unhover');
        }
    };

    // card mouse down
    $scope.cardMouseDown = function ($event, card) {
        vm.turned = true;
        if (vm.turned && !vm.clicked) {
            vm.clicked = true;

            var cardElement = $event.currentTarget,
                cardRarity = card.rarity.toLowerCase(),
                announcerRarities = ['rare', 'epic', 'legendary'];

            // flip card and inc counter
            $scope.$parent.cardFlip($event, cardElement);
            
            // add to pool
            if (typeof $scope.$parent.addCardToPool === 'function') {
                $scope.$parent.addCardToPool(card);
            }

            playAudio('card_turn_over_' + cardRarity);

            if (announcerRarities.indexOf(cardRarity) !== -1) {
                playAudio('announcer_' + cardRarity);
            }

            if ($scope.$parent.cardsFlipped > 4) {
                $scope.$parent.showDoneButton();
            } else {
                $scope.$parent.fastForwardNext();
            }
        }
    };
}]);