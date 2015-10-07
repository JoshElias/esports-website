var assets = require("./../../common/assets");


module.exports = function(server) {

 	function indexHandler(req, res, next) {
        var indexName = process.env.NODE_ENV + ".index.dust";
 		res.render(indexName, { cdnUrl: server.get("cdnUrl"), assets: assets });
 	}

	server.get("*", indexHandler);
}