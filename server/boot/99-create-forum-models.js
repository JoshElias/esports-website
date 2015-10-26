
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
					async.eachSeries(forumCategory.oldThreads, function(thread, superInnerCallback) {
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
					async.eachSeries(forumThread.oldPosts, function(post, superInnerCallback) {
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
					//console.log("forumPost comments:", forumPost.comments);
					async.eachSeries(forumPost.oldComments, function(comment, superInnerCallback) {
						if(!comment) {
							superInnerCallback();
							return;
						}

						console.log("looking for comment:", comment.toString());

						Comment.findById(comment.toString(), function(err, commentInstance) {
							if(err) superInnerCallback(err);
							else if(!commentInstance) {
								console.log("no comment found for id:", comment.toString());
								superInnerCallback();
							} else {
								commentInstance.updateAttribute("forumPostId", forumPost.id.toString(), function(err) {
									console.log("added forumPostId:",forumPost.id.toString());
									console.log("to comment:", commentInstance.id.toString())
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
