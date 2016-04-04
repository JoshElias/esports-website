module.exports = function(server) {
    var Role = server.models.Role;
    var User = server.models.user;
    var async = require("async");


    Role.registerResolver('$premium', function(role, ctx, cb) {

        function reject() {
            process.nextTick(function() {
                cb(null, false);
            });
        }

        User.getCurrent(function(err, currentUser) {
           if(err) return cb(err);
           else if (!currentUser) return cb(undefined, false);

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