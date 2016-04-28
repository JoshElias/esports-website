
var DEFAULT_HOST = "http://localhost:8080";


var header = {
    url : DEFAULT_HOST,
    imgSrc: "http://www.tempostorm.com/img/email/email-logo.png"
};

var body = {
    title: {
        text: "You're almost done signing up!"
    },
    description: {
        text: "Please click the link below to confirm your email address.",
        code: "Activation Code: TEST"
    },
    button: {
        url: DEFAULT_HOST,
        text: "Activate Now"
    }
}

var footer = {};



module.exports = {
    header: header,
    body: body,
    footer: footer
}
