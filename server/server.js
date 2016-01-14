var path = require("path");
var loopback = require('loopback');
var boot = require('loopback-boot');
var consolidate = require("consolidate");
var favicon = require("serve-favicon");
var bodyParser = require("body-parser");
var expressValidator = require('express-validator');
var compression = require("compression");
var methodOverride = require('method-override');
var cookieParser = require('cookie-parser');
var session = require("express-session");
var MongoStore = require("connect-mongo")(session);
var serveStatic = require("serve-static");

var app = module.exports = loopback();



// Bootstrap the application, configure models, datasources and middleware.
// Sub-apps like REST API are mounted via boot scripts.
var bootOptions = {
  "appRootDir": path.join(__dirname, "configs"),
  "bootDirs" : [path.join(__dirname, "boot")]
};
boot(app, bootOptions);


app.start = function() {
  return app.listen(app.get("port"), function() {
    app.emit('started');
    console.log('Web server listening at: %s', app.get('url'));
  });
};

// start the server if `$ node server.js`
if (require.main === module) {
  app.start();
}
