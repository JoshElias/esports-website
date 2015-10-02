module.exports = function(Article) {

	// Get Article/Articles example
/*
	// Article
	Article.findOne({'slug.url': slug},
		include : {
			authorId: ["username"],
			relatedArticles: ["title", "slug.url", "active", "createdDate"],
			comments: [{authorId: ["username" , "email"]}, "text", "createdDate votesCount votes"],
			deckId: [{cards: "cardId"}]
		},
	function(err, article) {

	});

	// Articles
	Article.find({
		where: {
			active: true
			articleType: "articleType",
			filter: "all",
			or: [
				{title: {like: "searchParam"}},
				{description: {like: "searchParam"}},
				{content: {like: "searchParam"}}
			]
		},
		include: {
			authorId: ["username"]
		},
		order: "createdDate DESC",
		skip: "0",
		limit: "0"
	},
	function(err, articles) {

	});


	//Article Comment Add

*/


};
