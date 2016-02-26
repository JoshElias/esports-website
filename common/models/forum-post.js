module.exports = function(ForumPost) {
    var utils = require(".././utils");

    ForumPost.observe("before save", utils.generateSlug("title"));
};
