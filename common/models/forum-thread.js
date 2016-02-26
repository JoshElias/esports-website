module.exports = function(ForumThread) {
    var utils = require(".././utils");


    ForumThread.observe("before save", utils.generateSlug("title"));
};
