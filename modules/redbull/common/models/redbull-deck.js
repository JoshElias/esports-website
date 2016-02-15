var async = require("async");
var loopback = require("loopback");
var _ = require("underscore");
var utils = require("./../../../../lib/utils");

var HS_CLASSES = ["Mage", "Paladin", "Rogue", "Druid", "Shaman",
    "Warlock", "Hunter", "Priest", "Warrior"];

var NUM_CARDS_PER_DECK = 30;
var NUM_OF_LEGENDARIES = 1;
var NUM_OF_CARDS_PER_DECK = 2;

var DECK_RESULT_LIMIT = 9;


module.exports = function(RedbullDeck) {


    // LIMIT FIND ALLS TO 9
    RedbullDeck.observe("access", limitDeckFind);


    function limitDeckFind(ctx, finalCb) {

        if(!ctx.query) {
            ctx.query = {};
        }

        ctx.query.limit = DECK_RESULT_LIMIT;
        finalCb();
    }



    // HIDING OFFICIAL

    RedbullDeck.afterRemote("**", function (ctx, redbullDeck, next) {
        return filterOfficialDecks(ctx, redbullDeck, next);
    });

    function filterOfficialDecks(ctx, deckInstance, finalCb) {
        var User = RedbullDeck.app.models.user;

        var req = ctx.req;

        // Do we have a user Id
        if (!req.accessToken || !req.accessToken.userId) {
            return applyFilter();
        }
        var userId = req.accessToken.userId.toString();

        return User.isInRoles(userId, ["$redbullAdmin", "$admin"], function (err, isInRoles) {
            if(err) return finalCb(err);
            if(isInRoles.none) return applyFilter();

            return finalCb();
        });

        function applyFilter() {

            if(!ctx.result) {
                return finalCb();
            }

            // Sets the context's result and finished the filter function
            function done(err, answer) {
                if(err) return finalCb(err);

                ctx.result = answer;
                return finalCb();
            }

            // handle arrays of results
            if (Array.isArray(deckInstance)) {
                var answer = [];
                async.eachSeries(ctx.result, function(result, resultCb) {

                    if(!result.isOfficial) {
                        answer.push(result);
                        return resultCb();
                    }

                    return User.isInRoles(userId,
                        ["$owner"],
                        {modelClass: "redbullDeck", modelId: result.id},
                        function (err, isInRoles) {
                            if(err) return resultCb(err);
                            if(!isInRoles.none) {
                                answer.push(result);
                            }
                            return resultCb();
                        }
                    );
                }, function(err) {
                    return done(err, answer);
                });

            // Handle single result
            } else {
                var answer = {};

                if(!ctx.result.isOfficial) {
                    answer = ctx.result;
                    return done(undefined, answer);
                }

                return User.isInRoles(userId,
                    ["$owner"],
                    {modelClass: "redbullDeck", modelId: ctx.result.id},
                    function (err, isInRoles) {
                        if(err) return finalCb(err);
                        if(isInRoles.none) {
                            var noDeckErr = new Error('unable to find deck');
                            noDeckErr.statusCode = 404;
                            noDeckErr.code = 'DECK_NOT_FOUND';
                            return done(noDeckErr)
                        }

                        answer = ctx.result;

                        return done(undefined, answer);
                    }
                );
            }
        }
    }



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
                validateDecks(draftJSON, clientDecks, clientOptions, currentTime),
                normalizeDecks(draftJSON),
                saveDecks(draftJSON),
                refreshDraftState(draft, currentTime),
                archiveDraft(draftJSON)
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
                tooManyDecks: 0,
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
                validateDeckStructure(draftJSON, clientDecks, validationReport)
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

                return finalCb(undefined, clientDecks, validationReport);
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
            if (!loopbackContext || typeof loopbackContext.active !== "object" || Object.keys(loopbackContext.active).length < 1) {
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
            var User = RedbullDeck.app.models.user;
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

    function validateDeckStructure(draftJSON,  clientDecks, validationReport) {
        return function (finalCb) {
            try {

                // Get all cards in this draft in an associative
                var draftCards = {};
                var cardIndex = draftJSON.cards.length;
                var currCard;
                while(cardIndex--) {
                    currCard = draftJSON.cards[cardIndex];
                    if(!draftCards[currCard.id]) {
                        draftCards[currCard.id] = currCard;
                    }
                }

                // Get number of decks submitted
                var numOfDecks = clientDecks.length;
                var overflowAmount = numOfDecks - draftJSON.settings.numOfDecks;
                if(overflowAmount > 0) {
                    validationReport.tooManyDecks = overflowAmount;
                    validationReport.passed = false;
                }

                // Iterate over decks
                var deckIndex = clientDecks.length;
                var currDeck;
                var playerClass;

                var deckCardIndex;
                var currDeckCard;
                var serverCard;
                var numOfExtraCards;
                var cardCount;

                while (deckIndex--) {
                    currDeck = clientDecks[deckIndex];
                    cardCount = 0;
                    playerClass = currDeck.playerClass;

                    // Iterate over decKCards
                    deckCardIndex = currDeck.deckCards.length;
                    while (deckCardIndex--) {
                        currDeckCard = currDeck.deckCards[deckCardIndex];
                        serverCard = draftCards[currDeckCard.cardId];

                        // Check for invalid player Class
                        if (serverCard.playerClass !== playerClass && serverCard.playerClass !== "Neutral") {
                            reportInvalidCard(currDeck.name, currDeckCard.cardId)
                        }

                        // Check for more than one legendary of the same type
                        if (serverCard.rarity === "Legendary" && currDeckCard.cardQuantity > NUM_OF_LEGENDARIES) {

                            // Get amount of invalid legendaries
                            numOfExtraCards = currDeckCard.cardQuantity - NUM_OF_LEGENDARIES;
                            while(numOfExtraCards--) {
                                reportInvalidCard(currDeck.name, currDeckCard.cardId);
                            }
                        }

                        // Check for more than 2 cards in a deck
                        if (currDeckCard.cardQuantity > NUM_OF_CARDS_PER_DECK) {

                            // Get amount of invalid cards
                            numOfExtraCards = currDeckCard.cardQuantity - NUM_OF_CARDS_PER_DECK;
                            while(numOfExtraCards--) {
                                reportInvalidCard(currDeck.name, currDeckCard.cardId);
                            }
                        }

                        // Increment the cardCount
                        cardCount += currDeckCard.cardQuantity;
                    }

                    // Check number of cards per deck
                    if (cardCount !== NUM_CARDS_PER_DECK) {

                        // Update report with error
                        if (!validationReport[currDeck.name]) {
                            validationReport[currDeck.name] = {};
                        }
                        validationReport[currDeck.name].invalidQuantity = cardCount;
                        validationReport.passed = false
                    }
                }

                function reportInvalidCard(deckName, cardId) {

                    if (!validationReport.deckErrors[deckName]) {
                        validationReport.deckErrors[deckName] = {};
                    }
                    if (!validationReport.deckErrors[deckName].invalidCards) {
                        validationReport.deckErrors[deckName].invalidCards = [];
                    }

                    validationReport.deckErrors[deckName].invalidCards.push(cardId);
                    validationReport.passed = false
                }


                return finalCb();

            } catch (err) {
                return finalCb(err);
            }
        }
    }



    // DECK NORMALIZING

    function normalizeDecks(draftJSON) {
        return function (clientDecks, validationReport, finalCb) {

            // Check if the submission had invalid cards
            if (validationReport.hasInvalidCards) {
                var availableDeckComponents = getAvailableDeckComponents(draftJSON);
                var randomDecks = createRandomDecks(draftJSON.settings.numOfDecks, draftJSON, availableDeckComponents);
                return finalCb(undefined, randomDecks);
            }

            // If we have invalid cards, remove them from the decks
            clientDecks = removeInvalidCards(clientDecks, validationReport);
            clientDecks = removeExtraDecks(clientDecks, validationReport);
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

    function removeExtraDecks(clientDecks, validationReport) {
        if(validationReport.tooManyDecks > 0) {
            clientDecks = removeRandomDecks(validationReport.tooManyDecks, clientDecks);
        }
        return clientDecks;
    }

    function removeRandomDecks(numOfDecksToRemove, clientDecks) {
        // Get a random deckCard Index
        var randomDeckIndex = utils.getRandomInt(0, clientDecks.length-1);
        clientDecks.splice(randomDeckIndex, 1);
        numOfDecksToRemove--;

        if(numOfDecksToRemove <= 0) {
            return clientDecks;
        }
        return removeRandomDecks(numOfDecksToRemove, clientDecks);
    }

    function removeExtraCards(clientDecks) {

        // Find the number of cards to trim by iterating over the deck
        var deckIndex = clientDecks.length;
        var currDeck;
        var cardCount;

        var deckCardIndex;
        var currDeckCard;
        while (deckIndex--) {
            currDeck = clientDecks[deckIndex];
            cardCount = 0;

            // Iterate over the deckCards for this deck
            deckCardIndex = currDeck.deckCards.length;
            while (deckCardIndex--) {
                currDeckCard = currDeck.deckCards[deckCardIndex];

                // Add to the card count
                cardCount += currDeckCard.cardQuantity;
            }

            // This deck is already full of cards. Anything else is extra randomly
            var overflowAmount = cardCount - NUM_CARDS_PER_DECK;
            if (overflowAmount > 0) {
                removeRandomCards(overflowAmount, clientDecks, deckIndex);
            }
        }

        return clientDecks;
    }

    function removeRandomCards(numOfCardsToRemove, clientDecks, deckIndex) {
        // Get a random deckCard Index
        var randomDeckCardIndex = utils.getRandomInt(0, clientDecks[deckIndex].deckCards.length-1);
        // Decrement it's card quanity by 1
        clientDecks[deckIndex].deckCards[randomDeckCardIndex].cardQuantity--;
        numOfCardsToRemove--;
        // If the quantity is 0 then remove the deckCard from the deck
        if(clientDecks[deckIndex].deckCards[randomDeckCardIndex].cardQuantity <= 0) {
            clientDecks[deckIndex].deckCards.splice(randomDeckCardIndex, 1);
        }

        if(numOfCardsToRemove <= 0) {
            return;
        }

        return removeRandomCards(numOfCardsToRemove, clientDecks, deckIndex);
    }

    function getAvailableDeckComponents(draftJSON, clientDecks) {

        var availableDeckComponents = {
            deckCards: {},
            classes: HS_CLASSES.slice()
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
                    rarity: currentCard.rarity,
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
                clientDecks[deckIndex] = createRandomDecks(1, draftJSON, availableDeckComponents)[0];
                continue;
            }

            // Make sure it's complete with appropriate cards
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

        // Decks should NEVER be over NUM_CARDS_PER_DECK by this point
        if(cardCount < NUM_CARDS_PER_DECK) {
            var cardDifference = NUM_CARDS_PER_DECK - cardCount;

            var randomDeckCards = createRandomDeckCardsForClass(cardDifference, clientDeck.playerClass, availableDeckComponents);
            deckCardIndex = randomDeckCards.length;
            while(deckCardIndex--) {
                currDeckCard = randomDeckCards[deckCardIndex];
                clientDeck.deckCards.push(currDeckCard);
            }
        }

        return clientDeck;
    }



    // RANDOM

    function createRandomDecks(numOfDecks, draftJSON, availableDeckComponents) {
        var randomDecks = [];
        function addRandomDeck(playerClass, deckCards) {
            var randomDeck = {
                name: playerClass+" Deck ",
                redbullDraftId: draftJSON.id,
                playerClass: playerClass,
                deckCards: deckCards
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
        remainingClasses = remainingClasses || HS_CLASSES.slice();
        randomClasses = randomClasses || [];

        // Get another random class from the remaining classes
        var randomIndex = utils.getRandomInt(0, remainingClasses.length - 1);
        randomClasses.push(remainingClasses.splice(randomIndex, 1)[0]); // Splice return array so we grab only element
        if (randomClasses.length >= numOfClasses || remainingClasses.length < 1) {
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

            // Check if this card qualifies for this deck
            if (deckCard.playerClass === playerClass || deckCard.playerClass === "Neutral") {

                // Find out the amount of cards to add
                numCardsOfToAdd = Math.min(numOfCards - cardCount, deckCard.cardQuantity);
                // Limit cards depending on rarity
                if(deckCard.rarity === "Legendary") {
                    numCardsOfToAdd = Math.min(NUM_OF_LEGENDARIES, numCardsOfToAdd);
                } else {
                    numCardsOfToAdd = Math.min(NUM_OF_CARDS_PER_DECK, numCardsOfToAdd);
                }

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

    function saveDecks(draftJSON) {
        return function (decks, finalCb) {

            // parent data
            var isOfficial = draftJSON.isOfficial;
            var redbullDraftId = draftJSON.id;
            var authorId = draftJSON.authorId;

            var savedDecks = [];

            return async.eachSeries(decks, function (deck, deckCb) {

                // Slap on parentData to the deck
                deck.isOfficial = isOfficial;
                deck.redbullDraftId = redbullDraftId;
                deck.authorId = authorId;

                return RedbullDeck.create(deck, function (err, newDeck) {
                    if (err) return deckCb(err);

                    savedDecks.push(newDeck);
                    return async.eachSeries(deck.deckCards, function (deckCard, deckCardCb) {

                        delete deckCard.card;
                        return newDeck.deckCards.create(deckCard, function(err, newDeckCard) {
                            return deckCardCb(err);
                        });
                    }, deckCb);
                });
            }, function (err) {
                return finalCb(err, savedDecks);
            });
        }
    }

    function saveDecks(draftJSON) {
        return function (decks, finalCb) {

            // parent data
            var isOfficial = draftJSON.isOfficial;
            var redbullDraftId = draftJSON.id;
            var authorId = draftJSON.authorId;

            var savedDecks = [];

            return async.eachSeries(decks, function (deck, deckCb) {

                // Slap on parentData to the deck
                deck.isOfficial = isOfficial;
                deck.redbullDraftId = redbullDraftId;
                deck.authorId = authorId;

                return RedbullDeck.create(deck, function (err, newDeck) {
                    if (err) return deckCb(err);

                    savedDecks.push(newDeck);
                    return async.eachSeries(deck.deckCards, function (deckCard, deckCardCb) {

                        delete deckCard.card;
                        return newDeck.deckCards.create(deckCard, function(err, newDeckCard) {
                            return deckCardCb(err);
                        });
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

    function archiveDraft(draftJSON) {
        return function (createdDeckIds, finalCb) {

            var ArchivedDraftCard = RedbullDeck.app.models.archivedDraftCard;
            var RedbullPack = RedbullDeck.app.models.redbullPack;
            var RedbullPackCard = RedbullDeck.app.models.redbullPackCard;

            async.waterfall([

                // Generate and save archivedDraftCards
                function(seriesCb) {

                    // Associate each new archivedDraftCard by id
                    var archivedDraftCardObj = {};
                    var cardIndex = draftJSON.cards.length;
                    var currCard;
                    while(cardIndex--) {
                        currCard = draftJSON.cards[cardIndex];
                        if(!archivedDraftCardObj[currCard.id]) {
                            archivedDraftCardObj[currCard.id] = {
                                cardId: currCard.id,
                                redbullDraftId: draftJSON.id,
                                cardQuantity: 0
                            }
                        }
                        archivedDraftCardObj[currCard.id].cardQuantity++;
                    }

                    var archivedDraftCards = _.map(archivedDraftCardObj, function(archivedDraftCard) {
                        return archivedDraftCard;
                    });

                    return ArchivedDraftCard.create(archivedDraftCards, function(err) {
                        return seriesCb(err);
                    });
                },
                // Delete the draft's packs
                function(seriesCb) {
                    return RedbullPack.destroyAll({redbullDraftId: draftJSON.id}, function(err) {
                        return seriesCb(err);
                    });
                },
                // Delete the draft's card packs
                function(seriesCb) {
                    return RedbullPackCard.destroyAll({redbullDraftId: draftJSON.id}, function(err) {
                        return seriesCb(err);
                    });
                }

            // Finish and pass along the created DeckIds from the previous step
            ], function(err) {
                return finalCb(err, createdDeckIds);
            });
        }
    }
};