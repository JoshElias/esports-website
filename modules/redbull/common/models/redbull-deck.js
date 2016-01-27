var async = require("async");
var loopback = require("loopback");
var _ = require("underscore");
var utils = require("./../../../../lib/utils");

var HS_CLASSES = ["Mage", "Paladin", "Rogue", "Druid", "Shaman",
  "Warlock", "Hunter", "Priest", "Warrior"];


module.exports = function(RedbullDeck) {

    RedbullDeck.saveDraftDecks = function (draft, clientDecks, finalCb) {

        var currentTime = Date.now();
        var draftJSON = draft.toJSON();
        var draftSettings = draftJSON.settings;
        var numOfDecks = draftSettings.numOfDecks;
        var deckSubmitCurfew = draftJSON.deckSubmitCurfew;


        // If this draft is official and the user has already
        if (draftJSON.hasDecksConstructed && draftJSON.isOfficial) {
            var alreadySubmittedErr = new Error("Decks have already been submitted for this draft");
            alreadySubmittedErr.statusCode = 400;
            alreadySubmittedErr.code = "ALREADY_SUBMITTED_DECKS";
            return finalCb(err);
        }

        // See if the curfew was breached
        /*
        console.log("currentTIme", currentTime);
        console.log("deckSubmitCurfew", deckSubmitCurfew);

         if (currentTime > deckSubmitCurfew) {
         var randomDecks = createRandomDecks(numOfDecks, draftJSON);
         return saveDecks(draft, randomDecks, finalCb);
         }
         */

        validateDecks(draftJSON, clientDecks);

        return saveDecks(draft, clientDecks, function (err, createdDecks) {

            // Refresh draft state
            currentTime = Date.now();
            draft.updateAttributes({
                deckBuildStopTime: currentTime,
                hasDecksContructed: true
            }, function (err) {
                if (err) return finalCb(err);

                // return only the created decks Ids
                var createdDeckIds = _.map(createdDecks, function (createdDeck) {
                    return createdDeck.id;
                });
                return finalCb(undefined, createdDeckIds);
            });
        });
    };

    function saveDecks(draft, decks, finalCb) {
        var savedDecks = [];
        return async.eachSeries(decks, function (deck, deckCb) {
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


    // DECK VALIDATION

    function validateDecks(draftJSON, clientDecks) {

        var noDeckValidationErr = new Error("No draft found for id", draftJSON.id);
        noDeckValidationErr.statusCode = 422;
        noDeckValidationErr.code = 'DRAFT_VALIDATION_ERROR';

        // Validate the client deck's cards'
        noDeckValidationErr.cardErrors = validateCardAmounts(draftJSON, clientDecks);

        // Validate Decks Structure
        noDeckValidationErr.deckErrors = validateDeckStructure(clientDecks);

        if (noDeckValidationErr.cardErrors || noDeckValidationErr.deckErrors) {
            return noDeckValidationErr;
        }

        return true;
    }

    function validateCardAmounts(draftJSON, clientDecks) {


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

        var cardErrors;
        var cardDifference;
        var clientCardQuantity;
        var availableCardQuantity;
        for (var cardId in clientCards) {
            clientCardQuantity = clientCards[cardId];
            availableCardQuantity = availableCards[cardId];
            cardDifference = availableCardQuantity - clientCardQuantity;
            if (cardDifference < 0) {
                if (!cardErrors) cardErrors = [];
                cardErrors.push("Too many instances found of card", cardId);
            }
        }

        return cardErrors;
    }

    function validateDeckStructure(clientDecks) {

        var deckErrors;

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
                if (deckCard.playerClass !== playerClass && deckCard.playerClass !== "Neutral") {
                    if (!deckErrors) deckErrors = [];
                    deckErrors.push("card " + deckCard.cardId + " is of invalid player class");
                }
                cardCount += deckCard.cardQuantity;
            }

            // Check for 30 cards
            if (cardCount !== 30) {
                if (!deckErrors) deckErrors = [];
                deckErrors.push("deck " + deck.id + " doesn't have 30 cards");
            }
        }

        return deckErrors;
    }


// DECK GENERATION

    function createRandomDecks(numOfDecks, draftJSON) {

        var randomDecks = [];

        function createDeckData(playerClass, deckCards) {
            return {
                redbullDraftId: draftJSON.id,
                authorId: draftJSON.authorId,
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
}