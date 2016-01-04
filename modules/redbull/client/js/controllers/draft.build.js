angular.module('redbull.controllers')
.controller('DraftBuildCtrl', ['$scope', '$compile', '$filter', '$state', 'Hearthstone', 'DeckBuilder', 'bootbox', 'AlertService', 'Pagination', 'DraftCards', 
    function ($scope, $compile, $filter, $state, Hearthstone, DeckBuilder, bootbox, AlertService, Pagination, DraftCards) {
        var allCards = DraftCards.getCards();
        if (!allCards.length) {
            return $state.go('app.redbull.draft.packs');
        }
        
        $scope.tournament = {
            allowDuplicateClasses: false,
            decksLimit: 3
        };
        
        $scope.klasses = angular.copy(Hearthstone.classes);
        $scope.klasses.splice(0, 1);

        $scope.currentDeck = null;
        $scope.cards = {
            sorted: {},
            current: [],
        };
        $scope.decks = [];
        $scope.decksLimit = 3;

        $scope.search = '';
        $scope.manaCosts = [0,1,2,3,4,5,6,7];
        $scope.cardMechanics = Hearthstone.mechanics;
        $scope.filters = {
            search: '',
            mana: false,
            mechanics: [],
            class: $scope.klasses[0],
        };
        
        function sortCards () {
            for (var i = 0; i < Hearthstone.classes.length; i++) {
                $scope.cards.sorted[Hearthstone.classes[i]] = [];
            }
            
            for (var i = 0; i < allCards.length; i++) {
                $scope.cards.sorted[allCards[i].card.playerClass].push(allCards[i]);
            }
            $scope.cards.current = $scope.cards.sorted[$scope.klasses[0]];
        }
        sortCards();
        
        // pagination
        $scope.perpage = 15;
        $scope.pagination = Pagination.new($scope.perpage, $scope.cards.current.length);
        
        function updatePagination () {
            $scope.pagination.page = 1;
            $scope.pagination.total = filteredCards($scope.cards.current).length;
        }
        
        function filteredCards (cards) {
            var filtered = cards;
                
            // filter search
            var s = $scope.filters.search;
            filtered = $filter('filter')(filtered, {
                $: s
            });
            
            // filter mana
            filtered = $filter('filter')(filtered, function (value, index, arr) {
                if ($scope.filters.mana !== false) {
                    if ($scope.filters.mana < 7) {
                        return (value.card.cost === $scope.filters.mana);
                    } else {
                        return (value.card.cost >= 7);
                    }
                }
                return true;
            });
            
            // filter mechanics
            if ($scope.filters.mechanics.length) {
                filtered = $filter('filter')(filtered, function (value, index, arr) {
                    for (var i = 0; i < $scope.filters.mechanics.length; i++) {
                        if (value.card.mechanics.indexOf($scope.filters.mechanics[i]) === -1) {
                            return false;
                        }
                    }
                    return true;
                });
            }
            
            return filtered;
        }
        
        $scope.getCardsCurrent = function () {
            var cards = filteredCards($scope.cards.current) || [];
            var start = (($scope.pagination.getPage() * $scope.perpage) - $scope.perpage);
            // return page of results
            return cards.slice(start, start + $scope.perpage);
        }

        $scope.addCardToDeck = function (card) {
            var deck = $scope.currentDeck;
            var cardQty = card.qty;
            var cardUsed = $scope.qtyUsed(card);
            
            console.log('deck: ', deck);
            console.log('cardQty: ', cardQty);
            console.log('cardUsed: ', cardUsed);
            
            if (!deck || cardUsed === cardQty) { return false; }
            
            if ($scope.currentDeck.isAddable(card.card)) {
                $scope.currentDeck.addCard(card.card);
            }
        };

        $scope.removeCardFromDeck = function (card) {
            if (!$scope.currentDeck) { return false; }
            $scope.currentDeck.removeCard(card);
        };
        
        $scope.qtyUsed = function (card) {
            var count = 0;
            for (var i = 0; i < $scope.decks.length; i++) {
                count += $scope.decks[i].cardQuantityById(card.card.id);
            }
            return count;
        };
        
        $scope.manaCount = function (cost) {
            if (!$scope.currentDeck) { return 0; }
            return $scope.currentDeck.manaCount(cost);
        }

        $scope.manaCurve = function (cost) {
            if (!$scope.currentDeck) { return 0; }
            return $scope.currentDeck.manaCurve(cost);
        }

        // set search
        $scope.setSearch = function () {
            $scope.filters.search = $scope.search;
            updatePagination();
        };

        // toggle mana filtering
        $scope.toggleFilterByMana = function (cost) {
            $scope.filters.mana = ($scope.filters.mana === cost) ? false : cost;
            updatePagination();
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
            updatePagination();
        };

        $scope.hasFilterClass = function (klass) {
            return ($scope.filters.class === klass);
        };

        $scope.setFilterClass = function (klass) {
            if ($scope.filters.class === klass) { return false; }
            $scope.filters.class = klass;
            $scope.cards.current = $scope.cards.sorted[klass];
            updatePagination();
        };

        $scope.decksHaveClass = function (klass) {
            for (var i = 0; i < $scope.decks.length; i++) {
                if ($scope.decks[i].playerClass === klass) {
                    return true;
                }
            }
            return false;
        };
        
        $scope.isCurrentDeck = function (deck) {
            return ($scope.currentDeck === deck);
        };

        $scope.toggleCurrentDeck = function (deck) {
            if ($scope.currentDeck === deck) {
                $scope.currentDeck = null;
            } else {
                $scope.currentDeck = deck;
                
                // make sure cards reflect selected deck
                if ($scope.filters.class !== deck.playerClass && $scope.filters.class !== 'Neutral') {
                    $scope.setFilterClass(deck.playerClass);
                }
            }
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
                                        // make sure cards reflect selected deck
                                        if ($scope.filters.class !== $scope.currentDeck.playerClass && $scope.filters.class !== 'Neutral') {
                                            $scope.setFilterClass($scope.currentDeck.playerClass);
                                        }
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
            if ($scope.decks.length >= $scope.decksLimit) {
                var box = bootbox.dialog({
                    title: 'Add Deck',
                    message: $compile('<div>You can only create <strong>{{decksLimit}}</strong> decks. To create another deck, you must first delete an existing one.</div>')($scope),
                    buttons: {
                        okay: {
                            label: 'Okay',
                            className: 'btn-primary',
                            callback: function () {
                                box.modal('hide');
                            }
                        }
                    }
                });
                box.modal('show');
                return false;
            }
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
                            if (!$scope.newDeck.playerClass) { return false; }
                            var error = false;
                            if (!error) {
                                if (!$scope.newDeck.name.length) { $scope.newDeck.name = $scope.newDeck.playerClass + ' Deck'; }
                                var newDeck = DeckBuilder.new($scope.newDeck.playerClass, $scope.newDeck);
                                console.log('newDeck: ', newDeck);
                                $scope.decks.push(newDeck);
                                $scope.currentDeck = newDeck;
                                if ($scope.filters.class !== $scope.newDeck.playerClass && $scope.filters.class !== 'Neutral') {
                                    $scope.setFilterClass($scope.newDeck.playerClass);
                                }
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

    }
]);
