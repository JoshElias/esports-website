module.exports = function(ForumThread) {
    var utils = require("../../lib/utils");


    ForumThread.observe("before save", utils.generateSlug("title"));
};
