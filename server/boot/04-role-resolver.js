module.exports = function(server) {
    var Role = server.models.Role;
    var RoleMapping = server.models.RoleMapping;
    var User = server.models.user;
    var loopback = require("loopback");
    var utils = require("../../lib/utils");


    Role.registerResolver('$premium', function(role, context, cb) {
        function reject() {
            process.nextTick(function() {
                cb(null, false);
            });
        }

        var loopbackContext = loopback.getCurrentContext();
        var currentUser = loopbackContext.get("currentUser");
        if(!currentUser) return reject();

        function isSubscribed(user) {
            var now = new Date();
            return (user.subscription.isSubscribed
            && (user.subscription.expiryDate > now));
        }

        return cb(undefined, isSubscribed(currentUser));
    });
};