var async = require("async");
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

        var noDeckValidationErr = new Error("No draft found for id", draftId);
        noDeckValidationErr.statusCode = 422;
        noDeckValidationErr.code = 'DRAFT_VALIDATION_ERROR';

        // See if the curfew was breached
        if (currentTime > deckSubmitCurfew) {
            var randomDecks = createRandomDecks(numOfDecks);
            return saveDecks(draft, randomDecks, finalCb);
        }

        // Validate the client deck's cards'
        noDeckValidationErr.cardErrors = validateCards(draftJSON, clientDecks);

        // Validate Decks Structure
        noDeckValidationErr.deckErrors = validateDecks(clientDecks);

        if (noDeckValidationErr.cardErrors || noDeckValidationErr.deckErrors) {
            return finalCb(noDeckValidationErr);
        }

        return saveDecks(draft, clientDecks, finalCb);
    };

    function saveDecks(draft, decks, finalCb) {
        return async.eachSeries(decks, function (deck, deckCb) {
            deck.isOfficial = draft.isOfficial;
            return RedbullDeck.create(deck, function (err, newDeck) {
                if (err) return deckCb(err);
                return async.eachSeries(deck.deckCards, function (deckCard, deckCardCb) {
                    return newDeck.deckCard.create(deckCard, deckCardCb);
                }, deckCb);
            });
        }, finalCb);
    }


    function createRandomDecks(numOfDecks, draft) {

        var randomDecks = [];

        function getNewDeck(className, deckCards) {
            return {
                redbullDraftId: draft.id,
                authorId: draft.authorId,
                className: className,
                deckCards: deckCards
            }
        };

        var randomClasses = getRandomClasses(numOfDecks);
        var deckIndex = numOfDecks;
        var className;
        var deckCards;
        while (deckIndex--) {
            className = randomClasses[deckIndex];
            deckCards = getRandomDeckCardsForClass(30, className, draft.cards);
            randomDecks.push(getNewDeck(className, deckCards));
        }
    }


    function getRandomClasses(numOfClasses, remainingClasses, randomClasses) {
        remainingClasses = remainingClasses || HS_CLASSES;
        randomClasses = randomClasses || [];
        var randomIndex = utils.getRandomInt(0, remainingClasses.length - 1);
        randomClasses.push(remainingClasses.splice(randomIndex, 1));
        if (randomClasses.length === numOfClasses) {
            return randomClasses;
        }
        getRandomClasses(numOfClasses, remainingClasses, randomClasses);
    }

    function getRandomDeckCardsForClass(numOfCards, className, cards) {

        // Get all the cards available in this draft
        var availableDeckCards = {};
        var currentCard;
        var cardId;
        var i = cards.length;
        while (i--) {
            currentCard = cards[i];
            cardId = currentCard.id.toString();
            if (!availableDeckCards[cardId]) {
                availableDeckCards[cardId] = {
                    cardQuantity: 1,
                    cardId: cardId
                };
            } else {
                availableDeckCards[cardId].cardQuantity++;
            }
        }


        // Pick random 30 cards
        var deckCards = [];
        var cardCount = 0;
        var card;
        var numOfCardsToAdd;
        for (var cardId in availableCards) {
            card = availableCards[cardId];
            if (card.className === className || "Neutral") {
                numCardsToAdd = Math.min(numCards - cardCount, card.cardQuantity);
                deckCards.push({
                    cardId: cardId,
                    cardQuantity: numOfCardsToGrab
                });
                cardCount += numCardsToAdd;
                if (cardCount === 30) {
                    return deckCards;
                }
            }
        }
    }


    function validateCards(draft, clientDecks) {

        // Get all the cards available in this draft
        var availableCards = {};
        var currentCard;
        var cardId;
        var i = draft.cards.length;
        while (i--) {
            currentCard = draft.cards[i];
            cardId = currentCard.id.toString();
            if (!availableCards[cardId]) {
                availableCards[cardId] = 1;
            } else {
                availableCards[cardId]++;
            }
        }

        // Get a count of all the client's used cards
        var clientCards = {};
        cardId;
        i = clientDecks.length;
        var deck;
        var j;
        var currentDeckCard;
        while (i--) {
            deck = clientDecks[i];
            var j = deck.deckCards.length;
            while (j--) {
                currentDeckCard = draft.deckCards[j];
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

    function validateDecks(clientDecks) {

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
                if (deckCard.card.playerClass !== playerClass && deckCard.card.playerClass !== "Neutral") {
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
};
