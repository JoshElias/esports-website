var async = require("async");
var Promise = require("bluebird");
var uuid = require("node-uuid");
var loopback = require("loopback");
var bcrypt = require('bcrypt-nodejs');
var request = require("request");

var emailBuilder = require("../../server/lib/email/email-builder");
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

                    // Compile the email html
                    var domain = User.app.get("domain");
                    var templateOptions = {
                        header: {
                            url: String.format("http://{0}", domain),
                            imgSrc: "http://www.tempostorm.com/img/email/email-logo.png"
                        },
                        body: {
                            title: {
                                text: "You're almost done signing up!"
                            },
                            description: {
                                text: "Please click the link below to confirm your email address.",
                                code: String.format("Activation Code: {0}", user.verificationToken)
                            },
                            button: {
                                url: String.format("http://{0}/api/users/confirm?uid={1}&token={2}&redirect={3}",
                                    domain, user.id, user.verificationToken, "/"),
                                text: "Activate Now"
                            }
                        }
                    }

                    var html = emailBuilder.compileHtml("account-activation", templateOptions);

                    // Send the email
                    var mailOptions = {
                        Destination: {
                            ToAddresses: [user.email]
                        },
                        Message: {
                            Body: {
                                Html: {
                                    Data: html
                                }
                            },
                            Subject: {
                                Data: "Reset your account password"
                            }
                        },
                        Source: "Tempostorm <admin@tempostorm.com>",
                        ReplyToAddresses: ["admin@tempostorm.com"]
                    };

                    var Email = userModel.email;
                    return Email.send(mailOptions, function (err, email) {
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

        // Compile the email html
        var domain = User.app.get("domain");
        var templateOptions = {
            header: {
                url: String.format("http://{0}", domain),
                imgSrc: "http://www.tempostorm.com/img/email/email-logo.png"
            },
            body: {
                title: {
                    text: "Lost your password?"
                },
                description: {
                    text: "Don't worry, we can help you out with that."
                },
                button: {
                    url: String.format("http://{0}/forgot-password/reset?email={1}&token={2}",
                        domain, info.email, info.accessToken.id.toString()),
                    text: "Reset Password"
                }
            }
        }
        var html = emailBuilder.compileHtml("reset-password", templateOptions);

        // Send the email
        var mailOptions = {
            Destination: {
                ToAddresses: [info.email]
            },
            Message: {
                Body: {
                    Html: {
                        Data: html
                    }
                },
                Subject: {
                    Data: "Reset your account password"
                }
            },
            Source: "Tempostorm <admin@tempostorm.com>",
            ReplyToAddresses: ["admin@tempostorm.com"]
        };

        var Email = User.app.models.Email;
        return Email.send(mailOptions, function (err, email) {
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

    User.requestEmailChange = function (email, finalCb) {
        finalCb = finalCb || new Promise();
        var ttl = User.settings.resetPasswordTokenTTL || DEFAULT_RESET_PW_TTL;

        return User.getCurrent(function(err, user) {
            if(err) return finalCb(err);
            else if(!user) return finalCb(noUserErr);

            return user.accessTokens.create({ttl: ttl}, function (tokenErr, accessToken) {
                if (tokenErr) {
                    var err = new Error('unable to create access token for user');
                    err.statusCode = 400;
                    err.code = 'UNABLE_TO_GENERATE_TOKEN';
                    return finalCb(err);
                }

                // Compile the email html
                var domain = User.app.get("domain");
                var templateOptions = {
                    header: {
                        url: String.format("http://{0}", domain),
                        imgSrc: "http://www.tempostorm.com/img/email/email-logo.png"
                    },
                    body: {
                        title: {
                            text: "Verify New Email Address"
                        },
                        description: {
                            text: "Please verify your new email address by clicking the button below."
                        },
                        button: {
                            url: String.format("http://{0}/api/users/changeEmail?uid={1}&token={2}&email={3}",
                                domain, user.id.toString(), accessToken.id.toString(), email),
                            text: "Confirm Email"
                        }
                    }
                }
                var html = emailBuilder.compileHtml("email-changed", templateOptions);

                // Send the email
                var mailOptions = {
                    Destination: {
                        ToAddresses: [email]
                    },
                    Message: {
                        Body: {
                            Html: {
                                Data: html
                            }
                        },
                        Subject: {
                            Data: "Email Updated"
                        }
                    },
                    Source: "Tempostorm <admin@tempostorm.com>",
                    ReplyToAddresses: ["admin@tempostorm.com"]
                };

                var Email = User.app.models.Email;
                return Email.send(mailOptions, function (err, email) {
                    if (err) {
                        var err = new Error('unable to send verification email');
                        err.statusCode = 400;
                        err.code = 'UNABLE_TO_SEND_EMAIL';
                        return finalCb(err);
                    }
                    return finalCb();
                });
            });
        });
    };

    
    User.changeEmail = function (uid, token, email, finalCb) {
        finalCb = finalCb || new Promise();

        var emailErr = new Error('unable to change email');
        emailErr.statusCode = 400;
        emailErr.code = 'UNABLE_TO_CHANGE_EMAIL';

        return User.findById(uid, function (err, user) {
            if (err) return finalCb(err);
            else if(!user) {
                var err = new Error('no user found');
                err.statusCode = 400;
                err.code = 'USER_NOT_FOUND';
                finalCb(err);
            }

            // check if the user has the access token
            return user.accessTokens.findById(token, function (tokenErr, accessToken) {
                if (tokenErr) return finalCb(emailErr);

                return user.updateAttribute("email", email, function (emailErr, emailInstance) {
                    if (emailErr) return finalCb(emailErr);

                    var ctx = loopback.getCurrentContext();
                    var res = ctx.active.http.res;
                    var req = ctx.active.http.req;
                    return user.createAccessToken("1209600", function (err, loginToken) {
                        if (err) return finalCb(err);
                        loginToken.__data.user = user;
                        return req.logIn(user, function (err) {
                            if (err) return finalCb(err);

                            res.cookie('access_token', loginToken.id.toString(), {
                                signed: req.signedCookies ? true : false,
                                // maxAge is in ms
                                maxAge: loginToken.ttl
                            });
                            res.cookie('userId', user.id.toString(), {
                                signed: req.signedCookies ? true : false,
                                maxAge: loginToken.ttl
                            });

                            var domain = User.app.get("domain");
                            res.redirect("http://"+domain);
                            return finalCb()
                        });
                    });
                });
            });
        });
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

    User.unlink = function (provider, cb) {
        cb = cb || new Promise();

        var UserIdentity = User.app.models.userIdentity;
        var ctx = loopback.getCurrentContext();
        var accessToken = ctx.get("accessToken");
        var userId = accessToken.userId.toString();

        return UserIdentity.destroyAll({userId:userId, provider:provider}, cb);
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

    User.getUsersWithActive = function (filter, cb) {
        cb = cb || new Promise();

        var findUsers = function (cb) {
            User.find(filter, function (err, data) {
                return cb(err, data);
            });
        }

        var getRoles = function (users, cb) {
            var newUsers = [];
            var roles = [
                '$active'
            ]

            async.each(users, function (user, eachCb) {
                User.isInRoles(user.id, roles, undefined, undefined, function (err, role) {
                    if (err) {
                        return eachCb(err);
                    }

                    user.isActive = role.$active;
                    newUsers.push(user);

                    return eachCb();
                });
            }, function (err) {
                return cb(err, newUsers);
            });
        }

        async.waterfall([
            findUsers,
            getRoles
        ], function (err, users) {
            if (err) {
                return console.log("ERR", err);
            }

            return cb(err, users);
        });
    }

    User.remoteMethod(
        'getUsersWithActive',
        {
            description: "Returns users with their active role attached",
            accepts: [
                {arg: 'filter', type: 'object', required:false, http: {source: 'query'}},
            ],
            returns: {arg: 'users', type: 'object'},
            http: {verb: 'get'},
            isStatic: true
        }
    );

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
        'unlink',
        {
            description: "Unlink providers from currently logged in user",
            accepts: {arg: 'provider', type: 'string', required:true, http: {source: 'form'}},
            http: {verb: 'post'},
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
        'requestEmailChange',
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
