var async = require("async");
var utils = require("./../../../../lib/utils");

var HS_CLASSES = ["Mage", "Paladin", "Rogue", "Druid", "Shaman",
  "Warlock", "Hunter", "Priest", "Warrior"];

module.exports = function(RedbullDeck) {

    RedbullDeck.saveDraftDecks = function (draft, clientDecks, finalCb) {
        clientDecks = testDecks;

        console.log("saving draft decks");
        var currentTime = Date.now();
        var draftJSON = draft.toJSON();
        var draftSettings = draftJSON.settings;
        var numOfDecks = draftSettings.numOfDecks;
        var deckSubmitCurfew = draftJSON.deckSubmitCurfew;

        var noDeckValidationErr = new Error("No draft found for id", draftId);
        noDeckValidationErr.statusCode = 422;
        noDeckValidationErr.code = 'DRAFT_VALIDATION_ERROR';

        // See if the curfew was breached
        console.log("currentTIme", currentTime);
        console.log("deckSubmitCurfew", deckSubmitCurfew);
        if (currentTime > deckSubmitCurfew) {
            var randomDecks = createRandomDecks(numOfDecks);
            return saveDecks(draft, randomDecks, finalCb);
        }

        clientDecks = createRandomDecks(numOfDecks);
        console.log("random decks:", clientDecks);

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
        var savedDecks = [];
        return async.eachSeries(decks, function (deck, deckCb) {
            deck.isOfficial = draft.isOfficial;
            return RedbullDeck.create(deck, function (err, newDeck) {
                if (err) return deckCb(err);
                savedDecks.push(newDeck);
                return async.eachSeries(deck.deckCards, function (deckCard, deckCardCb) {
                    return newDeck.deckCard.create(deckCard, deckCardCb);
                }, deckCb);
            });
        }, function(err) {
            return finalCb(err, savedDecks);
        });
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


var testDecks = [
    {
        "cards": [
            {
                "cardId": "56413e6057d86d620a149280",
                "cardQuantity": 1,
                "card": {
                    "name": "Murloc Tinyfin",
                    "cost": 0,
                    "rarity": "Common",
                    "race": "Murloc",
                    "playerClass": "Neutral",
                    "text": "",
                    "mechanics": [],
                    "cardType": "Minion",
                    "photoNames": {
                        "small": "murloctinyfin.small.png",
                        "medium": "murloctinyfin.medium.png",
                        "large": "murloctinyfin.large.png"
                    },
                    "expansion": "League of Explorers",
                    "id": "56413e6057d86d620a149280"
                }
            },
            {
                "cardId": "5480d874a83149a836510888",
                "cardQuantity": 1,
                "card": {
                    "name": "Target Dummy",
                    "cost": 0,
                    "rarity": "Rare",
                    "race": "Mech",
                    "playerClass": "Neutral",
                    "text": "Taunt",
                    "mechanics": [
                        "Taunt"
                    ],
                    "cardType": "Minion",
                    "photoNames": {
                        "small": "Target-Dummy.small.png",
                        "medium": "targetdummy.medium.png",
                        "large": "targetdummy.large.png"
                    },
                    "expansion": "Goblins Vs. Gnomes",
                    "id": "5480d874a83149a836510888"
                }
            },
            {
                "cardId": "55d50139029adae01f2621da",
                "cardQuantity": 1,
                "card": {
                    "name": "Living Roots",
                    "cost": 1,
                    "rarity": "Common",
                    "race": "",
                    "playerClass": "Druid",
                    "text": "Choose One - Deal 2 damage; or Summon two 1/1 Saplings",
                    "mechanics": [
                        "Choose One"
                    ],
                    "cardType": "Spell",
                    "photoNames": {
                        "small": "living-roots.small.png",
                        "medium": "living-roots.medium.png",
                        "large": "living-roots.large.png"
                    },
                    "expansion": "The Grand Tournament",
                    "id": "55d50139029adae01f2621da"
                }
            },
            {
                "cardId": "54123b536c69d76c280ea7b1",
                "cardQuantity": 1,
                "card": {
                    "name": "Abusive Sergeant",
                    "cost": 1,
                    "rarity": "Common",
                    "race": "",
                    "playerClass": "Neutral",
                    "text": "Battlecry: Give a minion +2 Attack this turn.",
                    "mechanics": [
                        "Battlecry"
                    ],
                    "cardType": "Minion",
                    "photoNames": {
                        "small": "Abusive-Sargent.small.png",
                        "medium": "abusivesergeant.medium.png",
                        "large": "abusivesergeant.large.png"
                    },
                    "expansion": "Basic",
                    "id": "54123b536c69d76c280ea7b1"
                }
            },
            {
                "cardId": "5480d237a83149a836510860",
                "cardQuantity": 1,
                "card": {
                    "name": "Clockwork Gnome",
                    "cost": 1,
                    "rarity": "Common",
                    "race": "Mech",
                    "playerClass": "Neutral",
                    "text": "Deathrattle: Add a Spare Part card to your hand.",
                    "mechanics": [
                        "Deathrattle"
                    ],
                    "cardType": "Minion",
                    "photoNames": {
                        "small": "Clockwork-Gnome.small.png",
                        "medium": "clockworkgnome.medium.png",
                        "large": "clockworkgnome.large.png"
                    },
                    "expansion": "Goblins Vs. Gnomes",
                    "id": "5480d237a83149a836510860"
                }
            },
            {
                "cardId": "5480d257a83149a836510861",
                "cardQuantity": 1,
                "card": {
                    "name": "Cogmaster",
                    "cost": 1,
                    "rarity": "Common",
                    "race": "",
                    "playerClass": "Neutral",
                    "text": "Has +2 Attack while you have a Mech.",
                    "mechanics": [],
                    "cardType": "Minion",
                    "photoNames": {
                        "small": "Cogmaster.small.png",
                        "medium": "cog-master.medium.png",
                        "large": "cog-master.large.png"
                    },
                    "expansion": "Goblins Vs. Gnomes",
                    "id": "5480d257a83149a836510861"
                }
            },
            {
                "cardId": "55189820b988ff6905b58e3b",
                "cardQuantity": 2,
                "card": {
                    "name": "Dragon Egg",
                    "cost": 1,
                    "rarity": "Rare",
                    "race": "",
                    "playerClass": "Neutral",
                    "text": "Whenever this minion takes damage, summon a 2/1 Whelp.",
                    "mechanics": [],
                    "cardType": "Minion",
                    "photoNames": {
                        "small": "dragon-egg.small.png",
                        "medium": "dragonegg.medium.png",
                        "large": "dragonegg.large.png"
                    },
                    "expansion": "Blackrock Mountain",
                    "id": "55189820b988ff6905b58e3b"
                }
            },
            {
                "cardId": "54133d39df6bb6fc15b76238",
                "cardQuantity": 1,
                "card": {
                    "name": "Murloc Raider",
                    "cost": 1,
                    "rarity": "Basic",
                    "race": "Murloc",
                    "playerClass": "Neutral",
                    "text": "",
                    "mechanics": [],
                    "cardType": "Minion",
                    "photoNames": {
                        "small": "Murloc-Raider.small.png",
                        "medium": "murlocraider.medium.png",
                        "large": "murlocraider.large.png"
                    },
                    "expansion": "Basic",
                    "id": "54133d39df6bb6fc15b76238"
                }
            },
            {
                "cardId": "54132c0cdf6bb6fc15b76203",
                "cardQuantity": 1,
                "card": {
                    "name": "Young Dragonhawk",
                    "cost": 1,
                    "rarity": "Common",
                    "race": "Beast",
                    "playerClass": "Neutral",
                    "text": "Windfury",
                    "mechanics": [
                        "Windfury"
                    ],
                    "cardType": "Minion",
                    "photoNames": {
                        "small": "Young-Dragonhawk.small.png",
                        "medium": "youngdragonhawk.medium.png",
                        "large": "youngdragonhawk.large.png"
                    },
                    "expansion": "Basic",
                    "id": "54132c0cdf6bb6fc15b76203"
                }
            },
            {
                "cardId": "54123a486c69d76c280ea7ac",
                "cardQuantity": 1,
                "card": {
                    "name": "Young Priestess",
                    "cost": 1,
                    "rarity": "Rare",
                    "race": "",
                    "playerClass": "Neutral",
                    "text": "At the end of your turn, give another random friendly minion +1 Health.",
                    "mechanics": [],
                    "cardType": "Minion",
                    "photoNames": {
                        "small": "Young-Priestess.small.png",
                        "medium": "youngpriestess.medium.png",
                        "large": "youngpriestess.large.png"
                    },
                    "expansion": "Basic",
                    "id": "54123a486c69d76c280ea7ac"
                }
            },
            {
                "cardId": "5410a45c8070e4440b874a05",
                "cardQuantity": 1,
                "card": {
                    "name": "Mark of the Wild",
                    "cost": 2,
                    "rarity": "Basic",
                    "race": "",
                    "playerClass": "Druid",
                    "text": "Give a minion Taunt and +2 / +2",
                    "mechanics": [],
                    "cardType": "Spell",
                    "photoNames": {
                        "small": "Mark-of-the-Wild.small.png",
                        "medium": "mark-of-the-wild.medium.png",
                        "large": "mark-of-the-wild.large.png"
                    },
                    "expansion": "Basic",
                    "id": "5410a45c8070e4440b874a05"
                }
            },
            {
                "cardId": "54123ecb6c69d76c280ea7b3",
                "cardQuantity": 1,
                "card": {
                    "name": "Amani Berserker",
                    "cost": 2,
                    "rarity": "Common",
                    "race": "",
                    "playerClass": "Neutral",
                    "text": "Enrage: +3 Attack",
                    "mechanics": [
                        "Enrage"
                    ],
                    "cardType": "Minion",
                    "photoNames": {
                        "small": "Amani-Berserker.small.png",
                        "medium": "amaniberserker.medium.png",
                        "large": "amaniberserker.large.png"
                    },
                    "expansion": "Basic",
                    "id": "54123ecb6c69d76c280ea7b3"
                }
            },
            {
                "cardId": "54131f91df6bb6fc15b761e3",
                "cardQuantity": 1,
                "card": {
                    "name": "Dire Wolf Alpha",
                    "cost": 2,
                    "rarity": "Common",
                    "race": "Beast",
                    "playerClass": "Neutral",
                    "text": "Adjacent minions have +1 Attack.",
                    "mechanics": [],
                    "cardType": "Minion",
                    "photoNames": {
                        "small": "Direwolf-Alpha.small.png",
                        "medium": "direwolf.medium.png",
                        "large": "direwolf.large.png"
                    },
                    "expansion": "Basic",
                    "id": "54131f91df6bb6fc15b761e3"
                }
            },
            {
                "cardId": "541231166c69d76c280ea77e",
                "cardQuantity": 1,
                "card": {
                    "name": "Doomsayer",
                    "cost": 2,
                    "rarity": "Epic",
                    "race": "",
                    "playerClass": "Neutral",
                    "text": "At the start of your turn, destroy ALL minions.",
                    "mechanics": [],
                    "cardType": "Minion",
                    "photoNames": {
                        "small": "Doomsayer.small.png",
                        "medium": "doomsayer.medium.png",
                        "large": "doomsayer.large.png"
                    },
                    "expansion": "Basic",
                    "id": "541231166c69d76c280ea77e"
                }
            },
            {
                "cardId": "541232cb6c69d76c280ea786",
                "cardQuantity": 1,
                "card": {
                    "name": "Echoing Ooze",
                    "cost": 2,
                    "rarity": "Epic",
                    "race": "",
                    "playerClass": "Neutral",
                    "text": "Battlecry: Summon an exact copy of this minion at the end of the turn.",
                    "mechanics": [
                        "Battlecry"
                    ],
                    "cardType": "Minion",
                    "photoNames": {
                        "small": "Echoing-Ooze.small.png",
                        "medium": "echoingooze.medium.png",
                        "large": "echoingooze.large.png"
                    },
                    "expansion": "Naxxramas",
                    "id": "541232cb6c69d76c280ea786"
                }
            },
            {
                "cardId": "547ff66ba83149a83651080a",
                "cardQuantity": 1,
                "card": {
                    "name": "Grove Tender",
                    "cost": 3,
                    "rarity": "Rare",
                    "race": "",
                    "playerClass": "Druid",
                    "text": "Choose One - Give each player a Mana Crystal; or Each player draws a card.",
                    "mechanics": [
                        "Choose One"
                    ],
                    "cardType": "Minion",
                    "photoNames": {
                        "small": "Grove-Tender.small.png",
                        "medium": "groove-tender.medium.png",
                        "large": "groove-tender.large.png"
                    },
                    "expansion": "Goblins Vs. Gnomes",
                    "id": "547ff66ba83149a83651080a"
                }
            },
            {
                "cardId": "56413ce77ec357cd11c77e62",
                "cardQuantity": 2,
                "card": {
                    "name": "Jungle Moonkin",
                    "cost": 4,
                    "rarity": "Rare",
                    "race": "Beast",
                    "playerClass": "Druid",
                    "text": "Both players have Spell Damage +2.",
                    "mechanics": [
                        "Spell Damage"
                    ],
                    "cardType": "Minion",
                    "photoNames": {
                        "small": "junglemoonkin.small.png",
                        "medium": "jungle-moonkin.medium.png",
                        "large": "jungle-moonkin.large.png"
                    },
                    "expansion": "League of Explorers",
                    "id": "56413ce77ec357cd11c77e62"
                }
            },
            {
                "cardId": "55d4f7f6029adae01f2621c0",
                "cardQuantity": 1,
                "card": {
                    "name": "Savage Combatant",
                    "cost": 4,
                    "rarity": "Rare",
                    "race": "Beast",
                    "playerClass": "Druid",
                    "text": "Inspire: Give your hero +2 Attack this turn.",
                    "mechanics": [
                        "Inspire"
                    ],
                    "cardType": "Minion",
                    "photoNames": {
                        "small": "savage-combatant.small.png",
                        "medium": "savage-combatant.medium.png",
                        "large": "savage-combatant.large.png"
                    },
                    "expansion": "The Grand Tournament",
                    "id": "55d4f7f6029adae01f2621c0"
                }
            },
            {
                "cardId": "55d4cd995ba9316411bc1645",
                "cardQuantity": 1,
                "card": {
                    "name": "Wildwalker",
                    "cost": 4,
                    "rarity": "Common",
                    "race": "",
                    "playerClass": "Druid",
                    "text": "Battlecry: Give a friendly Beast +3 Health.",
                    "mechanics": [
                        "Battlecry"
                    ],
                    "cardType": "Minion",
                    "photoNames": {
                        "small": "wildwalker.small.png",
                        "medium": "windwalker.medium.png",
                        "large": "windwalker.large.png"
                    },
                    "expansion": "The Grand Tournament",
                    "id": "55d4cd995ba9316411bc1645"
                }
            },
            {
                "cardId": "540f88448ad084541b6b626b",
                "cardQuantity": 1,
                "card": {
                    "name": "Druid of the Claw",
                    "cost": 5,
                    "rarity": "Common",
                    "race": "",
                    "playerClass": "Druid",
                    "text": "Choose One - Charge; or +2 Health and Taunt.",
                    "mechanics": [
                        ""
                    ],
                    "cardType": "Minion",
                    "photoNames": {
                        "small": "Druid-of-the-Claw.small.png",
                        "medium": "druid-of-the-claw.medium.png",
                        "large": "druid-of-the-claw.large.png"
                    },
                    "expansion": "Basic",
                    "id": "540f88448ad084541b6b626b"
                }
            },
            {
                "cardId": "547ff5e9a83149a836510809",
                "cardQuantity": 2,
                "card": {
                    "name": "Druid of the Fang",
                    "cost": 5,
                    "rarity": "Common",
                    "race": "",
                    "playerClass": "Druid",
                    "text": "Battlecry: If you have a Beast, transform this minion into a 7/7.",
                    "mechanics": [
                        "Battlecry"
                    ],
                    "cardType": "Minion",
                    "photoNames": {
                        "small": "Druid-of-the-Fang.small.png",
                        "medium": "druidotfang.medium.png",
                        "large": "druidotfang.large.png"
                    },
                    "expansion": "Goblins Vs. Gnomes",
                    "id": "547ff5e9a83149a836510809"
                }
            },
            {
                "cardId": "540f90d48ad084541b6b6289",
                "cardQuantity": 1,
                "card": {
                    "name": "Starfire",
                    "cost": 6,
                    "rarity": "Basic",
                    "race": "",
                    "playerClass": "Druid",
                    "text": "Deal 5 damage. Draw a card.",
                    "mechanics": [
                        ""
                    ],
                    "cardType": "Spell",
                    "photoNames": {
                        "small": "Starfire.small.png",
                        "medium": "starfire.medium.png",
                        "large": "starfire.large.png"
                    },
                    "expansion": "Basic",
                    "id": "540f90d48ad084541b6b6289"
                }
            },
            {
                "cardId": "547ff737a83149a83651080c",
                "cardQuantity": 1,
                "card": {
                    "name": "Mech-Bear-Cat",
                    "cost": 6,
                    "rarity": "Rare",
                    "race": "Mech",
                    "playerClass": "Druid",
                    "text": "Whenever this minion takes damage, add a Spare Part card to your hand.",
                    "mechanics": [],
                    "cardType": "Minion",
                    "photoNames": {
                        "small": "Mech-Bear-Cat.small.png",
                        "medium": "mechbearcat.medium.png",
                        "large": "mechbearcat.large.png"
                    },
                    "expansion": "Goblins Vs. Gnomes",
                    "id": "547ff737a83149a83651080c"
                }
            },
            {
                "cardId": "540f903e8ad084541b6b6286",
                "cardQuantity": 2,
                "card": {
                    "name": "Ironbark Protector",
                    "cost": 8,
                    "rarity": "Basic",
                    "race": "",
                    "playerClass": "Druid",
                    "text": "Taunt",
                    "mechanics": [
                        "Taunt"
                    ],
                    "cardType": "Minion",
                    "photoNames": {
                        "small": "Ironbark-Protector.small.png",
                        "medium": "ironbark-protector.medium.png",
                        "large": "ironbark-protector.large.png"
                    },
                    "expansion": "Basic",
                    "id": "540f903e8ad084541b6b6286"
                }
            },
            {
                "cardId": "551af80be8205e2a12f106d0",
                "cardQuantity": 2,
                "card": {
                    "name": "Volcanic Lumberer",
                    "cost": 9,
                    "rarity": "Rare",
                    "race": "",
                    "playerClass": "Druid",
                    "text": "Taunt Costs (1) less for each minion that died this turn.",
                    "mechanics": [
                        "Taunt"
                    ],
                    "cardType": "Minion",
                    "photoNames": {
                        "small": "volcanic-lumberer.small.png",
                        "medium": "volcaniclumberer.medium.png",
                        "large": "volcaniclumberer.large.png"
                    },
                    "expansion": "Blackrock Mountain",
                    "id": "551af80be8205e2a12f106d0"
                }
            }
        ],
        "playerClass": "Druid",
        "createdDate": "2016-01-26T22:38:08.554Z"
    },
    {
        "cards": [
            {
                "cardId": "5410ab7eb30b0ff4242b9504",
                "cardQuantity": 1,
                "card": {
                    "name": "Hunter's Mark",
                    "cost": 0,
                    "rarity": "Basic",
                    "race": "",
                    "playerClass": "Hunter",
                    "text": "Change a minion's Health to 1.",
                    "mechanics": [],
                    "cardType": "Spell",
                    "photoNames": {
                        "small": "Hunter's-Mark.small.png",
                        "medium": "huntersmark.medium.png",
                        "large": "huntersmark.large.png"
                    },
                    "expansion": "Basic",
                    "id": "5410ab7eb30b0ff4242b9504"
                }
            },
            {
                "cardId": "5410b12cb30b0ff4242b950a",
                "cardQuantity": 2,
                "card": {
                    "name": "Arcane Shot",
                    "cost": 1,
                    "rarity": "Basic",
                    "race": "",
                    "playerClass": "Hunter",
                    "text": "Deal 2 damage.",
                    "mechanics": [],
                    "cardType": "Spell",
                    "photoNames": {
                        "small": "Arcane-Shot.small.png",
                        "medium": "arcaneshot.medium.png",
                        "large": "arcaneshot.large.png"
                    },
                    "expansion": "Basic",
                    "id": "5410b12cb30b0ff4242b950a"
                }
            },
            {
                "cardId": "54133034df6bb6fc15b76216",
                "cardQuantity": 1,
                "card": {
                    "name": "Goldshire Footman",
                    "cost": 1,
                    "rarity": "Basic",
                    "race": "",
                    "playerClass": "Neutral",
                    "text": "Taunt",
                    "mechanics": [
                        "Taunt"
                    ],
                    "cardType": "Minion",
                    "photoNames": {
                        "small": "Goldshire-Footman.small.png",
                        "medium": "goldshirefootman.medium.png",
                        "large": "goldshirefootman.large.png"
                    },
                    "expansion": "Basic",
                    "id": "54133034df6bb6fc15b76216"
                }
            },
            {
                "cardId": "541237726c69d76c280ea79c",
                "cardQuantity": 1,
                "card": {
                    "name": "Lightwarden",
                    "cost": 1,
                    "rarity": "Rare",
                    "race": "",
                    "playerClass": "Neutral",
                    "text": "Whenever a character is healed, gain +2 Attack.",
                    "mechanics": [],
                    "cardType": "Minion",
                    "photoNames": {
                        "small": "Lightwarden.small.png",
                        "medium": "lightwarden.medium.png",
                        "large": "lightwarden.large.png"
                    },
                    "expansion": "Basic",
                    "id": "541237726c69d76c280ea79c"
                }
            },
            {
                "cardId": "55d4c7505ba9316411bc1625",
                "cardQuantity": 1,
                "card": {
                    "name": "Lowly Squire",
                    "cost": 1,
                    "rarity": "Common",
                    "race": "",
                    "playerClass": "Neutral",
                    "text": "Inspire: Gain +1 Attack.",
                    "mechanics": [
                        "Inspire"
                    ],
                    "cardType": "Minion",
                    "photoNames": {
                        "small": "lowly-squire.small.png",
                        "medium": "lowlysquire.medium.png",
                        "large": "lowlysquire.large.png"
                    },
                    "expansion": "The Grand Tournament",
                    "id": "55d4c7505ba9316411bc1625"
                }
            },
            {
                "cardId": "5411cedc9d2333d418373d9f",
                "cardQuantity": 1,
                "card": {
                    "name": "Timber Wolf",
                    "cost": 1,
                    "rarity": "Basic",
                    "race": "Beast",
                    "playerClass": "Hunter",
                    "text": "Your other Beasts have +1 Attack.",
                    "mechanics": [],
                    "cardType": "Minion",
                    "photoNames": {
                        "small": "Timber-Wolf.small.png",
                        "medium": "timberwolf.medium.png",
                        "large": "timberwolf.large.png"
                    },
                    "expansion": "Basic",
                    "id": "5411cedc9d2333d418373d9f"
                }
            },
            {
                "cardId": "5411cf339d2333d418373da1",
                "cardQuantity": 1,
                "card": {
                    "name": "Webspinner",
                    "cost": 1,
                    "rarity": "Common",
                    "race": "Beast",
                    "playerClass": "Hunter",
                    "text": "Deathrattle: Draw a random Beast card.",
                    "mechanics": [
                        "Deathrattle"
                    ],
                    "cardType": "Minion",
                    "photoNames": {
                        "small": "Webspinner.small.png",
                        "medium": "webspinner.medium.png",
                        "large": "webspinner.large.png"
                    },
                    "expansion": "Naxxramas",
                    "id": "5411cf339d2333d418373da1"
                }
            },
            {
                "cardId": "55d4f729029adae01f2621bb",
                "cardQuantity": 2,
                "card": {
                    "name": "Bear Trap",
                    "cost": 2,
                    "rarity": "Common",
                    "race": "",
                    "playerClass": "Hunter",
                    "text": "Secret: After your hero is attacked, summon a 3/3 Bear with Taunt",
                    "mechanics": [
                        "Secret",
                        "Taunt"
                    ],
                    "cardType": "Spell",
                    "photoNames": {
                        "small": "bear-trap.small.png",
                        "medium": "beartrap.medium.png",
                        "large": "beartrap.large.png"
                    },
                    "expansion": "The Grand Tournament",
                    "id": "55d4f729029adae01f2621bb"
                }
            },
            {
                "cardId": "56413a1c57d86d620a14927b",
                "cardQuantity": 2,
                "card": {
                    "name": "Explorer's Hat",
                    "cost": 2,
                    "rarity": "Rare",
                    "race": "",
                    "playerClass": "Hunter",
                    "text": "Give a minion +1 / +1 and \"Deathrattle: Add an Explorer's Hat to your hand.\"",
                    "mechanics": [
                        "Deathrattle"
                    ],
                    "cardType": "Spell",
                    "photoNames": {
                        "small": "explorershat.small.png",
                        "medium": "explorershat.medium.png",
                        "large": "explorershat.large.png"
                    },
                    "expansion": "League of Explorers",
                    "id": "56413a1c57d86d620a14927b"
                }
            },
            {
                "cardId": "5410a85ab30b0ff4242b94fc",
                "cardQuantity": 1,
                "card": {
                    "name": "Explosive Trap",
                    "cost": 2,
                    "rarity": "Common",
                    "race": "",
                    "playerClass": "Hunter",
                    "text": "Secret: When your hero is attacked, deal 2 damage to all enemies.",
                    "mechanics": [
                        "Secret"
                    ],
                    "cardType": "Spell",
                    "photoNames": {
                        "small": "Explosive-Trap.small.png",
                        "medium": "explosivetrap.medium.png",
                        "large": "explosivetrap.large.png"
                    },
                    "expansion": "Basic",
                    "id": "5410a85ab30b0ff4242b94fc"
                }
            },
            {
                "cardId": "551af938679c1b56473eb44e",
                "cardQuantity": 2,
                "card": {
                    "name": "Quick Shot",
                    "cost": 2,
                    "rarity": "Common",
                    "race": "",
                    "playerClass": "Hunter",
                    "text": "Deal 3 damage. If your hand is empty, draw a card.",
                    "mechanics": [],
                    "cardType": "Spell",
                    "photoNames": {
                        "small": "quick-shot.small.png",
                        "medium": "quickshot.medium.png",
                        "large": "quickshot.large.png"
                    },
                    "expansion": "Blackrock Mountain",
                    "id": "551af938679c1b56473eb44e"
                }
            },
            {
                "cardId": "5410a9e8b30b0ff4242b9500",
                "cardQuantity": 1,
                "card": {
                    "name": "Snipe",
                    "cost": 2,
                    "rarity": "Common",
                    "race": "",
                    "playerClass": "Hunter",
                    "text": "Secret: When your opponent plays a minion, deal 4 damage to it.",
                    "mechanics": [
                        "Secret"
                    ],
                    "cardType": "Spell",
                    "photoNames": {
                        "small": "Snipe.small.png",
                        "medium": "snipe.medium.png",
                        "large": "snipe.large.png"
                    },
                    "expansion": "Basic",
                    "id": "5410a9e8b30b0ff4242b9500"
                }
            },
            {
                "cardId": "5410a82db30b0ff4242b94fa",
                "cardQuantity": 1,
                "card": {
                    "name": "Deadly Shot",
                    "cost": 3,
                    "rarity": "Common",
                    "race": "",
                    "playerClass": "Hunter",
                    "text": "Destroy a random enemy minion.",
                    "mechanics": [],
                    "cardType": "Spell",
                    "photoNames": {
                        "small": "Deadly-Shot.small.png",
                        "medium": "deadlyshot.medium.png",
                        "large": "deadlyshot.large.png"
                    },
                    "expansion": "Basic",
                    "id": "5410a82db30b0ff4242b94fa"
                }
            },
            {
                "cardId": "5410acc9b30b0ff4242b9505",
                "cardQuantity": 1,
                "card": {
                    "name": "Kill Command",
                    "cost": 3,
                    "rarity": "Basic",
                    "race": "",
                    "playerClass": "Hunter",
                    "text": "Deal 3 damage. If you have a Beast, deal 5 damage instead.",
                    "mechanics": [],
                    "cardType": "Spell",
                    "photoNames": {
                        "small": "Kill-Command.small.png",
                        "medium": "killcommand.medium.png",
                        "large": "killcommand.large.png"
                    },
                    "expansion": "Basic",
                    "id": "5410acc9b30b0ff4242b9505"
                }
            },
            {
                "cardId": "55d4cb415ba9316411bc1638",
                "cardQuantity": 2,
                "card": {
                    "name": "Powershot",
                    "cost": 3,
                    "rarity": "Rare",
                    "race": "",
                    "playerClass": "Hunter",
                    "text": "Deal 2 damage to a minion and the minions next to it.",
                    "mechanics": [],
                    "cardType": "Spell",
                    "photoNames": {
                        "small": "powershot.small.png",
                        "medium": "powershot.medium.png",
                        "large": "powershot.large.png"
                    },
                    "expansion": "The Grand Tournament",
                    "id": "55d4cb415ba9316411bc1638"
                }
            },
            {
                "cardId": "54123cfd6c69d76c280ea7b2",
                "cardQuantity": 1,
                "card": {
                    "name": "Acolyte of Pain",
                    "cost": 3,
                    "rarity": "Common",
                    "race": "",
                    "playerClass": "Neutral",
                    "text": "Whenever this minion takes damage, draw a card.",
                    "mechanics": [],
                    "cardType": "Minion",
                    "photoNames": {
                        "small": "Acolyte-of-Pain.small.png",
                        "medium": "acolyteofpain.medium.png",
                        "large": "acolyteofpain.large.png"
                    },
                    "expansion": "Basic",
                    "id": "54123cfd6c69d76c280ea7b2"
                }
            },
            {
                "cardId": "55d4cd265ba9316411bc1642",
                "cardQuantity": 1,
                "card": {
                    "name": "Coliseum Manager",
                    "cost": 3,
                    "rarity": "Rare",
                    "race": "",
                    "playerClass": "Neutral",
                    "text": "Inspire: Return this minion to your hand.",
                    "mechanics": [
                        "Inspire"
                    ],
                    "cardType": "Minion",
                    "photoNames": {
                        "small": "coliseum-manage.small.png",
                        "medium": "coliseummanager.medium.png",
                        "large": "coliseummanager.large.png"
                    },
                    "expansion": "The Grand Tournament",
                    "id": "55d4cd265ba9316411bc1642"
                }
            },
            {
                "cardId": "54132ea6df6bb6fc15b7620e",
                "cardQuantity": 1,
                "card": {
                    "name": "Dalaran Mage",
                    "cost": 3,
                    "rarity": "Basic",
                    "race": "",
                    "playerClass": "Neutral",
                    "text": "Spell Damage +1",
                    "mechanics": [
                        "Spell Damage"
                    ],
                    "cardType": "Minion",
                    "photoNames": {
                        "small": "Dalaran-Mage.small.png",
                        "medium": "dalaranmage.medium.png",
                        "large": "dalaranmage.large.png"
                    },
                    "expansion": "Basic",
                    "id": "54132ea6df6bb6fc15b7620e"
                }
            },
            {
                "cardId": "54123a7a6c69d76c280ea7ad",
                "cardQuantity": 2,
                "card": {
                    "name": "Deathlord",
                    "cost": 3,
                    "rarity": "Rare",
                    "race": "",
                    "playerClass": "Neutral",
                    "text": "Taunt: Deathrattle: Your opponent puts a minion from their deck into the battlefield.",
                    "mechanics": [
                        "Deathrattle",
                        "Taunt"
                    ],
                    "cardType": "Minion",
                    "photoNames": {
                        "small": "Deathlord.small.png",
                        "medium": "deathlord.medium.png",
                        "large": "deathlord.large.png"
                    },
                    "expansion": "Naxxramas",
                    "id": "54123a7a6c69d76c280ea7ad"
                }
            },
            {
                "cardId": "564129e757d86d620a149275",
                "cardQuantity": 1,
                "card": {
                    "name": "Desert Camel",
                    "cost": 3,
                    "rarity": "Common",
                    "race": "Beast",
                    "playerClass": "Hunter",
                    "text": "Battlecry: Put a 1-cost minion from each deck into the battlefield.",
                    "mechanics": [
                        "Battlecry"
                    ],
                    "cardType": "Minion",
                    "photoNames": {
                        "small": "desertcamel.small.png",
                        "medium": "desertcamel.medium.png",
                        "large": "desertcamel.large.png"
                    },
                    "expansion": "League of Explorers",
                    "id": "564129e757d86d620a149275"
                }
            },
            {
                "deckId": null,
                "cardId": "5480d31fa83149a836510866",
                "cardQuantity": 2,
                "card": {
                    "name": "Flying Machine",
                    "cost": 3,
                    "rarity": "Common",
                    "race": "Mech",
                    "playerClass": "Neutral",
                    "text": "Windfury",
                    "mechanics": [
                        "Windfury"
                    ],
                    "cardType": "Minion",
                    "photoNames": {
                        "small": "Flying-Machine.small.png",
                        "medium": "flyingmachine.medium.png",
                        "large": "flyingmachine.large.png"
                    },
                    "expansion": "Goblins Vs. Gnomes",
                    "id": "5480d31fa83149a836510866"
                }
            },
            {
                "cardId": "55189b535ca7e6304179d364",
                "cardQuantity": 1,
                "card": {
                    "name": "Core Rager",
                    "cost": 4,
                    "rarity": "Rare",
                    "race": "Beast",
                    "playerClass": "Hunter",
                    "text": "Battlecry: If your hand is empty, gain +3 / +3.",
                    "mechanics": [
                        "Battlecry"
                    ],
                    "cardType": "Minion",
                    "photoNames": {
                        "small": "core-rager.small.png",
                        "medium": "corerager.medium.png",
                        "large": "corerager.large.png"
                    },
                    "expansion": "Blackrock Mountain",
                    "id": "55189b535ca7e6304179d364"
                }
            },
            {
                "cardId": "5480bec0a83149a83651080f",
                "cardQuantity": 1,
                "card": {
                    "name": "Cobra Shot",
                    "cost": 5,
                    "rarity": "Common",
                    "race": "",
                    "playerClass": "Hunter",
                    "text": "Deal 3 damage to a minion and the enemy hero",
                    "mechanics": [],
                    "cardType": "Spell",
                    "photoNames": {
                        "small": "Cobra-Shot.small.png",
                        "medium": "cobrash.medium.png",
                        "large": "cobrash.large.png"
                    },
                    "expansion": "Goblins Vs. Gnomes",
                    "id": "5480bec0a83149a83651080f"
                }
            }
        ],
        "playerClass": "Hunter",
        "createdDate": "2016-01-26T22:38:53.102Z"
    },
    {
        "cards": [
            {
                "cardId": "5411d3389d2333d418373dae",
                "cardQuantity": 1,
                "card": {
                    "name": "Ice Lance",
                    "cost": 1,
                    "rarity": "Common",
                    "race": "",
                    "playerClass": "Mage",
                    "text": "Freeze a character. If it was already Frozen, deal 4 damage instead.",
                    "mechanics": [
                        "Freeze"
                    ],
                    "cardType": "Spell",
                    "photoNames": {
                        "small": "Ice-Lance.small.png",
                        "medium": "icelan.medium.png",
                        "large": "icelan.large.png"
                    },
                    "expansion": "Basic",
                    "id": "5411d3389d2333d418373dae"
                }
            },
            {
                "cardId": "5411d5c39d2333d418373db5",
                "cardQuantity": 2,
                "card": {
                    "name": "Mirror Image",
                    "cost": 1,
                    "rarity": "Basic",
                    "race": "",
                    "playerClass": "Mage",
                    "text": "Summon two 0/2 minions with Taunt.",
                    "mechanics": [
                        "Taunt"
                    ],
                    "cardType": "Spell",
                    "photoNames": {
                        "small": "Mirror-Image.small.png",
                        "medium": "mirrorim.medium.png",
                        "large": "mirrorim.large.png"
                    },
                    "expansion": "Basic",
                    "id": "5411d5c39d2333d418373db5"
                }
            },
            {
                "cardId": "54133d39df6bb6fc15b76238",
                "cardQuantity": 1,
                "card": {
                    "name": "Murloc Raider",
                    "cost": 1,
                    "rarity": "Basic",
                    "race": "Murloc",
                    "playerClass": "Neutral",
                    "text": "",
                    "mechanics": [],
                    "cardType": "Minion",
                    "photoNames": {
                        "small": "Murloc-Raider.small.png",
                        "medium": "murlocraider.medium.png",
                        "large": "murlocraider.large.png"
                    },
                    "expansion": "Basic",
                    "id": "54133d39df6bb6fc15b76238"
                }
            },
            {
                "cardId": "5411d6ab9d2333d418373db8",
                "cardQuantity": 1,
                "card": {
                    "name": "Arcane Explosion",
                    "cost": 2,
                    "rarity": "Basic",
                    "race": "",
                    "playerClass": "Mage",
                    "text": "Deal 1 damage to all enemy minions.",
                    "mechanics": [],
                    "cardType": "Spell",
                    "photoNames": {
                        "small": "Arcane-Explosion.small.png",
                        "medium": "arcexplosion.medium.png",
                        "large": "arcexplosion.large.png"
                    },
                    "expansion": "Basic",
                    "id": "5411d6ab9d2333d418373db8"
                }
            },
            {
                "cardId": "5480c11ea83149a836510819",
                "cardQuantity": 1,
                "card": {
                    "name": "Flamecannon",
                    "cost": 2,
                    "rarity": "Common",
                    "race": "",
                    "playerClass": "Mage",
                    "text": "Deal 4 damage to a random enemy minion.",
                    "mechanics": [],
                    "cardType": "Spell",
                    "photoNames": {
                        "small": "Flamecannon.small.png",
                        "medium": "flamec.medium.png",
                        "large": "flamec.large.png"
                    },
                    "expansion": "Goblins Vs. Gnomes",
                    "id": "5480c11ea83149a836510819"
                }
            },
            {
                "cardId": "5411d4889d2333d418373db4",
                "cardQuantity": 1,
                "card": {
                    "name": "Frostbolt",
                    "cost": 2,
                    "rarity": "Basic",
                    "race": "",
                    "playerClass": "Mage",
                    "text": "Deal 3 damage to a character and Freeze it.",
                    "mechanics": [
                        "Freeze"
                    ],
                    "cardType": "Spell",
                    "photoNames": {
                        "small": "Frostbolt.small.png",
                        "medium": "frostb.medium.png",
                        "large": "frostb.large.png"
                    },
                    "expansion": "Basic",
                    "id": "5411d4889d2333d418373db4"
                }
            },
            {
                "cardId": "5480c1f5a83149a83651081d",
                "cardQuantity": 1,
                "card": {
                    "name": "Unstable Portal",
                    "cost": 2,
                    "rarity": "Rare",
                    "race": "",
                    "playerClass": "Mage",
                    "text": "Add a random minion to your hand. It costs (3) less.",
                    "mechanics": [],
                    "cardType": "Spell",
                    "photoNames": {
                        "small": "Unstableportal.small.png",
                        "medium": "unstablep.medium.png",
                        "large": "unstablep.large.png"
                    },
                    "expansion": "Goblins Vs. Gnomes",
                    "id": "5480c1f5a83149a83651081d"
                }
            },
            {
                "cardId": "55d4cf525ba9316411bc1650",
                "cardQuantity": 1,
                "card": {
                    "name": "Argent Watchman",
                    "cost": 2,
                    "rarity": "Rare",
                    "race": "",
                    "playerClass": "Neutral",
                    "text": "Cant Attack. Inspire: Can attack as normal this turn.",
                    "mechanics": [
                        "Inspire"
                    ],
                    "cardType": "Minion",
                    "photoNames": {
                        "small": "argent-watchman.small.png",
                        "medium": "argentwatchman.medium.png",
                        "large": "argentwatchman.large.png"
                    },
                    "expansion": "The Grand Tournament",
                    "id": "55d4cf525ba9316411bc1650"
                }
            },
            {
                "cardId": "54131ec5df6bb6fc15b761de",
                "cardQuantity": 1,
                "card": {
                    "name": "Bloodsail Raider",
                    "cost": 2,
                    "rarity": "Common",
                    "race": "Pirate",
                    "playerClass": "Neutral",
                    "text": "Battlecry: Gain Attack equal to the Attack of your weapon.",
                    "mechanics": [
                        "Battlecry"
                    ],
                    "cardType": "Minion",
                    "photoNames": {
                        "small": "Bloodsail-Raider.small.png",
                        "medium": "bloodsailraider.medium.png",
                        "large": "bloodsailraider.large.png"
                    },
                    "expansion": "Basic",
                    "id": "54131ec5df6bb6fc15b761de"
                }
            },
            {
                "cardId": "55d4ce6f5ba9316411bc164a",
                "cardQuantity": 1,
                "card": {
                    "name": "Flame Juggler",
                    "cost": 2,
                    "rarity": "Common",
                    "race": "",
                    "playerClass": "Neutral",
                    "text": "Battlecry: Deal 1 damage to a random enemy.",
                    "mechanics": [
                        "Battlecry"
                    ],
                    "cardType": "Minion",
                    "photoNames": {
                        "small": "flame-juggler.small.png",
                        "medium": "flamejuggler.medium.png",
                        "large": "flamejuggler.large.png"
                    },
                    "expansion": "The Grand Tournament",
                    "id": "55d4ce6f5ba9316411bc164a"
                }
            },
            {
                "cardId": "54132f40df6bb6fc15b76212",
                "cardQuantity": 2,
                "card": {
                    "name": "Frostwolf Grunt",
                    "cost": 2,
                    "rarity": "Basic",
                    "race": "",
                    "playerClass": "Neutral",
                    "text": "Taunt",
                    "mechanics": [
                        "Taunt"
                    ],
                    "cardType": "Minion",
                    "photoNames": {
                        "small": "Frostwolf-Grunt.small.png",
                        "medium": "frostwolfgrunt.medium.png",
                        "large": "frostwolfgrunt.large.png"
                    },
                    "expansion": "Basic",
                    "id": "54132f40df6bb6fc15b76212"
                }
            },
            {
                "cardId": "56413caa57d86d620a14927e",
                "cardQuantity": 2,
                "card": {
                    "name": "Jeweled Scarab",
                    "cost": 2,
                    "rarity": "Common",
                    "race": "Beast",
                    "playerClass": "Neutral",
                    "text": "Battlecry: Discover a 3-cost card.",
                    "mechanics": [
                        "Battlecry",
                        "Discover"
                    ],
                    "cardType": "Minion",
                    "photoNames": {
                        "small": "jeweledscarab.small.png",
                        "medium": "jeweldscarab.medium.png",
                        "large": "jeweldscarab.large.png"
                    },
                    "expansion": "League of Explorers",
                    "id": "56413caa57d86d620a14927e"
                }
            },
            {
                "cardId": "5412371c6c69d76c280ea79b",
                "cardQuantity": 1,
                "card": {
                    "name": "Knife Juggler",
                    "cost": 2,
                    "rarity": "Rare",
                    "race": "",
                    "playerClass": "Neutral",
                    "text": "After you summon a minion, deal 1 damage to a random enemy.",
                    "mechanics": [],
                    "cardType": "Minion",
                    "photoNames": {
                        "small": "Knife-Juggler.small.png",
                        "medium": "knifejuggler.medium.png",
                        "large": "knifejuggler.large.png"
                    },
                    "expansion": "Basic",
                    "id": "5412371c6c69d76c280ea79b"
                }
            },
            {
                "cardId": "5413313fdf6bb6fc15b7621b",
                "cardQuantity": 1,
                "card": {
                    "name": "Kobold Geomancer",
                    "cost": 2,
                    "rarity": "Basic",
                    "race": "",
                    "playerClass": "Neutral",
                    "text": "Spell Damage +1",
                    "mechanics": [
                        "Spell Damage"
                    ],
                    "cardType": "Minion",
                    "photoNames": {
                        "small": "Kobold-Geomancer.small.png",
                        "medium": "koboldgeomancer.medium.png",
                        "large": "koboldgeomancer.large.png"
                    },
                    "expansion": "Basic",
                    "id": "5413313fdf6bb6fc15b7621b"
                }
            },
            {
                "cardId": "5411d7a29d2333d418373dbd",
                "cardQuantity": 1,
                "card": {
                    "name": "Duplicate",
                    "cost": 3,
                    "rarity": "Common",
                    "race": "",
                    "playerClass": "Mage",
                    "text": "Secret: When a friendly minion dies, put 2 copies of it into your hand.",
                    "mechanics": [
                        "Secret"
                    ],
                    "cardType": "Spell",
                    "photoNames": {
                        "small": "Duplicate.small.png",
                        "medium": "dupe.medium.png",
                        "large": "dupe.large.png"
                    },
                    "expansion": "Naxxramas",
                    "id": "5411d7a29d2333d418373dbd"
                }
            },
            {
                "cardId": "56413abd7ec357cd11c77e60",
                "cardQuantity": 1,
                "card": {
                    "name": "Forgotten Torch",
                    "cost": 3,
                    "rarity": "Common",
                    "race": "",
                    "playerClass": "Mage",
                    "text": "Deal 3 damage. Shuffle a 'Roaring Torch' into your deck that deals 6 damage.",
                    "mechanics": [],
                    "cardType": "Spell",
                    "photoNames": {
                        "small": "forgottentoarch.small.png",
                        "medium": "forgtor.medium.png",
                        "large": "forgtor.large.png"
                    },
                    "expansion": "League of Explorers",
                    "id": "56413abd7ec357cd11c77e60"
                }
            },
            {
                "deckId": null,
                "cardId": "5411d4439d2333d418373db3",
                "cardQuantity": 1,
                "card": {
                    "name": "Frost Nova",
                    "cost": 3,
                    "rarity": "Basic",
                    "race": "",
                    "playerClass": "Mage",
                    "text": "Freeze all enemy minions.",
                    "mechanics": [
                        "Freeze"
                    ],
                    "cardType": "Spell",
                    "photoNames": {
                        "small": "Frost-Nova.small.png",
                        "medium": "frostno.medium.png",
                        "large": "frostno.large.png"
                    },
                    "expansion": "Basic",
                    "id": "5411d4439d2333d418373db3"
                }
            },
            {
                "deckId": null,
                "cardId": "55d4c5995ba9316411bc161c",
                "cardQuantity": 2,
                "card": {
                    "name": "Polymorph: Boar",
                    "cost": 3,
                    "rarity": "Rare",
                    "race": "",
                    "playerClass": "Mage",
                    "text": "Transform a minion into a 4/2 Boar with Charge.",
                    "mechanics": [],
                    "cardType": "Spell",
                    "photoNames": {
                        "small": "polymorph-boar.small.png",
                        "medium": "polymb.medium.png",
                        "large": "polymb.large.png"
                    },
                    "expansion": "The Grand Tournament",
                    "id": "55d4c5995ba9316411bc161c"
                }
            },
            {
                "deckId": null,
                "cardId": "55189ab3e871fbfa03a2be47",
                "cardQuantity": 1,
                "card": {
                    "name": "Flamewaker",
                    "cost": 3,
                    "rarity": "Rare",
                    "race": "",
                    "playerClass": "Mage",
                    "text": "After you cast a spell, deal 2 damage randomly split among all enemies.",
                    "mechanics": [],
                    "cardType": "Minion",
                    "photoNames": {
                        "small": "flamewalker.small.png",
                        "medium": "flamewa.medium.png",
                        "large": "flamewa.large.png"
                    },
                    "expansion": "Blackrock Mountain",
                    "id": "55189ab3e871fbfa03a2be47"
                }
            },
            {
                "deckId": null,
                "cardId": "55d4f7ae029adae01f2621be",
                "cardQuantity": 1,
                "card": {
                    "name": "Spellslinger",
                    "cost": 3,
                    "rarity": "Common",
                    "race": "",
                    "playerClass": "Mage",
                    "text": "Battlecry: Add a random spell to each player's hand.",
                    "mechanics": [
                        "Battlecry"
                    ],
                    "cardType": "Minion",
                    "photoNames": {
                        "small": "spellslinger.small.png",
                        "medium": "spellslin.medium.png",
                        "large": "spellslin.large.png"
                    },
                    "expansion": "The Grand Tournament",
                    "id": "55d4f7ae029adae01f2621be"
                }
            },
            {
                "deckId": null,
                "cardId": "5411d70f9d2333d418373dbb",
                "cardQuantity": 1,
                "card": {
                    "name": "Fireball",
                    "cost": 4,
                    "rarity": "Basic",
                    "race": "",
                    "playerClass": "Mage",
                    "text": "Deal 6 damage.",
                    "mechanics": [],
                    "cardType": "Spell",
                    "photoNames": {
                        "small": "Fireball.small.png",
                        "medium": "fireb.medium.png",
                        "large": "fireb.large.png"
                    },
                    "expansion": "Basic",
                    "id": "5411d70f9d2333d418373dbb"
                }
            },
            {
                "deckId": null,
                "cardId": "5641231157d86d620a14926d",
                "cardQuantity": 2,
                "card": {
                    "name": "Animated Armor",
                    "cost": 4,
                    "rarity": "Rare",
                    "race": "",
                    "playerClass": "Mage",
                    "text": "",
                    "mechanics": [],
                    "cardType": "Minion",
                    "photoNames": {
                        "small": "animatedarmor.small.png",
                        "medium": "ancienta.medium.png",
                        "large": "ancienta.large.png"
                    },
                    "expansion": "League of Explorers",
                    "id": "5641231157d86d620a14926d"
                }
            },
            {
                "deckId": null,
                "cardId": "5480c185a83149a83651081a",
                "cardQuantity": 1,
                "card": {
                    "name": "Goblin Blastmage",
                    "cost": 4,
                    "rarity": "Rare",
                    "race": "",
                    "playerClass": "Mage",
                    "text": "Battlecry: If you control a Mech, deal 4 damage randomly split among enemy characters.",
                    "mechanics": [
                        "Battlecry"
                    ],
                    "cardType": "Minion",
                    "photoNames": {
                        "small": "Goblin-Battlemage.small.png",
                        "medium": "gobblast.medium.png",
                        "large": "gobblast.large.png"
                    },
                    "expansion": "Goblins Vs. Gnomes",
                    "id": "5480c185a83149a83651081a"
                }
            },
            {
                "deckId": null,
                "cardId": "5641395b7ec357cd11c77e5e",
                "cardQuantity": 2,
                "card": {
                    "name": "Ethereal Conjurer",
                    "cost": 5,
                    "rarity": "Common",
                    "race": "",
                    "playerClass": "Mage",
                    "text": "Battlecry: Discover a spell.",
                    "mechanics": [
                        "Battlecry",
                        "Discover"
                    ],
                    "cardType": "Minion",
                    "photoNames": {
                        "small": "etherialconjurer.small.png",
                        "medium": "ethconj.medium.png",
                        "large": "ethconj.large.png"
                    },
                    "expansion": "League of Explorers",
                    "id": "5641395b7ec357cd11c77e5e"
                }
            }
        ],
        "heroName": "",
        "playerClass": "Mage",
        "createdDate": "2016-01-26T22:39:11.224Z",
        "premium": {
            "isPremium": false,
            "expiryDate": "2016-02-26T22:39:11.224Z"
        },
        "comments": [],
        "slug": "",
        "isFeatured": false,
        "isPublic": true,
        "voteScore": 1,
        "votes": [],
        "mulligans": [
            {
                "className": "Druid",
                "mulligansWithoutCoin": [],
                "mulligansWithCoin": [],
                "instructionsWithCoin": "",
                "instructionsWithoutCoin": ""
            },
            {
                "className": "Hunter",
                "mulligansWithoutCoin": [],
                "mulligansWithCoin": [],
                "instructionsWithCoin": "",
                "instructionsWithoutCoin": ""
            },
            {
                "className": "Mage",
                "mulligansWithoutCoin": [],
                "mulligansWithCoin": [],
                "instructionsWithCoin": "",
                "instructionsWithoutCoin": ""
            },
            {
                "className": "Paladin",
                "mulligansWithoutCoin": [],
                "mulligansWithCoin": [],
                "instructionsWithCoin": "",
                "instructionsWithoutCoin": ""
            },
            {
                "className": "Priest",
                "mulligansWithoutCoin": [],
                "mulligansWithCoin": [],
                "instructionsWithCoin": "",
                "instructionsWithoutCoin": ""
            },
            {
                "className": "Rogue",
                "mulligansWithoutCoin": [],
                "mulligansWithCoin": [],
                "instructionsWithCoin": "",
                "instructionsWithoutCoin": ""
            },
            {
                "className": "Shaman",
                "mulligansWithoutCoin": [],
                "mulligansWithCoin": [],
                "instructionsWithCoin": "",
                "instructionsWithoutCoin": ""
            },
            {
                "className": "Warlock",
                "mulligansWithoutCoin": [],
                "mulligansWithCoin": [],
                "instructionsWithCoin": "",
                "instructionsWithoutCoin": ""
            },
            {
                "className": "Warrior",
                "mulligansWithoutCoin": [],
                "mulligansWithCoin": [],
                "instructionsWithCoin": "",
                "instructionsWithoutCoin": ""
            }
        ],
        "$$hashKey": "object:64"
    }
]
