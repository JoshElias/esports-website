module.exports = function mixin (app) {
    app.loopback.modelBuilder.mixins.define('DeleteOnDestroy', require('./destroy-on-delete'));
};