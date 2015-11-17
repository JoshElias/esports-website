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


        var ctx = loopback.getCurrentContext();
        if(!ctx || !ctx.active) return reject();

        var res = ctx.active.http.res;
        var req = ctx.active.http.req;

        User.getCurrent(function(err, currentUser) {
           if(err) return cb(err);

           return cb(undefined, isSubscribed(currentUser));
        });

        function isSubscribed(user) {
            var now = new Date();
            return (user.subscription.isSubscribed
            && (user.subscription.expiryDate > now));
        }
    });
};