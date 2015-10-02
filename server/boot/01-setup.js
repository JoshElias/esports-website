var path = require("path");
var serveStatic = require("serve-static");
var consolidate = require("consolidate");
var favicon = require("serve-favicon");
var compression = require("compression");
var bodyParser = require("body-parser");
var methodOverride = require('method-override');
var loopback = require('loopback');
var session = require("express-session");
var MongoStore = require("connect-mongo")(session);


module.exports = function(server) {

  var staticDir = path.join(__dirname, "..", "..", "client");
  console.log("static dir: ", staticDir);
  server.use(serveStatic("client"));

  server.engine("dust", consolidate.dust);
  server.set("template_engine", "dust");
  server.set("views", path.join(__dirname, "..", "views"));
  server.set("view engine", "dust");


  server.use(require("prerender-node").set("prerenderToken", server.get("prerenderKey")));
  server.use(favicon(path.join(__dirname, "..", "..", "favicon.ico")));
  server.use(compression({
  	threshold: 512
  }));
  server.use(bodyParser.json({limit: "1mb"}));

  server.use(methodOverride());
  server.use(loopback.cookieParser(server.get("jwtSecret")));
  server.use(loopback.token({model:server.models.AccessToken}));

  var week = 60 * 60 * 24 * 7 * 1000;

  server.use(loopback.session({
      resave: false,
      saveUninitialized: false,
      secret:server.get("sessionSecret"),
      cookie: {
          expires: new Date(Date.now() + week),
          maxAge: week
      },
      clear_interval: 86400,
      store: new MongoStore({
          url:  server.get("dbUrl"),
          autoRemove: "native",
          ttl: 7 * 24 * 60 * 60 // 7 days
      })
  }));
}
