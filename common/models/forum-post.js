module.exports = function(ForumPost) {
    var utils = require("../../lib/utils");

    ForumPost.observe("before save", utils.generateSlug("title"));
};
