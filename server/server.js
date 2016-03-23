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
        options.mixinSources = [];

        // Add third-party models
        options.modelSources = [path.join(__dirname, "..", "node_modules", "loopback-component-passport", "lib", "models")];

        return xloop.generateBootOptions(app, options, function(err, bootOptions) {
            if(err) return seriesCb(err);

            if(!app.booting) {
                app.booting = true;
            }
            boot(app, bootOptions);
            app.booting = false;
            return seriesCb();
        })
    },

    // Start server
    function(seriesCb) {
/*
        app.handler('rest').adapter.getClasses().forEach(function(c) {
            console.log("fml", c);
        });
        */

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