module.exports = {
    "mongodb": {
        "url": 'mongodb://52.11.14.8:27017,52.8.169.246:27017,54.174.103.94:27017,52.28.87.90:27017,54.79.121.240:27017/tempostorm',
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
        "bucket": "cdn.tempostorm.com",
        "endpoint": "cdn.tempostorm.com.s3-website-us-west-2.amazonaws.com"
    }
}