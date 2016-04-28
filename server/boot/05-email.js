var ejs = require("ejs");
var path = require("path");
var fs = require("fs");
var async = require("async");

var emailBuilder = require("../lib/email/email-builder");

var EMAIL_VIEW_FOLDER = "views";


module.exports = function(server, finalCb) {

    // Get all emai templates by path
    var templatePaths = [];
    var rootTemplatePath = path.join(__dirname, "..", EMAIL_VIEW_FOLDER);
    templatePaths.push(path.join(rootTemplatePath, "notification-email", "reset-password"));
    templatePaths.push(path.join(rootTemplatePath, "notification-email", "account-activation"));

    // Add templates to email builder
    return async.each(templatePaths, function(templatePath, eachCb) {
        emailBuilder.addTemplate(templatePath, eachCb);
    }, finalCb)
};