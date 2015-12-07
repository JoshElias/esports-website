
var async = require("async");

module.exports = function(server) {
/*
    var Comment = server.models.comment;

    Comment.find({}, function(err, comments) {
        if(err) {
            console.log("err finding comments");
            return;
        }

        console.log("comments length:",comments.length);
        async.eachSeries(comments, async.ensureAsync(function(comment, callback) {
            console.log("iterating on comment:", comment);
            async.eachSeries(comment.oldReplies, async.ensureAsync(function(replyId, innerCallback) {
                console.log("iterating on reply:", replyId);
                Comment.updateAll({id:replyId.toString()}, {parentCommentId:comment.id.toString()}, function(err) {
                    if(!err) console.log("added parent ID:"+comment.id.toString()+" to comment:"+replyId.toString());
                    innerCallback(err);
                });
            }), callback);
        }), function(err) {
            if(err) console.log("ERR adding parentCommentIds to comments");
            if(!err) console.log("donnerino");
        })
    });
    */
};
