
module.exports = {
 "twitch-login": {
   "provider": "twitch",
   "module": "passport-twitch",
   "clientID": "7vmjjrlb8m9n9ko1xuaf22432rnpdof",
   "clientSecret": "1nkrbxz3q9dy0pfhhr8mh1ubx49ydg9",
   "callbackURL": "https://staging.tempostorm.com/login/twitch/callback",
   "authPath": "/login/twitch",
   "callbackPath": "/login/twitch/callback",
   "successRedirect": "/",
   "failureRedirect": "/login",
   "scope": ["user_read"]
 },
 "twitch-link": {
   "provider": "twitch",
   "module": "passport-twitch",
   "clientID": "1bu6q1noi0akto24jxbgivim6o3bfq9",
   "clientSecret": "b9d5vlb3f6vdbpy6h0xu4g1odzcw1j",
   "callbackURL": "https://staging.tempostorm.com/link/twitch/callback",
   "authPath": "/link/twitch",
   "callbackPath": "/link/twitch/callback",
   "successRedirect": "/",
   "failureRedirect": "/login",
   "scope": ["user_read"],
   "link": true,
   "session": true
 },
 "bnet-login": {
   "provider": "bnet",
   "module": "passport-bnet",
   "clientID": "se9jxsk6ykxbwtcbn9ept3eptp6h7t56",
   "clientSecret": "96dC8cCNMmjsMpjJ8BYSZ8BEpB2jQMQF",
   "callbackURL": "https://staging.tempostorm.com/login/bnet/callback",
   "authPath": "/login/bnet",
   "callbackPath": "/login/bnet/callback",
   "emailOptional": true,
   "successRedirect": "/",
   "failureRedirect": "/login"
 },
 "bnet-link": {
   "provider": "bnet",
   "module": "passport-bnet",
   "clientID": "xdq2yg3anetayzuyn89maqdn4bd76ct2",
   "clientSecret": "K7qNUmrqVXgfxDnUVCHfBk3AQeE5HG7a",
   "callbackURL": "https://staging.tempostorm.com/link/bnet/callback",
   "authPath": "/link/bnet",
   "callbackPath": "/link/bnet/callback",
   "emailOptional": true,
   "successRedirect": "/",
   "failureRedirect": "/login",
   "link": true,
   "session": true
 }
}
