module.exports = {
  "_meta": {
    "sources": [
      "loopback/common/models",
      "loopback/server/models",
      "../common/models",
      "./models",
      "../node_modules/loopback-component-passport/lib/models"
    ],
    "mixins": [
      "loopback/common/mixins",
      "loopback/server/mixins",
      "../common/mixins",
      "./mixins"
    ]
  },
  "AccessToken": {
    "dataSource": "mongodb",
    "public": false
  },
  "ACL": {
    "dataSource": "mongodb",
    "public": false
  },
  "RoleMapping": {
    "dataSource": "mongodb",
    "public": false
  },
  "Role": {
    "dataSource": "mongodb",
    "public": false
  },
  "Email": {
    "dataSource": "mandrill",
    "public": false
  },
  "UserCredential": {
    "dataSource": "mongodb",
    "public": false
  },
  "userIdentity": {
    "dataSource": "mongodb",
    "public": false
  },
  "deck": {
    "dataSource": "mongodb",
    "public": true
  },
  "card": {
    "dataSource": "mongodb",
    "public": true
  },
  "user": {
    "dataSource": "mongodb",
    "public": true
  },
  "topic": {
    "dataSource": "mongodb",
    "public": true
  },
  "post": {
    "dataSource": "mongodb",
    "public": true
  },
  "teamMember": {
    "dataSource": "mongodb",
    "public": true
  },
  "twitchFeed": {
    "dataSource": "mongodb",
    "public": true
  },
  "twitterPost": {
    "dataSource": "mongodb",
    "public": true
  },
  "article": {
    "dataSource": "mongodb",
    "public": true
  },
  "snapshot": {
    "dataSource": "mongodb",
    "public": true
  },
  "poll": {
    "dataSource": "mongodb",
    "public": true
  },
  "map": {
    "dataSource": "mongodb",
    "public": true
  },
  "comment": {
    "dataSource": "mongodb",
    "public": true
  },
  "activity": {
    "dataSource": "mongodb",
    "public": true
  },
  "banner": {
    "dataSource": "mongodb",
    "public": true
  },
  "vote": {
    "dataSource": "mongodb",
    "public": true
  },
  "vod": {
    "dataSource": "mongodb",
    "public": true
  }
}
