var async = require("async");
var loopback = require('loopback');
var boot = require('loopback-boot');
var jloop = require("../modules/jloop");
var path = require("path");

var app = module.exports = loopback();

async.series([

    // Bootstrap the application, configure models, datasources and middleware.
    // Sub-apps like REST API are mounted via boot scripts.
    function(seriesCb) {
        return jloop.generateBootOptions(function(err, bootOptions) {
            if(err) return seriesCb(err);

            // Add models for passport component
            bootOptions.modelSources.push(path.join(__dirname, "..", "node_modules", "loopback-component-passport", "lib", "models"));

            boot(app, bootOptions);
            return seriesCb();
        })
    },

    // Start server
    function(seriesCb) {

        if (require.main !== module) {
            return seriesCb();
        }

        return app.listen(app.get("port"), function() {
            app.emit('started');
            console.log('Web server listening at: %s', app.get('url'));
            return seriesCb();
        });
    }
  ],
  function(err) {
    if(err) console.log("err running server:", err);
  }
);