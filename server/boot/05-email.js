var ejs = require("ejs");
var path = require("path");
var fs = require("fs");
var async = require("async");

var emailBuilder = require("../lib/email/email-builder");

var bodyUrl = path.join(__dirname, "..", "lib", "email", "views", "notification-email", "lost-password", "lost-password.ejs");
console.log("bodyUrl", bodyUrl);


var EMAIL_VIEW_FOLDER = "views";


module.exports = function(server, finalCb) {

    // Cache email templates
    var rootTemplatePath = path.join(__dirname, "..", "boot", EMAIL_VIEW_FOLDER);

    // Get template paths
    var templatePaths = [];
    templatePaths.push(path.join(rootTemplatePath, "notification-email", "lost-password"));

    // Iterate through templates and render with default arguments
    return async.each(templatePaths, function(templatePath, eachCb) {
        return fs.readFile(templatePath, function(err, file) {
            if(err) return eachCb(err);

            emailBuilder.buildHtml()
        });
    });




    return;
    var Email = server.models.Email;

    return fs.readFile(bodyUrl, "utf8", function(err, data) {
        if(err) return console.log("unable to read file at", bodyUrl);

        var html = ejs.compile(data, {filename: path.basename(bodyUrl)})();
        console.log("HTML", html);



        // test email
        var emailOptions = {
            Destination: {
                ToAddresses: [
                    "joe.oshawa2@gmail.com"
                ]
            },
            Message: {
                Body: {
                    Html: {
                        Data: html
                    },
                    Text: {
                        Data: "WOOO Text"
                    }
                },
                Subject: {
                    Data: "subjecteddddd"
                }
            },
            Source: "admin@tempostorm.com"
        };

        return Email.send(emailOptions, function(err) {
            if(err) return console.log("err emailing", err);
            return console.log("successfully stuffed");
        });
    });
};