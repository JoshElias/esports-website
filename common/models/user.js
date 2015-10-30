var async = require("async");
var uuid = require("node-uuid");
var loopback = require("loopback");
var bcrypt = require('bcrypt-nodejs');
var utils = require("../../lib/utils");


module.exports = function(User) {

  User.afterRemote("login", function(ctx, remoteMethodOutput, next) {
    var weirdOutput = JSON.parse(JSON.stringify(remoteMethodOutput));
    ctx.req.logIn(weirdOutput.user, function(err) {
      next(err);
    });
  });


 /*!
   * Hash the plain password
   */
  User.hashPassword = function(plain) {
    this.validatePassword(plain);
    var salt = bcrypt.genSaltSync(10);
    return bcrypt.hashSync(plain, salt);
  };


	// Handle user registeration
  User.afterRemote("create", function(context, user, next) {
    var potentialOptions = {};
    user.verify(potentialOptions, function(err) {
      next(err);
    })
  });

    function generateVerificationToken(user, finalCallback) {
        try {
            var token = uuid.v4().substring(0, 22);
            finalCallback(undefined, token)
        } catch(err) {
            finalCallback(err);
        }
    };

// Override the base User's verify method
    User.on('attached', function (obj) {

        User.prototype.verify = function(options, finalCallback) {
            var user = this;
            var userModel = this.constructor;
            //var registry = userModel.registry;

            async.waterfall([
                // Generate token
                function(seriesCallback) {
                    var tokenGenerator = options.generateVerificationToken || generateVerificationToken;
                    tokenGenerator(user, seriesCallback);
                },
                // Save user with new token
                function(newToken, seriesCallback) {
                    user.updateAttribute("verificationToken", newToken, seriesCallback)
                },
                // Send Email
                function(user, seriesCallback) {
                    var mailOptions = {
                        from: { name: "Tempostorm", email: "admin@tempostorm.com" },
                        to: { name: user.username, email: user.email, type: "to"},
                        template : {
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
                            },{
                                'name': 'TOKEN',
                                'content': user.verificationToken
                            },{
                                'name': 'REDIRECT',
                                'content': '/'
                            }]
                        }],
                        tags: [ "signup" ]
                    };

                    var Email = userModel.email;
                    Email.send(mailOptions, function(err, email) {
                        seriesCallback(err);
                    });
                }],
          finalCallback);
        }

      /**
       * Confirm the user's identity.
       *
       * @param {Any} userId
       * @param {String} token The validation token
       * @param {String} redirect URL to redirect the user to once confirmed
       * @callback {Function} callback
       * @param {Error} err
       */
      User.confirm = function(uid, token, redirect, fn) {
        fn = fn || utils.createPromiseCallback();
        this.findById(uid, function(err, user) {
          if (err) {
            fn(err);
          } else {
            if (user && user.verificationToken === token) {
              user.verificationToken = undefined;
              user.emailVerified = true;
              user.save(function(err) {
                if (err) {
                  fn(err);
                } else {
                  var ctx = loopback.getCurrentContext();
                  if(ctx.active) {
                    var res = ctx.active.http.res;
                    var req = ctx.active.http.req;
                    user.createAccessToken("1209600", function(err, token) {
                      if (err) return fn(err);
                        token.__data.user = user;
                        ctx.req.logIn(user, function(err) {
                            if(err) return next(err);

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
    });

    //send password reset link when requested
    User.on('resetPasswordRequest', function(info) {

        var mailOptions = {
            from: { name: "Tempostorm", email: "admin@tempostorm.com" },
            to: { name: info.user.username, email: info.email, type: "to"},
            template : {
                name: "testresetpassword"
            },
            subject: "Reset your account password",
            //text: "text message",
            //html: "<b>message</b>"
            vars: [{
                "rcpt": info.email,
                "vars": [{
                    'name': 'ID',
                    'content': info.user.id.toString()
                },{
                    'name': 'TOKEN',
                    'content': info.accessToken.id.toString()
                }]
            }],
            tags: [ "signup" ]
        };

        var Email = User.app.models.Email;
        Email.send(mailOptions, function(err, email) {
            if(err) {
                console.log("ERR resetting user password");
                console.log("send the client some kind of error?")
            }
        });
    });


    User.changePassword = function(userId, newPassword, cb) {
        console.log("entering butthole");
        /*
        cb = cb || utils.createPromiseCallback();

        console.log("changing password");
        User.findById(userId, function(err, user) {
            if (err) {
                cb(err);
            } else if (user) {
                console.log("help");
                user.updateAttribute("password", User.hashPassword(newPassword), function(err) {
                    console.log('done');
                    if(err) {
                        var err = new Error('unable to save new password');
                        err.statusCode = 400;
                        err.code = 'UNABLE_TO_CHANGE_PASSWORD';
                        return cb(err);
                    }
                    cb();
                });
            } else {
                var err = new Error('no user found');
                err.statusCode = 400;
                err.code = 'USER_NOT_FOUND';
                cb(err);

            }
        });

        return cb.promise;
        */
    };

/*
  User.prototype.changeEmail = function(newEmail, finalCallback) {
    var user = this;
    var userModel = this.constructor;
    var registry = userModel.registry;

    async.waterfall([
      // Generate new verification code
      function(seriesCallback) {
        generateVerificationToken(user, seriesCallback);
      },
      // Save user with new code
      function(newToken, seriesCallback) {
        user.updateAttribute("newEmailCode", newToken, function(err, user) {
          seriesCallback(err, newToken);
        });
      },
      // Send email with new code
      function(newToken, seriesCallback) {
        var emailOptions = {
          from: { name: "Tempostorm", email: "admin@tempostorm.com" },
          to: { name: user.username, email: user.email, type: "to"},
          template : {
            name: "email-change-confirmation",
          },
          subject: "Confirm New Email",
          vars: [{
              "rcpt": user.email,
              "vars": [{
                    'name': 'EMAIL',
                    'content': user.email
                },{
                    'name': 'USERNAME',
                    'content': user.username
                },{
                    'name': 'TOKEN',
                    'content': newToken
              }]
          }],
          tags: [ "email-change-confirmation" ]
        };

        var Email = userModel.email;
        Email.send(emailOptions, function(err, email) {
          seriesCallback(err);
        });
      }],
    finalCallback);
  }


  User.remoteMethod(
    "changeEmail",
    {
      accepts: {arg: "newEmail", type: "string"},
      returns: {arg: "fuck", type: "string"},
      description: "Changes user email and verifies that it's correct",
      http: { path: "/changeEmail", verb: "post"}
    }
  );
  */

    User.remoteMethod(
        'changePassword',
        {
            description: "Changes user's emails",
            accepts: [
                {arg: 'uid', type: 'string', required: true},
                {arg: 'newPassword', type: 'string', required: true}
            ],
            http: {verb: 'post'}
        }
    );
    /*


/*
  // Filter out sensitive user information depending on ACL
  var sensitiveProperties = ["subscription", "isProvider", "isAdmin", "lastLoginDate",
    "resetPasswordCode", "newEmail", "newEmailCode", "verified"]

  User.afterRemote("find", function(context, user, next) {
    var userModel = this.constructor


    function filterUser() {
      for(var i = 0; i<sensitiveProperties.length; i++) {
        var sensitiveProperty = sensitiveProperties[i];
        if(user[sensitiveProperty]) {
          delete user[sensitiveProperty];
        }
      }
      next();
    }

    // Check if the user is authorized to view the sensitive properties
    if(!context.token || !context.token.userId) {
      var userId =  context.token.userId;
      var Role = User.app.models.Role;
      var RoleMapping = User.app.models.RoleMapping;

      Role.getRoles({principalType: RoleMapping.USER, principalId: userId}, function(err, roles) {
        if(err) next(err);
        else if(roles.indexOf("admin") !== -1 || roles.indexOf("owner") !== -1) next();
        else filterUser();
      });
    } else {
      filterUser();
    }
  });
*/


};
