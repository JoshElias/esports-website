module.exports = {
    "mongodb": {
        "name": "mongodb",
        "connector": "mongodb",
        "url": 'mongodb://54.68.67.60:27017/tempostorm',
        "server": {
            "auto_reconnect": true,
            "reconnectTries": 100,
            "reconnectInterval": 1000
        }
    },
    "tournament-mongo": {
        "name": "tournament-mongo",
        "connector": "mongodb",
        "url": 'mongodb://54.68.67.60:27017/tournament',
        "server": {
            "auto_reconnect": true,
            "reconnectTries": 100,
            "reconnectInterval": 1000
        }
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
};
