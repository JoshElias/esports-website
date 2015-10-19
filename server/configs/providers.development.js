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
   "failureRedirect": "/login"
 }
}
