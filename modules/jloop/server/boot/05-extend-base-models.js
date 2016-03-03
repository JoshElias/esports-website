var validator = require("../lib/validator/validator");
var filter = require("../lib/filter/filter");
var scope = require("../lib/scope");
var relation = require("../lib/relation");


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
        model.beforeRemote("find", scope.addMaxScope(server.models));
        model.observe("loaded", filter.filter);
        model.observe('before delete', relation.destroyChildren);
    }
};
