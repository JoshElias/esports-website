var async = require("async");
var loopback = require("loopback");
var _ = require("underscore");
var utils = require("./../utils");


var youtubeRegex = /^[a-zA-Z0-9_-]{11}$/;
function validateYoutubeId(state, youtubeCb) {

    if(typeof state.data !== "string" || state.data.length < 1) {
        return youtubeCb();
    }

    var youtubeErr;
    if(!youtubeRegex.test(state.data)) {
        youtubeErr = new Error('Invalid youtubeId');
        youtubeErr.statusCode = 400;
        youtubeErr.code = 'INVALID_YOUTUBE_ID';
    }
    return youtubeCb(undefined, youtubeErr);
}


var youtubePlaylistRegex = /^[a-zA-Z0-9_-]{34}$/;
function validateYoutubePlaylistId(state, validatorCb) {
    if(typeof state.data !== "object" || typeof state.data.list !== "string" || state.data.list.length < 1) {
        return validatorCb();
    }

    var playlistErr;
    if(!youtubePlaylistRegex.test(state.data.list)) {
        playlistErr = new Error('Invalid Youtube playlist id');
        playlistErr.statusCode = 400;
        playlistErr.code = 'INVALID_YOUTUBE_PLAYLIST_ID';
    }

    return validatorCb(undefined, playlistErr);
}


function validateSpam(state, validatorCb) {

    // Only check for spam if we have an active connection
    if(!state.ctx.req) {
        return validatorCb();
    }


    var filterErr = new Error('Unable to filter spam from the given data');
    filterErr.statusCode = 500;
    filterErr.code = 'UNABLE_TO_FILTER_SPAM';

    var spamErr = new Error('Cannot save due to spam in property:', state.key);
    spamErr.statusCode = 422;
    spamErr.code = 'SPAM_FOUND';

    var User            =   state.models.user;
    var SpamRegex       =   state.models.spamRegex;
    var SpamOffence     =   state.models.spamOffence;


    // Track information about the sender
    var requestIp = state.ctx.req.headers['x-forwarded-for'] || state.ctx.req.connection.remoteAddress;
    var requestUserAgent = state.ctx.req.headers['user-agent'];
    var requestReferer = state.ctx.header('Referer');


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

            var data = state.data;
            if(typeof state.data !== "string") {
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
                modelName: state.modelName,
                propertyName: state.key,
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

function validateUnique(state, uniqueCb) {

    var rootKey = state.rootKey;
    var Model = state.ctx.Model;
    var modelId = "";

    // Find the relevant model id if available
    if(typeof state.currentInstance === "object") {
      modelId = state.currentInstance.id;
    } else if(typeof state.ctx.where === "object"
              && typeof state.ctx.where.id == "string") {
      modelId = state.ctx.where.id;
    }

    var uniqueErr = new Error(state.key + ' is not unique');
    uniqueErr.statusCode = 422;
    uniqueErr.code = 'FIELD NOT UNIQUE';
  
    var where = {};
    
    where[rootKey] = state.data;
    if (typeof state.ctx.where === "object") {
        for (var key in state.ctx.where) {
            where[key] = state.ctx.where[key];
        }
    }

    Model.find({
        where: where,
        fields: {
            id: true
        },
        limit: 1
    }, function (err, instances) {
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

function validateSlug(state, uniqueCb) {

    var uniqueErr = new Error(state.key + ' is not unique');
    uniqueErr.statusCode = 422;
    uniqueErr.code = 'FIELD NOT UNIQUE';

    return state.model.find({
        where: state.requestData,
        fields: {
            id: true,
            parentModelName: true
        }
    }, function (err, slugs) {
        if (err) return uniqueCb(err);

        return async.each(slugs, function(slug, slugCb) {
            state.model.find({
                where: {
                    slug: state.data,
                    parentModelName: slug.parentModelName
                },
                fields: { id: true },
                limit: 1
            }, function(err, slugMatches) {
                if (err) return slugCb(err);
                else if (slugMatches.length === 0) {
                    return slugCb();
                } else if (slugMatches.length > 1) {
                    return slugCb(true);
                } else if (slug.id !== slugMatches[0].id) {
                    return slugCb(true);
                }

                return slugCb();
            });
        }, function(err) {
            if(err && err !== true) return uniqueCb(err);
            else if(err) {
                return uniqueCb(undefined, uniqueErr);
            }

            return uniqueCb();
        });
    });
}



module.exports = {
    youtubeId: validateYoutubeId,
    youtubePlaylistId: validateYoutubePlaylistId,
    spam : validateSpam,
    unique : validateUnique,
    slug : validateSlug
};
