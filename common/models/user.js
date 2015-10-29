var async = require("async");
var uuid = require("node-uuid");
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
    console.log("ummm");
    var potentialOptions = {};
    console.log("is this on?");
    user.verify(potentialOptions, function(err) {
      console.log("help:",err);
      if(err) {
        console.log("Unable to verify the user's email");
      } else {
        console.log("Verification email sent");
      }
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
    });

    //send password reset link when requested
    User.on('resetPasswordRequest', function(info) {
        var userModel = this.constructor;

        var mailOptions = {
            from: { name: "Tempostorm", email: "admin@tempostorm.com" },
            to: { name: info.user.username, email: info.email, type: "to"},
            template : {
                name: "testresetpassword",
            },
            subject: "Reset your account password",
            //text: "text message",
            //html: "<b>message</b>"
            vars: [{
                "rcpt": info.email,
                "vars": [{
                    'name': 'EMAIL',
                    'content': info.email
                },{
                    'name': 'TOKEN',
                    'content': info.accessToken
                }]
            }],
            tags: [ "signup" ]
        };

        var Email = userModel.email;
        Email.send(mailOptions, function(err, email) {
            seriesCallback(err);
        });
    });
/*
  User.afterRemote('confirm', function(ctx, inst, next) {
    var userInstance = JSON.parse(JSON.stringify(inst));
    console.log("isEmailVerified:", userInstance.emailVerified);
    if(userInstance.emailVerified) {
      ctx.res.cookie
    }
  });
*/
	/**
   * Verify a user's identity by sending them a confirmation email.
   */
    /*
  User.prototype.verify = function(options, finalCallback) {
    var user = this;
    var userModel = this.constructor;
    var registry = userModel.registry;

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
                'name': 'EMAIL',
                'content': user.email
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
  };
*/

  /**
   * Confirm the user's identity.
   *
   * @param {String} email
   * @param {String} token The validation token
   * @param {String} redirect URL to redirect the user to once confirmed
   * @callback {Function} callback
   * @param {Error} err
   */
  /*
  User.confirmEmail = function(email, token, redirect, fn) {
    var user = this;
    var userModel = this.constructor;
    var registry = userModel.registry;

    console.log("Confirming email:", email);
    //fn = fn || utils.createPromiseCallback();
    user.findOne({where:{email:email}}, function(err, user) {
      console.log("found something?")
      if (err) {
        fn(err);
      } else {
        console.log("user:", user);
        console.log("user's token:", user.verificationToken);
        console.log("client's token:", token);
        if (user && user.verificationToken === token) {
          user.verificationToken = undefined;
          user.emailVerified = true;
          user.save(function(err) {
            if (err) {
              fn(err);
            } else {
              fn();
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

  User.disableRemoteMethod('confirm', true);
  User.remoteMethod(
  'confirmEmail',
  {
    description: 'Confirm a user registration with email verification token.',
    accepts: [
      {arg: 'email', type: 'string', required: true},
      {arg: 'token', type: 'string', required: true},
      {arg: 'redirect', type: 'string'}
    ],
    http: {verb: 'get', path: '/confirmEmail'}
  }
);
*/


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
    /*


	// Handle passport reset
	User.on("resetPasswordRequest", function(info) {
		var url = "http://localhost:3000/reset-password";
		var html = 'Click <a href="' + url + '?access_token=' + info.accessToken.id
	  		+ '">here</a> to reset your password';

	  	User.app.models.Email.send({
	  		to: info.email,
	  		from: info.email,
	  		subject: "Password reset",
	  		html: html
	  	}, function(err) {
	  		if(err) console.log("Error sending client password changed email");
	  		else console.log("successfully sent client password changed email");
	  	});
	});

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
