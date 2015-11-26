angular.module('redbull.services')
.factory('DraftPacks', ['Hearthstone',
    function (Hearthstone) {
        function DraftPacks (cards, tournament) {
            this.cards = cards;
            //this.tournament = tournament;
            this.tournament = {
                packs: [
                    {
                        expansion: 'Basic',
                        packs: 10,
                        chances: {
                            basic: 30,
                            common: 44,
                            rare: 21,
                            epic: 4,
                            legendary: 1
                        }
                    },
                    {
                        expansion: 'Naxxramas',
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
                        expansion: 'The Grand Tournament',
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
                        expansion: 'League of Explorers',
                        packs: 10,
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
                var expansions = Hearthstone.expansions,
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
                    
                    sorted[expansion][rarity].push(card);
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
                    pool,
                    randomCard;
                
                if (!chances) { /* TODO: ERROR */ }
                
                // basic
                if (chances.basic > 0 && roll > start && roll <= chances.basic) {
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
                
                return card;
            },
            generatePackFromRolls: function ( expansion, rolls ) {
                var pack = [],
                    card;
                
                for (var i = 0; i < rolls.length; i++) {
                    card = this.generateCardFromRoll( expansion, rolls[i] );
                    pack.push(card);
                }
                
                return pack;
            },
            generatePacksWithCards: function () {
                var packs = [];
                
                for (var i = 0; i < this.numberPacks; i++) {
                    packs.push( this.generatePackFromRolls( this.packsWithExpansions[i], this.packsWithRolls[i] ) );
                }
                
                this.packsWithCards = packs;
            }
        };
        
        return DraftPacks;
    }
]);