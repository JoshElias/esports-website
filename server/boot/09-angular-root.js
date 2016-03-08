var assets = require("./../../server/configs/assets");

// convert asset keys "." to "_"
var newAssets = {};
for(var key in assets) {
    var newKey = key.split(".").join("_");
    newAssets[newKey] = assets[key];
}


module.exports = function(server) {

	function indexHandler(req, res, next) {
        var indexName = process.env.NODE_ENV + ".index.dust";

 		res.render(indexName, { cdnUrl: server.get("cdnUrl"), cdnUrl2: server.get("cdnUrl2"), assets: newAssets });
 	}

	server.get("*", indexHandler);
}
