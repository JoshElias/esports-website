module.exports = function(RedbullPack) {


    RedbullPack.seedPacks = function(uid, finalCb) {

        var Card = RedbullTournament.app.models.card;
        var RedbullExpansion = RedbullTournament.app.models.redbullExpansion;

        async.waterfall([
            // Get all cards that can be put into a deck
            function (seriesCb) {
                Card.find({deckable: true, isActive: true}, seriesCb);
            },
            // Organize cards into expansion
            function (cards, seriesCb) {

                // Declare vars outside of for loop
                var cardIndex = cards.length;
                var sortedCards = {};
                var expansion;
                var rarity;
                var card;

                while (cardIndex--) {
                    card = cards[cardIndex];
                    rarity = card.rarity.toLowerCase();
                    expansion = (rarity === "basic")
                        ? "Soulbound" : card.expansion;

                    if (!sortedCards[expansion]) {
                        sortedCards[expansion] = {};
                    }
                    if (!sortedCards[expansion][rarity]) {
                        sortedCards[expansion][rarity] = [];
                    }

                    sortedCards[expansion][rarity].push(card);
                }

                return seriesCb(undefined, sortedCards);
            },
            // Get all the expansions
            function (sortedCards, seriesCb) {
                RedbullExpansion.find({
                        where: {isActive: true}, /*fields:{numOfPacks:true},*/
                        include: ["rarityChances"]
                    }, function (err, expansions) {
                        return seriesCb(err, sortedCards, expansions);
                    }
                );
            },
            // Generate Packs
            function (sortedCards, expansions, seriesCb) {
                generatePacks(sortedCards, expansions, seriesCb);
            }
        ], finalCb);

        return finalCb.promise;
    };


    function generatePacks(sortedPacks, expansions, finalCb) {
        var clientResult = {};

        // Generate packs for each expansion
        async.eachSeries(expansions, function (expansion, expansionCb) {
            var expansionJSON = expansion.toJSON();
            clientResult[expansionJSON.name] = expansionJSON;
            clientResult[expansionJSON.name].packs = [];
            async.timesSeries(expansionJSON.numOfPacks, function (packNum, packNumCb) {
                var expansionCards = sortedPacks[expansionJSON.name];
                generatePack(expansionCards, expansionJSON, packNum, function (err, newPack) {
                    if (err) return packNumCb(err);
                    clientResult[expansion.name].packs.push(newPack);
                    return packNumCb();
                });
            }, expansionCb);
        }, function (err) {
            return finalCb(err, clientResult);
        });
    }


    function generatePack(cards, expansion, packNum, finalCb) {
        var RedbullPack = RedbullTournament.app.models.redbullPack;

        // General Pack data
        var packData = {
            orderNum: packNum,
            redbullExpansionId: expansion.id,
            ownerId: uid
        };

        // Get the rarity chances for this packs
        var rarityChances = {};
        var rarityChanceIndex = expansion.rarityChances.length;
        while (rarityChanceIndex--) {
            var rarityChance = expansion.rarityChances[rarityChanceIndex];
            rarityChances[rarityChance.rarity] = rarityChance.percentage;
        }
        var rareThreshold = (rarityChances.basic + rarityChances.common);
        var rareChance = rarityChanceIndex.rare;

        // Generate the Rolls for the pack and shuffle
        var packRolls = generatePackRolls(rareThreshold, rareChance);
        packRolls = shufflePack(packRolls);

        // Start Creating the Pack
        RedbullPack.create(packData, function (err, newPack) {
            if (err) return finalCb(err);

            var newPackJSON = newPack.toJSON();
            newPackJSON.cards = [];
            newPackJSON.className = expansion.className;
            newPackJSON.expansionName = expansion.name;

            // Each roll should correspond to a card
            async.forEachOfSeries(packRolls, function (packRollVal, packRollKey, packRollCb) {
                var rolledCard = getCardFromRoll(packRollVal, rarityChances, cards);

                newPack.packCards.create({
                    orderNum: packRollKey,
                    cardId: rolledCard.id,
                    redbullExpansionId: expansion.id
                }, function (err, newPackCard) {
                    if (err) return packRollCb(err);

                    // Add order number just in case the client needs to re-order
                    rolledCard.orderNum = newPackCard.orderNum;
                    newPackJSON.cards.push(rolledCard);
                    return packRollCb();
                });
            }, function (err) {
                return finalCb(err, newPackJSON);
            });
        });
    }

    function generatePackRolls(rareThreshold, rareChance) {
        var addRare = false;

        var packRolls = [];
        var cardIndex = NUM_CARD_PER_PACK;
        while (cardIndex--) {
            packRolls[cardIndex] = getRandomInt(1, 100);
            if (packRolls[cardIndex] > rareThreshold) {
                addRare = true;
            }

            if (cardIndex === 4 && !addRare && rareChance) {
                packRolls[cardIndex] += 100;
            }
        }
        return packRolls;
    }

    function shufflePack(packRolls) {
        for (var j, x, i = packRolls.length; i; j = parseInt(Math.random() * i), x = packRolls[--i], packRolls[i] = packRolls[j], packRolls[j] = x);
        return packRolls;
    }

    function getRandomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    function getCardFromRoll(roll, chances, cards) {
        var start = 0;
        var cardPool = [];
        var randomCard;
        var rolledCard;

        if (!chances) { /* TODO: ERROR */
        }

        // basic
        if (chances.basic > 0 && ((roll > start && roll <= chances.basic) || ( chances.basic === 100 ))) {
            cardPool = cards.basic;
        }
        start += chances.basic;

        // common
        if ((chances.common > 0 && roll > start && roll <= (chances.common + start)) || chances.common === 100) {
            cardPool = cards.common;
        }
        start += chances.common;

        // rare
        // TODO: POSSIBLE BUG IF RARE CHANCE IS 0% AND LAST CARD NEEDED TO BE AT LEAST RARE
        if ((chances.rare > 0 && ((roll > start && roll <= (chances.rare + start)) || roll > 100)) || chances.rare === 100) {
            cardPool = cards.rare;
        }
        start += chances.rare;

        // epic
        if ((chances.epic > 0 && roll > start && roll <= (chances.epic + start)) || chances.epic === 100) {
            cardPool = cards.epic;
        }
        start += chances.epic;

        // legendary
        if ((chances.legendary > 0 && roll > start && roll <= (chances.legendary + start)) || chances.legendary === 100) {
            cardPool = cards.legendary;
        }

        // assign random card from pool
        randomCard = getRandomInt(0, cardPool.length - 1);
        rolledCard = cardPool[randomCard];

        return rolledCard;
    }
}