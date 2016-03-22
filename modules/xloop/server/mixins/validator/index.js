module.exports = function mixin (app) {
    app.loopback.modelBuilder.mixins.define('Validate', require('./validate'));
};