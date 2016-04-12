var assets = require("./../../server/configs/assets");

var NODE_ENV = process.env.NODE_ENV;
var INDEX_NAME = NODE_ENV + ".index.dust";

// convert asset keys "." to "_"
var newAssets = {};
for(var key in assets) {
    var newKey = key.split(".").join("_");
    newAssets[newKey] = assets[key];
}


module.exports = function(server) {

 	function indexHandler(req, res, next) {
        var clientConfig = {
            cdnUrl: server.get("cdnUrl"),
            cdnUrl2: server.get("cdnUrl2"),
            assets: newAssets
        };

        if (NODE_ENV !== "production") {
            clientConfig.adSense = true;
        }

 		res.render(INDEX_NAME, clientConfig);
 	}

	server.get("*", indexHandler);
}
