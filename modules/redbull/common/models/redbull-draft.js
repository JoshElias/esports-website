var loopback = require("loopback");
var bson = require("bson");
var BSON = new bson.BSONPure.BSON();
var utils = require("./../../../../lib/utils");


module.exports = function(RedbullDraft) {

    var contextErr = new Error('Could not find context');
    contextErr.statusCode = 500;
    contextErr.code = 'NO_CONTEXT';


    RedbullDraft.observe("before save", handleNewDraftRequest);


    function handleNewDraftRequest(ctx, next) {
        if(!ctx.isNewInstance) {
            return next();
        }

        var User = RedbullDraft.app.models.user;
        var RedbullPack = RedbullDraft.app.models.redbullPack;


        // Initialize custom default values
        var data = ctx.data || ctx.instance;
        data.isOfficial = false;
        data.draftStartTime = Date.now();

        // Is the user logged in?
        var loopbackContext = loopback.getCurrentContext();
        if (!loopbackContext || !loopbackContext.active) {
            return next(contextErr);
        }
        var req = loopbackContext.active.http.req;

        if(req.accessToken && typeof req.accessToken.userId) {
            var userId = req.accessToken.userId;
            data.authorId = userId;

            // Check if this is an official draft or not
            return User.isInRoles(userId, ["$redbullPlayer", "$redbullAdmin"], function(err, isInRoles) {
                if (err) next(err);

                // Is this an official draft?
                data.official = !isInRoles.none;

                // Check if the user is registered to be an active player
                if(isInRoles.none) {
                    return next();
                }

                // Check if the active player has already done a draft
                RedbullDraft.findOne({where:{authorId:userId}}, function(err, draft) {
                    if(err) next(err);
                    else if(!draft) next();

                    return handleRegisteredPlayerError(draft, next);
                });
            });
        }

        return next();
    }

    function handleRegisteredPlayerError(draft, finalCb) {

        var alreadyDraftedErr = new Error('User has already drafted');
        alreadyDraftedErr.statusCode = 400;
        alreadyDraftedErr.code = 'ALREADY_DRAFTED';

        // Check if user as already drafted packs
        if(!draft.hasOpenedPacks) {
            var decodedPackage = BSON.deserialize(draft.clientPackage);
            alreadyDraftedErr.package = decodedPackage;
            return finalCb(alreadyDraftedErr);
        }

        return RedbullDraft.findById(draft.id, {
            include: {
                relation: "decks",
                scope: {
                    include: {
                        relation: "deckCards",
                        scope: {
                            include: ["card"]
                        }
                    }
                }
            }
        }, function(err, heavyDraft) {
            if(err) finalCb(err);

            alreadyDraftedErr.draft = heavyDraft;
            return finalCb(alreadyDraftedErr);
        });
    }



    RedbullDraft.afterRemote("create", function (ctx, redbullDraft, next) {

        var draftErr = new Error('Unable to create draft');
        draftErr.statusCode = 500;
        draftErr.code = 'COULD_NOT_CREATE_DRAFT';

        var RedbullPack = RedbullDraft.app.models.redbullPack;
        var RedbullDraftSettings = RedbullDraft.app.models.redbullDraftSettings;

        // Get the default Draft Settings
        RedbullDraftSettings.findOne({}, function(err, draftSettings) {
            if(err) next(draftErr);

            return RedbullPack.seedPacks(redbullDraft, draftSettings, function(err, package) {
                if(err) return next(err);

                var encodedPackage = BSON.serialize(package, false, true, false);

                // Update the draft with the compressed package
                return redbullDraft.updateAttribute("clientPackage", encodedPackage, function(err, newRedbullDraft) {
                    if(err) return next(err);

                    redbullDraft.package = package;
                    return next();
                });
            });
        });
    });



    RedbullDraft.addDraftPlayer = function(uid, options, finalCb) {
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



    RedbullDraft.remoteMethod(
        'addDraftPlayer',
        {
            description: "Adds the redbull role to a user",
            accepts: [
                {arg: 'uid', type: 'string', required:true, http: {source: 'form'}},
                {arg: 'options', type: 'object', required:false, http: {source: 'form'}}
            ],
            http: {verb: 'put'},
            isStatic: true
        }
    );
};
