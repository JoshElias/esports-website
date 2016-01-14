module.exports = {
	"mongodb": {
	    "host": "54.68.67.60",
	    "port": 27017,
	    "database": "perfectMigration",
	    "name": "mongodb",
	    "connector": "mongodb",
	    "server": {
	      "auto_reconnect": true,
	      "reconnectTries": 100,
	      "reconnectInterval": 1000
	    },
	    "allowExtendedOperators": true
	},
	"mandrill": {
	    "name": "mandrill",
	    "connector": "loopback-connector-mandrill",
	    "apiKey": "Zl5f6pHhNAraoqh5Z2jBEQ"
	},
    "s3": {
        "name": "s3",
        "connector": "loopback-component-storage",
        "provider": "amazon",
        "key": "+KtXI6Pvdt8ijq4uOCpkIT5f76Wxf23avEdy311f",
        "keyId": "AKIAI5GMLIWXZP6TQXYQ",
        "bucket": "staging-cdn.tempostorm.com"
  }
}