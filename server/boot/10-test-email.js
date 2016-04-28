var ejs = require("ejs");
var path = require("path");
var fs = require("fs");
var async = require("async");

var emailBuilder = require("../lib/email/email-builder");


module.exports = function(server, finalCb) {
    return finalCb();
    // Compile the email html
    var domain = server.get("domain");
    var templateOptions = {
        header: {
            url: String.format("http://{0}", domain),
            imgSrc: "http://www.tempostorm.com/img/email/email-logo.png"
        },
        body: {
            title: {
                text: "You're almost done signing up!"
            },
            description: {
                text: "Please click the link below to confirm your email address.",
                code: String.format("Activation Code: {0}", "TEST")
            },
            button: {
                url: String.format("http://{0}/api/users/confirm?uid={1}&token={2}&redirect={3}",
                    "TEST", "TEST", "/"),
                text: "Reset Password"
            }
        }
    }

    var html = emailBuilder.compileHtml("account-activation", templateOptions);

    // Send the email
    var mailOptions = {
        Destination: {
            ToAddresses: ["joe.oshawa2@gmail.com"]
        },
        Message: {
            Body: {
                Html: {
                    Data: html
                }
            },
            Subject: {
                Data: "Reset your account password"
            }
        },
        Source: "admin@tempostorm.com",
        ReplyToAddresses: ["admin@tempostorm.com"]
    };

    var Email = server.models.Email;
    return Email.send(mailOptions, function(err) {
        if(err) return finalCb(err);

        return finalCb(err);
    });
};