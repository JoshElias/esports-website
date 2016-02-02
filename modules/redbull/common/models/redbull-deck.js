var async = require("async");
var loopback = require("loopback");
var _ = require("underscore");
var utils = require("./../../../../lib/utils");

var HS_CLASSES = ["Mage", "Paladin", "Rogue", "Druid", "Shaman",
    "Warlock", "Hunter", "Priest", "Warrior"];


module.exports = function(RedbullDeck) {


    RedbullDeck.saveDraftDecks = function (draft, clientDecks, clientOptions, finalCb) {

        // Gather variables needed to save decks
        var currentTime = Date.now();
        var draftJSON = draft.toJSON();

        // If this draft is official and the user has already
        if (draftJSON.hasDecksConstructed && draftJSON.isOfficial) {
            var alreadySubmittedErr = new Error("Decks have already been submitted for this draft");
            alreadySubmittedErr.statusCode = 400;
            alreadySubmittedErr.code = "ALREADY_SUBMITTED_DECKS";
            return finalCb(err);
        }

        return async.waterfall(
            [
<<<<<<< aff3c83aca9d75f93826db296ad3622bba4e5a6f
                function(seriesCb) {
                    validateDecks(draftJSON, clientDecks, seriesCb);
                },
                function(seriesCb) {
                    saveDecks(draft, clientDecks, seriesCb);
                },
                // Refresh draft state
                function(createdDecks, seriesCb) {

                    // Refresh draft state
                    currentTime = Date.now();
                    return draft.updateAttributes({
                        deckBuildStopTime: currentTime,
                        hasDecksConstructed: true
                    }, function (err) {
                        if (err) return finalCb(err);

                        // return only the created decks Ids
                        var createdDeckIds = _.map(createdDecks, function (createdDeck) {
                            return createdDeck.id;
                        });
                        return seriesCb(undefined, createdDeckIds);
                    });
                }
=======
                validateDecks(draftJSON, clientDecks, clientDecks, currentTime),
<<<<<<< 5a90c95f2036675bae8adee8331f9039ab68d796
<<<<<<< b90108d38973777eb25ace89c7cbd1c01d1099af
<<<<<<< c86708f5cbc724cf73a68bedabbac2cec924f3fa
                //normalizeDecks(draft, draftJSON, clientDecks, clientOptions, currentTime),
=======
                //fillDecks(draft, draftJSON, clientDecks, clientOptions, currentTime),
>>>>>>> changes to deck
=======
                //normalizeDecks(draft, draftJSON, clientDecks, clientOptions, currentTime),
>>>>>>> merged for end of day
=======
                normalizeDecks(draft, draftJSON, clientDecks, clientOptions, currentTime),
>>>>>>> almost done deck validation
                saveDecks(draft, clientDecks),
                refreshDraftState(draft, currentTime)
>>>>>>> working on deck fill
            ],
            finalCb
        );
    };

<<<<<<< aff3c83aca9d75f93826db296ad3622bba4e5a6f
    function saveDecks(draft, decks, finalCb) {
        var savedDecks = [];
        return async.eachSeries(decks, function (deck, deckCb) {
            deck.redbullDraftId = draft.id;
            deck.isOfficial = draft.isOfficial;
            return RedbullDeck.create(deck, function (err, newDeck) {
                if (err) return deckCb(err);
                savedDecks.push(newDeck);
                return async.eachSeries(deck.deckCards, function (deckCard, deckCardCb) {
                    return newDeck.deckCards.create(deckCard, deckCardCb);
                }, deckCb);
            });
        }, function (err) {
            return finalCb(err, savedDecks);
        });
    }

=======
>>>>>>> working on deck fill
<<<<<<< c86708f5cbc724cf73a68bedabbac2cec924f3fa



    // DECK VALIDATION

    function validateDecks(draftJSON, clientDecks, clientOptions, currentTime) {
        return function(finalCb) {

            var validationErr = new Error("Redbull Decks submitted were invalid");
            validationErr.statusCode = 422;
            validationErr.code = "INVALID_REDBULL_DECKS";
<<<<<<< b90108d38973777eb25ace89c7cbd1c01d1099af
=======



    // DECK VALIDATION

    function validateDecks(draftJSON, clientDecks, clientOptions, currentTime) {
        return function(finalCb) {
>>>>>>> changes to deck
=======
>>>>>>> merged for end of day

            // Did they break the curfew
            if (currentTime > draftJSON.deckSubmitCurfew) {
                // If so they they all random decks
                var randomDecks = createRandomDecks(draftJSON.settings.numOfDecks, draftJSON);
                return finalCb(undefined, randomDecks);
            }

<<<<<<< b90108d38973777eb25ace89c7cbd1c01d1099af
<<<<<<< c86708f5cbc724cf73a68bedabbac2cec924f3fa
=======
            var invalidDeckErr = new Error("Invalid structure was submitted as draft deck");
            invalidDeckErr.statusCode = 422;
            invalidDeckErr.code = 'DRAFT_DECK_VALIDATION_ERROR';

>>>>>>> changes to deck
=======
>>>>>>> merged for end of day
            var validationReport = {
                deckErrors: {},
                hasInvalidCards: false,
                unauthorized: false,
                passed: true
            };

            return async.series([
                validateOfficial(draftJSON, validationReport),
                validateCardAmounts(draftJSON, clientDecks, clientOptions, validationReport),
                validateDeckStructure(clientDecks, validationReport)
            ], function (err) {
<<<<<<< b90108d38973777eb25ace89c7cbd1c01d1099af
<<<<<<< c86708f5cbc724cf73a68bedabbac2cec924f3fa
=======
>>>>>>> merged for end of day
                if(err && err !== true) return finalCb(err);

                if(!clientOptions || !clientOptions.hasTimedOut) {
                    validationErr.report = validationReport;
                    return finalCb(validationErr);
                }

                return finalCb(undefined, validationReport);
<<<<<<< b90108d38973777eb25ace89c7cbd1c01d1099af
=======
                if(err === true) return finalCb(undefined, validationReport)
                return finalCb(err, validationReport);
>>>>>>> changes to deck
=======
>>>>>>> merged for end of day
            });
        }
    }



    function validateOfficial(draftJSON, validationReport) {
        return function(finalCb) {
            // Do we even need to worry about official?
            if(!draftJSON.isOfficial) {
                return finalCb();
            }

            function reportValidationErr() {
                validationReport.unathorized = true;
                validationReport.passed = false;
                return finalCb()
            }

            // Get loopback context for request obj
            var loopbackContext = loopback.getCurrentContext();
            if(!loopbackContext || !loopbackContext.active) {
                return finalCb();
            }
            var req = loopbackContext.active.http.req;

            // Do we have a user Id
            if (!req.accessToken || !req.accessToken.userId) {
                return finalCb()
            }
            var userId = req.accessToken.userId.toString();

            // Do the userID and authorId match
            if(userId.toString() !== draftJSON.authorId.toString()) {
                return reportValidationErr();
            }

            // Do they have the right role
            return User.isInRoles(userId, ["$redbullPlayer", "$redbullAdmin"], function (err, isInRoles) {
                if (err) return finalCb(err);
                else if(!isInRoles.none) return finalCb();
                else return reportValidationErr();
            });
        }
    }

    function validateCardAmounts(draftJSON, clientDecks, clientOptions, validationReport) {
        return function(finalCb) {
            try {

                // Get all the cards available in this draft
                var availableCards = {};
                var currentCard;
                var cardId;
                var i = draftJSON.cards.length;
                while (i--) {
                    currentCard = draftJSON.cards[i];
                    cardId = currentCard.id.toString();
                    if (!availableCards[cardId]) {
                        availableCards[cardId] = 1;
                    } else {
                        availableCards[cardId]++;
                    }
                }

                // Get a count of all the client's used cards
                var clientCards = {};
                i = clientDecks.length;
                var deck;
                var j;
                var currentDeckCard;
                while (i--) {
                    deck = clientDecks[i];
                    var j = deck.deckCards.length;
                    while (j--) {
                        currentDeckCard = deck.deckCards[j];
                        cardId = currentDeckCard.cardId.toString();
                        if (!clientCards[cardId]) {
                            clientCards[cardId] = currentDeckCard.cardQuantity;
                        } else {
                            clientCards[cardId] += currentDeckCard.cardQuantity;
                        }
                    }
                }

                // Look for excess cards in client data
                var cardDifference;
                var clientCardQuantity;
                var availableCardQuantity;
                for (var cardId in clientCards) {
                    clientCardQuantity = clientCards[cardId];
                    availableCardQuantity = availableCards[cardId];
                    cardDifference = availableCardQuantity - clientCardQuantity;
                    if (cardDifference < 0) {

                        // Update validation state with invalid cards found
                        validationReport.hasInvalidCards = true;
                        validationReport.passed = false;

                        // If this failed then there's no point in validating further
                        return finalCb(true)
                    }
                }

                // Return successfully
                return finalCb();

            } catch(err) {
                return finalCb(err);
            }
        }
    }

    function validateDeckStructure(clientDecks, validationReport) {
        return function(finalCb) {
            try {

                // Iterate over decks
                var i = clientDecks.length;
                var deck;
                var playerClass;
                var j;
                var deckCard;
                var cardCount;
                while (i--) {
                    deck = clientDecks[i];
                    cardCount = 0;
                    playerClass = deck.playerClass;

                    // Iterate over decKCards
                    j = deck.deckCards.length;
                    while (j--) {
                        deckCard = deck.deckCards[j];
                        if (deckCard.card.playerClass !== playerClass && deckCard.card.playerClass !== "Neutral") {

                            // Update report with error
                            if(!validationReport.deckErrors[clientDecks.name]) {
                                validationReport.deckErrors[clientDecks.name] = {};
                            }
                            if(!validationReport.deckErrors[clientDecks.name].invalidCards) {
                                validationReport.deckErrors[clientDecks.name].invalidCards = [];
                            }

                            validationReport.deckErrors[clientDecks.name].invalidCards.push(deckCard.cardId);
                            validationReport.passed = false
                        }
                        cardCount += deckCard.cardQuantity;
                    }

                    // Check for 30 cards
                    if (cardCount !== 30) {
                        // Update report with error
                        if(!validationReport[clientDecks.name]) {
                            validationReport[clientDecks.name] = {};
                        }
                        validationReport[clientDecks.name].invalidQuantity = cardCount;
                        validationReport.passed = false
                    }
                }

                return finalCb();

            } catch(err) {
                return finalCb(err);
            }
        }
    }





    // DECK NORMALIZING

<<<<<<< b90108d38973777eb25ace89c7cbd1c01d1099af
<<<<<<< c86708f5cbc724cf73a68bedabbac2cec924f3fa
    function normalizeDecks(draft, draftJSON, clientDecks, clientOptions, currentTime) {
=======
    function fillDecks(draft, draftJSON, clientDecks, clientOptions, currentTime) {
>>>>>>> changes to deck
=======
    function normalizeDecks(draft, draftJSON, clientDecks, clientOptions, currentTime) {
>>>>>>> merged for end of day
        return function(validationReport, finalCb) {

            var validationReport = {
                passed: true,
                hasInvalidCards: false,
                unauthorized: false,
                deckErrors: []
            };

<<<<<<< b90108d38973777eb25ace89c7cbd1c01d1099af
<<<<<<< c86708f5cbc724cf73a68bedabbac2cec924f3fa
=======
>>>>>>> merged for end of day
            // Check if the submission had invalid cards
            if(validationReport.hasInvalidCards) {
                var randomDecks = createRandomDecks(draftJSON.settings.numOfDecks, draftJSON);
                return finalCb(undefined, randomDecks);
            }
<<<<<<< b90108d38973777eb25ace89c7cbd1c01d1099af

            // If we have invalid cards, remove them from the decks
=======
>>>>>>> changes to deck
=======
>>>>>>> merged for end of day

            // If we have invalid cards, remove them from the decks
            clientDecks = removeInvalidCards(clientDecks, validationReport);
            clientDecks = removeExtraCards(clientDecks, validationReport);
            var availableDeckComponents = getAvailableDeckComponents(draftJSON, clientDecks);

            // Fill incomplete decks with the remaining cards
            clientDecks = completeDecks(clientDecks, availableDeckComponents, draftJSON);

            // If none of those other things then the decks should pass validation
            return finalCb(undefined, clientDecks);
        }
    }



    function removeInvalidCards(clientDecks, validationReport) {

        // Iterate over all the clients decks
        var deckIndex = clientDecks.length;
        var currDeck;
        var deckErrors;
        var invalidCardIndex;
        var currInvalidCardId;

        var deckCardIndex;
        var currDeckCard;

        while(deckIndex--) {
            currDeck = clientDecks[deckIndex];

            // Does this deck have any invalid cards
            deckErrors = validationReport.deckErrors[currDeck.name];
            if(deckErrors && Array.isArray(deckErrors.invalidCards) && deckErrors.invalidCards.length > 0) {

                // Iterate over deck's invalid cards
                invalidCardIndex = deckErrors.invalidCards.length;
                while(invalidCardIndex--) {
                    currInvalidCardId = deckErrors.invalidCards[invalidCardIndex];

                    // Remove this card from the client deck

                    // Iterate through the current deck's deckCards to remove it
                    deckCardIndex = currDeck.deckCards.length;
                    while(deckCardIndex--) {
                        currDeckCard = currDeck.deckCards[deckCardIndex];

                        // We found the card
                        if(currInvalidCardId === currDeckCard.cardId) {

                            // Subtract this card from our available card
                            clientDecks[deckIndex].deckCards[deckCardIndex].cardQuantity--; currDeckCard.cardQuantity--;

                            // If this deckCard has a zero quantity, remove it
                            if(clientDecks[deckIndex].deckCards[deckCardIndex].cardQuantity < 1) {
                                clientDecks[deckIndex].deckCards.splice(deckCardIndex, 1);
                            }
                            break;
                        }
                    }
                }
            }
        }

        return clientDecks;
    }


    function removeExtraCards(availableDeckCards, clientDecks) {

        // Iterate over total number of decks
        var deckIndex = clientDecks.length;
        var currDeck;
        var cardCount;

        var deckCardIndex;
        var currDeckCard;
        var overflowAmount;
        while(deckIndex--) {
            currDeck = clientDecks[deckIndex];
            cardCount = 0;

            // Iterate over the deckCards for this deck
            deckCardIndex = currDeck.deckCards.length;
            while(deckCardIndex--) {
                currDeckCard = currDeck.deckCards[deckCardIndex];

                // This deck is already full of cards. Anything else is extra
                if(cardCount >= 30) {
                    currDeck.deckCards.splice(deckCardIndex, 1);
                    continue;
                }

                // Check if this card is pushing the card amount over limit
                overflowAmount = cardCount + currDeckCard.cardQuantity - 30;
                if(overflowAmount > 0) {

                    // Since the deck is not full yet, it must still need one card
                    clientDecks[deckIndex].deckCards[deckCardIndex].cardQuantity = 1;
                    cardCount++;
                }

                // Add to the card count
                cardCount += clientDecks[deckIndex].deckCards[deckCardIndex].cardQuantity;
            }
        }

        return clientDecks;
    }


    function getAvailableDeckComponents(draftJSON, clientDecks) {

        var availableDeckComponents = {
            deckCards: {},
            classes: HS_CLASSES
        };

        // Get all of the deck cards available in this draft and index by cardId
        var cardIndex = draftJSON.cards.length;
        var currentCard;
        var cardId;
        while (cardIndex--) {
            currentCard = draftJSON.cards[i];
            cardId = currentCard.id.toString();
            if (!availableDeckComponents.deckCards[cardId]) {
                availableDeckComponents.deckCards[cardId] = {
                    playerClass: currentCard.playerClass,
                    cardQuantity: 1,
                    cardId: cardId
                };
            } else {
                availableDeckComponents.deckCards[cardId].cardQuantity++;
            }
        }

        // Subtract the cards used in the client decks
        var deckIndex = clientDecks.length;
        var currDeck;

        var deckCardIndex;
        var currDeckCard;
        var playerClassIndex;
        while(deckIndex--) {
            currDeck = clientDecks[deckIndex];

            // Remove deck's playerClass from the available classes
            playerClassIndex = availableDeckComponents.classes.index(currDeck.playerClass);
            if(playerClassIndex != -1) {
                availableDeckComponents.classes.splice(playerClassIndex, i);
            }

            // Iterate over the deckCards
            deckCardIndex = currDeck.deckCards.length;
            while(deckCardIndex--) {
                currDeckCard = currDeck.deckCards[deckCardIndex];

                cardId = currDeckCard.cardId;
                // Should not need to check if the cardId exists
                availableDeckComponents.deckCards[cardId].cardQuantity -= currDeckCard.cardQuantity;
                if(availableDeckComponents.deckCards[cardId].cardQuantity < 1) {
                    delete availableDeckComponents.deckCards[cardId];
                }
            }
        }

        return availableDeckComponents;
    }


    function completeDecks(clientDecks, availableDeckComponents, draftJSON) {
        var draftSettings = draftJSON.settings;

        // Iterate over amount of decks for this draft
        var deckIndex = draftSettings.numOfDecks;
        var clientDeck;
        while(deckIndex--) {

            // Grab the client's deck
            clientDeck = clientDecks[deckIndex];

            // Did the client provide this deck

                // Is it complete with 30 cards

        }

    }


    function createRandomDecks(numOfDecks, draftJSON, availableDeckComponents) {

        var randomDecks = [];

        function createDeckData(playerClass, deckCards) {
            return {
                redbullDraftId: draftJSON.id,
                playerClass: playerClass,
                deckCards: deckCards
            }
        };

        // Get all the cards available for this draft
        var availableDeckCards = {};
        var currentCard;
        var cardId;
        var i = draftJSON.cards.length;
        while (i--) {
            currentCard = draftJSON.cards[i];
            cardId = currentCard.id.toString();
            if (!availableDeckCards[cardId]) {
                availableDeckCards[cardId] = {
                    playerClass: currentCard.playerClass,
                    cardQuantity: 1,
                    cardId: cardId
                };
            } else {
                availableDeckCards[cardId].cardQuantity++;
            }
        }


        // Get the random classes we will try to generate
        var randomClasses = getRandomClasses(numOfDecks);

        var deckIndex = numOfDecks;
        var playerClass;
        var deckCards;
        while (deckIndex--) {
            playerClass = randomClasses[deckIndex];
            deckCards = createRandomDeckCardsForClass(30, playerClass, availableDeckCards);
            randomDecks.push(createDeckData(playerClass, deckCards));
        }
        return randomDecks;
    }


    function getRandomClasses(numOfClasses, remainingClasses, randomClasses) {
        remainingClasses = remainingClasses || HS_CLASSES;
        randomClasses = randomClasses || [];
        var randomIndex = utils.getRandomInt(0, remainingClasses.length - 1);
        randomClasses.push(remainingClasses.splice(randomIndex, 1)[0]);
        if (randomClasses.length === numOfClasses) {
            return randomClasses;
        }
        return getRandomClasses(numOfClasses, remainingClasses, randomClasses);
    }

    function createRandomDeckCardsForClass(numOfCards, playerClass, availableDeckCards) {

        // Pick random 30 cards
        var deckCards = [];
        var cardCount = 0;
        var deckCard;
        var numCardsOfToAdd;
        for (var cardId in availableDeckCards) {
            deckCard = availableDeckCards[cardId];
            if (deckCard.playerClass === playerClass || deckCard.playerClass === "Neutral") {
                numCardsOfToAdd = Math.min(numOfCards - cardCount, deckCard.cardQuantity);

                // push new deckCard
                deckCards.push({
                    cardId: cardId,
                    cardQuantity: numCardsOfToAdd,
                    playerClass: deckCard.playerClass
                });
                cardCount += numCardsOfToAdd;

                // subtract from available card
                availableDeckCards[cardId].cardQuantity -= numCardsOfToAdd;
                if (availableDeckCards[cardId].cardQuantity < 1) {
                    delete availableDeckCards[cardId];
                }

                // If we have enough cards exit
                if (cardCount === 30) {
                    return deckCards;
                }
            }
        }
    }

<<<<<<< 5a90c95f2036675bae8adee8331f9039ab68d796
<<<<<<< b90108d38973777eb25ace89c7cbd1c01d1099af
<<<<<<< c86708f5cbc724cf73a68bedabbac2cec924f3fa
    function normalizeDecks(draftJSON, clientDecks, clientOptions) {
=======
    function completePartialDecks(draftJSON, clientDecks, clientOptions) {
>>>>>>> changes to deck
=======
    function normalizeDecks(draftJSON, clientDecks, clientOptions) {
>>>>>>> merged for end of day

        // Keep Track of total card pool
        var availableDeckCards = {};
        var currentCard;
        var cardId;
        var i = draftJSON.cards.length;
        while (i--) {
            currentCard = draftJSON.cards[i];
            cardId = currentCard.id.toString();
            if (!availableDeckCards[cardId]) {
                availableDeckCards[cardId] = {
                    playerClass: currentCard.playerClass,
                    cardQuantity: 1,
                    cardId: cardId
                };
            } else {
                availableDeckCards[cardId].cardQuantity++;
            }
        }

        subtractUsedCards(availableDeckCards, clientDecks);


        // Iterate over total number of decks
        var deckIndex = draftJSON.settings.numOfDecks;
        var currentDeck;
        var excessCards;
        while(deckIndex--) {

            // Check if the client has made a deck for this index
            currentDeck = clientDecks[deckIndex];
            if(typeof currentDeck === "object") {
                excessCards = normalizeDeck(currentDeck, availableDeckCards);
                if(Array.isArray(excessCards) && excessCards.length > 0) {

                }
            }


        }

        // Trim off excess cards and return result

    }

<<<<<<< b90108d38973777eb25ace89c7cbd1c01d1099af
<<<<<<< c86708f5cbc724cf73a68bedabbac2cec924f3fa
=======
>>>>>>> merged for end of day
    // Will either add more cards from our pool or return the excess ones it removed
    function normalizeDeck(currentDeck, availableDeckCards) {

    }

<<<<<<< b90108d38973777eb25ace89c7cbd1c01d1099af
=======
>>>>>>> changes to deck
=======
>>>>>>> merged for end of day
    function subtractUsedCards(availableDeckCards, clientDecks) {

        // Iterate over all the clients decks
        var deckIndex = clientDecks.length;
        var currDeck;
        var deckCardIndex;
        var currDeckCard;
        var cardId;
        while(deckIndex--) {
            currDeck = clientDecks[deckIndex];

            // Iterate over deck's deckCards
            deckCardIndex = currDeck.deckCards.length;
            while(deckCardIndex--) {
                currDeckCard = currDeck.deckCards[deckCardIndex];
                cardId = currDeckCard.cardId;


                if(availableDeckCards[cardId]) {

                    // Subtract this deck card from our available card
                    availableDeckCards[cardId].cardQuantity -= currDeckCard.cardQuantity;
                    // If this deckCard has a zero quantity, remove it
                    if(availableDeckCards[cardId].cardQuantity < 1) {
                        delete availableDeckCards[cardId];
                    }
                }
            }
        }
    }

<<<<<<< b90108d38973777eb25ace89c7cbd1c01d1099af
<<<<<<< c86708f5cbc724cf73a68bedabbac2cec924f3fa
    function subtractUsedCards(availableDeckCards, clientDecks) {


=======
    // Will either add more cards from our pool or return the excess ones it removed
    function normalizeDeck(currentDeck, availableDeckCards) {

    }
>>>>>>> changes to deck
=======
    function subtractUsedCards(availableDeckCards, clientDecks) {


>>>>>>> merged for end of day

=======
>>>>>>> almost done deck validation



    // SAVING

    function saveDecks(draft, decks) {
        return function(finalCb) {
            var savedDecks = [];
            return async.eachSeries(decks, function (deck, deckCb) {

                deck.isOfficial = draft.isOfficial;
                deck.redbullDraftId = draft.id;
                return RedbullDeck.create(deck, function (err, newDeck) {
                    if (err) return deckCb(err);

                    savedDecks.push(newDeck);
                    return async.eachSeries(deck.deckCards, function (deckCard, deckCardCb) {
                        return newDeck.deckCards.create(deckCard, deckCardCb);
                    }, deckCb);
                });
            }, function (err) {
                return finalCb(err, savedDecks);
            });
        }
    }

    function refreshDraftState(draft, currentTime) {
        return function (createdDecks, seriesCb) {

            return draft.updateAttributes({
                deckBuildStopTime: currentTime,
<<<<<<< b90108d38973777eb25ace89c7cbd1c01d1099af
<<<<<<< c86708f5cbc724cf73a68bedabbac2cec924f3fa
                hasDecksConstructed: true
=======
                hasDecksContructed: true
>>>>>>> changes to deck
=======
                hasDecksConstructed: true
>>>>>>> merged for end of day
            }, function (err) {
                if (err) return finalCb(err);

                // return only the created decks Ids
                var createdDeckIds = _.map(createdDecks, function (createdDeck) {
                    return createdDeck.id;
                });
                return seriesCb(undefined, createdDeckIds);
            });
        }
    }
}