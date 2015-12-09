angular.module('redbull.services')
.factory('DraftPacks', ['Hearthstone', 'Util',
    function (Hearthstone, Util) {
        function DraftPacks (cards, tournament) {
            this.cards = cards;
            //this.tournament = tournament;
            this.tournament = {
                packs: [
                    {
                        expansion: 'Soulbound',
                        packs: 10,
                        chances: {
                            basic: 100,
                            common: 0,
                            rare: 0,
                            epic: 0,
                            legendary: 0
                        }
                    },
                    {
                        expansion: 'Basic',
                        packs: 10,
                        chances: {
                            basic: 0,
                            common: 74,
                            rare: 21,
                            epic: 4,
                            legendary: 1
                        }
                    },
                    {
                        expansion: 'Naxxramas',
                        packs: 5,
                        chances: {
                            basic: 0,
                            common: 74,
                            rare: 21,
                            epic: 4,
                            legendary: 1
                        }
                    },
                    {
                        expansion: 'Goblins Vs. Gnomes',
                        packs: 10,
                        chances: {
                            basic: 0,
                            common: 74,
                            rare: 21,
                            epic: 4,
                            legendary: 1
                        }
                    },
                    {
                        expansion: 'Blackrock Mountain',
                        packs: 5,
                        chances: {
                            basic: 0,
                            common: 74,
                            rare: 25,
                            epic: 0,
                            legendary: 1
                        }
                    },
                    {
                        expansion: 'The Grand Tournament',
                        packs: 9,
                        chances: {
                            basic: 0,
                            common: 74,
                            rare: 21,
                            epic: 4,
                            legendary: 1
                        }
                    },
                    {
                        expansion: 'League of Explorers',
                        packs: 5,
                        chances: {
                            basic: 0,
                            common: 74,
                            rare: 21,
                            epic: 4,
                            legendary: 1
                        }
                    },
                ]
            };
            
            this.numberPacks = 0;
            this.packsWithRolls = [];
            this.packsWithExpansions = [];
            this.packsWithCards = [];
            this.cardsSorted = [];
        }
        
        DraftPacks.getPacks = function( cards, tournament ) {
            var draftPacks = new DraftPacks( cards, tournament );
            return draftPacks.load();
        };
        
        DraftPacks.prototype = {
            constructor: DraftPacks,
            // ---
            // PUBLIC METHODS.
            // ---
            load: function () {
                // sort cards
                this.sortCards();
                
                // calculate how many packs in the draft
                this.calculateNumberOfPacks();
                
                // generate packs rolls
                this.generatePacksRolls();
                
                // assign expansions to packs
                this.generatePacksWithExpansions();
                
                // generate packs with cards
                this.generatePacksWithCards();
                
                // return packs
                return this.packsWithCards;
            },
            // ---
            // PRIVATE METHODS.
            // ---
            getRandomInt: function (min, max) {
                return Math.floor(Math.random() * (max - min + 1)) + min;
            },
            shufflePack: function (o) {
                for (var j, x, i = o.length; i; j = parseInt(Math.random() * i), x = o[--i], o[i] = o[j], o[j] = x);
                return o;
            },
            generatePackRolls: function () {
                var rolls = [],
                    rarePlus = false;

                for (var i = 0; i < 5; i++) {
                    rolls[i] = this.getRandomInt(1, 100);
                    if (rolls[i] > 74) {
                        rarePlus = true;
                    }

                    if (i == 4 && !rarePlus) {
                        rolls[i] += 100;
                    }
                }

                return this.shufflePack(rolls);
            },
            calculateNumberOfPacks: function () {
                var numberPacks = 0;
                
                for (var i = 0; i < this.tournament.packs.length; i++) {
                    numberPacks += this.tournament.packs[i].packs;
                }
                
                this.numberPacks = numberPacks;
            },
            generatePacksRolls: function () {
                var packs = [];
                
                for (var i = 0; i < this.numberPacks; i++) {
                    packs.push(this.generatePackRolls());
                }
                
                this.packsWithRolls = packs;
            },
            sortCards: function () {
                var expansions = ['Soulbound'].concat(Hearthstone.expansions),
                    sorted = [],
                    defaultExpansion = {
                        basic: [],
                        common: [],
                        rare: [],
                        epic: [],
                        legendary: []
                    },
                    expansion,
                    rarity,
                    card;
                
                for (var i = 0; i < expansions.length; i++) {
                    sorted[expansions[i]] = angular.copy(defaultExpansion);
                }
                
                for (var i = 0; i < this.cards.length; i++) {
                    expansion = this.cards[i].expansion;
                    rarity    = this.cards[i].rarity.toLowerCase();
                    card      = this.cards[i];
                    
                    if (rarity === 'basic') {
                        sorted['Soulbound'][rarity].push(card);
                    } else {
                        sorted[expansion][rarity].push(card);
                    }
                }
                
                this.cardsSorted = sorted;
            },
            generatePacksWithExpansions: function () {
                var packs = [];
                
                for (var i = 0; i < this.tournament.packs.length; i++) {
                    for (var j = 0; j < this.tournament.packs[i].packs; j++) {
                        packs.push(this.tournament.packs[i].expansion);
                    }
                }
                
                this.packsWithExpansions = packs;
            },
            getExpansionChances: function ( expansion ) {
                for (var i = 0; i < this.tournament.packs.length; i++) {
                    if (this.tournament.packs[i].expansion === expansion) {
                        return this.tournament.packs[i].chances;
                    }
                }
                
                return false;
            },
            generateCardFromRoll: function ( expansion, roll ) {
                var chances = this.getExpansionChances( expansion ),
                    expansionCards = this.cardsSorted[expansion],
                    start = 0,
                    card,
                    pool = [],
                    randomCard;
                
                if (!chances) { /* TODO: ERROR */ }
                
                // basic
                if (chances.basic > 0 && ((roll > start && roll <= chances.basic) || ( chances.basic === 100 ))) {
                    pool = expansionCards.basic;
                }
                start += chances.basic;
                
                // common
                if (chances.common > 0 && roll > start && roll <= (chances.common + start)) {
                    pool = expansionCards.common;
                }
                start += chances.common;
                
                // rare
                // TODO: POSSIBLE BUG IF RARE CHANCE IS 0% AND LAST CARD NEEDED TO BE AT LEAST RARE
                if (chances.rare > 0 && ((roll > start && roll <= (chances.rare + start)) || roll > 100)) {
                    pool = expansionCards.rare;
                }
                start += chances.rare;
                
                // epic
                if (chances.epic > 0 && roll > start && roll <= (chances.epic + start)) {
                    pool = expansionCards.epic;
                }
                start += chances.epic;
                
                // legendary
                if (chances.legendary > 0 && roll > start && roll <= (chances.legendary + start)) {
                    pool = expansionCards.legendary;
                }
                
                // assign random card from pool
                randomCard = this.getRandomInt(0, pool.length - 1);
                card = pool[randomCard];
                
                if (card === undefined) {
                    console.log('expansion: ', expansion);
                    console.log('chances: ', chances);
                    console.log('expansionCards: ', expansionCards);
                    console.log('randomCard: ', randomCard);
                    console.log('pool: ', pool);
                    console.log('pool[randomCard]: ', pool[randomCard]);
                    console.log('card: ', card);
                }
                
                return card;
            },
            generatePackFromRolls: function ( expansion, rolls ) {
                var pack = [],
                    card;
                
                for (var i = 0; i < rolls.length; i++) {
                    card = this.generateCardFromRoll( expansion, rolls[i] );
                    pack.push(card);
                }
                
                return {
                    expansion: expansion,
                    cards: pack,
                    expansionClass: Util.slugify(expansion)
                };
            },
            generatePacksWithCards: function () {
                var packs = {},
                    expansion,
                    packWithRoll,
                    packWithExpansion;
                
                // create expansions
                for (var i = 0; i < this.tournament.packs.length; i++) {
                    if (this.tournament.packs[i].packs > 0) {
                        expansion = this.tournament.packs[i].expansion;
                        packs[expansion] = {
                            expansion: expansion,
                            packs: [],
                            expansionClass: Util.slugify(expansion)
                        };
                    }
                }
                
                // add packs to expansions
                for (var i = 0; i < this.numberPacks; i++) {
                    packWithRoll = this.packsWithRolls[i];
                    packWithExpansion = this.packsWithExpansions[i];
                    
                    packs[packWithExpansion].packs.push( this.generatePackFromRolls( packWithExpansion, packWithRoll ) );
                }
                
                this.packsWithCards = packs;
            }
        };
        
        return DraftPacks;
    }
]);