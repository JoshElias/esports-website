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
boot(app, __dirname);


app.start = function() {
  return app.listen(app.get("port"), function() {
    app.emit('started');
    console.log('Web server listening at: %s', app.get('url'));
  });
};

/*
var https = require("https");
var http = require("http");
var fs = require("fs");
app.start = function() {

		var keyData = fs.readFileSync("/etc/ssl/certs/server.key").toString();
		var certData = fs.readFileSync("/etc/ssl/certs/server.crt").toString();
    var options = {
      key: keyData,
      cert: certData
    };
  var server = https.createServer(options, app);

  server.listen(function() {
    var baseUrl = 'https://' + app.get('host') + ':' + app.get('port');
    app.emit('started', baseUrl);
    console.log('LoopBack server listening @ %s%s', baseUrl, '/');
  });
  return server;
};
*/


// start the server if `$ node server.js`
if (require.main === module) {
  app.start();
}
