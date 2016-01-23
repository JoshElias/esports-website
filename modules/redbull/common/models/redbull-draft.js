var loopback = require("loopback");
var utils = require("./../../../../lib/utils");


module.exports = function(RedbullDraft) {

    var contextErr = new Error('Could not find context');
    contextErr.statusCode = 500;
    contextErr.code = 'NO_CONTEXT';


    RedbullDraft.observe("before save", handleNewDraftRequest);


    function handleNewDraftRequest(ctx, next) {
      if (!ctx.isNewInstance) {
        return next();
      }

      var RedbullDraftSettings = RedbullDraft.app.models.redbullDraftSettings;

      // Initialize custom default values
      clientData = ctx.data || ctx.instance;

      clientData.draftStartTime = Date.now();

      // Is the user logged in?
      var loopbackContext = loopback.getCurrentContext();
      if (!loopbackContext || !loopbackContext.active) {
        return next(contextErr);
      }
      var req = loopbackContext.active.http.req;

      // Get the default Draft Settings
      return RedbullDraftSettings.findOne({}, {fields: {id: true}}, function (err, draftSettings) {
        if (err) next(err);

        clientData.redbullDraftSettingsId = draftSettings.id;

        if (req.accessToken && typeof req.accessToken.userId) {
          var userId = req.accessToken.userId.toString();
          clientData.authorId = userId;
          return checkForOfficialDraft(userId, clientData, next)
        }

        return next();
      });
    }

  function checkForOfficialDraft(userId, clientData, finalCb) {
    var User = RedbullDraft.app.models.user;

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
        if(!draft.hasOpenedPacks) {
            var decodedPackOpenerData = JSON.parse(draft.packOpenerString);
            alreadyDraftedErr.packOpenerData = decodedPackOpenerData;
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
        }, function(err, deckbuilderData) {
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
          packOpenerString : JSON.stringify(packOpenerData),
          packOpeningStartTime : Date.now()
        };

        // Update the draft with the compressed package and packOpeningStartTime
        return redbullDraft.updateAttributes(draftUpdates, function (err, newRedbullDraft) {
          if (err) return next(err);

          redbullDraft.packOpenerData = packOpenerData;
          return next();
        });
      });
    }

    RedbullDraft.startDraftBuild = function(draftId, options, finalCb) {
      console.log("draft build", draftId)
      if (finalCb === undefined && typeof options === 'function') {
        // createAccessToken(ttl, cb)
        finalCb = options;
        options = undefined;
      }
      finalCb = finalCb || utils.createPromiseCallback();


      RedbullDraft.findById(draftId, {
        fields: {clientPackage: false},
        include: [
          {
            relation: "decks",
            scope: {
              include: {
                relation: "deckCards",
                scope: {
                  include: ["card"]
                }
              }
            }
          },
          {
            relation: "settings"
          }
        ]
      }, function (err, draft) {
        if (err) return finalCb(err);

        // Have we already updated the draft state?
        if(draft.hasOpenedPacks) {
            return finalCb(undefined, draft);
        }

        // Update the draft state
        var draftUpdates = newDraftState(draft.settings);
        return draft.updateAttributes(draftUpdates, finalCb);
      });
    };


    function newDraftState(draftSettings) {
      var currentTime = Date.now();
      var draftUpdates = {};

      draftUpdates.packOpeningEndTime = currentTime;
      draftUpdates.deckBuildStartTime = currentTime;
      var buildTimeLimitMillis = draftSettings.deckBuildTimeLimit * 60 * 1000;
      var gracePeriodMillis = draftSettings.deckBuildGracePeriod * 60 * 1000;
      draftUpdates.deckSubmitCurfew = currentTime + buildTimeLimitMillis + gracePeriodMillis;
      draftUpdates.hasOpenedPacks = true;
      return draftUpdates;
    }



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
      'startDraftBuild',
      {
        description: "Starts the deck building stage of the Redbull Tournament",
        accepts: [
          {arg: 'draftId', type: 'string', required:true, http: {source: 'form'}},
          {arg: 'options', type: 'object', required:false, http: {source: 'form'}}
        ],
        returns: {arg: 'deckBuilderData', type: 'object'},
        http: {verb: 'post'},
        isStatic: true
      }
    );


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
