var fs = require("fs");
var path = require("path");

var CONFIG_FOLDER_NAME = "configs";


var configPath = path.join(__dirname, CONFIG_FOLDER_NAME);



var bodyUrl = path.join(__dirname, "..", "lib", "email", "views", "notification-email", "lost-password", "lost-password.ejs");
var html = ejs.compile(data, {filename: path.basename(bodyUrl)})();

console.log("templatePath", templatePath);

var templates = {};
var cachedHtml = {};


fs.readdirSync(templatePath).forEach(function(file) {
    console.log("file", file);
    var templateName = path.basename(file, ".js");
    console.log("templateName", templateName);
    templates[templateName] = require("./" + TEMPLATE_FOLDER_NAME + "/" + file);
});


function buildHtml(templatePath) {



    var templateHtml = cachedHtml[templateName];
    if(typeof templateHtml === "string") {
        return templateHtml;
    }



}

function cacheTemplate(templatePath) {

}


function getTemplate() {

}



module.exports = {
    buildHtml: buildHtml,
    templates: templates,
    cachedHtml: cachedHtml
}