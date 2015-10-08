
module.exports = {
 "twitch-login": {
   "provider": "twitch",
   "module": "passport-twitch",
   "clientID": "226rnm5263dzbn13wrs3q5bvuc9aeml",
   "clientSecret": "edg5nj934q127ayqlmfapsbj7e2navx",
   "callbackURL": "http://localhost:8080/auth/twitch/callback",
   "authPath": "/auth/twitch",
   "callbackPath": "/auth/twitch/callback",
   "successRedirect": "/",
   "failureRedirect": "/login",
   "customCallback": passportCallback,
   "scope": ["user_read"]
 },
 "bnet-login": {
   "provider": "bnet",
   "module": "passport-bnet",
   "clientID": "6xjg4e2va25ag3mdsbuzpqp5faa59pqm",
   "clientSecret": "yrq9yt5KtHtA3feEwU59BcvkYcyc2uMJ",
   "callbackURL": "https://localhost:443/auth/bnet/callback",
   "authPath": "/auth/bnet",
   "callbackPath": "/auth/bnet/callback",
   "emailOptional": true,
   "successRedirect": "/",
   "failureRedirect": "/login",
   "customCallback": passportCallback
 }
}

function passportCallback(req, res, next) {

    // The default callback
    passport.authenticate(name, _.defaults({session: session},
      options.authOptions), function(err, user, info) {
      if (err) {
        res.cookie('error', JSON.stringify({code:"ERROR_PASSPORT_LINK"}), {
          signed: req.signedCookies ? true : false,
         // maxAge: 1000 * info.accessToken.ttl
        });
        return res.redirect(failureRedirect);
      }
      if (!user) {
        if (!!options.json) {
          return res.status(401).json("authentication error")
        }
        return res.redirect(failureRedirect);
      }
      if (session) {
        req.logIn(user, function(err) {
          if (err) {
            return next(err);
          }
          if (info && info.accessToken) {
            if (!!options.json) {
              return res.json({
                'access_token': info.accessToken.id,
                userId: user.id.toString(),
                username: user.username,
                email: user.email
              });
            } else {


              res.cookie('access_token', info.accessToken.id, {
                  signed: req.signedCookies ? true : false,
                  // maxAge is in ms
                  maxAge: 1000 * info.accessToken.ttl
                });
              res.cookie('userId', user.id.toString(), {
                signed: req.signedCookies ? true : false,
                maxAge: 1000 * info.accessToken.ttl
              });
              res.cookie('username', user.username, {
                  signed: req.signedCookies ? true : false,
                  maxAge: 1000 * info.accessToken.ttl
                });
              res.cookie('email', user.email, {
                signed: req.signedCookies ? true : false,
                maxAge: 1000 * info.accessToken.ttl
              });
            }
          }
          var redirectUrl = (req.cookies.redirectPath) ? req.cookies.redirectPath : successRedirect;
          delete req.cookies.redirectPath;
          return res.redirect(redirectUrl);
        });
      } else {
        if (info && info.accessToken) {
          if (!!options.json) {
            return res.json({
              'access_token': info.accessToken.id,
              userId: user.id
            });
          } else {
            res.cookie('access_token', info.accessToken.id, {
              signed: req.signedCookies ? true : false,
              maxAge: 1000 * info.accessToken.ttl
            });
            res.cookie('userId', user.id.toString(), {
              signed: req.signedCookies ? true : false,
              maxAge: 1000 * info.accessToken.ttl
            });
          }
        }
        return res.redirect(successRedirect);
      }
    })(req, res, next);
  };
