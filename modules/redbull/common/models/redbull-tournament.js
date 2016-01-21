var async = require("async");
var utils = require("./../../../../lib/utils");


module.exports = function(RedbullTournament) {

    RedbullTournament.seedPacks = function(uid, options, finalCb) {
        if (finalCb === undefined && typeof options === 'function') {
            // createAccessToken(ttl, cb)
            finalCb = options;
            options = undefined;
        }
        finalCb = finalCb || utils.createPromiseCallback();


        var Card = RedbullTournament.app.models.card;
        var RedbullExpansion = RedbullTournament.app.models.redbullExpansion;


        async.waterfall([
            // Get all cards that can be put into a deck
            function(seriesCb) {
                Card.find({deckable: true, isActive: true}, seriesCb);
            },
            // Organize cards into expansion
            function(cards, seriesCb) {
                console.log("num of cards", cards.length);
                // Declare vars outside of forloop
                var cardIndex = cards.length;
                var sortedCards = {};
                var expansion;
                var rarity;
                var card;

                while(--cardIndex) {
                    card = cards[cardIndex];
                    rarity = card.rarity.toLowerCase();
                    expansion = (rarity === "basic")
                        ? "Soulbound" : card.expansion;

                    if(!sortedCards[expansion]){
                        sortedCards[expansion] = {};
                    }
                    if(!sortedCards[expansion][rarity]) {
                        sortedCards[expansion][rarity] = [];
                    }

                    sortedCards[expansion][rarity].push(card);
                }

                return seriesCb(undefined, sortedCards);
            },
            // Get number of packs that will be generated
            function(sortedCards, seriesCb) {

                RedbullExpansion.find({isActive:true},
                    {fields:{numOfPacks:true}, include:"rarityChances"}, seriesCb); /*function(err, expansions) {
                        if (err) return seriesCb(err);

                        console.log("expansions count:", expansions.length);
                        var numOfPacks = 0;
                        for(var key in expansions) {
                            var expansion = expansions[key];
                          console.log("expansion:", expansion);
                            if(typeof expansion.numOfPacks !== "number") {
                                continue;
                            }
                            numOfPacks += expansion.numOfPacks;
                        }
                        return seriesCb(undefined, numOfPacks);

                    }
                );*/
            },
            // Generate Pack Rolls
            function(expansions, seriesCb) {

                for(var key in expansions) {
                    var expansion = expansions[key];

                    // Iterate over each expansions numOfPacks
                    var packIndex = expansion.numOfPacks;
                    while(--packIndex) {

                        // Get the chance for
                        var rarityChances = {};
                        var rarityChanceIndex = expansion.rarityChances.length;
                        while(--rarityChanceIndex) {
                            var rarityChance = expansion.rarityChances[rarityChanceIndex];
                            rarityChances[rarityChance.rarity] = rarityChance.percentage;
                        }
                        var rareThreshold = (rarityChances.basic + rarityChances.common);



                    }
                }
/*
                var packs = [];

                for (var i = 0; i < this.numberPacks; i++) {
                    packs.push(this.generatePackRolls(i));
                }

                console.log("packs with roles:", packs);
                this.packsWithRolls = packs;

                // Per Pack
                var rolls = [],
                    expansion = this.packsWithExpansions[packNum],
                    rareThreshold = this.getRareThreshold(expansion),
                    hasRare = this.getExpansionChances(expansion).rare,
                    rarePlus = false;

                for (var i = 0; i < 5; i++) {
                    rolls[i] = this.getRandomInt(1, 100);
                    if (rolls[i] > rareThreshold) {
                        rarePlus = true;
                    }

                    if (i === 4 && !rarePlus && hasRare) {
                        rolls[i] += 100;
                    }
                }

                console.log("pack rolls:", rolls);
                return this.shufflePack(rolls);
                */
            }
        ], function(err) {
            if(err) console.log("Error seeding:", err);
            return finalCb(err);
        });

        return finalCb.promise;
    }



    RedbullTournament.remoteMethod(
        'seedPacks',
        {
            description: "Seeds new cards, sorts them into packs and returns it",
            accepts: [
                {arg: 'uid', type: 'string', required:true, http: {source: 'query'}},
                {arg: 'options', type: 'object', required:false, http: {source: 'query'}}
            ],
            returns: {arg: 'packs', type: 'array'},
            http: {verb: 'get'},
            isStatic: true
        }
    );
};
