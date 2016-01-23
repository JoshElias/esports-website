var async = require("async");
var loopback = require("loopback");
var utils = require("./../../../../lib/utils");


var NUM_CARD_PER_PACK = 5;


module.exports = function(RedbullTournament) {



    RedbullTournament.startDraft = function(uid, options, finalCb) {
        if (finalCb === undefined && typeof options === 'function') {
            // createAccessToken(ttl, cb)
            finalCb = options;
            options = undefined;
        }
        finalCb = finalCb || utils.createPromiseCallback();

        var User = RedbullTournament.app.models.user;
        var RedbullPack = RedbullTournament.app.models.redbullPack;


        User.isInRoles(uid, ["$redbullUser"], function(err, isInRoles) {
            if(err) finalCb(err);

            // Is this a pleb user
            if(isInRoles.none) {
                return RedbullPack.seedPacks(undefined, finalCb);
            }

            //
        });
    }


    RedbullTournament.resumeDraft = function(uid, options, finalCb) {
        if (finalCb === undefined && typeof options === 'function') {
            // createAccessToken(ttl, cb)
            finalCb = options;
            options = undefined;
        }
        finalCb = finalCb || utils.createPromiseCallback();

    }


    RedbullTournament.hasDraft = function(uid, finalCb) {
        if (finalCb === undefined && typeof options === 'function') {
            // createAccessToken(ttl, cb)
            finalCb = options;
            options = undefined;
        }
        finalCb = finalCb || utils.createPromiseCallback();

        var RedbullDeck = RedbullTournament.app.models.redbullDeck;
        RedbullDeck.find({where:{authorId:uid}})

    }

    RedbullTournament.clearDraft = function(uid, options, finalCb) {
        if (finalCb === undefined && typeof options === 'function') {
            // createAccessToken(ttl, cb)
            finalCb = options;
            options = undefined;
        }
        finalCb = finalCb || utils.createPromiseCallback();

    }



    RedbullTournament.whitelistUser = function(uid, finalCb) {
        if (finalCb === undefined && typeof options === 'function') {
            // createAccessToken(ttl, cb)
            finalCb = options;
            options = undefined;
        }
        finalCb = finalCb || utils.createPromiseCallback();

        // Add the redbull role to this user
        var User = RedbullTournament.app.models.user;
        User.assignRoles(uid, ["$redbullUser"], finalCb);
    };




    RedbullTournament.remoteMethod(
        'startDraft',
        {
            description: "Seeds new cards, sorts them into packs and returns it",
            accepts: [
                {arg: 'uid', type: 'string', required:true, http: {source: 'form'}},
                {arg: 'options', type: 'object', required:false, http: {source: 'form'}}
            ],
            returns: {arg: 'packs', type: 'object'},
            http: {verb: 'get'},
            isStatic: true
        }
    );

    RedbullTournament.remoteMethod(
        'whitelistUser',
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
