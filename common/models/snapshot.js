module.exports = function(Snapshot) {
    var utils = require("../../lib/utils");

    Snapshot.observe("before save", utils.generateSlug("title"));
};
