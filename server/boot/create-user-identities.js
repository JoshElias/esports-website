
var async = require("async");


module.exports = function(server) {
	/*
	var UserIdentity = server.models.UserIdentity;
    var User = server.models.user;

    var date = new Date();
    async.waterfall([
    	// Get all the users
    	function(seriesCallback) {
    		console.log("Finding users");
    		User.find({where:{twitchID:{"exists":true}}}, seriesCallback);
    	},
    	// Create user identity for each user
    	function(users, seriesCallback) {
    		console.log("creating user identies");
    		async.eachSeries(users, function(user, callback) {
				UserIdentity.create({
		          provider: "twitch-login",
		          externalId: user.twitchID,
		          authScheme: "oAuth 2.0",
		          profile: {},
		          credentials: {},
		          userId: user.id,
		          created: date,
		          modified: date
		        }, function(err, identity) {
		        	callback(err);
		        });
			}, seriesCallback);
    	}],
    function(err) {
    	if(err) console.log("ERR creating user identities:", err);
    	else console.log("Donerino");
    });
*/
};
