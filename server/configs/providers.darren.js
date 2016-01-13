
module.exports = {
 "twitch-login": {
   "provider": "twitch",
   "module": "passport-twitch",
   "clientID": "ms556wfz0hr0adtraypjo2i7m2pmvam",
   "clientSecret": "hzrci57rtvfw9r915linb2gmfyzr30r",
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
   "clientID": "6raft682814tfrgr00pvmek4tb543n8",
   "clientSecret": "q1coxxl8ly4yel676ttkht705z0fkju",
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
