module.exports = function(server) {
    var utils = require("../../lib/utils");

    var cleanModels = {};
    for(var key in server.models) {
        var lowerKey = key.toLowerCase();
        if(!cleanModels[lowerKey])
            cleanModels[lowerKey] = server.models[key];
    }



    for(var key in cleanModels) {
        var model = cleanModels[key];

        model.observe("before save", utils.filterSpam);
        model.observe("after save", utils.saveChildren);
        model.observe('before delete', utils.destroyRelations);
    }
};
