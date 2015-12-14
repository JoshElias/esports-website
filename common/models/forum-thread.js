module.exports = function(ForumThread) {

    ForumThread.validatesUniquenessOf('slug.url', {message: 'Slug.url already exists'});
};
