module.exports = function mixin (app) {
    app.loopback.modelBuilder.mixins.define('Filter', require('./filter'));
};