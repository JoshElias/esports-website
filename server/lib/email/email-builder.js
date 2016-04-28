var fs = require("fs");
var path = require("path");
var ejs = require("ejs");
var async = require("async");



var CONFIG_FOLDER_NAME = "configs";
var CONFIG_FOLDER_PATH = path.join(__dirname, CONFIG_FOLDER_NAME);

var templates = {};



function addTemplate(templatePath, finalCb) {

    var templateName = path.basename(templatePath);

    return async.waterfall([
        function(seriesCb) {
            var template = {};
            return seriesCb(undefined, {});
        },
        addConfig(templateName),
        addTemplateData(templateName, templatePath)
    ],
    function(err, template) {
        if(err) return finalCb(err);

        templates[templateName] = template;
        return finalCb(undefined, template);
    });
}



function addConfig(templateName) {
    return function(template, finalCb) {

        var templateConfigPath = path.join(CONFIG_FOLDER_PATH, templateName + ".js");
        return fs.exists(templateConfigPath, function (exists) {
            if (!exists) {
                template.config = {};
            } else {
                template.config = require(templateConfigPath);
            }

            return finalCb(undefined, template);
        });
    }
}

function addTemplateData(templateName, templatePath) {
    return function(template, finalCb) {

        var ejsPath = path.join(templatePath, templateName + ".ejs");
        return fs.exists(ejsPath, function (exists) {
            if (!exists) {
                return finalCb(new Error("Could not find email template at path", ejsPath))
            }

            return fs.readFile(ejsPath, "utf8", function (err, data) {
                if (err) return finalCb(err);

                // Append to template
                template.data = data;
                return finalCb(undefined, template);
            });
        });
    }
}

function compileHtml(templateName, options) {

    var template = templates[templateName];
    if(!template) {
        return "";
    }

    // normalize options
    var options = options || {};
    for(var key in options) {
        template.config[key] = options[key];
    }

    var html = ejs.compile(template.data, {filename: templateName+".ejs"})(template.config);
    return html;
}


String.format = function() {
    // The string containing the format items (e.g. "{0}")
    // will and always has to be the first argument.
    var theString = arguments[0];

    // start with the second argument (i = 1)
    for (var i = 1; i < arguments.length; i++) {
        // "gm" = RegEx options for Global search (more than one instance)
        // and for Multiline search
        var regEx = new RegExp("\\{" + (i - 1) + "\\}", "gm");
        theString = theString.replace(regEx, arguments[i]);
    }

    return theString;
}



module.exports = {
    addTemplate: addTemplate,
    compileHtml: compileHtml
}