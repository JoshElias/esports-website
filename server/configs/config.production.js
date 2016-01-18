module.exports = {
  "restApiRoot": "/api",
  "host": "0.0.0.0",
  "port": 8080,
  "remoting": {
    "context": {
      "enableHttpContext": true
    },
    "rest": {
      "normalizeHttpPath": false,
      "xml": false
    },
    "json": {
      "strict": false,
      "limit": "100kb"
    },
    "urlencoded": {
      "extended": true,
      "limit": "100kb"
    },
    "cors": false,
    "errorHandler": {
      "disableStackTrace": false
    }
  },
  "legacyExplorer": false,
  "prerenderKey" : "XrpCoT3t8wTNledN5pLU",
  "jwtSecret" : "83udfhjdsfh93HJKHel338283ru",
  "sessionSecret" : "kjadhKJHJKhsdjhd82387sjJK",
  "dbUrl": "mongodb://52.11.14.8:27017,52.8.169.246:27017,54.174.103.94:27017,52.28.87.90:27017,54.79.121.240:27017/tempostorm?readPreference=nearest&w=1",
  "cdnUrl" : "https://cdn-tempostorm.netdna-ssl.com/",
  "cdnUrl2" : "https://cdn-tempostorm.netdna-ssl.com/",
  "appIndex" : "production-index",
  "stripeKey" : "sk_live_FHjluwAxnn5yISh7lMs0vxMx",
  "captchaKey": "6LeLJhQTAAAAAEnLKxtQmTkRkrGpqmbQGTRzu3u8",
  "captchaSecret": "6LeLJhQTAAAAAPU4djVaXiNX28hLIKGdC7XM9QG4"
}
