module.exports = function(server) {
    var Role = server.models.Role;
    var RoleMapping = server.models.RoleMapping;
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
            return (user.subscription.isSubscribed
                && (user.subscription.expiryDate > now));
        }
    });


    Role.isInRoles = function(uid, roleNames, finalCb) {
        async.eachSeries(roleNames, function (roleName, eachCb) {
            Role.isInRole(roleName, {
                principalType: RoleMapping.USER,
                principalId: uid
            }, function (err, isRole) {
                if (err) return eachCb(err);
                if (isRole) return eachCb("ok");
                else return eachCb();
            });
        }, function (err) {
            return finalCb(err, (err !== "ok"));
        });
    }
};