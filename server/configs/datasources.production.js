module.exports = {
    "mongodb": {
        "url": 'mongodb://52.11.14.8:27017,52.8.169.246:27017,54.174.103.94:27017,52.28.87.90:27017,54.79.121.240:27017/tempostorm?readPreference=nearest&w=1',
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
        "key": "ZwkdEzGJDa5MZDp66bPdZEyRIlpaqtGh5LhPhBnv",
        "keyId": "AKIAIRC7VKIUNLLUQJPA",
        "bucket": "cdn.tempostorm.com",
        "endpoint": "cdn.tempostorm.com.s3-website-us-west-2.amazonaws.com"
    }
}