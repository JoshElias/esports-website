var async = require("async");
var utils = require("./../../lib/utils");

module.exports = function(server) {
    var RedbullTournament = server.models.redbullTournament;
    var RedbullExpansion = server.models.redbullExpansion;
    var RedbullRarityChance = server.models.redbullRarityChance;
    var Role = server.models.Role;

    async.waterfall([
        // Load the tournament settings
        function(seriesCb) {
            RedbullTournament.create(redbullData.tournament, seriesCb);
        },
        // Iterate over pack data
        function(tournament, seriesCb) {

            // Get info on the expansion
            async.eachSeries(redbullData.packs, function(packData, eachCb) {
                var redbullExpansionData = {
                    name: packData.expansion,
                    numOfPacks: packData.packs,
                    isActive: packData.isActive,
                    className: utils.slugify(packData.expansion)
                };
                RedbullExpansion.create(redbullExpansionData, function(err, redbullExpansion) {
                    if(err) return eachCb(err);

                    // Make a rarity for each expansion
                    async.forEachOfSeries(packData.chances, function(chanceValue, chanceKey, chanceCb) {
                        var redbullRarityChanceData = {
                            rarity: chanceKey,
                            percentage: chanceValue,
                            redbullExpansionId: redbullExpansion.id
                        };
                        RedbullRarityChance.create(redbullRarityChanceData, chanceCb);
                    }, eachCb);
                })
            }, seriesCb);
        },
        // Add role for $redbullUser and $redbullAdmin
        function(seriesCb) {
            Role.create({name:"$redbullUser"}, function(err) {
                if(err) return seriesCb(err);
                Role.create({name:"$redbullAdmin"}, function(err) {
                    return seriesCb(err);
                });
            });
        }
    ],
    function(err) {
        if(err) console.log("Error creating redbull data:", err);
        else console.log("Successfully created redbull data");
    });
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