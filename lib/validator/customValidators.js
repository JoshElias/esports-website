var async = require("async");
var loopback = require("loopback");
var _ = require("underscore");
var utils = require("./../utils");
var _ = require("underscore");

var youtubeRegex = /^[a-zA-Z0-9_-]{11}$/;
function validateYoutubeId(validationState, youtubeCb) {
    var youtubeId = validationState.data || validationState.instance;
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
    var youtubeVars = validationState.data || validationState.instance;
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
                    return seriesCb(true);
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
        function(user, combinedRegex, seriesCb) {
          
            var data = validationState.data || validationState.instance;
            if(typeof data !== "string") {
                return seriesCb();
            }

            data = data.trim();
            data = data.replace(".", "");

            var matches = data.match(combinedRegex);
            if(!matches || matches.length < 1) {
                return seriesCb();
            }

            SpamOffence.create({
                userId: user.id,
                ip: requestIp || "",
                userAgent: requestUserAgent || "",
                referer: requestReferer || "",
                matches: matches,
                modelName: validationState.modelName,
                propertyName: validationState.key,
                createdDate: new Date().toISOString()
            }, function(err) {
                if(err) return seriesCb(filterErr);
                return seriesCb(undefined, spamErr);
            });
        }],
    function(err, spamErr) {
      if(!!err) return validatorCb(undefined, spamErr);
      else return validatorCb(err, spamErr)
    });
}

function validateUnique(validationState, uniqueCb) {
    var rootKey = validationState.rootKey;
    var Model = validationState.ctx.Model;
    var modelId = "";
    // Find the relevant model id if available
    if(typeof validationState.ctx.currentInstance === "object") {
      modelId = validationState.ctx.currentInstance.id;
    } else if(typeof validationState.ctx.where === "object" 
              && typeof validationState.ctx.where.id == "string") {
      modelId = validationState.ctx.where.id;
    }
    var uniqueErr = new Error(validationState.key + ' is not unique');
    uniqueErr.statusCode = 422;
    uniqueErr.code = 'FIELD NOT UNIQUE';
  
    var where = {};
    
    where[rootKey] = validationState.data || validationState.instance;
    if (typeof validationState.ctx.where === "object") {
        for (var key in validationState.ctx.where) {
            where[key] = validationState.ctx.where[key];
        }
    }
    Model.find({where: where, fields: {id: true }}, function (err, instances) {
        if (err) return uniqueCb(err);
      
        if (instances.length < 1) {
          return uniqueCb();
        } else if (instances.length > 1) {
            return uniqueCb(undefined, uniqueErr);
        } 
        if(instances[0].id.toString() !== modelId.toString()) {
            return uniqueCb(undefined, uniqueErr);
        }
      
        return uniqueCb();
    });
}


module.exports = {
    youtubeId: validateYoutubeId,
    youtubePlaylistId: validateYoutubePlaylistId,
    spam : validateSpam,
    unique : validateUnique
};