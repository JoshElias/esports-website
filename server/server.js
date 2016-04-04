var async = require("async");
var loopback = require('loopback');
var boot = require('loopback-boot');
var xloop = require("xloop");
var path = require("path");

var app = module.exports = loopback();


async.series([

    // Bootstrap the application, configure models, datasources and middleware.
    // Sub-apps like REST API are mounted via boot scripts.
    function(seriesCb) {

        var options = {};

        // Add third-party mixins
        options.mixinSources = [];
        options.mixinSources.push(path.join("..", "node_modules", "loopback-authored-mixin"));
        options.mixinSources.push(path.join("..", "node_modules", "loopback-destroy-on-delete-mixin"));
        options.mixinSources.push(path.join("..", "node_modules", "loopback-filter-mixin"));
        options.mixinSources.push(path.join("..", "node_modules", "loopback-scope-mixin"));
        options.mixinSources.push(path.join("..", "node_modules", "loopback-slug-mixin"));
        options.mixinSources.push(path.join("..", "node_modules", "loopback-timestamp-mixin"));
        options.mixinSources.push(path.join("..", "node_modules", "loopback-validate-mixin"));

        // Add third-party models
        options.modelSources = [];
        options.modelSources.push(path.join(__dirname, "..", "node_modules", "loopback-component-passport", "lib", "models"));
        options.modelSources.push(path.join(__dirname, "..", "node_modules", "loopback-slug-mixin", "models"));
        options.modelSources.push(path.join(__dirname, "..", "node_modules", "loopback-validate-mixin", "models"));

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