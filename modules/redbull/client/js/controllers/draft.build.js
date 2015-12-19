angular.module('redbull.controllers')
.controller('DraftBuildCtrl', ['$scope', '$compile', 'Hearthstone', 'bootbox', 'AlertService', 'cards', function ($scope, $compile, Hearthstone, bootbox, AlertService, cards) {
    
    $scope.klasses = angular.copy(Hearthstone.classes);
    $scope.klasses.splice(0, 1);
    
    $scope.currentDeck = null;
    $scope.decks = [];
    
    $scope.search = '';
    $scope.manaCosts = [0,1,2,3,4,5,6,7];
    $scope.cardMechanics = Hearthstone.mechanics;
    $scope.filters = {
        search: '',
        mana: false,
        mechanics: [],
        class: $scope.klasses[0],
    };
    
    $scope.manaCount = function (cost) {
        if (!$scope.currentDeck) { return 0; }
        // TODO: ADD MANA CHECK FOR CURRENT DECK
    }
    
    $scope.manaCurve = function (cost) {
        if (!$scope.currentDeck) { return 0; }
        // TODO: ADD MANA CHECK FOR CURRENT DECK
    }
    
    // set search
    $scope.setSearch = function () {
        $scope.filters.search = $scope.search;
    };
    
    // toggle mana filtering
    $scope.toggleFilterByMana = function (cost) {
        $scope.filters.mana = ($scope.filters.mana === cost) ? false : cost;
    };
    
    // has mechanics filtering
    $scope.hasFilterMechanic = function (mechanic) {
        var index = $scope.filters.mechanics.indexOf(mechanic);
        return (index !== -1);
    };
    
    // toggle mechanics filtering
    $scope.toggleFilterByMechanic = function (mechanic) {
        var index = $scope.filters.mechanics.indexOf(mechanic);
        if (index !== -1) {
            $scope.filters.mechanics.splice(index, 1);
        } else {
            $scope.filters.mechanics.push(mechanic);
        }
    };
    
    $scope.isCurrentDeck = function (deck) {
        return ($scope.currentDeck === deck);
    };
    
    $scope.setCurrentDeck = function (deck) {
        $scope.currentDeck = deck;
    };
    
    function getClosestDeck (deck) {
        var index = $scope.decks.indexOf(deck);
        var direction = (index > 0) ? -1 : 1;
        return $scope.decks[index + direction];
    };
    
    $scope.deleteDeck = function ($event, deck) {
        // stop prop
        $event.stopPropagation();
        
        var box = bootbox.dialog({
            title: 'Delete Deck',
            message: 'Are you sure you want to delete the '+ deck.playerClass +' deck <strong>' + deck.name + '</strong>?',
            buttons: {
                delete: {
                    label: 'Delete',
                    className: 'btn-danger',
                    callback: function () {
                        // make sure deck exists (for double clicking)
                        var index = $scope.decks.indexOf(deck);
                        if (index !== -1) {
                            
                            // set new current deck if needed
                            if ($scope.decks.length > 1) {
                                if ($scope.currentDeck === deck) {
                                    $scope.currentDeck = getClosestDeck(deck);
                                }
                            } else {
                                $scope.currentDeck = null;
                            }

                            // remove deck
                            $scope.decks.splice(index, 1);
                            
                        }
                    }
                },
                cancel: {
                    label: 'Cancel',
                    className: 'btn-default pull-left',
                    callback: function () {
                        box.modal('hide');
                    }
                }
            }
        });
        box.modal('show');
    };
    
    // add deck modal
    $scope.addDeckWnd = function () {
        $scope.newDeck = {
            name: '',
            playerClass: '',
            gameModeType: 'draft'
        };
        var box = bootbox.dialog({
            title: 'Add Deck',
            message: $compile('<add-deck></add-deck>')($scope),
            buttons: {
                save: {
                    label: 'Add Deck',
                    className: 'btn-blue',
                    callback: function () {
                        var error = false;
                        if (!error) {
                            $scope.decks.push($scope.newDeck);
                            $scope.currentDeck = $scope.newDeck;
                        } else {
                            AlertService.setError({ show: true, msg: error });
                            return false;
                        }
                    }
                },
                cancel: {
                    label: 'Cancel',
                    className: 'btn-default pull-left',
                    callback: function () {
                        $scope.newDeck = null;
                        box.modal('hide');
                    }
                }
            }
        });
        box.modal('show');
    };
    
}]);
