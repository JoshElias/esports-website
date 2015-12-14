module.exports = function(server) {
    var utils = require("../../lib/utils");


    for(var key in server.models) {
        var model = server.models[key];

        model.observe("after save", utils.saveChildren);
        model.observe('before delete', utils.destroyRelations);
    }
};
