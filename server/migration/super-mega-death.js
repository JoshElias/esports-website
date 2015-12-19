var async = require("async");
var server;

module.exports = function(_server) {
    var startTime = Date.now();
   server = _server;

    async.series([
        addMissingTalent,
        createAbilitiesAndTalents,
        assignGameTypeMode,
        createPollItems,
        createForumModels,
        associateCommentReplies,
        associateRelatedArticles,
        createDeckCards,
        associateGuideHeroes,
        associateGuideMaps,
        associateGuideComments,
        createMulliganModels,
        createSnapshotModels,
        createUserIdentities,
        createUserRoles,
        //createRedbullExpansions
    ],
    function(err) {
        console.log("Finished in ", convertMillisecondsToDigitalClock(Date.now() - startTime));
        if(err) {
            console.log("error with super mega death script:", err);
            console.log(err.stack);
        }
        else console.log("Donnerino");
    });
};


function convertMillisecondsToDigitalClock(ms) {
    hours = Math.floor(ms / 3600000), // 1 Hour = 36000 Milliseconds
        minutes = Math.floor((ms % 3600000) / 60000), // 1 Minutes = 60000 Milliseconds
        seconds = Math.floor(((ms % 360000) % 60000) / 1000) // 1 Second = 1000 Milliseconds
    return {
        hours : hours,
        minutes : minutes,
        seconds : seconds,
        clock : hours + ":" + minutes + ":" + seconds
    };
}


var missingTalentId;
function addMissingTalent(finalCb) {
    var Talent = server.models.talent;

    var missingTalent = {
        className: "__missing",
        name: "__missing",
        description: "__missing",
        orderNum: 0
    };

    Talent.upsert(missingTalent, function(err, instance) {
        if(!err) console.log("upserted missing talent:", instance);
        missingTalentId = instance.id.toString();
        finalCb(err);
    });
}




var properTalents = {
    "Vampiric Strike": "Basic Attacks heal for 25% of the damage dealt to the primary target.",
    "Nexus": "Frenzy: Increase Attack Speed by 20% and Attack Range by 20%.",
    "Calldown: MULE": "Activate to calldown a Mule that repairs Structures, one at a time, near target point for 40 seconds, healing for 100 Health every 1 second. Grants 1 ammo every 5 seconds.",
    "Cleanse": "Activate to remove all stuns, roots, silences, and slows from the target and reduce the duration of their reapplication by 50% for 2 seconds.",
    "Block": "Every 5 seconds, you can Block a Basic Attack from an enemy Hero reducing its damage by 50%. Stores up to 2 charges.",
    "Stoneskin": "Activate to gain 30% of your Maximum Health as a Shield for 5 seconds.",
    "Scouting Drone": "Places a Scouting Drone at target location, revealing a large area around it for 45 seconds. This drone cannot be hidden and is killed by enemies with 2 Basic Attacks. Stores up to 2 charges.",
    "Healing Ward": "Activate to place a ward on the ground that heals allies in an area for 2% of their max Health every second for 10 seconds.",
    "Envenom": "Activate to poison an enemy Hero, dealing 352 damage over 10 seconds.",
    "Relentless": "Reduce the duration of silences, stuns, slows, and roots against your Hero by 50%.",
    "Burning Rage": "Deal 23 damage per second to nearby enemies.",
    "Amplified Healing": "Increases regeneration effects and all healing received by 30%.",
    "Hardened Focus": "While above 80% life, your Basic Ability cooldowns regenerate 50% faster.",
    "Conjurer's Pursuit": "Collecting Regeneration Globes permanently increases Mana Regeneration by 0.1 per second.",
    "Follow Through": "After using an ability, your next basic attack within 6 seconds deals 40% additional damage.",
    "Seasoned Marksman": "For every 6 enemy Minions or captured Mercenary kills near your Hero, gain 1 Basic Attack damage. Hero Takedowns count as 3 Minion kills.",
    "Spell Shield": "Upon taking Ability Damage, reduce that damage and further Ability Damage by 50% for 3 seconds. Can only trigger once every 30 seconds.",
    "Battle Momentum": "Basic Attacks reduce ability cooldowns by 0.5 seconds.",
    "Ice Block": "Activate to place yourself in Stasis and gain Invulnerability for 3 seconds.",
    "Storm Shield": "Activate to give all nearby allied heroes a Shield for 20% of their max health for 3 seconds.",
    "Hardened Shield": "Activate to reduce damage taken by 75% for 4 seconds.",
    "Bolt of the Storm": "Activate to teleport to a nearby location.",
    "Rewind": "Activate to reset the cooldowns of your Basic Abilities.",
    "Fury of the Storm": "Every 5 seconds, your next basic attack will deal an additional 91 damage to the target, and 228 damage to all nearby Minions and Mercenaries."
}

var oldTalents = {};
var oldAbilities = {};
function createAbilitiesAndTalents(finalCb) {

    var Hero = server.models.hero;
    var Talent = server.models.talent;
    var HeroTalent = server.models.heroTalent;
    var Ability = server.models.ability;



    async.waterfall([
        function(seriesCb) {
            Hero.find({}, seriesCb);
        },
        function(heroes, seriesCb) {
            async.eachSeries(heroes, function (hero, heroCb) {


                async.each(hero.oldAbilities, function (ability, abilityCb) {

                    var newAbility = {
                        heroId: hero.id.toString(),
                        name: ability.name,
                        abilityType: ability.abilityType,
                        description: ability.description,
                        className: ability.className,
                        orderNum: ability.orderNum,
                        healing: ability.healing,
                        damage: ability.damage,
                        cooldown: ability.cooldown,
                        mana: ability.mana
                    };

                    Ability.findOne({
                        where: newAbility
                    }, function (err, abilityInstance) {
                        if (err) {
                            return abilityCb(err);
                        } else if (abilityInstance) {
                            oldAbilities[ability._id.toString()] = abilityInstance.id.toString();
                            return abilityCb();
                        }


                        Ability.create(newAbility, function (err, abilityInstance) {
                            if (!err) {
                                console.log("created ability:", abilityInstance);
                                oldAbilities[ability._id.toString()] = abilityInstance.id.toString();
                            }
                            return abilityCb(err);
                        });
                    });
                }, function(err) {
                    if(err) return heroCb(err);

                    async.each(hero.oldTalents, function(talent, talentCb) {

                        function getTalent(talent, getCb) {
                            Talent.findOne({
                                where: {
                                    name: talent.name,
                                    className: talent.className
                                }
                            }, function (err, talentInstance) {
                                if (err) {
                                    return talentCb(err);
                                } else if(talentInstance) {
                                    oldTalents[talent._id.toString()] = talentInstance.id.toString();
                                    return getCb(err, talentInstance);
                                }


                                var newTalent = {
                                    name: talent.name,
                                    className: talent.className
                                }

                                newTalent.description = (properTalents[talent.name])
                                    ? properTalents[talent.name] : talent.description;

                                Talent.create(newTalent, function(err, talentInstance) {
                                    if (!err) {
                                        console.log("created talent:", talentInstance);
                                        oldTalents[talent._id.toString()] = talentInstance.id.toString();
                                    }
                                    return getCb(err, talentInstance);
                                });
                            });
                        }

                        getTalent(talent, function(err, talentInstance) {
                            if (err) {
                                return talentCb(err);
                            }

                            var newHeroTalent = {
                                heroId: hero.id.toString(),
                                talentId: talentInstance.id.toString(),
                                tier: talent.tier,
                                orderNum: talent.orderNum
                            };

                            if(talent.ability) {
                                newHeroTalent.abilityId = oldAbilities[talent.ability.toString()];
                            }

                            HeroTalent.findOne({
                                where: newHeroTalent
                            }, function (err, heroTalentInstance) {
                                if (err) {
                                    return talentCb(err);
                                } else if(heroTalentInstance) {
                                    return talentCb();
                                }

                                HeroTalent.create(newHeroTalent, function(err, heroTalentInstance) {
                                    talentCb(err);
                                });
                            });
                        })
                    }, heroCb);
                })
            }, seriesCb);
        }],
    function(err) {
        finalCb(err);
    });
};

function createForumModels(finalCb) {

    var ForumCategory = server.models.forumCategory;
    var ForumThread = server.models.forumThread;
    var ForumPost = server.models.forumPost;
    var Comment = server.models.comment;

    async.waterfall([

        // Get forumCategories
        function (seriesCallback) {
            ForumCategory.find({}, seriesCallback);
        },
        // Update forumCategoryId  in forumThread
        function (forumCategories, seriesCallback) {
            async.eachSeries(forumCategories, function (forumCategory, innerCallback) {
                async.eachSeries(forumCategory.oldThreads, function (thread, superInnerCallback) {
                    ForumThread.findById(thread.toString(), function (err, forumThread) {
                        if (err) superInnerCallback(err);
                        else if (!forumThread) {
                            console.log("no forumThread found for id:", thread.toString());
                            superInnerCallback();
                        } else {
                            forumThread.updateAttribute("forumCategoryId", forumCategory.id.toString(), function (err) {
                                if(!err) console.log("updated forumCategory:", forumCategory.id);
                                superInnerCallback(err);
                            });
                        }
                    });
                }, innerCallback);
            }, seriesCallback);
        },
        // Get all the forumThreads
        function (seriesCallback) {
            ForumThread.find({}, seriesCallback);
        },
        // Update forumThreadId  in forumPost
        function (forumThreads, seriesCallback) {
            async.eachSeries(forumThreads, function (forumThread, innerCallback) {
                async.eachSeries(forumThread.oldPosts, function (post, superInnerCallback) {
                    ForumPost.findById(post.toString(), function (err, forumPost) {
                        if (err) superInnerCallback(err);
                        else if (!forumPost) {
                            console.log("no forumPost found for id:", post.toString());
                            superInnerCallback();
                        } else {
                            forumPost.updateAttribute("forumThreadId", forumThread.id.toString(), function (err) {
                                if(!err) console.log("updated forumThread:", forumThread.id);
                                superInnerCallback(err);
                            });
                        }
                    });
                }, innerCallback);
            }, seriesCallback);
        },
        // Get all the forumPosts
        function (seriesCallback) {
            ForumPost.find({}, seriesCallback);
        },
        // Update forumPostId  in comments
        function (forumPosts, seriesCallback) {
            async.eachSeries(forumPosts, function (forumPost, innerCallback) {
                //console.log("forumPost comments:", forumPost.comments);
                async.eachSeries(forumPost.oldComments, function (comment, superInnerCallback) {
                    if (!comment) {
                        superInnerCallback();
                        return;
                    }

                    Comment.findById(comment.toString(), function (err, commentInstance) {
                        if (err) superInnerCallback(err);
                        else if (!commentInstance) {
                            console.log("no comment found for id:", comment.toString());
                            superInnerCallback();
                        } else {
                            commentInstance.updateAttribute("forumPostId", forumPost.id.toString(), function (err) {
                                console.log("added forumPostId:", forumPost.id.toString());
                                console.log("to comment:", commentInstance.id.toString())
                                superInnerCallback(err);
                            });
                        }
                    });
                }, innerCallback);
            }, seriesCallback);
        },

    ],
    finalCb);
};

function associateCommentReplies(finalCb) {
    var Comment = server.models.comment;

    Comment.find({}, function(err, comments) {
        if(err) {
            console.log("err finding comments");
            return finalCb(err);
        }

        console.log("comments length:",comments.length);
        async.each(comments, async.ensureAsync(function(comment, callback) {
            console.log("iterating on comment:", comment);
            if(!Array.isArray(comment.oldReplies)) {
                return callback();
            }
            async.each(comment.oldReplies, async.ensureAsync(function(replyId, innerCallback) {
                console.log("iterating on reply:", replyId);
                Comment.updateAll({id:replyId.toString()}, {parentCommentId:comment.id.toString()}, function(err) {
                    if(!err) console.log("added parent ID:"+comment.id.toString()+" to comment:"+replyId.toString());
                    innerCallback(err);
                });
            }), callback);
        }), finalCb);
    });
}

function associateRelatedArticles(finalCb) {
    var Article = server.models.article;

    Article.find({}, function(err, articles) {
        if(err) {
            return finalCb(err);
        }

        async.each(articles, async.ensureAsync(function(article, callback) {
            async.each(article.oldRelatedArticles, async.ensureAsync(function(relatedArticleId, innerCallback) {
                if(!relatedArticleId.toString() || relatedArticleId.toString().length < 1) {
                    return innerCallback();
                }
                Article.findById(relatedArticleId.toString(), function(err, relatedArticleInstance) {
                    if(err || !relatedArticleInstance) innerCallback(err);
                    else {
                        article.relatedArticles.add(relatedArticleInstance, function(err) {
                            if(!err) console.log("added parent ID:"+article.id.toString()+" to relatedArticle:"+relatedArticleId.toString());
                            else console.log("fuck this err:", err);
                            innerCallback();
                        });
                    }
                });
            }), callback);
        }), finalCb)
    });
};


function createDeckCards(finalCb) {
    var Deck = server.models.deck;
    var Card = server.models.card;
    var DeckCard = server.models.deckCard;


    async.waterfall([
        // Get all the users
        function(seriesCallback) {
            console.log("Finding decks");
            Deck.find({}, seriesCallback);
        },
        // Create user identity for each user
        function(decks, seriesCallback) {
            console.log("creating card decks");
            async.eachSeries(decks, function(deck, callback) {
                async.each(deck.oldCards, function(card, innerCallback) {
                    DeckCard.create({
                        cardId: card.card.toString(),
                        deckId: deck.id.toString(),
                        cardQuantity: card.qty
                    }, function(err, newDeckCard) {
                        if(err) console.log(err);
                        else console.log("successfully added DeckCard:", newDeckCard.id);
                        innerCallback(err);
                    });
                }, callback);
            }, seriesCallback);
        }],
    finalCb);
};

// Requires oldTalents!
function associateGuideHeroes(finalCb) {
    var Guide = server.models.guide;
    var Hero = server.models.hero;
    var GuideHero = server.models.guideHero;
    var GuideTalent = server.models.guideTalent;

    console.log("oldTalents:", Object.keys(oldTalents));
    console.log("first talent value:", oldTalents[Object.keys(oldTalents)[0]]);
    async.waterfall([
        // Get all the users
        function(seriesCallback) {
            console.log("Finding users");
            Guide.find({}, seriesCallback);
        },
        // Create user identity for each user
        function(guides, seriesCallback) {
            console.log("creating user identies");
            async.each(guides, function(guide, callback) {
                console.log("old heroes:", guide.oldHeroes);
                async.each(guide.oldHeroes, function(hero, innerCallback) {
                    Hero.findById(hero.hero, function(err, heroInstance) {
                        if(err) innerCallback(err);
                        else {

                            console.log("added hero:", heroInstance.name);
                            console.log("to guide:", guide.name);

                            GuideHero.create({
                                guideId: guide.id.toString(),
                                heroId: heroInstance.id.toString()
                            }, function(err, guideHeroInstance) {
                                if(err) return innerCallback(err);

                                async.forEachOfSeries(hero.talents, function(talent, talentKey, talentCb) {

                                    var tier = talentKey.replace("tier", "");
                                    console.log("tier:", tier);

                                    console.log("looking at talent:", talent.toString());
                                    console.log("talent:", oldTalents[talent.toString()]);
                                    var talentInstanceId = oldTalents[talent.toString()] || missingTalentId;
                                    console.log("talentInstanceId?:", talentInstanceId);

                                    GuideTalent.create({
                                        guideHeroId: guideHeroInstance.id.toString(),
                                        tier: tier,
                                        talentId: talentInstanceId,
                                        guideId: guide.id.toString()
                                    }, function(err) {
                                        talentCb(err);
                                    });
                                }, innerCallback);
                            });
                        }
                    });
                }, callback);
            }, seriesCallback);
        }],
    finalCb);
};

function associateGuideMaps(finalCb) {
    var Guide = server.models.guide;
    var Map = server.models.map;

    async.waterfall([
        // Get all the users
        function(seriesCallback) {
            console.log("Finding users");
            Guide.find({}, seriesCallback);
        },
        // Create user identity for each user
        function(guides, seriesCallback) {
            console.log("creating user identies");
            async.each(guides, function(guide, callback) {
                async.each(guide.oldMaps, function(mapId, innerCallback) {
                    console.log("searching on map name:" , mapId)
                    Map.findOne({where:{id:mapId}}, function(err, mapInstance) {
                        if(err) innerCallback(err);
                        else {
                            console.log("added map Instance:", mapInstance);
                            console.log("to guide:", guide.name);
                            mapInstance.guides.add(guide, function(err) {
                                if(err) console.log(err);
                                innerCallback(err);
                            });
                        }
                    });
                }, callback);
            }, seriesCallback);
        }],
    finalCb);
};

function associateGuideComments(finalCb) {
    var Guide = server.models.guide;
    var Comment = server.models.comment;

    async.waterfall([
        // Get all the users
        function(seriesCallback) {
            console.log("Finding users");
            Guide.find({}, seriesCallback);
        },
        // Create user identity for each user
        function(guides, seriesCallback) {
            console.log("creating user identies");
            async.each(guides, function(guide, callback) {
                async.each(guide.oldComments, function(commentId, innerCallback) {
                    console.log("searching on comment name:" , commentId)
                    Comment.findOne({where:{id:commentId}}, function(err, commentInstance) {
                        if(err) innerCallback(err);
                        else {
                            console.log("added map Instance:", commentInstance);
                            console.log("to guide:", guide.id);
                            commentInstance.updateAttribute("guideId", guide.id, function(err) {
                                if(err) console.log(err);
                                innerCallback(err);
                            });
                        }
                    });
                }, callback);
            }, seriesCallback);
        }],
    finalCb);
};


function createMulliganModels(finalCb) {
    var Deck = server.models.deck;
    var Mulligan = server.models.mulligan;
    var CardWithCoin = server.models.cardWithCoin;
    var CardWithoutCoin = server.models.cardWithoutCoin;


    async.waterfall([
        // Get all the decks
        function(seriesCallback) {
            console.log("Finding decks");
            Deck.find({}, seriesCallback);
        },
        // Create mulligans for each deck
        function(decks, seriesCallback) {
            console.log("creating deck mulligans");
            var mullCount = 0;
            async.each(decks, function(deck, callback) {
                async.each(deck.oldMulligans, async.ensureAsync(function(mulligan, innerCallback) {
                    Mulligan.create({
                        className: mulligan.klass,
                        instructionsWithCoin: mulligan.withCoin.instructions,
                        instructionsWithoutCoin: mulligan.withoutCoin.instructions,
                        deckId: deck.id.toString()
                    }, function(err, newMulligan) {
                        if(err) innerCallback(err);
                        else {
                            console.log("created new mulligan:", mullCount++);
                            mulligan.newMulligan = newMulligan;
                            innerCallback();
                        }
                    });
                }), callback);
            }, function(err) {
                seriesCallback(err, decks);
            });
        },
        // Create CardWithCoin
        function(decks, seriesCallback) {
            console.log("creating cardWithCoin mulligans");
            var count = 0;
            async.each(decks, function(deck, callback) {
                async.each(deck.oldMulligans, function(mulligan, innerCallback) {
                    async.each(mulligan.withCoin.cards, async.ensureAsync(function(cardId, superInnerCallback) {
                        CardWithCoin.create({
                            cardId: cardId.toString(),
                            mulliganId: mulligan.newMulligan.id.toString()
                        }, function(err) {
                            if(err) superInnerCallback(err)
                            else {
                                console.log("created cardwithcoin:", count++);
                                superInnerCallback();
                            }
                        });
                    }), innerCallback)
                }, callback);
            }, function(err) {
                seriesCallback(err, decks)
            });
        },
        // Create CardWithoutCoin
        function(decks, seriesCallback) {
            console.log("creating cardWithoutCoin mulligans");
            var count = 0;
            async.each(decks, function(deck, callback) {
                async.each(deck.oldMulligans, function(mulligan, innerCallback) {
                    async.each(mulligan.withoutCoin.cards, async.ensureAsync(function(cardId, superInnerCallback) {
                        CardWithoutCoin.create({
                            cardId: cardId.toString(),
                            mulliganId: mulligan.newMulligan.id.toString()
                        }, function(err) {
                            if(err) superInnerCallback(err)
                            else {
                                console.log("created cardwithoutcoin:", count++);
                                superInnerCallback();
                            }
                        });
                    }), innerCallback)
                }, callback);
            }, seriesCallback);
        }
    ],
    finalCb);
}


function createSnapshotModels(finalCb) {
    var Snapshot = server.models.snapshot;
    var DeckTier = server.models.deckTier;
    var DeckTech = server.models.deckTech;
    var CardTech = server.models.cardTech;
    var SnapshotAuthor = server.models.snapshotAuthor;
    var DeckMatchup = server.models.deckMatchup;

    async.waterfall([
        // Get all snapshots
        function(seriesCallback) {
            Snapshot.find({}, seriesCallback);
        },
        // Create user identity for each user
        function(snapshots, seriesCallback) {
            async.each(snapshots, function(snapshot, callback) {
                convertSnapshot(snapshot, callback);
            }, seriesCallback);
        }],
    finalCb);

    function convertSnapshot(snapshot, finalCallback) {
        async.waterfall([
                function(seriesCallback) {
                    createDeckTier(snapshot, seriesCallback);
                },
                createDeckTech,
                createCardTech,
                createSnapshotAuthor,
                createDeckMatchup
            ],
            function(err) {
                if(err) console.log(err);
                else console.log("finished processing snapshot");
                finalCallback(err);
            });
    }

    function createDeckTier(snapshot, finalCallback) {
        async.each(snapshot.tiers, function(tier, seriesCallback) {
            async.each(tier.decks, function(deck, innerCallback) {
                try {
                    deck.rank.last.unshift(deck.rank.current);
                    var deckTier = {
                        name: deck.name,
                        description: deck.explanation,
                        weeklyNotes: deck.weeklyNotes,
                        deckId: deck.deck.toString(),
                        snapshotId: snapshot.id.toString(),
                        tier: tier.tier,
                        ranks: deck.rank.last
                    }
                } catch(err) {
                    innerCallback(err);
                }
                DeckTier.create(deckTier, function(err, newDeckTier) {
                    if(err) innerCallback(err);
                    else  {
                        deck.deckTier = newDeckTier;
                        innerCallback();
                    }
                });
            }, seriesCallback);
        }, function(err) {
            finalCallback(err, snapshot);
        });
    }

    function createDeckTech(snapshot, finalCallback) {
        async.each(snapshot.tiers, function(tier, seriesCallback) {
            async.each(tier.decks, function(deck, innerCallback) {
                async.each(deck.tech, function(tech, superInnerCallback) {
                    try {
                        var deckTech = {
                            title: tech.title,
                            orderNum: tech.orderNum,
                            deckId: deck.deck.toString(),
                            deckTierId: deck.deckTier.id.toString()
                        }
                    } catch(err) {
                        superInnerCallback(err);
                    }

                    DeckTech.create(deckTech, function(err, newDeckTech) {
                        if(err) superInnerCallback(err);
                        else {
                            tech.deckTech = newDeckTech;
                            superInnerCallback();
                        }
                    });
                }, innerCallback);
            }, seriesCallback);
        }, function(err) {
            finalCallback(err, snapshot);
        });
    }

    function createCardTech(snapshot, finalCallback) {
        async.each(snapshot.tiers, function(tier, seriesCallback) {
            async.each(tier.decks, function(deck, innerCallback) {
                async.each(deck.tech, function(tech, superInnerCallback) {
                    async.each(tech.cards, function(card, retardedInnerCallback) {
                        try {
                            var cardTech = {
                                cardId: card.card.toString(),
                                orderNum: card.orderNum,
                                both: card.both,
                                toss: card.toss,
                                deckTechId: tech.deckTech.id.toString()
                            }
                        } catch(err) {
                            retardedInnerCallback(err);
                        }

                        CardTech.create(cardTech, function(err, newCardTech) {
                            if(err) retardedInnerCallback(err);
                            else {
                                card.cardTech = newCardTech;
                                retardedInnerCallback();
                            }
                        });
                    }, superInnerCallback);
                }, innerCallback);
            }, seriesCallback);
        }, function(err) {
            finalCallback(err, snapshot);
        });
    }

    function createSnapshotAuthor(snapshot, finalCallback) {
        async.each(snapshot.oldAuthors, function(author, seriesCallback) {
            try {
                var snapshotAuthor = {
                    authorId: author.user.toString(),
                    description: author.description,
                    expertClasses: author.klass,
                    snapshotId: snapshot.id.toString()
                }
            } catch(err) {
                seriesCallback(err);
            }

            SnapshotAuthor.create(snapshotAuthor, function(err, newSnapshotAuthor) {
                if(err) retardedInnerCallback(err);
                else {
                    author.snapshotAuthor = newSnapshotAuthor;
                    seriesCallback();
                }
            });
        }, function(err) {
            finalCallback(err, snapshot);
        });
    }

    function createDeckMatchup(snapshot, finalCallback) {
        async.each(snapshot.oldMatches, function(match, seriesCallback) {
            try {
                var deckMatchup = {
                    forDeckId: match.for.toString(),
                    againstDeckId: match.against.toString(),
                    forChance: match.forChance,
                    againstChance: match.againstChance,
                    snapshotId: snapshot.id.toString()
                }
            } catch(err) {
                seriesCallback(err);
            }

            DeckMatchup.create(deckMatchup, function(err, newDeckMatchup) {
                if(err) retardedInnerCallback(err);
                else {
                    match.deckMathup = newDeckMatchup;
                    seriesCallback();
                }
            });
        }, function(err) {
            finalCallback(err, snapshot);
        });
    }
}

function createUserIdentities(finalCb) {
    var UserIdentity = server.models.UserIdentity;
    var User = server.models.user;

    var date = new Date();
    async.waterfall([
        // Get all the users
        function(seriesCallback) {
            console.log("Finding users");
            User.find({}, seriesCallback);
        },
        // Create user identity for each user
        function(users, seriesCallback) {
            console.log("creating user identies");
            async.each(users, function(user, callback) {
                if(!user.twitchID) {
                    return callback();
                }
                UserIdentity.create({
                    provider: "twitch",
                    externalId: user.twitchID,
                    authScheme: "oAuth 2.0",
                    profile: {},
                    credentials: {},
                    userId: user.id.toString(),
                    created: date,
                    modified: date
                }, function(err, identity) {
                    console.log("created new identity")
                    callback(err);
                });
            }, seriesCallback);
        }],
    finalCb);
}

function createUserRoles(finalCb) {
    var async = require("async");
    var _ = require("underscore");
    var ObjectId = require("mongodb").ObjectID;


    var Role = server.models.Role;
    var User = server.models.user;
    var RoleMapping = server.models.RoleMapping;

    var roles = ["$contentProvider", "$admin", "$active"];
    var roleInstances = {};
    async.waterfall([
            // Create the different roles
            function (seriesCb) {
                console.log("create different roles");
                async.each(roles, function (role, eachCb) {
                    Role.create({name: role}, function (err, newRole) {
                        if (err) return eachCb(err);

                        roleInstances[newRole.name] = newRole;
                        eachCb();
                    });
                }, seriesCb);
            },
            // Get all the users
            function (seriesCb) {
                console.log("getting users:", roleInstances);
                User.find({}, seriesCb);
            },
            // Assign their roles
            function (users, seriesCb) {
                console.log("assigning rules");
                assignRole(users, seriesCb);
            }
        ],
        finalCb);


    function assignRole(users, finalCallback) {
        var cuntCounter = 0;
        async.each(users, function (user, userCb) {
            async.each(roles, function (roleName, roleCb) {

                if ((roleName === "$admin" && user.isAdmin)
                    || (roleName === "$contentProvider" && user.isProvider)
                    || (roleName === "$active" && user.isActive)) {

                    roleInstances[roleName].principals.create({
                        principalType: RoleMapping.USER,
                        principalId: user.id.toString()
                    }, function (err, newPrincipal) {
                        if (!err) {
                            console.log("created principal:", newPrincipal);
                            console.log(cuntCounter++);
                        }
                        return roleCb(err);
                    });
                } else {
                    return roleCb();
                }

            }, userCb);
        }, finalCallback)
    }
}

function createPollItems(finalCb) {
    var Poll = server.models.poll;
    var PollItem = server.models.pollItem;

    async.waterfall([
        function (waterfallCb) {
            console.log("finding polls");
            Poll.find({}, waterfallCb);
        },
        function (polls, waterfallCb) {
            async.each(polls, function (poll, outerEachCb) {
                console.log("on poll:", poll.id);

                async.each(poll.oldItems, function (item, innerEachCb) {
                    item.pollId = poll.id.toString();

                    PollItem.create(item, function (err, newPollItem) {
                        if(!err) console.log("Successfully created newPollItem: " + newPollItem.id);
                        return innerEachCb(err);
                    })
                }, outerEachCb)
            }, waterfallCb)
        }
    ], function (err) {
        finalCb(err);
    });
}

function assignGameTypeMode(finalCb) {

    var Deck = server.models.deck;

    async.waterfall([
        function(seriesCb) {
            Deck.find({}, seriesCb);
        },
        function(decks, seriesCb) {
            var count = 0;
            async.each(decks, function(deck, eachCb) {

                function dealWithIt(deck, cb) {

                    var gameTypeString = "";
                    if(deck.type == 1) {
                        gameTypeString = "constructed"
                    } else if(deck.type == 2) {
                        gameTypeString = "arena"
                    } else if(deck.type == 3) {
                        gameTypeString = "brawl"
                    }

                    deck.updateAttribute("gameModeType", gameTypeString, function(err) {
                        if(err && err.statusCode == 422) {
                            return Deck.destroyById(deck.id.toString(), function(err) {
                                if(!err) console.log("deleted duplicate deck:", count++);
                                return cb(err);
                            });
                        }
                        else if(!err) console.log("updated deck gameModeType:", count++);
                        cb(err);
                    });
                }
                dealWithIt(deck, eachCb);
            }, seriesCb);
        }
    ],
    function(err) {
        finalCb(err);
    });
}



var redbullData = [
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
    }
]

function createRedbullExpansions(finalCb) {

}

