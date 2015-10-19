module.exports = {
  "twitch-login": {
    "provider": "twitch",
    "module": "passport-twitch",
    "clientID": "226rnm5263dzbn13wrs3q5bvuc9aeml",
    "clientSecret": "edg5nj934q127ayqlmfapsbj7e2navx",
    "callbackURL": "https://52.26.75.137/login/twitch/callback",
    "authPath": "/login/twitch",
    "callbackPath": "/login/twitch/callback",
    "successRedirect": "/",
    "failureRedirect": "/login",
    "scope": ["user_read"]
  },
  "twitch-link": {
    "provider": "twitch",
    "module": "passport-twitch",
    "clientID": "n5unbtqp62v5422v5ylegn0hp20po6m",
    "clientSecret": "l57vitpor6j09bzmxjus0b5ldbtpru7",
    "callbackURL": "https://52.26.75.137/link/twitch/callback",
    "authPath": "/link/twitch",
    "callbackPath": "/link/twitch/callback",
    "link": true,
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
  },
  "bnet-link": {
    "provider": "bnet",
    "module": "passport-bnet",
    "clientID": "dabvc6wpmq93c7m3z9626zeny9crppyb",
    "clientSecret": "yrq9yt5KtHtA3feEwU59BcvkYcyc2uMJ",
    "callbackURL": "https://localhost:443/link/bnet/callback",
    "authPath": "/link/bnet",
    "callbackPath": "/link/bnet/callback",
    "emailOptional": true,
    "link": true,
    "successRedirect": "/",
    "failureRedirect": "/login"
  }
}
