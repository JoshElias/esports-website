module.exports = function mixin (app) {
    console.log("FUCK");
    app.loopback.modelBuilder.mixins.define("Slug", require("./slug"));
};