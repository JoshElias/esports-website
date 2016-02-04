angular.module('redbull.controllers')
.controller('DraftBuildCtrl', ['$scope', '$compile', '$filter', '$state', '$localStorage', 'Hearthstone', 'DeckBuilder', 'bootbox', 'AlertService', 'Pagination', 'RedbullDraft', 'draftSettings', 'draftCards', 'draftDecks', 'draftBuildStart', 
    function ($scope, $compile, $filter, $state, $localStorage, Hearthstone, DeckBuilder, bootbox, AlertService, Pagination, RedbullDraft, draftSettings, draftCards, draftDecks, draftBuildStart) {
        var draft = draftBuildStart.draft;
        
        $scope.draftId = draft.id;
        $scope.decksSaving = false;
        
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
        
        // tournament settings
        $scope.tournament = {
            allowDuplicateClasses: draftSettings.allowDuplicateClasses,
            decksLimit: draftSettings.numOfDecks,
            deckBuildStartTime: draft.deckBuildStartTime,
            deckBuildTimeLimit: draftSettings.deckBuildTimeLimit,
            hasDecksConstructed: draft.hasDecksConstructed,
            isOfficial: draft.isOfficial || false
        };
        
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
        
        // decks
        $scope.decks = [];
        // clean deck for isOfficial decks
        function cleanLoadedDeck (deck) {
            var newDeck = angular.copy(deck);

            newDeck.cards = newDeck.deckCards;
            delete newDeck.deckCards;
            
            return newDeck;
        }
        
        function cleanLoadedDecks (decks) {
            var newDecks = [];
            for (var i = 0; i < decks.length; i++) {
                var deck = cleanLoadedDeck(decks[i]);
                newDecks.push(deck);
            }
            return newDecks;
        }
        
        function initDecks () {
            var decks = ($scope.tournament.isOfficial) ? cleanLoadedDecks(draftDecks) : $localStorage.draftDecks;
            if (decks && decks.length) {
                for (var i = 0; i < decks.length; i++) {
                    $scope.decks.push(DeckBuilder.new(decks[i].playerClass, decks[i]));
                }
            }
        }
        initDecks();
        
        if (!$scope.tournament.isOfficial) {
            // save decks to local storage for now
            $scope.$watch(function () { return $scope.decks; }, function (newValue) {
                $localStorage.draftDecks = newValue;
            }, true);
        }
        
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
            return (!$scope.tournament.hasDecksConstructed && !$scope.decksSaving);
        };
        
        $scope.addCardToDeck = function (card) {
            if (!$scope.canEdit()) { return false; }
            var deck = $scope.currentDeck;
            var cardQty = card.qty;
            var cardUsed = $scope.qtyUsed(card);
            
            if (!deck || cardUsed === cardQty) { return false; }
            
            if ($scope.currentDeck.isAddable(card.card)) {
                $scope.currentDeck.addCard(card.card);
            }
        };

        $scope.removeCardFromDeck = function (card) {
            if (!$scope.currentDeck || !$scope.canEdit()) { return false; }
            $scope.currentDeck.removeCardFromDeck(card.card);
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
            if (!$scope.canEdit()) { return false; }
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
            if (!$scope.canEdit()) { return false; }
            if ($scope.decks.length >= 9) {
                var box = bootbox.dialog({
                    title: 'Add Deck',
                    message: $compile('<div>You can only create one deck for each class while building. To create another deck, you must first delete an existing one.</div>')($scope),
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
        
        $scope.decksComplete = function () {
            var decks = $scope.decks;
            if (!decks || !decks.length || decks.length !== $scope.tournament.decksLimit) { return false; }
            for (var i = 0; i < decks.length; i++) {
                if (decks[i].getSize() !== 30) {
                    return false;
                }
            }
            return true;
        };
        
        $scope.timesUp = function () {
            $scope.saveDecks(true);
        };
                
        function cleanDeck (deck) {
            deck.deckCards = deck.cards;

            delete deck.author;
            delete deck.basic;
            delete deck.cards;
            delete deck.chapters;
            delete deck.comments;
            delete deck.deckType;
            delete deck.description;
            delete deck.dust;
            delete deck.gameModeType;
            delete deck.heroName;
            delete deck.isFeatured;
            delete deck.isPublic;
            delete deck.matchups;
            delete deck.mulligans;
            delete deck.premium;
            delete deck.slug;
            delete deck.voteScore;
            delete deck.votes;
            delete deck.youtubeId;
            
            _.each(deck.deckCards, function (card) {
                delete card.deckId;
                delete card.card.cardType;
                delete card.card.cost;
                delete card.card.expansion;
                delete card.card.mechanics;
                delete card.card.name;
                delete card.card.photoNames;
                delete card.card.race;
                delete card.card.rarity;
                delete card.card.text;
            });
        }
        
        $scope.saveDecksCheck = function () {
            if (!$scope.decksComplete()) {
                // error modal
                var decks = draftSettings.numOfDecks;
                var box = bootbox.dialog({
                    title: 'Error Saving Decks',
                    message: '<strong>Error:</strong> You must have <strong>' + decks + ' decks all with <strong>30 cards</strong> to save.',
                    buttons: {
                        cancel: {
                            label: 'OK',
                            className: 'btn-blue',
                            callback: function () {
                                box.modal('hide');
                            }
                        }
                    }
                });
                box.modal('show');
            } else {
                $scope.saveConfirm();
            }
        };
        
        $scope.saveConfirm = function () {
            if (!$scope.canEdit()) { return false; }
            var box = bootbox.dialog({
                title: 'Save Decks',
                message: 'Once you save your decks, you will not be able to make any changes. Are you sure you want to save?',
                buttons: {
                    continue: {
                        label: 'Save Decks',
                        className: 'btn-blue',
                        callback: function () {
                            box.modal('hide');
                            $scope.saveDecks();
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
        
        $scope.saveDecks = function (timesUp) {
            if (!$scope.canEdit()) { return false; }
            timesUp = timesUp || false;
            
            // save decks
            $scope.decksSaving = true;

            var cleanDecks = angular.copy($scope.decks);
            _.each(cleanDecks, function (deck) {
                cleanDeck(deck);
            });

            RedbullDraft.submitDecks({ draftId: draft.id, decks: cleanDecks, options: { hasTimedOut: timesUp } }).$promise
            .then(function (data) {
                if (!$scope.tournament.isOfficial) {
                    delete $localStorage.draftDecks;
                    delete $localStorage.draftId;
                }
                
                if (timesUp) {
                    bootbox.hideAll();
                    var box = bootbox.dialog({
                        title: 'Times Up!',
                        message: 'You ran out of time and we have submitted your decks as is. Our system will now complete your decks for you. What does this mean?<br><br><strong>If you had fewer than '+ $scope.tournament.decksLimit +' decks or fewer than 30 cards in a deck?</strong><br>We will add some decks / cards for you. Random remaining classes will be selected, and we will fill your decks with random cards from the remaining card pool.<br><br><strong>If you had more than '+ $scope.tournament.decksLimit +' decks or 30 cards in a deck?</strong><br>We will randomly remove decks / cards until you have the appropriate amount.<br>',
                        buttons: {
                            continue: {
                                label: 'View Decks',
                                className: 'btn-blue',
                                callback: function () {
                                    box.modal('hide');
                                    if (!$scope.tournament.isOfficial) {
                                        return $state.go('^.decks', { draftId: draft.id });
                                    } else {
                                        $state.reload();
                                    }
                                }
                            }
                        },
                        closeButton: false
                    });
                    box.modal('show');
                } else {
                    if ($scope.tournament.isOfficial) {
                        $state.reload();
                    } else {
                        return $state.go('^.decks', { draftId: draft.id });
                    }
                }
            }).catch(function (data) {
                console.error(data);
            });
        };

    }
]);
