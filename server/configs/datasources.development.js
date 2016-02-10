module.exports = {
	"mongodb": {
        "url": 'mongodb://localhost:27017/tempostorm',
	    "connector": "loopback-connector-mongodb",
	    "server": {
	      "auto_reconnect": true,
	      "reconnectTries": 100,
	      "reconnectInterval": 1000
	    },
	    "allowExtendedOperators": true
	},
	"tournament-mongo": {
		"url": 'mongodb://52.36.61.197:27017,52.8.70.39:27017,52.72.111.236:27017,52.29.157.100:27017/tournament?readPreference=nearest&w=1',
		"connector": "loopback-connector-mongodb",
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
