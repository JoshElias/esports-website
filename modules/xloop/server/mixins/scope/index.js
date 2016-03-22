module.exports = function mixin (app) {
    app.loopback.modelBuilder.mixins.define('Scope', require('./scope'));
};