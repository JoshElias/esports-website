module.exports = function(Snapshot) {
    var utils = require(".././utils");

    Snapshot.observe("before save", utils.generateSlug("title"));
};
