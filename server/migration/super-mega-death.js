var async = require("async");
var server;

module.exports = function(_server) {
   server = _server;

    async.series([
        addMissingTalent,
        createAbilitiesAndTalents,
        //assignGameTypeMode,
        //createPollItems,
        //createForumModels,
        //associateCommentReplies,
        //associateRelatedArticles,
        //createDeckCards,
        associateGuideHeroes,
        //associateGuideMaps,
        //associateGuideComments,
        //createMulliganModels,
        //createSnapshotModels,
        //createUserIdentities,
        //createUserRoles
    ],
    function(err) {
        if(err) console.log("error with super mega death script:", err);
        else console.log("Donnerino");
    });
};


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


var oldTalents = {};
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
            async.each(heroes, function (hero, heroCb) {

                // Create Abilities
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
                    Ability.create(newAbility, {}, function (err, abilityInstance) {
                        console.log("created ability instance:", err, abilityInstance);
                        if (err) return abilityCb(err);

                        console.log("created ability:", abilityInstance.id);
                        async.each(hero.oldTalents, function (talent, eachCb) {

                            function findOrCreateTalentInstance(talent, talentCb) {
                                Talent.findOne({
                                    where: {
                                        name: talent.name,
                                        description: talent.description,
                                        className: talent.className,
                                        orderNum: talent.orderNum
                                    }
                                }, function (err, talentInstance) {
                                    if (err || talentInstance) {
                                        return talentCb(err, talentInstance);
                                    }

                                    Talent.create({
                                        name: talent.name,
                                        description: talent.description,
                                        className: talent.className,
                                        orderNum: talent.orderNum
                                    }, talentCb);
                                });
                            }

                            function findOrCreateHeroTalentInstance(heroTalentData, heroTalentCb) {
                                HeroTalent.findOne({
                                    where: heroTalentData
                                }, function (err, talentInstance) {
                                    if (err || talentInstance) {
                                        return heroTalentCb(err, talentInstance);
                                    }

                                    HeroTalent.create(heroTalentData, heroTalentCb);
                                });
                            }

                            findOrCreateTalentInstance(talent, function(err, talentInstance) {
                                if(err) return eachCb(err)

                                oldTalents[talent._id.toString()] = talentInstance.id.toString();
                                var newHeroTalent = {
                                    heroId: hero.id.toString(),
                                    talentId: talentInstance.id.toString(),
                                    abilityId: abilityInstance.id.toString(),
                                    tier: talent.tier
                                };

                                findOrCreateHeroTalentInstance(newHeroTalent, eachCb);
                            });

                        }, abilityCb);
                    });
                }, function(err) {
                    heroCb(err);
                });
            }, function(err) {
                seriesCb(err);
            });
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
        async.eachSeries(comments, async.ensureAsync(function(comment, callback) {
            console.log("iterating on comment:", comment);
            async.eachSeries(comment.oldReplies, async.ensureAsync(function(replyId, innerCallback) {
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
            console.log("err finding articles");
            return finalCb(err);
        }

        async.eachSeries(articles, async.ensureAsync(function(article, callback) {
            async.eachSeries(article.oldRelatedArticles, async.ensureAsync(function(relatedArticleId, innerCallback) {
                Article.findById(relatedArticleId, function(err, relatedArticleInstance) {
                    if(err) innerCallback(err);
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
                async.eachSeries(deck.oldCards, function(card, innerCallback) {
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
            async.eachSeries(guides, function(guide, callback) {
                console.log("old heroes:", guide.oldHeroes);
                async.eachSeries(guide.oldHeroes, function(hero, innerCallback) {
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
            async.eachSeries(guides, function(guide, callback) {
                async.eachSeries(guide.oldMaps, function(mapId, innerCallback) {
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
            async.eachSeries(guides, function(guide, callback) {
                async.eachSeries(guide.oldComments, function(commentId, innerCallback) {
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
            async.eachSeries(decks, function(deck, callback) {
                async.eachSeries(deck.oldMulligans, async.ensureAsync(function(mulligan, innerCallback) {
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
            async.eachSeries(decks, function(deck, callback) {
                async.eachSeries(deck.oldMulligans, function(mulligan, innerCallback) {
                    async.eachSeries(mulligan.withCoin.cards, async.ensureAsync(function(cardId, superInnerCallback) {
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
            async.eachSeries(decks, function(deck, callback) {
                async.eachSeries(deck.oldMulligans, function(mulligan, innerCallback) {
                    async.eachSeries(mulligan.withoutCoin.cards, async.ensureAsync(function(cardId, superInnerCallback) {
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
            async.eachSeries(snapshots, function(snapshot, callback) {
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
        async.eachSeries(snapshot.tiers, function(tier, seriesCallback) {
            async.eachSeries(tier.decks, function(deck, innerCallback) {
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
        async.eachSeries(snapshot.tiers, function(tier, seriesCallback) {
            async.eachSeries(tier.decks, function(deck, innerCallback) {
                async.eachSeries(deck.tech, function(tech, superInnerCallback) {
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
        async.eachSeries(snapshot.tiers, function(tier, seriesCallback) {
            async.eachSeries(tier.decks, function(deck, innerCallback) {
                async.eachSeries(deck.tech, function(tech, superInnerCallback) {
                    async.eachSeries(tech.cards, function(card, retardedInnerCallback) {
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
        async.eachSeries(snapshot.oldAuthors, function(author, seriesCallback) {
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
        async.eachSeries(snapshot.oldMatches, function(match, seriesCallback) {
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
            async.eachSeries(users, function(user, callback) {
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
                async.eachSeries(roles, function (role, eachCb) {
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
        async.eachSeries(users, function (user, userCb) {
            async.eachSeries(roles, function (roleName, roleCb) {

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
            async.eachSeries(polls, function (poll, outerEachCb) {
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
            async.eachSeries(decks, function(deck, eachCb) {

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
