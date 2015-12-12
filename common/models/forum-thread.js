module.exports = function(ForumThread) {
    var utils = require("../../lib/utils");


    var foreignKeys = ["forumCategoryId"];
    ForumThread.observe("persist", utils.convertObjectIds(foreignKeys));


    ForumThread.validatesUniquenessOf('slug.url', {message: 'Slug.url already exists'});
};
