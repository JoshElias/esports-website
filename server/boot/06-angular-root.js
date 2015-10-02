var config = require("./../../common/config");
var assets = require("./../../common/assets");


module.exports = function(server) {

 	function indexHandler(req, res, next) {
 		res.render(config.APP_INDEX, { cdnUrl: config.CDN_URL, assets: assets });
 	}

	server.get("*", indexHandler);
}