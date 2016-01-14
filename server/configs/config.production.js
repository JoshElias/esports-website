module.exports = {
  "restApiRoot": "/api",
  "host": "0.0.0.0",
  "port": 8080,
  "remoting": {
    "context": {
      "enableHttpContsext": true
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
  "dbUrl": "mongodb://54.68.67.60:27017/tempostorm",
  "cdnUrl" : "https://cdn-tempostorm.netdna-ssl.com/",
  "cdnUrl2" : "https://cdn-tempostorm.netdna-ssl.com/",
  "appIndex" : "production-index",
  "stripeKey" : "sk_live_FHjluwAxnn5yISh7lMs0vxMx",
  "captchaKey": "6LeLJhQTAAAAAEnLKxtQmTkRkrGpqmbQGTRzu3u8",
  "captchaSecret": "6LeLJhQTAAAAAPU4djVaXiNX28hLIKGdC7XM9QG4"
}
