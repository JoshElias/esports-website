
var validators = {
    spam : validateSpam,

}

function validateSpam(ctx, validatorCb) {

}

function filterSpam(ctx, finalCb) {
    console.log("filtering spam")
    var filterErr = new Error('Unable to filter spam from the given data');
    filterErr.statusCode = 500;
    filterErr.code = 'UNABLE_TO_FILTER_SPAM';

    var spamErr = new Error('Cannot save due to spam');
    spamErr.statusCode = 422;
    spamErr.code = 'SPAM_FOUND';

    console.log("getting props")
    var loopbackContext = loopback.getCurrentContext();
    if (!loopbackContext || !loopbackContext.active) {
        return finalCb();
    }
    var req = loopbackContext.active.http.req;
    var Model = ctx.Model;
    var User = Model.app.models.user;
    var SpamRegex = Model.app.models.spamRegex;
    var SpamOffence = Model.app.models.spamOffence;

    // Track information about the sender
    var requestIp = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    var requestUserAgent = req.headers['user-agent'];
    var requestReferer = req.header('Referer');
    console.log("fields to check")

    // Iterate over the model's config and run validators
    var fieldsToCheck = [];
    for(var key in Model.definition.properties) {
        var property = Model.definition.properties[key]
        if(property.filterSpam) {
            fieldsToCheck.push(key);
        }
    }

    console.log("starting water")
    async.waterfall([
            // Get the current user
            function(seriesCb) {
                console.log("getting current user")
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
            function(user, combinedRegex) {

            }

                    async.each(fieldsToCheck, function(fieldToCheck, eachCb) {

                        var value = getEventualValue(ctx, fieldToCheck);
                        if(typeof value !== "string") {
                            return eachCb();
                        }

                        value = value.trim();
                        value = value.replace(".", "");

                        var matches = value.match(combinedRegex);
                        if(!matches || matches.length < 1) {
                            return eachCb();
                        }

                        if(!hasSpam)
                            hasSpam = true;

                        SpamOffence.create({
                            userId: user.id,
                            ip: requestIp || "",
                            userAgent: requestUserAgent || "",
                            referer: requestReferer || "",
                            matches: matches,
                            modelName: ctx.Model.definition.name,
                            propertyName: fieldToCheck,
                            createdDate: new Date().toISOString()
                        }, function(err, newSpamOffence) {
                            if(err) return eachCb(filterErr);
                            return eachCb();
                        });

                    }, function(err) {
                        if(err) return seriesCb(err);
                        else if(hasSpam) return seriesCb(spamErr);
                        else return seriesCb();
                    });
                });
            }],
        finalCb);
}

function getEventualValue(ctx, key) {
    if(typeof ctx.data !== "undefined" && typeof ctx.data[key] !== "undefined") {
        return ctx.data[key];
    } else if(typeof ctx.instance !== "undefined" && typeof ctx.instance[key] !== "undefined") {
        return ctx.instance[key];
    } else if(typeof ctx.currentInstance !== "undefined" && typeof ctx.currentInstance[key] !== "undefined") {
        return ctx.currentInstance[key];
    }
}