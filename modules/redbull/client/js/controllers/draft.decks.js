angular.module('redbull.controllers')
.controller('DraftDecksCtrl', ['$scope', '$compile', '$filter', 'Hearthstone', 'DeckBuilder', 'bootbox', 'Pagination', 'draft', 'draftCards', 'draftDecks',
    function ($scope, $compile, $filter, Hearthstone, DeckBuilder, bootbox, Pagination, draft, draftCards, draftDecks) {
        $scope.draftId = draft.id;

        // tournament settings
        $scope.tournament = {
            allowDuplicateClasses: false,
            decksLimit: 0,
            deckBuildStartTime: 0,
            deckBuildTimeLimit: 0,
            hasDecksConstructed: true
        };
        
        
        // set cards
        var allCards = getCards(draftCards);

        function cardIndex (card, cards) {
            for (var i = 0; i < cards.length; i++) {
                if (cards[i].card.id === card.id) {
                    return i;
                }
            }
            return -1;
        }
    
        function getCards (cards) {
            var out = [];
            if (!cards.length) { return out; }
            for (var i = 0; i < cards.length; i++) {
                var index = cardIndex(cards[i], out);
                if (index !== -1) {
                    out[index].qty++;
                } else {
                    out.push({
                        qty: 1,
                        card: cards[i]
                    });
                }
            }
            return out;
        }
        
        // classes
        $scope.klasses = angular.copy(Hearthstone.classes);
        $scope.klasses.splice(0, 1);
        
        // rarities
        $scope.rarities = [
            { name: 'All', value: '' },
            { name: 'Soulbound', value: 'Basic' },
            { name: 'Common', value: 'Common' },
            { name: 'Rare', value: 'Rare' },
            { name: 'Epic', value: 'Epic' },
            { name: 'Legendary', value: 'Legendary' },
        ];
        
        $scope.mobileCardFilters = false;
        $scope.manaCurveFilter = false;
        $scope.currentDeck = null;
        $scope.cards = {
            sorted: {},
            current: [],
        };
        $scope.decks = [];
        
        $scope.search = '';
        $scope.manaCosts = [0,1,2,3,4,5,6,7];
        $scope.cardMechanics = Hearthstone.mechanics;
        $scope.filters = {
            search: '',
            mana: false,
            rarity: $scope.rarities[0],
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
        
        function initDecks () {
            var decks = draftDecks;
            if (decks && decks.length) {
                for (var i = 0; i < decks.length; i++) {
                    $scope.decks.push(DeckBuilder.new(decks[i].playerClass, decks[i]));
                }
            }
        }
        initDecks();
        
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
            
            // filter rarity
            if ($scope.filters.rarity.value.length) {
                filtered = $filter('filter')(filtered, function (value, index, arr) {
                    if (value.card.rarity === $scope.filters.rarity.value) {
                        return true;
                    }
                    return false;
                });
            }
            
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
        
        $scope.canEdit = function () {
            return false;
        };
        
        $scope.addCardToDeck = function (card) {
            return false;
        };

        $scope.removeCardFromDeck = function (card) {
            return false;
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
        
        $scope.setFilterRarity = function (rarity) {
            $scope.filters.rarity = rarity;
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
            return false;
        };

        // add deck modal
        $scope.addDeckWnd = function () {
            return false;
        };
        
        $scope.decksComplete = function () {
            return true;
        };
        
        $scope.timesUp = function () {
            return false;
        };
        
        // share modal
        $scope.shareDecks = function () {
            var box = bootbox.dialog({
                title: 'Share Your Decks',
                message: $compile('<draft-deck-share></draft-deck-share>')($scope),
                buttons: {
                    cancel: {
                        label: 'DONE',
                        className: 'btn-blue',
                        callback: function () {
                            box.modal('hide');
                        }
                    }
                }
            });
            box.modal('show');
        };
        
        $scope.saveDecks = function (timesUp) {
            return false;
        };

    }
]);
