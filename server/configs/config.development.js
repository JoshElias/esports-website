module.exports = {
  "restApiRoot": "/api",
  "host": "localhost",
  "domain": "localhost:8080",
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
  "dbUrl": "mongodb://localhost:27017/tempostorm",
  "cdnUrl" : "./",
  "cdnUrl2" : "https://staging-cdn-tempostorm.netdna-ssl.com/",
  "appIndex" : "staging-index",
  "stripeKey" : "sk_test_Li9eL2cuhrnTNjp5UJXg7RH6"
}
