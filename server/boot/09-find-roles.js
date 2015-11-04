


module.exports = function(server) {
/*
    var MongoClient = require("mongodb");
    var ObjectID = require("mongodb").ObjectID;
    var async = require("async");
    var _ = require("underscore");


    var url = 'mongodb://54.68.67.60:27017/tempostorm';


    MongoClient.connect(url, function(err, db) {
        if (err) {
            console.log("ERR");
            console.log(err);
            return;
        }

        db.collection("RoleMapping").find({}).toArray(function(err, mappings) {
            if(err) console.log("ERR getting users");
            else {
                console.log("mapping count:", mappings.length);
                async.eachSeries(mappings, function(mapping, eachCb) {
                    var principalId = mapping.principalId;
                    console.log("original principalId:", principalId);
                    principalId = new ObjectID(principalId);
                    console.log("new principalId:", principalId);
                    db.collection("RoleMapping").update({_id:mapping._id}, {$set:{principalId: principalId}}, {multi:true}, eachCb);
                }, function(err) {
                    if(err) console.log("ERR updating mappings");
                    else console.log("Donnerino");

                    db.close();
                });
            }
        });
    });



    var User = server.models.user;

    console.log("finding hero by id");
    User.findById("54847c5c9c76c20e9149f5d3", {include:"roles"}, function(err, user) {
        if(err) console.log("ERR getting user:", err);
        else console.log("User:", user);
    });

    var RoleMapping = server.models.RoleMapping;
    var Role = server.models.Role;
    Role.getRoles({principalType: RoleMapping.USER, principalId: "54847c5c9c76c20e9149f5d3"}, function(err, roles) {
        console.log("shitttY:", roles);  // everyone, authenticated, etc (hopefully)
    });
 */
}