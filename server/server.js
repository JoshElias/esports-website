var async = require("async");
var loopback = require('loopback');
var boot = require('loopback-boot');
var xloop = require("../modules/xloop");
var path = require("path");

var app = module.exports = loopback();

async.series([

    // Bootstrap the application, configure models, datasources and middleware.
    // Sub-apps like REST API are mounted via boot scripts.
    function(seriesCb) {

        var options = {};

        // Add third-party mixins
        options.mixinDirs = [];

        // Add third-party models
        options.modelSources = [path.join(__dirname, "..", "node_modules", "loopback-component-passport", "lib", "models")];

        return xloop.generateBootOptions(app, options, function(err, bootOptions) {
            if(err) return seriesCb(err);

            return boot(app, bootOptions, seriesCb);
        });
    },

    // Start server
    function(seriesCb) {

        if (require.main !== module) {
            return seriesCb();
        }

        return app.listen(function() {
            var baseUrl = app.get('url').replace(/\/$/, '');
            console.log('Web server listening at: %s', baseUrl);
            app.emit('started');
            return seriesCb();
        });
    }
  ],
  function(err) {
    if(err) console.log("err running server:", err);
  }
);