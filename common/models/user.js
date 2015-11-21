module.exports = function(User) {
    var _ = require("underscore");
    var async = require("async");
    var uuid = require("node-uuid");
    var loopback = require("loopback");
    var bcrypt = require('bcrypt-nodejs');
    var utils = require("./../../lib/utils");
    var ObjectId = require("mongodb").ObjectID;
    var subscription = require("./../../lib/subscription");


    var DEFAULT_TTL = 1209600; // 2 weeks in seconds
    var DEFAULT_RESET_PW_TTL = 15 * 60; // 15 mins in seconds
    var DEFAULT_MAX_TTL = 31556926; // 1 year in seconds



    User.afterRemote("login", function (ctx, remoteMethodOutput, next) {
        var weirdOutput = JSON.parse(JSON.stringify(remoteMethodOutput));
        ctx.req.logIn(weirdOutput.user, function (err) {
            next(err);
        });
    });


    User.observe("access", function(ctx, next) {
        //removePrivateFields(ctx, next);
        next();
    });


    // Handle user registeration
    User.afterRemote("create", function (context, user, next) {
        var potentialOptions = {};
        user.verify(potentialOptions, function (err) {
            next(err);
        });
    });


    // Override the base User's verify method
    User.on('attached', function (obj) {

        User.prototype.verify = function (options, finalCallback) {
            var user = this;
            var userModel = this.constructor;
            //var registry = userModel.registry;

            async.waterfall([
                // Generate token
                function (seriesCallback) {
                    var tokenGenerator = options.generateVerificationToken || generateVerificationToken;
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
                            name: "testactivation",
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


    // Filter out sensitive user information depending on ACL
    var privateFields = ["subscription", "isProvider", "isAdmin", "lastLoginDate",
        "resetPasswordCode", "newEmail", "newEmailCode"];

    function removePrivateFields(ctx, finalCb) {
        var Role = User.app.models.Role;
        var RoleMapping = User.app.models.RoleMapping;

        // sets the private fields to false
        function removeFields() {
            try {
                if(!ctx.query.fields)
                    ctx.query.fields = {};

                for (var i = 0; i < privateFields.length; i++) {
                    var privateField = privateFields[i];
                    ctx.query.fields[privateField] = false;
                }
                return finalCb();
            } catch(err) {
                return finalCb(err);
            }
        }

        var loopbackContext = loopback.getCurrentContext();
        if(!loopbackContext) return removeFields();

        var accessToken = loopbackContext.get("accessToken");
        if(!accessToken || !accessToken.userId)
            return removeFields();

        async.series([
            function(seriesCb) {
                Role.isInRole("$owner", {principalType: RoleMapping.USER, principalId: accessToken.userId}, function (err, isRole) {
                    if (err) return seriesCb(err);
                    if (isRole) return seriesCb("ok");
                    else return seriesCb();
                });
            },
            function(seriesCb) {
                Role.isInRole("$admin", {principalType: RoleMapping.USER, principalId: accessToken.userId}, function (err, isRole) {
                    if (err) return seriesCb(err);
                    if (isRole) return seriesCb("ok");
                    else return seriesCb();
                });
            }
        ],
        function(err) {
            if(err === "ok") return finalCb();
            else if(err) return finalCb(err);
            else return removeFields();
        });
    };



    /**
     * Confirm the user's identity.
     *
     * @param {Any} userId
     * @param {String} token The validation token
     * @param {String} redirect URL to redirect the user to once confirmed
     * @callback {Function} callback
     * @param {Error} err
     */
    User.confirm = function (uid, token, redirect, fn) {
        fn = fn || utils.createPromiseCallback();
        User.findById(uid, function (err, user) {
            if (err) {
                fn(err);
            } else {
                if (user && user.verificationToken === token) {
                    user.verificationToken = undefined;
                    user.emailVerified = true;
                    user.save(function (err) {
                        if (err) {
                            fn(err);
                        } else {
                            var ctx = loopback.getCurrentContext();
                            if (ctx.active) {
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
                            } else {
                                fn(err, user);
                            }
                        }
                    });
                } else {
                    if (user) {
                        err = new Error('Invalid token: ' + token);
                        err.statusCode = 400;
                        err.code = 'INVALID_TOKEN';
                    } else {
                        err = new Error('User not found: ' + uid);
                        err.statusCode = 404;
                        err.code = 'USER_NOT_FOUND';
                    }
                    fn(err);
                }
            }
        });
        return fn.promise;
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


    User.changePassword = function (data, cb) {
        cb = cb || utils.createPromiseCallback();

        User.findOne({where: {email: data.email}}, function (err, user) {
            if (err) {
                cb(err);
            } else if (user) {

                var err = new Error('unable to save new password');
                err.statusCode = 400;
                err.code = 'UNABLE_TO_CHANGE_PASSWORD';

                // check if the user has the access token
                user.accessTokens.findById(data.token, function (tokenErr, accessToken) {
                    if (tokenErr) return cb(err);

                    var newPassword = User.hashPassword(data.password);
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


    User.resetEmail = function (data, cb) {
        cb = cb || utils.createPromiseCallback();
        var ttl = User.settings.resetPasswordTokenTTL || DEFAULT_RESET_PW_TTL;

        if (typeof data.email === 'string') {
            var err = new Error('unable to find user');
            err.statusCode = 400;
            err.code = 'USER_NOT_FOUND';

            User.findById(data.uid, function (userErr, user) {
                if (userErr) {
                    cb(err);
                } else if (user) {
                    user.accessTokens.create({ttl: ttl}, function (tokenErr, accessToken) {
                        if (tokenErr) {
                            var err = new Error('unable to create access token for user');
                            err.statusCode = 400;
                            err.code = 'UNABLE_TO_GENERATE_TOKEN';
                            return cb(err);
                        }

                        var mailOptions = {
                            from: {name: "Tempostorm", email: "admin@tempostorm.com"},
                            to: {name: user.username, email: data.email, type: "to"},
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
                                    'content': data.email
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
                } else {
                    var err = new Error('email is required');
                    err.statusCode = 400;
                    err.code = 'EMAIL_REQUIRED';
                    cb(err);
                }
            });
        } else {
            var err = new Error('email is required');
            err.statusCode = 400;
            err.code = 'EMAIL_REQUIRED';
            cb(err);
        }
        return cb.promise;
    }


    User.changeEmail = function (uid, token, email, cb) {
        cb = cb || utils.createPromiseCallback();

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


    User.assignRole = function (userId, roleName, cb) {
        cb = cb || utils.createPromiseCallback();

        var Role = User.app.models.Role;
        var RoleMapping = User.app.models.RoleMapping;

        async.waterfall([
            // check if user is already that role
            function (seriesCb) {
                Role.isInRole(roleName, {principalType: RoleMapping.USER, principalId: userId}, function (err, isRole) {
                    if (err) return seriesCb(err);

                    if (isRole) return seriesCb("ok");
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
                    principalId: userId
                }, function (err, newPrincipal) {
                    seriesCb(err);
                });
            }], function (err) {
            if (err && err !== "ok") return cb(err);
            return cb();
        });

        return cb.promise;
    };


    User.isRole = function (roleName, cb) {
        var Role = User.app.models.Role;
        var RoleMapping = User.app.models.RoleMapping;

        cb = cb || utils.createPromiseCallback();

        var ctx = loopback.getCurrentContext();
        var res = ctx.active.http.res;
        var req = ctx.active.http.req;


        var accessToken = ctx.get("accessToken");
        var userId = accessToken.userId;

        Role.isInRole(roleName, {principalType: RoleMapping.USER, principalId: userId}, cb);

        return cb.promise;
    };

    User.isLinked = function (provider, cb) {
        cb = cb || utils.createPromiseCallback();
        
        if(typeof provider === "undefined")
            return cb(undefined, false);
        
        var UserIdentity = User.app.models.userIdentity;
        var ctx = loopback.getCurrentContext();
        var accessToken = ctx.get("accessToken");
        var userId = accessToken.userId.toString();

        UserIdentity.findOne({where:{userId:userId, provider:provider}}, function(err, identity) {
            if(err) return cb(err);
            return cb(undefined, !!identity)
        });

        return cb.promise;
    };

    User.getCurrent = function (finalCb) {
        console.log("wtff")
        var err = new Error('no user found');
        err.statusCode = 400;
        err.code = 'USER_NOT_FOUND';

        var ctx = loopback.getCurrentContext();
        if (!ctx || !ctx.active) return finalCb(err);

        var res = ctx.active.http.res;
        var req = ctx.active.http.req;

        if (req.currentUser) return finalCb(undefined, req.currentUser);

        var accessToken = ctx.get("accessToken");
        if (!accessToken) return finalCb(err);
        req.app.models.user.findById(accessToken.userId, function (err, user) {
            if (err || !user) return finalCb(err);
            var Role = User.app.models.Role;
            var RoleMapping = User.app.models.RoleMapping;
            /*
            Role.getRoles({principalType: RoleMapping.USER, principalId: accessToken.userId}, function(err, roles) {
                console.log("bitches:", err)
                if(err) return finalCb(err);
*/
                //console.log("roles:", roles);
                req.currentUser = user;
                finalCb(undefined, user);
            //});
        });
    };


    User.setSubscriptionPlan = function (plan, cctoken, cb) {
        cb = cb || utils.createPromiseCallback();

        User.getCurrent(function (err, currentUser) {
            if (err) cb(err);

            subscription.setPlan(currentUser, plan, cctoken, cb);
        });
    };


    User.setSubscriptionCard = function (cctoken, cb) {
        cb = cb || utils.createPromiseCallback();

        User.getCurrent(function (err, currentUser) {
            if (err) cb(err);

            subscription.setCard(currentUser, cctoken, cb);
        });
    };

    User.cancelSubscription = function (cb) {
        cb = cb || utils.createPromiseCallback();

        User.getCurrent(function (err, currentUser) {
            if (err) cb(err);

            subscription.cancel(currentUser, cb);
        });
    };



    User.remoteMethod(
        'isRole',
        {
            description: "Checks if a user is of role",
            accepts: [
                {arg: 'roleName', type: 'string', http: {source: 'query'}}
            ],
            returns: {arg: 'isRole', type: 'boolean'},
            http: {verb: 'get'},
            isStatic: true
        }
    );

    User.remoteMethod(
        'isLinked',
        {
            description: "Checks if a user has a 3rd party link",
            accepts: [
                {arg: 'provider', type: 'string', http: {source: 'query'}}
            ],
            returns: {arg: 'isLinked', type: 'boolean'},
            http: {verb: 'get'},
            isStatic: true
        }
    );


    User.remoteMethod(
        'changePassword',
        {
            description: "Changes user's password",
            accepts: {arg: 'data', type: 'object', http: {source: 'body'}},
            http: {verb: 'post'},
            isStatic: true
        }
    );

    User.remoteMethod(
        'resetEmail',
        {
            description: "Resets a user's email",
            accepts: {arg: 'data', type: 'object', http: {source: 'body'}},
            http: {verb: 'post'},
            isStatic: true
        }
    );

    User.remoteMethod(
        'changeEmail',
        {
            description: "Changes user's email",
            accepts: [
                {arg: 'uid', type: 'string', http: {source: 'query'}},
                {arg: 'token', type: 'string', http: {source: 'query'}},
                {arg: 'email', type: 'string', http: {source: 'query'}},
            ],
            http: {verb: 'get'},
            isStatic: true
        }
    );

    User.remoteMethod(
        'setSubscriptionPlan',
        {
            description: "derp",
            accepts: [
                {arg: 'plan', type: 'string', http: {source: 'form'}},
                {arg: 'cctoken', type: 'string', http: {source: 'form'}}
            ],
            http: {verb: 'post'},
            isStatic: true
        }
    );

    User.remoteMethod(
        'setSubscriptionCard',
        {
            description: "derp",
            accepts: {arg: 'cctoken', type: 'string', http: {source: 'form'}},
            http: {verb: 'post'},
            isStatic: true
        }
    );

    User.remoteMethod(
        'cancelSubscription',
        {
            description: "derp",
            http: {verb: 'post'},
            isStatic: true
        }
    );

    User.remoteMethod(
        'assignRole',
        {
            description: "Assigns a role to a user",
            accepts: [
                {arg: 'userId', type: 'string', http: {source: 'form'}},
                {arg: 'roleName', type: 'string', http: {source: 'form'}}
            ],
            http: {verb: 'post'},
            isStatic: true
        }
    );
};
