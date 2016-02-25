module.exports = {
	"mongodb": {
	    "host": "54.68.67.60",
	    "port": 27017,
	    "database": "tempostorm",
	    "name": "mongodb",
	    "connector": "mongodb",
	    "server": {
	      "auto_reconnect": true,
	      "reconnectTries": 100,
	      "reconnectInterval": 1000
	    },
	    "allowExtendedOperators": true
	},
	"tournament-mongo": {
	    "host": "54.68.67.60",
	    "port": 27017,
	    "database": "tournament",
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
        "key": "ZwkdEzGJDa5MZDp66bPdZEyRIlpaqtGh5LhPhBnv",
        "keyId": "AKIAIRC7VKIUNLLUQJPA",
        "bucket": "staging-cdn.tempostorm.com",
        "endpoint": "staging-cdn.tempostorm.com.s3-website-us-west-2.amazonaws.com"
    }
}
