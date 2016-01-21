
var async = require("async");

module.exports = function(server) {
    var RedbullTournament = server.models.redbullTournament;



    async.waterfall([
        // Load the tournament settings
        function(seriesCb) {
            db.collection["redbullTournament"].create(redbullData.tournament, seriesCb);
        },
        // Iterate over pack data
        function(tournament, seriesCb) {
            async.eachSeries(redbullData.packs, function(packData, eachCb) {
                var newRedbullExpansion = {
                    name: packData.expansion,
                    numOfPacks: packData.
                };
                db.collection["redbullExpansion"].create({})
            }, seriesCb);
        }
    ], done);
};

var redbullData = {
    "tournament": {
        "name": "master",
        "allowDuplicateClasses": false,
        "deckLimit": 3
    },
    "packs": [
        {
            "expansion": "Soulbound",
            "packs": 15,
            "chances": {
                "basic": 100,
                "common": 0,
                "rare": 0,
                "epic": 0,
                "legendary": 0
            },
            "isActive": true
        },
        {
            "expansion": "Basic",
            "packs": 10,
            "chances": {
                "basic": 0,
                "common": 72,
                "rare": 21,
                "epic": 4,
                "legendary": 3
            },
            "isActive": true
        },
        {
            "expansion": "Naxxramas",
            "packs": 5,
            "chances": {
                "basic": 0,
                "common": 74,
                "rare": 21,
                "epic": 4,
                "legendary": 1
            },
            "isActive": true
        },
        {
            "expansion": "Goblins Vs. Gnomes",
            "packs": 10,
            "chances": {
                "basic": 0,
                "common": 72,
                "rare": 21,
                "epic": 4,
                "legendary": 3
            },
            "isActive": true
        },
        {
            "expansion": "Blackrock Mountain",
            "packs": 5,
            "chances": {
                "basic": 0,
                "common": 74,
                "rare": 25,
                "epic": 0,
                "legendary": 1
            },
            "isActive": true
        },
        {
            "expansion": "The Grand Tournament",
            "packs": 10,
            "chances": {
                "basic": 0,
                "common": 72,
                "rare": 21,
                "epic": 4,
                "legendary": 3
            },
            "isActive": true
        },
        {
            "expansion": "League of Explorers",
            "packs": 8,
            "chances": {
                "basic": 0,
                "common": 74,
                "rare": 21,
                "epic": 4,
                "legendary": 1
            },
            "isActive": true
        },
    ]
}
