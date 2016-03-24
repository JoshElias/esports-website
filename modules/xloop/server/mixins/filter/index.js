var packageJSON = require("./package");

module.exports = function mixin (app) {
    app.loopback.modelBuilder.mixins.define(packageJSON.mixinName, require("./filter"));
};