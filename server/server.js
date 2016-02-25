var async = require("async");
var loopback = require('loopback');
var bootstrap = require("./bootstrap");
var start = require("./start");

var app = module.exports = loopback();


async.series([

    // Bootstrap the application, configure models, datasources and middleware.
    // Sub-apps like REST API are mounted via boot scripts.
    bootstrap(app),
    // Start server
    start(app, module)
  ],
  function(err) {
    if(err) console.log("err running server:", err);
  }
);