module.exports = function(server) {
    var Role = server.models.Role;
    var User = server.models.user;
    var loopback = require("loopback");
    var utils = require("../../lib/utils");
    var async = require("async");


    Role.registerResolver('$premium', function(role, ctx, cb) {

        function reject() {
            process.nextTick(function() {
                cb(null, false);
            });
        }

        User.getCurrent(function(err, currentUser) {
           if(err) return cb(err);
           return cb(undefined, isSubscribed(currentUser.toJSON()));
        });

        function isSubscribed(user) {
            if(!user || !user.subscription)
                return false;

            var now = new Date();
            var dateISO = now.toISOString();
            
            return (user.subscription.isSubscribed 
                    || (user.subscription.expiryDate > dateISO));
        }
    });
};