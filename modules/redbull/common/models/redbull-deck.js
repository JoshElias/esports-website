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
                validateDecks(draftJSON, clientDecks, clientDecks, currentTime),
                //normalizeDecks(draft, draftJSON, clientDecks, clientOptions, currentTime),
                saveDecks(draft, clientDecks),
                refreshDraftState(draft, currentTime)
            ],
            finalCb
        );
    };




    // DECK VALIDATION

    function validateDecks(draftJSON, clientDecks, clientOptions, currentTime) {
        return function(finalCb) {

            var validationErr = new Error("Redbull Decks submitted were invalid");
            validationErr.statusCode = 422;
            validationErr.code = "INVALID_REDBULL_DECKS";

            // Did they break the curfew
            if (currentTime > draftJSON.deckSubmitCurfew) {
                // If so they they all random decks
                var randomDecks = createRandomDecks(draftJSON.settings.numOfDecks, draftJSON);
                return finalCb(undefined, randomDecks);
            }

            var validationReport = {
                deckErrors: [],
                hasInvalidCards: false,
                unauthorized: false,
                passed: true
            };

            return async.series([
                validateOfficial(draftJSON, validationReport),
                validateCardAmounts(draftJSON, clientDecks, clientOptions, validationReport),
                validateDeckStructure(clientDecks, validationReport)
            ], function (err) {
                if(err && err !== true) return finalCb(err);

                if(!clientOptions || !clientOptions.hasTimedOut) {
                    validationErr.report = validationReport;
                    return finalCb(validationErr);
                }

                return finalCb(undefined, validationReport);
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
                            if(!validationReport[clientDecks.name]) {
                                validationReport[clientDecks.name] = {};
                            }
                            if(!validationReport[clientDecks.name].invalidCards) {
                                validationReport[clientDecks.name].invalidCards = [];
                            }

                            validationReport[clientDecks.name].invalidCards.push(deckCard.cardId);
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
                        validationReport[clientDecks.name].invalidQuantity = cardCount - 30;
                        validationReport.passed = false
                    }
                }

                return finalCb();

            } catch(err) {
                return finalCb(err);
            }
        }
    }





    // DECK FILLING

    function normalizeDecks(draft, draftJSON, clientDecks, clientOptions, currentTime) {
        return function(validationReport, finalCb) {

            var validationReport = {
                passed: true,
                hasInvalidCards: false,
                unauthorized: false,
                deckErrors: []
            };

            // Check if the submission had invalid cards
            if(validationReport.hasInvalidCards) {
                var randomDecks = createRandomDecks(draftJSON.settings.numOfDecks, draftJSON);
                return finalCb(undefined, randomDecks);
            }

            // If we have invalid cards, remove them from the decks


            var randomDecks = createRandomDecks(draftJSON.settings.numOfDecks, draftJSON);
            return finalCb(undefined, randomDecks);

            var deckSubmitCurfew = draftJSON.settings.deckSubmitCurfew;
            var numOfDecks = draftJSON.settings.numOfDecks;

            validationReport



            // If none of those other things then the decks should pass validation
            return finalCb(undefined, clientDecks);
        }
    }

    function createRandomDecks(numOfDecks, draftJSON) {

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

    function normalizeDecks(draftJSON, clientDecks, clientOptions) {

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

    // Will either add more cards from our pool or return the excess ones it removed
    function normalizeDeck(currentDeck, availableDeckCards) {

    }

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

    function subtractUsedCards(availableDeckCards, clientDecks) {






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
    }
}