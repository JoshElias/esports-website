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
        "key": "+5HNYCyZ84OMMNuZfrFuEz2xzyN9MtJQWN65dSB3",
        "keyId": "AKIAIQZRXBQLHFBKCGSQ",
        "bucket": "cdn.tempostorm.com",
		"endpoint": "cdn.tempostorm.com.s3-website-us-west-2.amazonaws.com"
    }
}
