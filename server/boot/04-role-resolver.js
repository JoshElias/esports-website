module.exports = function(app) {
    var Role = app.models.Role;

    Role.registerResolver('premium', function(role, context, cb) {
        function reject() {
            process.nextTick(function() {
                cb(null, false);
            });
        }

        // if the target model is not project
        console.log("context:", context);
        console.log("role:", role);
        /*
        console.log("modelName:", context.modelName);
        if (context.modelName !== 'user') {
            return reject();
        }

        // do not allow anonymous users
        var userId = context.accessToken.userId;
        console.log("userId:", userId);
        if (!userId) {
            return reject();
        }

        // check if userId is in team table for the given project id
        context.model.findById(userId, function(err, user) {
            if (err || !user)
                return reject();

            console.log("checking if user is subbed");
            function isSubscribed(subscription) {
                var now = new Date();
                return (subscription.isSubscribed
                    && subscription.expiryDate > now)
            }

            return cb(undefined, isSubscribed(user.subscription));
        });
        */
    });
};