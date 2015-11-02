module.exports = function(ForumPost) {

    var ObjectId = require("mongodb").ObjectID;

    var foreignKeys = ["forumThreadId", "authorId"];
    ForumPost.observe("persist", function(ctx, next) {

        console.log("data before:", ctx.data);
        convertObjectIds(foreignKeys, ctx.data);
        console.log("data after:", ctx.data);

        assignOrderNum(ctx.data, next);
    });


    function convertObjectIds(keys, obj) {
        _.each(key, function(foreignKey) {
            _.each(obj, function(modelValue, modelKey){
                if(foreignKey === modelKey && typeof modelValue === "string") {
                    modelValue = new ObjectID(modelValue);
                }
            })
        });
    }
};
