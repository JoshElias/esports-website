var passport = require("passport");
var async = require("async");
var crypto = require("crypto");
var config = require("./../../common/config");

var PassportConfigurator = require("loopback-component-passport").PassportConfigurator;

module.exports = function(server) {


    var passportConfigurator = PassportConfigurator(server);


    // More passport stuffs
    var passportProviders = {};
    try {
      passportProviders = require("./../providers.json");
    } catch(err) {
      console.error('Please configure your passport strategy in `providers.json`.');
      console.error('Copy `providers.json.template` to `providers.json` and replace the clientID/clientSecret values with your own.');
      process.exit(1);
    }


    passportConfigurator.init();
    passportConfigurator.setupModels({
      userModel: server.models.user,
      userIdentityModel: server.models.userIdentity,
      userCredentialModel: server.models.UserCredential
    });

    for(var s in passportProviders) {
      var c = passportProviders[s];
      c.session = c.session !== false;
      passportConfigurator.configureProvider(s, c);
    }


    /*
	var User = server.models.user;

	passport.serializeUser(function(user, done) {
		done(null, user.id);
	});

	passport.deserializeUser(function(id, done) {
		User.findById(id, done);
	});


	function getPassportHandler(idName) {
		return function(accessToken, refreshToken, profile, done) {
  			
  			function findByIdName (callback) {
  				var query = {};
  				query[idName] = profile.id;
                User.findOne(query, function (err, user) {
                    if (err || !user) { return callback(); }
                    return done(err, user);
                });
            }

            function findByEmail (callback) {
                if (!profile.email || !profile.email.length) { 
                	callback();
                	return;
                }

                User.findOne({email: profile.email}, function (err, user) {
                    if (err || !user) { 
                    	callback(); 
                    	return;
                    }

                    user[idName] = profile.id;
                    user.verified = true;

                    user.save(function (err, user) {
                        return done(err, user);
                    });
                });
            }

            function createPassportAccount (callback) {
                var newUser = new Schemas.User({
                    email: profile.email,
                    username: profile.username,
                    password: '',
                    verified: true,
                    createdDate: new Date().toISOString()
                });
                newUser[idName] = profile.id;

                newUser.save(function (err, user) {
                    return done(err, user);
                });
            }

            findByIdName(function () {
                findByEmail(function () {
                    createPassportAccount();
                });
            });
		};
	};

	function getPassportCallback(req, res) {
		var token = jwt.sign({ _id: req.user._id.toString() }, config.JWT_SECRET);
    	res.cookie('token', token);
    	res.redirect('/');
	}


	// Twitch
	passport.use(new TwitchStrategy({
		clientID: config.TWITCH_ID,
		clientSecret: config.TWITCH_SECRET,
		callbackURL: config.TWITCH_CALLBACK_URL,
		scope: "user_read"
	}, getPassportHandler("twitchID")));

	server.get('/auth/twitch', passport.authenticate('twitch'));
	server.get('/auth/twitch/callback', passport.authenticate('twitch', 
		{ failureRedirect: '/login' }), getPassportCallback);


	// BattleNet
	passport.use(new BnetStrategy({
    	clientID: config.BNET_ID,
    	clientSecret: config.BNET_SECRET,
    	callbackURL: config.BNET_CALLBACK_URL
  	}, getPassportHandler("bnetID")));

  	server.get('/auth/bnet', passport.authenticate('bnet'));
	server.get('/auth/bnet/callback', passport.authenticate('bnet', 
		{ failureRedirect: '/login' }), getPassportCallback);
    */
};

function generateKey(hmacKey, algorithm, encoding) {
  algorithm = algorithm || 'sha1';
  encoding = encoding || 'hex';
  var hmac = crypto.createHmac(algorithm, hmacKey);
  var buf = crypto.randomBytes(32);
  hmac.update(buf);
  var key = hmac.digest(encoding);
  return key;
}
