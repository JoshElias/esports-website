module.exports = {
  "restApiRoot": "/api",
  "host": "52.26.75.137",
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
  "dbUrl": "mongodb://54.68.67.60:27017/tempostorm",
  "cdnUrl" : "https://cdn-tempostorm.netdna-ssl.com/",
  "appIndex" : "staging-index",
  "stripeKey" : "sk_live_FHjluwAxnn5yISh7lMs0vxMx"
}
