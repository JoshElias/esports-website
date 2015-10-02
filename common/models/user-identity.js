//var loopback = require('loopback');

module.exports = function(UserIdentity) {

	function profileToUser(provider, profile, options) {
	  	if(provider === "bnet-login") {
	     	return {
	        	username: profile.username,
	        	password : generateKey('password')
	      	}
	  	} else if(provider === "twitch-login") {
	      	return {
	        	username: profile.username,
	        	email: profile.email,
	        	password : generateKey('password')
	      	}
	    }
	}

	function getModel(cls, base) {
  		if (!cls) {
    		return base;
  		}
 		return (cls.prototype instanceof base)? cls: base;
	}



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
	    if(typeof options === 'function' && cb === undefined) {
	      cb = options;
	      options = {};
	    }
	    var autoLogin = options.autoLogin || options.autoLogin === undefined;
	    var userIdentityModel = getModel(this, UserIdentity);

	    console.log("provider:",provider);
	    console.log("profile.id",profile.id);

	    userIdentityModel.findOne({where: {
	      provider: provider,
	      externalId: profile.id
	    }}, function (err, identity) {
	    	console.log("IDEN:",identity);
	      if (err) {
	        return cb(err);
	      }
	      if (identity) {
	        identity.credentials = credentials;
	        return identity.updateAttributes({profile: profile,
	          credentials: credentials, modified: new Date()}, function (err, i) {
	          // Find the user for the given identity
	          return identity.user(function (err, user) {
	            // Create access token if the autoLogin flag is set to true
	            if(!err && user && autoLogin) {
	              return (options.createAccessToken || createAccessToken)(user, function(err, token) {
	                cb(err, user, identity, token);
	              });
	            }
	            cb(err, user, identity);
	          });
	        });
	      } else {
	      	return cb("You must link your profile first");
	      }
	  });
	};
};
