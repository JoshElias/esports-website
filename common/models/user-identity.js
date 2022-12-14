var loopback = require('loopback');
var url = require('url');


module.exports = function(UserIdentity) {


    /**
     * Log in with a third-party provider such as Facebook or Google.
     *
     * @param {String} provider The provider name.
     * @param {String} authScheme The authentication scheme.
     * @param {Object} profile The profile.
     * @param {Object} credentials The credentials.
     * @param {Object} [options] The options.
     * @callback {Function} cb The callback function.
     * @param {Error|String} err The error object or string.
     * @param {Object} user The user object.
     * @param {Object} [info] The auth info object.
     *
     * -  identity: UserIdentity object
     * -  accessToken: AccessToken object
     */
    UserIdentity.login = function (provider, authScheme, profile, credentials,
                                   options, cb) {
        options = options || {};
        if (typeof options === 'function' && cb === undefined) {
            cb = options;
            options = {};
        }

        // Third party login is not available for development
        if(typeof process.env.NODE_ENV !== "string" || process.env.NODE_ENV === "development") {
            var thirdPartyLoginErr = new Error('Third party login is not available in development');
            thirdPartyLoginErr.statusCode = 400;
            thirdPartyLoginErr.code = 'UNABLE_TO_LOGIN';
            return cb(thirdPartyLoginErr);
        }

        // Get the host to rediret to from the provider information
        var urlObj = url.parse(options.callbackURL);
        var redirectUrl = urlObj.protocol + "//" + urlObj.host;

        var autoLogin = options.autoLogin || options.autoLogin === undefined;
        provider = (profile.battletag) ? "bnet" : "twitch"; // extend if needed

        // Set the result if available
        var loopbackContext = loopback.getCurrentContext();
        if (loopbackContext && loopbackContext.active && loopbackContext.active.http){
            loopbackContext.set("res", loopbackContext.active.http.res);
        }

        return UserIdentity.findOne({
            where: {
                provider: provider,
                externalId: profile.id
            }
        }, function (err, identity) {
            if (err) {

                var res;
                if (loopbackContext) {
                    res = loopbackContext.get("res");
                }

                if(res) {
                    res.cookie("thirdPartyError", "Please link your " + provider + " profile to an email account first.", {
                        signed: true,
                        maxAge: 1209600
                    });
                    return res.redirect(redirectUrl);
                }

                return cb(err);
            } else if (identity) {
                identity.credentials = credentials;
                return identity.updateAttributes({
                    profile: profile,
                    credentials: credentials, modified: new Date()
                }, function (err, i) {
                    // Find the user for the given identity
                    return identity.user(function (err, user) {
                        // Create access token if the autoLogin flag is set to true
                        if (!err && user && autoLogin) {
                            return (options.createAccessToken || createAccessToken)(user, function (err, token) {
                                cb(err, user, identity, token);
                            });
                        }
                        cb(err, user, identity);
                    });
                });
            } else {
                var res;
                if (loopbackContext) {
                    res = loopbackContext.get("res");
                }

                if(res) {
                    res.cookie("thirdPartyError", "Please link your " + provider + " profile to an email account first.", {
                        signed: true,
                        maxAge: 1209600
                    });
                    return res.redirect(redirectUrl);
                }

                return cb(undefined, new Error("You must link your profile first"));
            }
        });
    };


    /**
     * Link a third party account to a LoopBack user
     * @param {String} provider The provider name
     * @param {String} authScheme The authentication scheme
     * @param {Object} profile The profile
     * @param {Object} credentials The credentials
     * @param {Object} [options] The options
     * @callback {Function} cb The callback function
     * @param {Error|String} err The error object or string
     * @param {Object} [credential] The user credential object
     */
    UserIdentity.link = function (userId, provider, authScheme, profile,
                                  credentials, options, cb) {
        options = options || {};
        if(typeof options === 'function' && cb === undefined) {
            cb = options;
            options = {};
        }

        var provider = (profile.battletag) ? "bnet" : "twitch"; // extend if needed
        UserIdentity.findOne({where: {
            userId: userId,
            provider: provider,
            externalId: profile.id
        }}, function (err, extCredential) {
            if (err) {
                return cb(err);
            }

            var date = new Date();
            if (extCredential) {
                // Find the user for the given extCredential
                extCredential.credentials = credentials;
                return extCredential.updateAttributes({profile: profile,
                    credentials: credentials, modified: date}, cb);
            }

            // Create the linked account
            var newUserIdentity = {
                provider: provider,
                externalId: profile.id,
                authScheme: authScheme,
                profile: profile,
                credentials: credentials,
                userId: userId
            };

            return UserIdentity.create(newUserIdentity, function (err, i) {
                return cb(err, i);
            });
        });
    }


    /*!
     * Create an access token for the given user
     * @param {User} user The user instance
     * @param {Number} [ttl] The ttl in millisenconds
     * @callback {Function} cb The callback function
     * @param {Error|String} err The error object
     * param {AccessToken} The access token
     */
    function createAccessToken(user, ttl, cb) {
        if (arguments.length === 2 && typeof ttl === 'function') {
            cb = ttl;
            ttl = 0;
        }
        user.accessTokens.create({
            created: new Date(),
            ttl: Math.min(ttl || user.constructor.settings.ttl,
                user.constructor.settings.maxTTL)
        }, cb);
    }
};
