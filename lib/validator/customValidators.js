var async = require("async");
var loopback = require("loopback");
var _ = require("underscore");
var utils = require("./../utils");


var youtubeRegex = /^[a-zA-Z0-9_-]{11}$/;
function validateYoutubeId(validationState, youtubeCb) {
    var youtubeId = validationState.clientData;
    if(typeof youtubeId !== "string") {
        return youtubeCb();
    }

    var youtubeErr;
    if(!youtubeRegex.test(youtubeId)) {
        youtubeErr = new Error('Invalid youtubeId');
        youtubeErr.statusCode = 400;
        youtubeErr.code = 'INVALID_YOUTUBE_ID';
    }

    return youtubeCb(undefined, youtubeErr);
}


var youtubePlaylistRegex = /^[a-zA-Z0-9_-]{34}$/;
function validateYoutubePlaylistId(validationState, validatorCb) {
    var youtubeVars = validationState.clientData;
    if(typeof youtubeVars !== "object" || typeof youtubeVars.list !== "string") {
        return validatorCb();
    }

    var playlistErr;
    if(!youtubePlaylistRegex.test(youtubeVars.list)) {
        playlistErr = new Error('Invalid Youtube playlist id');
        playlistErr.statusCode = 400;
        playlistErr.code = 'INVALID_YOUTUBE_PLAYLIST_ID';
    }

    return validatorCb(undefined, playlistErr);
}


function validateSpam(validationState, validatorCb) {

    var filterErr = new Error('Unable to filter spam from the given data');
    filterErr.statusCode = 500;
    filterErr.code = 'UNABLE_TO_FILTER_SPAM';

    var spamErr = new Error('Cannot save due to spam in property:', validationState.key);
    spamErr.statusCode = 422;
    spamErr.code = 'SPAM_FOUND';

    var loopbackContext = loopback.getCurrentContext();
    if (!loopbackContext || !loopbackContext.active) {
        return validatorCb();
    }

    var req = loopbackContext.active.http.req;
    var Model = validationState.ctx.Model;

    var User = Model.app.models.user;
    var SpamRegex = Model.app.models.spamRegex;
    var SpamOffence = Model.app.models.spamOffence;

    // Track information about the sender
    var requestIp = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    var requestUserAgent = req.headers['user-agent'];
    var requestReferer = req.header('Referer');


    async.waterfall([
        // Get the current user
        function(seriesCb) {
            User.getCurrent(seriesCb);
        },
        // Generate the regex that will be used to evaluate the value
        function(user, seriesCb) {

            SpamRegex.find({}, function (err, spamRegexes) {
                if (err) return seriesCb(err);

                if (spamRegexes.length < 1) {
                    return seriesCb();
                }

                // Get all the different regex
                var regexArr = _.map(spamRegexes, function (spamRegex) {
                    return spamRegex.regex
                });
                var regexString = regexArr.join("|");
                var combinedRegex = new RegExp("(" + regexString + ")", 'i');
                seriesCb(undefined, user, combinedRegex);
            });
        },
        // Recurse through model's config and run validators
        function(user, combinedRegex, eachCb) {

            var fieldsToCheck = [];
            for(var key in Model.definition.properties) {
                var property = Model.definition.properties[key];
                if(property.filterSpam) {
                    fieldsToCheck.push(key);
                }
            }

            var data = validationState.clientData;
            if(typeof data !== "string") {
                return eachCb();
            }

            data = data.trim();
            data = data.replace(".", "");

            var matches = data.match(combinedRegex);
            if(!matches || matches.length < 1) {
                return eachCb();
            }

            SpamOffence.create({
                userId: user.id,
                ip: requestIp || "",
                userAgent: requestUserAgent || "",
                referer: requestReferer || "",
                matches: matches,
                modelName: validationState.ctx.Model.definition.name,
                propertyName: fieldToCheck,
                createdDate: new Date().toISOString()
            }, function(err) {
                if(err) return eachCb(filterErr);
                return eachCb(undefined, spamErr);
            });
        }],
    validatorCb);
}

function validateUnique(validationState, uniqueCb) {
    var rootKey = validationState.rootKey;
    var Model = validationState.ctx.Model;

    var where = {};
    where[rootKey] = validationState.clientData;
    if(typeof validationState.ctx.where === "object") {
        for(var key in validationState.ctx.where) {
            where[key] = validationState.ctx.where[key];
        }
    }

  Model.find({where:where}, function(err, instances) {
    if(err) return uniqueCb(err);

    var uniqueErr;
    if(instances.length > 0) {
      uniqueErr = new Error(validationState.key+' is not unique');
      uniqueErr.statusCode = 422;
      uniqueErr.code = 'FIELD NOT UNIQUE';
    }

    return uniqueCb(undefined, uniqueErr);
});
}


module.exports = {
    youtubeId: validateYoutubeId,
    youtubePlaylistId: validateYoutubePlaylistId,
    spam : validateSpam,
    unique : validateUnique
};
