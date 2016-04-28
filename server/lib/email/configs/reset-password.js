
var DEFAULT_HOST = "http://localhost:8080";


var header = {
    url : DEFAULT_HOST,
    imgSrc: "http://www.tempostorm.com/img/email/email-logo.png"
};

var body = {
    title: {
        text: "Lost your password?"
    },
    description: {
        text: "Don't worry, we can help you out with that."
    },
    button: {
        url: DEFAULT_HOST,
        text: "Reset Password"
    }
}

var footer = {};



module.exports = {
    header: header,
    body: body,
    footer: footer
}
