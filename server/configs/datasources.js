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
		"url": 'mongodb://localhost:27017/tournament',
		"connector": "loopback-connector-mongodb",
		"server": {
			"auto_reconnect": true,
			"reconnectTries": 100,
			"reconnectInterval": 1000
		},
		"allowExtendedOperators": true
	},
	"aws-ses": {
		"name": "aws-ses",
		"connector": "loopback-connector-aws-ses",
		"key": "AKIAIRC7VKIUNLLUQJPA",
		"secret": "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",
		"region": "us-west-2"
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
