var utils = require("../../lib/utils");
var validator = require("../../lib/validator/validator");
var scope = require("../../../lib/scope");

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
        model.observe("access", scope.addMaxScope);
        //model.observe("after save", utils.saveChildren);
        model.observe('before delete', utils.destroyRelations);
    }
};
