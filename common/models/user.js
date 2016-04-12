var async = require("async");
var Promise = require("bluebird");
var uuid = require("node-uuid");
var loopback = require("loopback");
var bcrypt = require('bcrypt-nodejs');
var request = require("request");

var subscription = require("../../server/lib/subscription");


module.exports = function(User) {

    var DEFAULT_TTL = 1209600; // 2 weeks in seconds
    var DEFAULT_RESET_PW_TTL = 15 * 60; // 15 mins in seconds
    var DEFAULT_MAX_TTL = 31556926; // 1 year in seconds


    var noUserErr = new Error('unable to find user');
    noUserErr.statusCode = 404;
    noUserErr.code = 'USER_NOT_FOUND';

    var invalidTokenErr = new Error('Invalid token');
    invalidTokenErr.statusCode = 400;
    invalidTokenErr.code = 'INVALID_TOKEN';

    var invalidCatpchaTokenErr = new Error('Invalid captcha token');
    invalidCatpchaTokenErr.statusCode = 400;
    invalidCatpchaTokenErr.code = 'INVALID_CAPTCHA_TOKEN';

    
    User.afterRemote("login", function (ctx, remoteMethodOutput, next) {
        ctx.method.skipFilter = true;
        ctx.req.logIn(ctx.result.toJSON().user, function (err) {
            next(err);
        });
    });


    // Handle user registeration
    User.afterRemote("create", function (ctx, user, next) {
        user.verify(ctx, function (err) {
            next(err);
        });
    });

    
    // Override the base User's verify method
    User.on('attached', function (obj) {

        User.prototype.verify = function (ctx, finalCallback) {
            var user = this;
            var userModel = this.constructor;
            //var registry = userModel.registry;

            async.waterfall([
                    /*
                // Verify Capcha
                function(seriesCb) {
                    if(typeof ctx.options !== "object" || typeof ctx.options.captchaToken !== "string") {
                        seriesCb(invalidCatpchaTokenErr);
                    }

                    var loopbackContext = loopback.getCurrentContext();
                    var captchaSecret = loopbackContext.get("captchaSecret");
                    var captchaUrl = "https://www.google.com/recaptcha/api/siteverify";
                    var captchaOptions = {
                        form: {
                            secret: captchaSecret,
                            response: ctx.options.captchaToken
                        }
                    }

                    request.post(captchaUrl, captchaOptions, function (err, res, body) {
                        if(err) return seriesCb(err);
                        else if(res.statusCode !== 200) {
                            return seriesCb(invalidCatpchaTokenErr);
                        }

                        var body = JSON.parse(body);
                        if(!body.success) {
                            return seriesCb(invalidCatpchaTokenErr);
                        }

                        return seriesCb();
                    });
                },
                */
                // Generate token
                function (seriesCallback) {
                    var tokenGenerator = generateVerificationToken;
                    tokenGenerator(user, seriesCallback);
                },
                // Save user with new token
                function (newToken, seriesCallback) {
                    user.updateAttribute("verificationToken", newToken, seriesCallback)
                },
                // Send Email
                function (user, seriesCallback) {
                    var mailOptions = {
                        from: {name: "Tempostorm", email: "admin@tempostorm.com"},
                        to: {name: user.username, email: user.email, type: "to"},
                        template: {
                            name: "testactivation"
                        },
                        subject: "Confirm your account",
                        //text: "text message",
                        //html: "<b>message</b>"
                        vars: [{
                            "rcpt": user.email,
                            "vars": [{
                                'name': 'ID',
                                'content': user.id
                            }, {
                                'name': 'TOKEN',
                                'content': user.verificationToken
                            }, {
                                'name': 'REDIRECT',
                                'content': '/'
                            }]
                        }],
                        tags: ["signup"]
                    };

                    var Email = userModel.email;
                    Email.send(mailOptions, function (err, email) {
                        seriesCallback(err);
                    });
                }],
            finalCallback);
        }

        
        /**
         * Confirm the user's identity.
         *
         * @param {Any} uid
         * @param {String} token The validation token
         * @param {String} redirect URL to redirect the user to once confirmed
         * @callback {Function} callback
         * @param {Error} err
         */
        User.confirm = function (uid, token, redirect, fn) {
            fn = fn || new Promise();

            User.findOne({where:{id:uid, verificationToken:token}}, function (err, user) {
                if (err) return fn(err);
                else if(!user) return fn(noUserErr);

                user.verificationToken = undefined;
                user.emailVerified = true;
                user.save(function (err) {
                    if (err) {
                        return fn(err);
                    }

                    var ctx = loopback.getCurrentContext();
                    if (!ctx || !ctx.active) {
                        return fn(noUserErr);
                    }

                    var res = ctx.active.http.res;
                    var req = ctx.active.http.req;
                    user.createAccessToken("1209600", function (err, token) {
                        if (err) return fn(err);

                        token.__data.user = user;
                        req.logIn(user, function (err) {
                            if (err) return next(err);

                            res.cookie('access_token', token.id.toString(), {
                                signed: req.signedCookies ? true : false,
                                // maxAge is in ms
                                maxAge: token.ttl
                            });
                            res.cookie('userId', user.id.toString(), {
                                signed: req.signedCookies ? true : false,
                                maxAge: token.ttl
                            });

                            fn(err, token);
                        });
                    });
                });
            });

            return fn.promise;
        };

    });

    /*!
     * Hash the plain password
     */
    User.hashPassword = function (plain) {
        this.validatePassword(plain);
        var salt = bcrypt.genSaltSync(10);
        return bcrypt.hashSync(plain, salt);
    };


    function generateVerificationToken(user, finalCallback) {
        try {
            var token = uuid.v4().substring(0, 22);
            finalCallback(undefined, token)
        } catch (err) {
            finalCallback(err);
        }
    };


    //send password reset link when requested
    User.on('resetPasswordRequest', function (info) {

        var mailOptions = {
            from: {name: "Tempostorm", email: "admin@tempostorm.com"},
            to: {name: info.user.username, email: info.email, type: "to"},
            template: {
                name: "testresetpassword"
            },
            subject: "Reset your account password",
            //text: "text message",
            //html: "<b>message</b>"
            vars: [{
                "rcpt": info.email,
                "vars": [{
                    'name': 'EMAIL',
                    'content': info.email
                }, {
                    'name': 'TOKEN',
                    'content': info.accessToken.id.toString()
                }]
            }],
            tags: ["signup"]
        };

        var Email = User.app.models.Email;
        Email.send(mailOptions, function (err, email) {
            if (err) {
                console.log("ERR resetting user password");
                console.log("send the client some kind of error?")
            }
        });
    });


    
    User.changePassword = function (email, password, token, cb) {
        cb = cb || new Promise();

        User.findOne({where: {email: email}}, function (err, user) {
            if (err) {
                cb(err);
            } else if (user) {

                var err = new Error('unable to save new password');
                err.statusCode = 400;
                err.code = 'UNABLE_TO_CHANGE_PASSWORD';

                // check if the user has the access token
                user.accessTokens.findById(token, function (tokenErr, accessToken) {
                    if (tokenErr) return cb(err);

                    var newPassword = User.hashPassword(password);
                    user.updateAttribute("password", newPassword, function (err, instance) {
                        if (err) {
                            var err = new Error('unable to save new password');
                            err.statusCode = 400;
                            err.code = 'UNABLE_TO_CHANGE_PASSWORD';
                            return cb(err);
                        }
                        cb();
                    });
                });

            } else {
                var err = new Error('no user found');
                err.statusCode = 400;
                err.code = 'USER_NOT_FOUND';
                cb(err);
            }
        });

        return cb.promise;
    };

    User.resetEmail = function (email, cb) {
        cb = cb || new Promise();
        var ttl = User.settings.resetPasswordTokenTTL || DEFAULT_RESET_PW_TTL;

        User.getCurrent(function(err, user) {
            if(err) return cb(err);
            else if(!user) return cb(noUserErr);

            user.accessTokens.create({ttl: ttl}, function (tokenErr, accessToken) {
                if (tokenErr) {
                    var err = new Error('unable to create access token for user');
                    err.statusCode = 400;
                    err.code = 'UNABLE_TO_GENERATE_TOKEN';
                    return cb(err);
                }

                var mailOptions = {
                    from: {name: "Tempostorm", email: "admin@tempostorm.com"},
                    to: {name: user.username, email: email, type: "to"},
                    template: {
                        name: "test-email-change-confirmed"
                    },
                    subject: "Email Updated",
                    //text: "text message",
                    //html: "<b>message</b>"
                    vars: [{
                        "rcpt": data.email,
                        "vars": [{
                            'name': 'UID',
                            'content': user.id.toString()
                        }, {
                            'name': 'TOKEN',
                            'content': accessToken.id.toString()
                        }, {
                            'name': 'EMAIL',
                            'content': email
                        }]
                    }],
                    tags: ["signup"]
                };

                var Email = User.app.models.Email;
                Email.send(mailOptions, function (err, email) {
                    if (err) {
                        var err = new Error('unable to send verification email');
                        err.statusCode = 400;
                        err.code = 'UNABLE_TO_SEND_EMAIL';
                        return cb(err);
                    }
                    return cb();
                });

            });

        });

        return cb.promise;
    };

    
    User.changeEmail = function (uid, token, email, cb) {
        cb = cb || new Promise();

        var AccessToken = User.app.models.AccessToken;

        var emailErr = new Error('unable to change email');
        emailErr.statusCode = 400;
        emailErr.code = 'UNABLE_TO_CHANGE_EMAIL';

        AccessToken.findOne({where:{id:token, userId:uid}, include:"user"}, function(err, accessToken) {
            if(err || !accessToken || !accessToken.user) return cb(invalidTokenErr);

            accessToken.user.updateAttribute("email", email, function (err, emailInstance) {
                if (err) return cb(err);


                var ctx = loopback.getCurrentContext();
                if (!ctx || !ctx.active) {
                    return cb(emailErr);
                }

                var res = ctx.active.http.res;
                var req = ctx.active.http.req;
                user.createAccessToken("1209600", function (err, loginToken) {
                    if (err) return cb(invalidTokenErr);
                    loginToken.__data.user = user;
                    req.logIn(user, function (err) {
                        if (err) return next(err);

                        res.cookie('access_token', loginToken.id.toString(), {
                            signed: req.signedCookies ? true : false,
                            // maxAge is in ms
                            maxAge: loginToken.ttl
                        });
                        res.cookie('userId', user.id.toString(), {
                            signed: req.signedCookies ? true : false,
                            maxAge: loginToken.ttl
                        });

                        res.redirect("https://52.26.75.137");
                    });

                    return cb();
                });
            });
        });

        User.findById(uid, function (err, user) {
            if (err) {
                cb(err);
            } else if (user) {

                var err = new Error('unable to change email');
                err.statusCode = 400;
                err.code = 'UNABLE_TO_CHANGE_EMAIL';

                // check if the user has the access token
                user.accessTokens.findById(token, function (tokenErr, accessToken) {
                    if (tokenErr) return cb(err);

                    user.updateAttribute("email", email, function (emailErr, emailInstance) {
                        if (emailErr) return cb(emailErr);

                        var ctx = loopback.getCurrentContext();
                        if (ctx.active) {
                            var res = ctx.active.http.res;
                            var req = ctx.active.http.req;
                            user.createAccessToken("1209600", function (err, loginToken) {
                                if (err) return cb(err);
                                loginToken.__data.user = user;
                                req.logIn(user, function (err) {
                                    if (err) return next(err);

                                    res.cookie('access_token', loginToken.id.toString(), {
                                        signed: req.signedCookies ? true : false,
                                        // maxAge is in ms
                                        maxAge: loginToken.ttl
                                    });
                                    res.cookie('userId', user.id.toString(), {
                                        signed: req.signedCookies ? true : false,
                                        maxAge: loginToken.ttl
                                    });

                                    res.redirect("https://52.26.75.137");
                                });
                                cb();
                            });
                        } else {
                            cb()
                        }
                    });
                });

            } else {
                var err = new Error('no user found');
                err.statusCode = 400;
                err.code = 'USER_NOT_FOUND';
                cb(err);
            }
        });

        return cb.promise;
    };



    User.isInRoles = function(uid, roleNames, req, options, finalCb) {
        if (finalCb === undefined && typeof options === "function") {
            finalCb = options;
            options = undefined;
        }

        finalCb = finalCb || new Promise();

        var Role = User.app.models.Role;
        var RoleMapping = User.app.models.RoleMapping;


        // Check for the roles we already have
        var isInRoles = {};
        if (req) {

            // Add generic static/dynamic roles
            if (typeof req.roles !== "object") {
                req.roles = {};
            }
            if(typeof req.roles[uid] !== "object") {
                req.roles[uid] = {};
            }

            var currentRoles = req.roles[uid];
            for (var key in currentRoles) {
                isInRoles[key] = currentRoles[key];
            }

            // Add the owner status if applicable
            if (req.ownedModels !== "object") {
                req.ownedModels = {};
            }
            if (req.ownedModels[uid] !== "object") {
                req.ownedModels[uid] = {};
            }

            var ownedModels = req.ownedModels[uid];
            if(options && typeof options.modelId === "string") {
                if(typeof ownedModels[options.modelId] !== "undefined") {
                    isInRoles["$owner"] = ownedModels[options.modelId];
                }
            }
        }

        
        // Re evaluate isInRole report
        if (Object.keys(isInRoles).length > 0) {
            var all = true;
            var none = true;
            for (var key in isInRoles) {
                var inRoleVal = isInRoles[key];
                if (!inRoleVal && all) {
                    all = false;
                } else if (inRoleVal && none) {
                    none = false;
                }

            }
            isInRoles.all = all;
            isInRoles.none = none;
        } else {
            isInRoles.all = true;
            isInRoles.none = true;
        }

        return async.each(roleNames, function (roleName, eachCb) {

            if (typeof isInRoles[roleName] !== "undefined") {
                return eachCb();
            }

            function updateIsInRoles(err, isRole) {
                if (err) return eachCb(err);

                if (!isRole && isInRoles.all) {
                    isInRoles.all = false;
                } else if (isRole && isInRoles.none) {
                    isInRoles.none = false;
                }

                isInRoles[roleName] = isRole;
                return eachCb();
            }

            // Handle the $owner role specially.
            if (roleName === "$owner") {

                if (typeof options !== "object" || !options.modelClass || !options.modelId) {
                    return updateIsInRoles(undefined, false);
                }

                var modelClass = loopback.getModel(options.modelClass);
                return Role.isOwner(modelClass, options.modelId, uid, function (err, isRole) {
                    if (err) return eachCb(err);

                    if (req) {
                        req.ownedModels[uid][options.modelId] = isRole;
                    }
                    return updateIsInRoles(undefined, isRole);
                });
            }

            // Handle all other roles
            return Role.isInRole(roleName, {principalType: RoleMapping.USER, principalId: uid}, function (err, isRole) {
                if (err) return eachCb(err);


                if (req) {
                    req.roles[uid][roleName] = isRole;
                }
                return updateIsInRoles(undefined, isRole);
            })


        }, function (err) {
            if (err) return finalCb(err);

            return finalCb(err, isInRoles);
        });
    };


    User.assignRoles = function (uid, roleNames, finalCb) {

        finalCb = finalCb || new Promise();

        var Role = User.app.models.Role;
        var RoleMapping = User.app.models.RoleMapping;

        // Set the request if available
        var loopbackContext = loopback.getCurrentContext();
        var req;
        if (loopbackContext && loopbackContext.active && loopbackContext.active.http){
            loopbackContext.set("req", loopbackContext.active.http.req);
        }

        // Stringify uid
        uid = uid.toString();

        function assignRole(roleName, assignCb) {
            async.waterfall([
                // check if user is already that role
                function (seriesCb) {

                    var req;
                    if (loopbackContext) {
                        req = loopbackContext.get("req");
                    }
                    return User.isInRoles(uid, [roleName], req, undefined, function (err, isInRoles) {
                        if (err) return seriesCb(err);
                        if (isInRoles[roleName]) return seriesCb("ok");
                        else return seriesCb(undefined)
                    });
                },
                // Get the new role
                function (seriesCb) {

                    Role.findOne({where: {name: roleName}}, function (err, role) {
                        if (err) return seriesCb(err);
                        if (!role) {
                            var roleErr = new Error('no role found');
                            roleErr.statusCode = 400;
                            roleErr.code = 'ROLE_NOT_FOUND';
                            return seriesCb(roleErr);
                        }
                        return seriesCb(undefined, role);
                    });
                },
                // Assign the user to that role
                function (role, seriesCb) {

                    role.principals.create({
                        principalType: RoleMapping.USER,
                        principalId: uid
                    }, function (err, newPrincipal) {
                        seriesCb(err);
                    });
                },
                // Add the role to the req cache
                function(seriesCb) {

                    var req;
                    if (loopbackContext) {
                        req = loopbackContext.get("req");
                    }

                    if(!req) {
                        return seriesCb();
                    }

                    var roles = req.roles;
                    if(typeof roles !== "object") {
                        roles = {};
                    }

                    var userRoles = roles[uid.toString()];
                    if(typeof userRoles !== "object") {
                        userRoles = {};
                    }

                    userRoles[roleName] = true;
                    return seriesCb();
                }],
            function (err) {
                if (err && err !== "ok") return assignCb(err);
                return assignCb();
            });
        }

        return async.eachSeries(roleNames, assignRole, finalCb);
    };


    User.revokeRoles = function (uid, roleNames, finalCb) {
        finalCb = finalCb || new Promise();

        var Role = User.app.models.Role;
        var RoleMapping = User.app.models.RoleMapping;

        // Set the request if available
        var loopbackContext = loopback.getCurrentContext();
        var req;
        if (loopbackContext && loopbackContext.active && loopbackContext.active.http){
            loopbackContext.set("req", loopbackContext.active.http.req);
        }

        uid = uid.toString();

        function revokeRole(roleName, assignCb) {
            async.waterfall([
                // check if user is already that role
                function (seriesCb) {
                    User.isInRoles(uid, [roleName], req, undefined, function (err, isInRoles) {
                        if (err) return seriesCb(err);

                        if (!isInRoles[roleName]) return seriesCb("ok");
                        else return seriesCb(undefined)
                    });
                },
                // Get the new role
                function (seriesCb) {
                    Role.findOne({where: {name: roleName}}, function (err, role) {
                        if (err) return seriesCb(err);

                        if (!role) {
                            var roleErr = new Error('no role found');
                            roleErr.statusCode = 400;
                            roleErr.code = 'ROLE_NOT_FOUND';
                            return seriesCb(roleErr);
                        }

                        return seriesCb(undefined, role);
                    });
                },
                // Remove the user to that role
                function (role, seriesCb) {
                    RoleMapping.destroyAll({
                        principalType: RoleMapping.USER,
                        principalId: uid.toString(),
                        roleId: role.id
                    }, function (err) {
                        seriesCb(err);
                    });
                },
                // Remove the role from the req cache
                function(seriesCb) {

                    var req;
                    if (loopbackContext) {
                        req = loopbackContext.get("req");
                    }

                    if(!req) {
                        return seriesCb();
                    }

                    var roles = req.roles;
                    if(typeof roles !== "object") {
                        return seriesCb();
                    }

                    var currentRoles = roles[uid];
                    if(typeof currentRoles !== "object") {
                        return seriesCb();
                    }

                    currentRoles[roleName] = false;
                    return seriesCb();
                }],
            function (err) {
                if (err && err !== "ok") return assignCb(err);
                return assignCb();
            });
        }

        return async.eachSeries(roleNames, revokeRole, finalCb);
    };



    User.isLinked = function (providers, cb) {
        cb = cb || new Promise();

        var UserIdentity = User.app.models.userIdentity;
        var ctx = loopback.getCurrentContext();
        var accessToken = ctx.get("accessToken");
        var userId = accessToken.userId.toString();

        var isLinked = {};
        async.mapSeries(providers, function(provider, seriesCb) {
            UserIdentity.findOne({where:{userId:userId, provider:provider}}, function(err, identity) {
                isLinked[provider] = !!identity;
                return seriesCb(err)
            });
        }, function(err) {
            cb(err, isLinked);
        });

        return cb.promise;
    };

    User.getCurrent = function(finalCb) {

        // Is the user logged in?
        var loopbackContext = loopback.getCurrentContext();
        if(!loopbackContext || typeof loopbackContext.active !== "object" || Object.keys(loopbackContext.active).length < 1) {
            var noContextErr = new Error("Server could not find http context. Contact system admin.");
            noContextErr.statusCode = 500;
            noContextErr.code = 'NO_HTTP_CONTEXT';
            return finalCb(noContextErr);
        }
        var req = loopbackContext.active.http.req;

        // Return if we've already cached the current user
        if (req.currentUser)
            return finalCb(undefined, req.currentUser);

        // Do we have a user Id
        if (!req.accessToken || !req.accessToken.userId) {
            return finalCb();
        }
        var userId = req.accessToken.userId.toString();


        return User.findById(userId, function (err, user) {
            if (err) return finalCb(err);
            else if(user) {
                req.currentUser = user;
                loopbackContext.set("currentUser", user);
            }

            return finalCb(undefined, user);
        });
    };


    User.setSubscriptionPlan = function (plan, cctoken, cb) {
        cb = cb || new Promise();

        User.getCurrent(function (err, user) {
            if (err) return cb(err);
            else if(!user) return cb(noUserErr);

            subscription.setPlan(user, plan, cctoken, cb);
        });
    };


    User.setSubscriptionCard = function (cctoken, cb) {
        cb = cb || new Promise();

        User.getCurrent(function (err, user) {
            if (err) return cb(err);
            else if(!user) return cb(noUserErr);

            subscription.setCard(user, cctoken, cb);
        });
    };

    User.cancelSubscription = function (cb) {
        cb = cb || new Promise();

        User.getCurrent(function (err, user) {
            if (err) return cb(err);
            else if(!user) return cb(noUserErr);

            subscription.cancel(user, cb);
        });
    };

    



    User.remoteMethod(
        'isInRoles',
        {
            description: "Checks if a user is of role",
            accepts: [
                {arg: 'uid', type: 'string', required:true, http: {source: 'query'}},
                {arg: 'roleNames', type: 'array', required:true, http: {source: 'query'}},
                {arg: 'req', type: 'object', description:'http request object. Not read from client', required:true, http: {source: 'req'}},
                {arg: 'options', type: 'object', http: {source: 'query'}}
            ],
            returns: {arg: 'isInRoles', type: 'object'},
            http: {verb: 'get'},
            isStatic: true
        }
    );

    User.remoteMethod(
        'assignRoles',
        {
            description: "Assigns a role to a user",
            accepts: [
                {arg: 'uid', type: 'string', required:true, http: {source: 'form'}},
                {arg: 'roleNames', type: 'array', required:true, http: {source: 'form'}}
            ],
            http: {verb: 'post'},
            isStatic: true
        }
    );

    User.remoteMethod(
        'isLinked',
        {
            description: "Checks if a user has a 3rd party link",
            accepts: {arg: 'providers', type: 'array', required:true, http: {source: 'query'}},
            returns: {arg: 'isLinked', type: 'object'},
            http: {verb: 'get'},
            isStatic: true
        }
    );


    User.remoteMethod(
        'changePassword',
        {
            description: "Changes user's password",
            accepts: [
                {arg: 'email', type: 'string', required:true, http: {source: 'form'}},
                {arg: 'password', type: 'string', required:true, http: {source: 'form'}},
                {arg: 'token', type: 'string', required:true, http: {source: 'form'}}
            ],
            http: {verb: 'post'},
            isStatic: true
        }
    );

    User.remoteMethod(
        'resetEmail',
        {
            description: "Resets a user's email",
            accepts: {arg: 'email', type: 'string', required:true, http: {source: 'form'}},
            http: {verb: 'post'},
            isStatic: true
        }
    );

    User.remoteMethod(
        'changeEmail',
        {
            description: "Changes user's email",
            accepts: [
                {arg: 'uid', type: 'string', required:true, http: {source: 'query'}},
                {arg: 'token', type: 'string', required:true, http: {source: 'query'}},
                {arg: 'email', type: 'string', required:true, http: {source: 'query'}},
            ],
            http: {verb: 'get'},
            isStatic: true
        }
    );

    User.remoteMethod(
        'setSubscriptionPlan',
        {
            description: "Set a subscription plan for a user",
            accepts: [
                {arg: 'plan', type: 'string', required:true, http: {source: 'form'}},
                {arg: 'cctoken', type: 'string', required:true, http: {source: 'form'}}
            ],
            http: {verb: 'post'},
            isStatic: true
        }
    );

    User.remoteMethod(
        'setSubscriptionCard',
        {
            description: "Replace a user's subscription card number",
            accepts: {arg: 'cctoken', type: 'string', required:true, http: {source: 'form'}},
            http: {verb: 'post'},
            isStatic: true
        }
    );

    User.remoteMethod(
        'cancelSubscription',
        {
            description: "Cancel a user's subscription",
            http: {verb: 'post'},
            isStatic: true
        }
    );

    User.remoteMethod(
        'revokeRoles',
        {
            description: "Revokes roles of the user",
            accepts: [
                {arg: 'uid', type: 'string', required:true, http: {source: 'form'}},
                {arg: 'roleNames', type: 'array', required:true, http: {source: 'form'}}
            ],
            http: {verb: 'post'},
            isStatic: true
        }
    );
};
