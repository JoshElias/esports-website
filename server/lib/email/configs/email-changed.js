
var DEFAULT_HOST = "http://localhost:8080";


var header = {
    url : DEFAULT_HOST,
    imgSrc: "http://www.tempostorm.com/img/email/email-logo.png"
};

var body = {
    title: {
        text: "Verify New Email Address"
    },
    description: {
        text: "Please verify your new email address by clicking the button below."
    },
    button: {
        url: DEFAULT_HOST,
        text: "Confirm Email"
    }
}

var footer = {};



module.exports = {
    header: header,
    body: body,
    footer: footer
}
