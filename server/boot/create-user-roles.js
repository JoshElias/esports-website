
var async = require("async");
var config = require("./../../common/config");
var roles = {
    PREMIUM: "premium",
    PROVIDER: "provider",
    ADMIN: "admin"
};

module.exports = function(server) {
    /*
	var Role = server.models.Role;
    var User = server.models.user;
    var RoleMapping = server.models.RoleMapping;

    async.forEachOfSeries(roles, function(roleName, key, seriesCallback) {
        console.log("iterating on role:", roleName);
        Role.create({name:roleName}, function(err, role) {
            if(err) {
                console.log("ERR creating role");
                console.log(err);
                seriesCallback(err);
            } else {
                var where = {};
                if(roleName === "premium") {
                    where = {"subscription.isSubscribed":true};
                } else if(roleName === "provider") {
                    where = {isProvider:true};
                } else if(roleName === "admin") {
                    where = {isAdmin:true};
                }
                console.log("querying user with:", where);
                User.find({where:where, filter:{_id:true}}, function(err, users) {
                    if(err) {
                        console.log("ERR querying bitches");
                        console.log(err);
                        seriesCallback(err);
                    } else {
                        console.log("found this many users per role:",users.length);
                        async.eachSeries(users, function(user, holyCallback) {
                            role.principals.create({
                                principalType: RoleMapping.USER,
                                principalId: user.id
                            }, function(err, principal) {
                                if(err) {
                                    console.log("ERR creating principal");
                                    console.log(err);
                                } 
                                holyCallback(err); 
                            });
                        }, function(err) {
                            if(err) {
                                console.log("ERR eaching users");
                                console.log(err);
                            }
                            seriesCallback(err);
                        });              
                    }
                }); 
            }
        });
    }, function(err) {
        if(err) {
            console.log("Plz kill me");
            console.log(err);
        } else {
            console.log("successfully done stuff?");
        }
    });
*/
};