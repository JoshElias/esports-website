var loopback = require("loopback");
var async = require("async");
var utils = require("./../../../../lib/utils");


module.exports = function(RedbullDraft) {

    var contextErr = new Error('Could not find context');
    contextErr.statusCode = 500;
    contextErr.code = 'NO_CONTEXT';



    // START DRAFT

    RedbullDraft.observe("before save", handleNewDraftRequest);


    function handleNewDraftRequest(ctx, next) {
        if (!ctx.isNewInstance) {
            return next();
        }

        var RedbullDraftSettings = RedbullDraft.app.models.redbullDraftSettings;

        // Initialize custom default values
        var clientData = ctx.data || ctx.instance;
        clientData.draftStartTime = Date.now();

        // Get the default Draft Settings
        return RedbullDraftSettings.findOne({}, {fields: {id: true}}, function (err, draftSettings) {
            if (err) next(err);

            clientData.redbullDraftSettingsId = draftSettings.id;


            return checkForOfficialDraft(clientData, next)
        });
    }

    function checkForOfficialDraft(clientData, finalCb) {
        var User = RedbullDraft.app.models.user;


        // Does the user want to create an official deck?
        if(!clientData.isOfficial){
            return finalCb();
        }

        // Is the user logged in?
        var loopbackContext = loopback.getCurrentContext();
        if(!loopbackContext || !loopbackContext.active) {
                return finalCb();
        }
        var req = loopbackContext.active.http.req;

        // Do we have a user Id
        if (!req.accessToken || !req.accessToken.userId) {
            return finalCb()
        }
        var userId = req.accessToken.userId.toString();
        clientData.authorId = userId;


        // Check if this is an official draft or not
        return User.isInRoles(userId, ["$redbullPlayer", "$redbullAdmin"], function (err, isInRoles) {
            if (err) return finalCb(err);

            // Is this an official draft?
            clientData.isOfficial = !isInRoles.none;

            // Check if the user is registered to be an active player
            if (isInRoles.none) {
                return finalCb();
            }

            // Check if the active player has already done a draft
            return RedbullDraft.findOne({where: {authorId: userId}}, function (err, draft) {
                if (err) return finalCb(err);
                else if (!draft) return finalCb();

                return handleRegisteredPlayerError(draft, finalCb);
            });
        });
    }

    function handleRegisteredPlayerError(draft, finalCb) {

        var alreadyDraftedErr = new Error('User has already drafted');
        alreadyDraftedErr.statusCode = 400;
        alreadyDraftedErr.code = 'ALREADY_DRAFTED';

        // Check if user as already drafted packs
        if (!draft.hasOpenedPacks) {
            var decodedPackOpenerData = JSON.parse(draft.packOpenerString);
            alreadyDraftedErr.packOpenerData = decodedPackOpenerData;
            return finalCb(alreadyDraftedErr);
        }

        // Make another query for the cards
        return RedbullDraft.findById(draft.id, {
            fields: {
                packOpenerString: false
            },
            include: ["cards"]
        }, function (err, deckbuilderData) {
            if (err) finalCb(err);

            alreadyDraftedErr.deckBuilderData = deckbuilderData;
            return finalCb(alreadyDraftedErr);
        });
    }


    // If the before save completed without err, attach the package
    RedbullDraft.afterRemote("create", addPackage);


    function addPackage(ctx, redbullDraft, next) {

        var draftErr = new Error('Unable to create draft');
        draftErr.statusCode = 500;
        draftErr.code = 'COULD_NOT_CREATE_DRAFT';

        var RedbullPack = RedbullDraft.app.models.redbullPack;

        return RedbullPack.rollPacks(redbullDraft, function (err, packOpenerData) {
            if (err) return next(err);
            //console.log("pack opener data:", packOpenerData)
            // Update the draft with the compressed packOpenerData and packOpeningStartTime
            var draftUpdates = {
                packOpenerString: JSON.stringify(packOpenerData),
                packOpeningStartTime: Date.now()
            };

            // Update the draft with the compressed package and packOpeningStartTime
            return redbullDraft.updateAttributes(draftUpdates, function (err, newRedbullDraft) {
                if (err) return next(err);

                redbullDraft.packOpenerData = packOpenerData;
                return next();
            });
        });
    }



    // OPENING PACKS

    RedbullDraft.finishedOpeningPacks = function(draftId, options, finalCb) {
        if (finalCb === undefined && typeof options === 'function') {
            finalCb = options;
            options = undefined;
        }
        finalCb = finalCb || utils.createPromiseCallback();

        //var User = RedbullDraft.app.models.user;
        var currentTime = Date.now();

        return RedbullDraft.findById(draftId, {fields:{id:true}}, function(err, draft) {
            if(err) return finalCb(err);

            return draft.updateAttributes({
                hasOpenedPacks: true,
                packOpeningEndTime: currentTime
            }, function(err) {
                return finalCb(err);
            });
        });

        return finalCb.promise;
    }



    // BUILDING

    RedbullDraft.startDraftBuild = function (draftId, options, finalCb) {
        if (finalCb === undefined && typeof options === 'function') {
            finalCb = options;
            options = undefined;
        }
        finalCb = finalCb || utils.createPromiseCallback();

        RedbullDraft.findById(draftId, {
            fields: {
                packOpenerString: false,
                isOfficial : false
            },
            include: ["settings"]
        }, function (err, draft) {
            if (err) return finalCb(err);
            else if (!draft) {
                var noDraftErr = new Error("No draft found for id", draftId);
                noDraftErr.statusCode = 404;
                noDraftErr.code = 'DRAFT_NOT_FOUND';
                return finalCb(noDraftErr);
            }

            // Get data from instance
            var draftJSON = draft.toJSON();
            var draftSettings = draftJSON.settings;
            delete draftJSON.settings;

            // Have we already updated the draft state?
            if (draft.hasStartedBuildingDeck) {
                return finalCb(undefined, draftJSON);
            }

            // Update the draft state
            var draftUpdates = newDraftState(draftSettings);
            return draft.updateAttributes(draftUpdates, function(err, newDraft) {
                if(err) return finalCb(err);

                draftJSON = newDraft.toJSON();
                delete draftJSON.packOpenerString;
                delete draftJSON.isOfficial;
                return finalCb(undefined, draftJSON);
            });
        });

        return finalCb.promise;
    };


    function newDraftState(draftSettings) {
        var currentTime = Date.now();
        var draftUpdates = {};

        draftUpdates.hasStartedBuildingDeck = true;
        draftUpdates.deckBuildStartTime = currentTime;
        var buildTimeLimitMillis = draftSettings.deckBuildTimeLimit * 60 * 1000;
        var gracePeriodMillis = draftSettings.deckBuildGracePeriod * 60 * 1000;
        draftUpdates.deckSubmitCurfew = currentTime + buildTimeLimitMillis + gracePeriodMillis;
        return draftUpdates;
    }


    RedbullDraft.submitDecks = function (draftId, clientDecks, options, finalCb) {
        if (finalCb === undefined && typeof options === 'function') {
            finalCb = options;
            options = undefined;
        }
        finalCb = finalCb || utils.createPromiseCallback();

        var RedbullDeck = RedbullDraft.app.models.redbullDeck;

        // Does the given draft exist and have official set?
        return RedbullDraft.findById(draftId, {
            fields: {
                packOpenerString: false
            },
            include: [
                {
                    relation: "cards",
                    scope: {
                        fields: ["playerClass"]
                    }
                },
                {
                    relation: "settings"
                }
            ]
        }, function (err, draft) {
            if (err) return finalCb(err);
            else if (!draft) {
                var noDraftErr = new Error("No draft found for id", draftId);
                noDraftErr.statusCode = 404;
                noDraftErr.code = 'DRAFT_NOT_FOUND';
                return finalCb(noDraftErr);
            }

            return RedbullDeck.saveDraftDecks(draft, clientDecks, finalCb);
        });

        return finalCb.promise;
    };



    // DRAFT PLAYER MANAGEMENT

    RedbullDraft.addDraftPlayer = function (uid, options, finalCb) {
        if (finalCb === undefined && typeof options === 'function') {
            // createAccessToken(ttl, cb)
            finalCb = options;
            options = undefined;
        }
        finalCb = finalCb || utils.createPromiseCallback();

        // Add the redbull role to this user
        var User = RedbullDraft.app.models.user;
        User.assignRoles(uid, ["$redbullPlayer"], finalCb);
    };

    RedbullDraft.getDraftPlayers = function (finalCb) {
        finalCb = finalCb || utils.createPromiseCallback();

        // Add the redbull role to this user
        var User = RedbullDraft.app.models.user;
        var Role = RedbullDraft.app.models.Role;
        var RoleMapping = RedbullDraft.app.models.RoleMapping;

        async.waterfall([
            // Get the redbullPlayer role
            function(seriesCb) {
                return Role.findOne({where:{name: "$redbullPlayer"}}, function(err, role) {
                    if(err) return seriesCb(err);
                    else if(!role) {
                        var noRoleErr = new Error("Could not find redbullPlayer role");
                        noRoleErr.statusCode = 404;
                        noRoleErr.code = 'ROLE_NOT_FOUND';
                        return seriesCb(noRoleErr);
                    }
                    return seriesCb(undefined, role);
                });
            },
            // Get all role mappings
            function(role, seriesCb) {
                return RoleMapping.find({where:{roleId:role.id}}, seriesCb);
            },
            // Get all users of this role
            function(roleMappings, seriesCb) {
                return async.map(roleMappings, function(roleMapping, mappingCb) {
                    User.findById(roleMapping.principalId, {
                        fields: {
                            id: true,
                            username: true,
                            email: true
                        }
                    }, mappingCb);
                }, seriesCb);
            }
        ], finalCb);

        return finalCb.promise;
    };


    RedbullDraft.removeDraftPlayer = function (uid, options, finalCb) {
        if (finalCb === undefined && typeof options === 'function') {
            // createAccessToken(ttl, cb)
            finalCb = options;
            options = undefined;
        }
        finalCb = finalCb || utils.createPromiseCallback();

        // Add the redbull role to this user
        var User = RedbullDraft.app.models.user;
        User.revokeRoles(uid, ["$redbullPlayer"], finalCb);
    };




    RedbullDraft.remoteMethod(
        'startDraftBuild',
        {
            description: "Starts the deck building stage of the Redbull Tournament",
            accepts: [
                {arg: 'draftId', type: 'string', required: true, http: {source: 'form'}},
                {arg: 'options', type: 'object', required: false, http: {source: 'form'}}
            ],
            returns: {arg: 'draft', type: 'object'},
            http: {verb: 'post'},
            isStatic: true
        }
    );

    RedbullDraft.remoteMethod(
        'finishedOpeningPacks',
        {
            description: "Tells the server that you've finished creating packs",
            accepts: [
                {arg: 'draftId', type: 'string', required: true, http: {source: 'form'}},
                {arg: 'options', type: 'object', required: false, http: {source: 'form'}}
            ],
            http: {verb: 'post'},
            isStatic: true
        }
    );

    RedbullDraft.remoteMethod(
        'addDraftPlayer',
        {
            description: "Adds the redbull role to a user",
            accepts: [
                {arg: 'uid', type: 'string', required: true, http: {source: 'form'}},
                {arg: 'options', type: 'object', required: false, http: {source: 'form'}}
            ],
            http: {verb: 'post'},
            isStatic: true
        }
    );

    RedbullDraft.remoteMethod(
        'getDraftPlayers',
        {
            description: "Gets all the redbull users",
            http: {verb: 'get'},
            returns: {arg: 'players', type: 'array'},
            isStatic: true
        }
    );

    RedbullDraft.remoteMethod(
        'removeDraftPlayer',
        {
            description: "Removes the player role from a user",
            accepts: [
                {arg: 'uid', type: 'string', required: true, http: {source: 'form'}},
                {arg: 'options', type: 'object', required: false, http: {source: 'form'}}
            ],
            http: {verb: 'post'},
            isStatic: true
        }
    );


    RedbullDraft.remoteMethod(
        'submitDecks',
        {
            description: "Starts the deck building stage of the Redbull Tournament",
            accepts: [
                {arg: 'draftId', type: 'string', required: true, http: {source: 'form'}},
                {arg: 'clientDecks', type: 'object', required: false, http: {source: 'form'}},
                {arg: 'options', type: 'object', required: false, http: {source: 'form'}}
            ],
            returns: {arg: 'createdDeckIds', type: 'array'},
            http: {verb: 'post'},
            isStatic: true
        }
    );
};
