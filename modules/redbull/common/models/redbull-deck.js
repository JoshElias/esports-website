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
                normalizeDecks(draft, draftJSON, clientDecks, clientOptions, currentTime),
                saveDecks(draft),
                refreshDraftState(draft, currentTime)
            ],
            finalCb
        );
    };



    // DECK VALIDATION

    function validateDecks(draftJSON, clientDecks, clientOptions, currentTime) {
        return function (finalCb) {

            var validationReport = {
                deckErrors: {},
                hasInvalidCards: false,
                unauthorized: false,
                passed: true
            };

            // Did they break the curfew
            if (currentTime > draftJSON.deckSubmitCurfew) {
                // Give them all random decks
                var availableDeckComponents = getAvailableDeckComponents(draftJSON);
                clientDecks = createRandomDecks(draftJSON.settings.numOfDecks, draftJSON, availableDeckComponents);
            }

            return async.series([
                validateOfficial(draftJSON, validationReport),
                validateCardAmounts(draftJSON, clientDecks, validationReport),
                validateDeckStructure(clientDecks, validationReport)
            ], function (err) {
                if (err && err !== true) return finalCb(err);

                // If the validation did not pass and the client isn't forcing a save
                if (!validationReport.passed && (!clientOptions || !clientOptions.hasTimedOut)) {
                    var invalidDeckErr = new Error("Invalid structure was submitted as draft deck");
                    invalidDeckErr.statusCode = 422;
                    invalidDeckErr.code = 'DRAFT_DECK_VALIDATION_ERROR';
                    invalidDeckErr.report = validationReport;
                    return finalCb(invalidDeckErr);
                }

                return finalCb(undefined, validationReport);
            });
        }
    }


    function validateOfficial(draftJSON, validationReport) {
        return function (finalCb) {

            // Do we even need to worry about official?
            if (!draftJSON.isOfficial) {
                return finalCb();
            }

            function reportValidationErr() {
                validationReport.unathorized = true;
                validationReport.passed = false;
                return finalCb()
            }

            // Get loopback context for request obj
            var loopbackContext = loopback.getCurrentContext();
            if (!loopbackContext || !loopbackContext.active) {
                return finalCb();
            }
            var req = loopbackContext.active.http.req;

            // Do we have a user Id
            if (!req.accessToken || !req.accessToken.userId) {
                return finalCb()
            }
            var userId = req.accessToken.userId.toString();

            // Do the userID and authorId match
            if (userId.toString() !== draftJSON.authorId.toString()) {
                return reportValidationErr();
            }

            // Do they have the right role
            return User.isInRoles(userId, ["$redbullPlayer", "$redbullAdmin"], function (err, isInRoles) {
                if (err) return finalCb(err);
                else if (!isInRoles.none) return finalCb();
                else return reportValidationErr();
            });
        }
    }

    function validateCardAmounts(draftJSON, clientDecks, validationReport) {
        return function (finalCb) {
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

            } catch (err) {
                return finalCb(err);
            }
        }
    }

    function validateDeckStructure(clientDecks, validationReport) {
        return function (finalCb) {
            try {

                // Iterate over decks
                var deckIndex = clientDecks.length;
                var currDeck;
                var playerClass;

                var deckCardIndex;
                var currDeckCard;
                var cardCount;

                while (deckIndex--) {
                    currDeck = clientDecks[deckIndex];
                    cardCount = 0;
                    playerClass = currDeck.playerClass;

                    // Iterate over decKCards
                    deckCardIndex = currDeck.deckCards.length;
                    while (deckCardIndex--) {
                        currDeckCard = currDeck.deckCards[deckCardIndex];
                        if (currDeckCard.card.playerClass !== playerClass && currDeckCard.card.playerClass !== "Neutral") {

                            // Update report with error
                            if (!validationReport.deckErrors[currDeck.name]) {
                                validationReport.deckErrors[currDeck.name] = {};
                            }
                            if (!validationReport.deckErrors[currDeck.name].invalidCards) {
                                validationReport.deckErrors[currDeck.name].invalidCards = [];
                            }

                            validationReport.deckErrors[clientDecks.name].invalidCards.push(currDeckCard.cardId);
                            validationReport.passed = false
                        }
                        cardCount += currDeckCard.cardQuantity;
                    }

                    // Check for 30 cards
                    if (cardCount !== 30) {

                        // Update report with error
                        if (!validationReport[currDeck.name]) {
                            validationReport[currDeck.name] = {};
                        }
                        validationReport[currDeck.name].invalidQuantity = cardCount;
                        validationReport.passed = false
                    }
                }

                return finalCb();

            } catch (err) {
                return finalCb(err);
            }
        }
    }


    // DECK NORMALIZING


    function normalizeDecks(draft, draftJSON, clientDecks, clientOptions, currentTime) {
        return function (validationReport, finalCb) {

            // Check if the submission had invalid cards
            if (validationReport.hasInvalidCards) {
                var availableDeckComponents = getAvailableDeckComponents(draftJSON);
                var randomDecks = createRandomDecks(draftJSON.settings.numOfDecks, draftJSON, availableDeckComponents);
                return finalCb(undefined, randomDecks);
            }


            // If we have invalid cards, remove them from the decks
            clientDecks = removeInvalidCards(clientDecks, validationReport);
            clientDecks = removeExtraCards(clientDecks);
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

        while (deckIndex--) {
            currDeck = clientDecks[deckIndex];

            // Does this deck have any invalid cards
            deckErrors = validationReport.deckErrors[currDeck.name];
            if (deckErrors && Array.isArray(deckErrors.invalidCards) && deckErrors.invalidCards.length > 0) {

                // Iterate over deck's invalid cards
                invalidCardIndex = deckErrors.invalidCards.length;
                while (invalidCardIndex--) {
                    currInvalidCardId = deckErrors.invalidCards[invalidCardIndex];

                    // Remove this card from the client deck

                    // Iterate through the current deck's deckCards to remove it
                    deckCardIndex = currDeck.deckCards.length;
                    while (deckCardIndex--) {
                        currDeckCard = currDeck.deckCards[deckCardIndex];

                        // We found the card
                        if (currInvalidCardId === currDeckCard.cardId) {

                            // Subtract this card from our available card
                            clientDecks[deckIndex].deckCards[deckCardIndex].cardQuantity--;
                            currDeckCard.cardQuantity--;

                            // If this deckCard has a zero quantity, remove it
                            if (clientDecks[deckIndex].deckCards[deckCardIndex].cardQuantity < 1) {
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


    function removeExtraCards(clientDecks) {

        // Iterate over total number of decks
        var deckIndex = clientDecks.length;
        var currDeck;
        var cardCount;

        var deckCardIndex;
        var currDeckCard;
        var overflowAmount;
        while (deckIndex--) {
            currDeck = clientDecks[deckIndex];
            cardCount = 0;

            // Iterate over the deckCards for this deck
            deckCardIndex = currDeck.deckCards.length;
            while (deckCardIndex--) {
                currDeckCard = currDeck.deckCards[deckCardIndex];

                // This deck is already full of cards. Anything else is extra
                if (cardCount >= 30) {
                    currDeck.deckCards.splice(deckCardIndex, 1);
                    continue;
                }

                // Check if this card is pushing the card amount over limit
                overflowAmount = cardCount + currDeckCard.cardQuantity - 30;
                if (overflowAmount > 0) {

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
            currentCard = draftJSON.cards[cardIndex];
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

        // If there is not client deck then we're done
        if(!Array.isArray(clientDecks) || clientDecks.length < 1) {
            return availableDeckComponents;
        }

        // Subtract the cards used in the client decks
        var deckIndex = clientDecks.length;
        var currDeck;

        var deckCardIndex;
        var currDeckCard;
        var playerClassIndex;
        while (deckIndex--) {
            currDeck = clientDecks[deckIndex];

            // Remove deck's playerClass from the available classes
            playerClassIndex = availableDeckComponents.classes.indexOf(currDeck.playerClass);
            if (playerClassIndex != -1) {
                availableDeckComponents.classes.splice(playerClassIndex, 1);
            }

            // Iterate over the deckCards
            deckCardIndex = currDeck.deckCards.length;
            while (deckCardIndex--) {
                currDeckCard = currDeck.deckCards[deckCardIndex];

                cardId = currDeckCard.cardId;
                // Should not need to check if the cardId exists
                availableDeckComponents.deckCards[cardId].cardQuantity -= currDeckCard.cardQuantity;
                if (availableDeckComponents.deckCards[cardId].cardQuantity < 1) {
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
        while (deckIndex--) {

            // Did the client provide this deck
            if(typeof clientDecks[deckIndex] !== "object") {
                clientDecks[deckIndex] = createRandomDecks(1, draftJSON, availableDeckComponents);
                continue;
            }

            // Make sure it's complete with 30 cards
            clientDecks[deckIndex] = completeDeck(clientDecks[deckIndex], availableDeckComponents);
        }

        return clientDecks;
    }

    function completeDeck(clientDeck, availableDeckComponents) {

        // Get the count of cards in this deck
        var cardCount = 0;
        var deckCardIndex = clientDeck.deckCards.length;
        var currDeckCard;
        while(deckCardIndex--) {
            currDeckCard = clientDeck.deckCards[deckCardIndex];
            cardCount += currDeckCard.cardQuantity;
        }

        // Decks should NEVER be over 30 by this point
        if(cardCount < 30) {
            var cardDifference = 30 - cardCount;

            var randomDeckCards = createRandomDeckCardsForClass(cardDifference, clientDeck.playerClass, availableDeckComponents);
            deckCardIndex = randomDeckCards.length;
            while(deckCardIndex--) {
                currDeckCard = randomDeckCards[deckCardIndex];
                clientDeck.deckCards.push(currDeckCard);
            }
        }

        return clientDeck;
    }


    function createRandomDecks(numOfDecks, draftJSON, availableDeckComponents) {
        var randomDecks = [];
        function addRandomDeck(playerClass, deckCards) {
            var randomDeck = {
                name: "random deck "+randomDecks.length,
                redbullDraftId: draftJSON.id,
                playerClass: playerClass,
                deckCards: deckCards
            }

            if(typeof draftJSON.authorId === "string") {
                randomDeck.authorId = draftJSON.authorId;
            }
            randomDecks.push(randomDeck);
        }

        // Get the random classes we will try to generate
        var randomClasses = getRandomClasses(numOfDecks, availableDeckComponents.classes);

        var deckIndex = numOfDecks;
        var playerClass;
        var deckCards;
        while (deckIndex--) {
            playerClass = randomClasses[deckIndex];
            deckCards = createRandomDeckCardsForClass(30, playerClass, availableDeckComponents);
            addRandomDeck(playerClass, deckCards);
        }
        return randomDecks;
    }

    function getRandomClasses(numOfClasses, remainingClasses, randomClasses) {
        // Create or use these
        remainingClasses = remainingClasses || HS_CLASSES;
        randomClasses = randomClasses || [];
        if(remainingClasses.length < 1) {
            return randomClasses;
        }

        // Get another random class from the remaining classes
        var randomIndex = utils.getRandomInt(0, remainingClasses.length - 1);
        randomClasses.push(remainingClasses.splice(randomIndex, 1)[0]); // Splice return array so we grab only element
        if (randomClasses.length === numOfClasses) {
            return randomClasses;
        }
        return getRandomClasses(numOfClasses, remainingClasses, randomClasses);
    }

    function createRandomDeckCardsForClass(numOfCards, playerClass, availableDeckComponents) {

        var deckCards = [];
        var cardCount = 0;
        var deckCard;
        var numCardsOfToAdd;
        for (var cardId in availableDeckComponents.deckCards) {
            deckCard = availableDeckComponents.deckCards[cardId];
            if (deckCard.playerClass === playerClass || deckCard.playerClass === "Neutral") {
                numCardsOfToAdd = Math.min(numOfCards - cardCount, deckCard.cardQuantity);

                // push new deckCard
                deckCards.push({
                    cardId: cardId,
                    cardQuantity: numCardsOfToAdd,
                    playerClass: deckCard.playerClass,
                    card: {
                        playerClass: deckCard.playerClass
                    }
                });
                cardCount += numCardsOfToAdd;

                // subtract from available cards
                availableDeckComponents.deckCards[cardId].cardQuantity -= numCardsOfToAdd;
                if (availableDeckComponents.deckCards[cardId].cardQuantity < 1) {
                    delete availableDeckComponents.deckCards[cardId];
                }

                // If we have enough cards exit
                if (cardCount >= numOfCards) {
                    return deckCards;
                }
            }
        }
    }


    // SAVING

    function saveDecks(draft) {
        return function (decks, finalCb) {

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
        return function (createdDecks, finalCb) {

            return draft.updateAttributes({
                deckBuildStopTime: currentTime,
                hasDecksConstructed: true

            }, function (err) {
                if (err) return finalCb(err);

                // return only the created decks Ids
                var createdDeckIds = _.map(createdDecks, function (createdDeck) {
                    return createdDeck.id;
                });
                return finalCb(undefined, createdDeckIds);
            });
        }
    }
}