var Schemas = require('./schemas');

function Util() {
}

Util.prototype.ucfirst = function (string) {
    return string.toLowerCase().charAt(0).toUpperCase() + string.slice(1);
};

Util.prototype.slugify = function (string) {
    return (string) ? string.toLowerCase().replace(/-+/g, '').replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') : '';
};

Util.prototype.spamFilter = function (fields, cb) {
    // fields would be an array of strings ie: ['chapters.name', 'chapters.description'] to protect the payload
    var SpamSchema = Schemas.SpamFilter;
    var spamArray = [];
    var matched = false;

    // load up the spam filter collection
    SpamSchema.find({}).exec(function (err, data) {
        if (err) {
            return;
        }

        var i = data.length;

        // notice this juice josh:
        console.log("Schema data: ",data);
        while (i > 0) {
            spamArray.push(data[i-1].case);
            i--;
        }

        // pipe array to string for regex
        var regMatch = new RegExp("(" + spamArray.join('|') + ")", 'i');

        console.log("regMatch: ", regMatch);
        fields.forEach(function (val, key) {
            console.log("val in fields: ", val, key);
            var match = val.match(regMatch);
            if (match){
                matched = match;
                return matched;
            }
        });

        // TODO: Log IP on match, increment if IP exists


        // if no matches, pass the spamFilter
        return cb(matched);


    });

};

module.exports = new Util();


/*
 function loadSpamFilter(callback){}

 function checkforSpam(string){
 // pull in from database collection
 var regMatch = new RegExp('Free,HD/ig');

 }*/
