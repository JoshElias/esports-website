var assets = require("./../../common/assets");


module.exports = function(server) {

 	function indexHandler(req, res, next) {
 		res.render(server.get("appIndex"), { cdnUrl: server.get("cdnUrl"), assets: assets });
 	}

	server.get("*", indexHandler);
}