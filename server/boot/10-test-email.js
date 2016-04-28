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
                text: "Verify New Email Address"
            },
            description: {
                text: "Please verify your new email address by clicking the button below."
            },
            button: {
                url: String.format("http://{0}/api/users/changeEmail?uid={0}&token={1}&email={2}",
                    "testDomain", "testUid", "testTokenId", "testEmail"),
                text: "Confirm Email"
            }
        }
    }
    var html = emailBuilder.compileHtml("email-changed", templateOptions);

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
                Data: "Email Updated"
            }
        },
        Source: "Tempostorm <admin@tempostorm.com>",
        ReplyToAddresses: ["admin@tempostorm.com"]
    };

    var Email = server.models.Email;
    return Email.send(mailOptions, function(err) {
        if(err) return finalCb(err);

        return finalCb(err);
    });
};