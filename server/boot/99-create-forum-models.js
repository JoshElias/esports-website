
var async = require("async");


module.exports = function(server) {
/*
	 	var ForumCategory = server.models.forumCategory;
    var ForumThread = server.models.forumThread;
    var ForumPost = server.models.forumPost;
		var Comment = server.models.comment;

    async.waterfall([

    	// Get forumCategories
    	function(seriesCallback) {
    		ForumCategory.find({}, seriesCallback);
    	},
    	// Update forumCategoryId  in forumThread
    	function(forumCategories, seriesCallback) {
    		async.eachSeries(forumCategories, function(forumCategory, innerCallback) {
					async.eachSeries(forumCategory.threads, function(thread, superInnerCallback) {
						ForumThread.findById(thread.toString(), function(err, forumThread) {
							if(err) superInnerCallback(err);
							else if(!forumThread)  {
								console.log("no forumThread found for id:", thread.toString());
								superInnerCallback();
							} else {
								forumThread.updateAttribute("forumCategoryId", forumCategory.id.toString(), function(err) {
									superInnerCallback(err);
								});
							}
						});
					}, innerCallback);
				}, seriesCallback);
			},
			// Get all the forumThreads
			function(seriesCallback) {
					ForumThread.find({}, seriesCallback);
			},
			// Update forumThreadId  in forumPost
			function(forumThreads, seriesCallback) {
				async.eachSeries(forumThreads, function(forumThread, innerCallback) {
					async.eachSeries(forumThread.posts, function(post, superInnerCallback) {
						ForumPost.findById(post.toString(), function(err, forumPost) {
							if(err) superInnerCallback(err);
							else if(!forumPost) {
								console.log("no forumPost found for id:", post.toString());
								superInnerCallback();
							} else {
								forumPost.updateAttribute("forumThreadId", forumThread.id.toString(), function(err) {
									superInnerCallback(err);
								});
							}
						});
					}, innerCallback);
				}, seriesCallback);
			},
			// Get all the forumPosts
			function(seriesCallback) {
					ForumPost.find({}, seriesCallback);
			},
			// Update forumPostId  in comments
			function(forumPosts, seriesCallback) {
				async.eachSeries(forumPosts, function(forumPost, innerCallback) {
					async.eachSeries(forumPost.comments, function(comment, superInnerCallback) {
						if(!comment) {
							superInnerCallback();
							return;
						}

						Comment.findById(comment.toString(), function(err, commentInstance) {
							if(err) superInnerCallback(err);
							else if(!commentInstance) {
								console.log("no comment found for id:", comment.toString());
								superInnerCallback();
							} else {
								commentInstance.updateAttribute("forumPostId", forumPost.id.toString(), function(err) {
									superInnerCallback(err);
								});
							}
						});
					}, innerCallback);
				}, seriesCallback);
			},

],
  function(err) {
    if(err) console.log("ERR creating user identities:", err);
    else console.log("Donerino");
  });
	*/
};
