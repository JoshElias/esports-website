var utils = require("../../.././utils");
var validator = require(".././validator");
var scope = require("./scope");
var relation = require("./relation");


module.exports = function(server) {

    var cleanModels = {};
    for(var key in server.models) {
        var lowerKey = key.toLowerCase();
        if(!cleanModels[lowerKey])
            cleanModels[lowerKey] = server.models[key];
    }


    for(var key in cleanModels) {
        var model = cleanModels[key];

        model.observe("before save", validator.validate);
        model.beforeRemote("find", scope.addMaxScope);
        model.observe('before delete', relation.destroyChildren);
    }
};
