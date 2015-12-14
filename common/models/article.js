module.exports = function(Article) {
	  var utils = require("../../lib/utils");


    var filter =  {
      fieldNames: ["content", "oldComments", "oldRelatedArticles"],
      acceptedRoles: ["$owner", "$admin", "$premium", "$contentProvider"]
    }
    Article.observe("loaded", utils.filterFields(filter));


    Article.validatesUniquenessOf('slug.url', {message: 'Slug url already exists'});
};
