module.exports = function(server) {
    /*
    var async = require("async");
    var _ = require("underscore");


	var Role = server.models.Role;
    var User = server.models.user;
    var RoleMapping = server.models.RoleMapping;

    var roles = ["contentProvider", "admin"];
    var roleInstances = {};
    async.waterfall([
        // Create the different roles
        function(seriesCb) {
            console.log("create different roles");
            async.eachSeries(roles, function(role, eachCb) {
                Role.create({name:role}, function(err, newRole) {
                    if(err) return eachCb(err);

                    roleInstances[newRole.name] = newRole;
                    eachCb();
                });
            }, seriesCb);
        },
        // Get all the users
        function(seriesCb) {
            console.log("getting users:", roleInstances);
            User.find({}, seriesCb);
        },
        // Assign their roles
        function(users, seriesCb) {
            console.log("assigning rules");
            assignRole(users, seriesCb);
        }
    ],
    function(err) {
        if(err) console.log("ERR unable to assign roles:", err);
        else console.log("Donnerinos");
    });

    function assignRole(users, finalCb) {
        var cuntCounter = 0;
        async.eachSeries(users, function(user, userCb) {
            async.eachSeries(roles, function(roleName, roleCb) {

                if ((roleName === "admin" && user.isAdmin)
                    || (roleName === "contentProvider" && user.isProvider)) {

                    roleInstances[roleName].principals.create({
                        principalType: RoleMapping.USER,
                        principalId: user.id
                    }, function(err) {
                        if(!err) console.log("created principal:", cuntCounter++);
                        return roleCb(err);
                    });
                } else {
                    return roleCb();
                }

            }, userCb);
        }, finalCb)
    }
    */
};