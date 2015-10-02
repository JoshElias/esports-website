var async = require("async");
var uuid = require("node-uuid");
var bcrypt = require('bcrypt-nodejs');


module.exports = function(User) {


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

		var options = {
			generateVerificationToken : generateVerificationToken
		}

		user.verify(options, function(err) {
			if(err) {
				console.log("Unable to verify the user's email");
				next(err);
			} else {
				console.log("Verification email sent");
				context.res.json({success:true});
				/*
				context.res.render("response", {
					title: "Signed up successfully",
					content: "Please check your email and click on the verification link",
					redirectTo: "/",
					redirectToLinkText: "Log in"
				});
				*/
			}
		});
	});

	function generateVerificationToken(user, finalCallback) {
		try {
			var token = uuid.v4().substring(0, 23);
			finalCallback(undefined, token)
		} catch(err) {
			finalCallback(err);
		}
	};


	/**
   * Verify a user's identity by sending them a confirmation email.
   */
  User.prototype.verify = function(options, finalCallback) {
    var user = this;
    var userModel = this.constructor;
    var registry = userModel.registry;

    async.waterfall([
      // Generate token
      function(seriesCallback) {
        var tokenGenerator = options.generateVerificationToken || User.generateVerificationToken;
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


  /**
   * Confirm the user's identity.
   *
   * @param {String} email
   * @param {String} token The validation token
   * @param {String} redirect URL to redirect the user to once confirmed
   * @callback {Function} callback
   * @param {Error} err
   */
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

  /**
     * Login a user by with the given `credentials`.
     *
     * ```js
     *    User.login({username: 'foo', password: 'bar'}, function (err, token) {
    *      console.log(token.id);
    *    });
     * ```
     *
     * @param {Object} credentials username/password or email/password
     * @param {String[]|String} [include] Optionally set it to "user" to include
     * the user info
     * @callback {Function} callback Callback function
     * @param {Error} err Error object
     * @param {AccessToken} token Access token if login is successful
     */
/*
    User.linkThirdParty = function(id, fn) {
      var self = this;
      fn = fn || utils.createPromiseCallback();

      self.findById(id, function(err, user) {
        var defaultError = new Error('linking 3rd party failed');
        defaultError.statusCode = 401;
        defaultError.code = '3RD_PARTY_LINK_FAILED';

        if (err) {
          debug('An error is reported from User.findById: %j', err);
          fn(defaultError);
        } else if (user) {
          user.hasPassword(credentials.password, function(err, isMatch) {
            if (err) {
              debug('An error is reported from User.hasPassword: %j', err);
              fn(defaultError);
            } else if (isMatch) {
              if (self.settings.emailVerificationRequired && !user.emailVerified) {
                // Fail to log in if email verification is not done yet
                debug('User email has not been verified');
                err = new Error('login failed as the email has not been verified');
                err.statusCode = 401;
                err.code = 'LOGIN_FAILED_EMAIL_NOT_VERIFIED';
                fn(err);
              } else {
                if (user.createAccessToken.length === 2) {
                  user.createAccessToken(credentials.ttl, tokenHandler);
                } else {
                  user.createAccessToken(credentials.ttl, credentials, tokenHandler);
                }
              }
            } else {
              debug('The password is invalid for user %s', query.email || query.username);
              fn(defaultError);
            }
          });
        } else {
          debug('No matching record is found for user %s', query.email || query.username);
          fn(defaultError);
        }
      });
      return fn.promise;
    };
*/

  User.remoteMethod(
    "changeEmail",
    {
      accepts: {arg: "newEmail", type: "string"},
      returns: {arg: "fuck", type: "string"},
      description: "Changes user email and verifies that it's correct",
      http: { path: "/changeEmail", verb: "post"}
    }
  );


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
