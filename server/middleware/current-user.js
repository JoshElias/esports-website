module.exports = function(options) {
    var loopback = require("loopback");

    return function currentUserHandler(req, res, next) {
        var loopbackContext = loopback.getCurrentContext();
        var accessToken = loopbackContext.get("accessToken");
        if(!accessToken) {
            return next();
        }

        req.app.models.user.findById(accessToken.userId, function(err, user) {
            if (err) {
                return next(err);
            }
            if (!user) {
                return next(new Error('No user with this access token was found.'));
            }

            var loopbackContext = loopback.getCurrentContext();
            if (loopbackContext) {
                loopbackContext.set('currentUser', user.toJSON());
            }
            next();
        });
    };
};