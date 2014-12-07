var mandrill = require('mandrill-api/mandrill'),
    mandrillClient = new mandrill.Mandrill('cr_7MquZ5JJ4uSpavfJr_Q');

function Mail() {
}

Mail.prototype.signup = function(data, callback){
    var message = {
        "to": [{
                "email": data.email,
                "name": data.username,
                "type": "to"
            }],
        "merge": true,
        "merge_language": "mailchimp",
        "merge_vars": [{
            "rcpt": data.email,
            "vars": [{
                    'name': 'EMAIL',
                    'content': data.email
                },{
                    'name': 'ACTIVATION_CODE',
                    'content': data.activationCode
            }]
        }],
        "tags": [
            "signup"
        ]
    };

    mandrillClient.messages.sendTemplate({
        'template_name': 'signup',
        'template_content': [],
        'message': message
    }, function(result) {
        console.log(result);
        return callback();
    }, function(e) {
        console.log('A mandrill error occurred: ' + e.name + ' - ' + e.message);
    });
};

Mail.prototype.activated = function(data, callback){
    var message = {
        "to": [{
                "email": data.email,
                "name": data.username,
                "type": "to"
            }],
        "merge": true,
        "merge_language": "mailchimp",
        "merge_vars": [{
            "rcpt": data.email,
            "vars": [{
                    'name': 'EMAIL',
                    'content': data.email
                },{
                    'name': 'USERNAME',
                    'content': data.username
            }]
        }],
        "tags": [
            "activated"
        ]
    };

    mandrillClient.messages.sendTemplate({
        'template_name': 'activated',
        'template_content': [],
        'message': message
    }, function(result) {
        console.log(result);
        return callback();
    }, function(e) {
        console.log('A mandrill error occurred: ' + e.name + ' - ' + e.message);
    });
};

Mail.prototype.forgotPassword = function(data, callback){
    var message = {
        "to": [{
                "email": data.email,
                "name": data.username,
                "type": "to"
            }],
        "merge": true,
        "merge_language": "mailchimp",
        "merge_vars": [{
            "rcpt": data.email,
            "vars": [{
                    'name': 'EMAIL',
                    'content': data.email
                },{
                    'name': 'USERNAME',
                    'content': data.username
                },{
                    'name': 'RESET_PASSWORD_CODE',
                    'content': data.resetPasswordCode
            }]
        }],
        "tags": [
            "password-forgot"
        ]
    };

    mandrillClient.messages.sendTemplate({
        'template_name': 'forgot-password',
        'template_content': [],
        'message': message
    }, function(result) {
        console.log(result);
        return callback();
    }, function(e) {
        console.log('A mandrill error occurred: ' + e.name + ' - ' + e.message);
    });
};

Mail.prototype.resetPassword = function(data, callback){
    var message = {
        "to": [{
                "email": data.email,
                "name": data.username,
                "type": "to"
            }],
        "merge": true,
        "merge_language": "mailchimp",
        "merge_vars": [{
            "rcpt": data.email,
            "vars": [{
                    'name': 'EMAIL',
                    'content': data.email
                },{
                    'name': 'USERNAME',
                    'content': data.username
                },{
                    'name': 'PASSWORD',
                    'content': data.password
            }]
        }],
        "tags": [
            "password-reset"
        ]
    };

    mandrillClient.messages.sendTemplate({
        'template_name': 'reset-password',
        'template_content': [],
        'message': message
    }, function(result) {
        console.log(result);
        return callback();
    }, function(e) {
        console.log('A mandrill error occurred: ' + e.name + ' - ' + e.message);
    });
};

module.exports = Mail;