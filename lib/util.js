var Schemas = require('./schemas');

function Util() {
}

Util.prototype.ucfirst = function (string) {
    return string.toLowerCase().charAt(0).toUpperCase() + string.slice(1);
};

Util.prototype.slugify = function (string) {
    return (string) ? string.toLowerCase().replace(/-+/g, '').replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') : '';
};

Util.prototype.spamFilter = function (fields, req, userId, cb) {
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
//        console.log("Schema data: ",data);
        while (i > 0) {
            spamArray.push(data[i-1].case);
            i--;
        }
      
        function replaceWithArr(arr, val) {
          for(var i = 0; i < arr.length; i++) {
            var out = val.replace(val, "");
          }
          return out;
        }

        // pipe array to string for regex
        var regMatch = new RegExp("(" + spamArray.join('|') + ")", 'i');
      
//        console.log("regMatch: ", regMatch);
        fields.forEach(function (val, key) {
//            var str = replaceWithArr([".","-"], val);
//          console.log("val", val);
            var str = val.replace(".", "");
//          console.log("str", str);
            
            var match = str.match(regMatch);
            if (match){
                matched = match;
                return matched;
            }
        });
        // TODO: Log IP on match, increment if IP exists
        var ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
        var userID = userId;
        
        var SpamPositive = Schemas.SpamPositive;
        
      
        SpamPositive.findOne({ "ip": ip, "userId": userID }, function (err, data) {
          if(err) { return }
          
          if(data === null || data === undefined){
            var newPositive = new SpamPositive({
              ip: ip,
              userId: userID,
              createdDate: new Date().toISOString(),
              userAgent: req.headers['user-agent'],
              referer: req.header('Referer'),
              qty: 1,
              matches: [matched[0]]
            });
            
            newPositive.save();
          } else {
            data.matches.push(matched[0]);
            data.qty++;
            
            SpamPositive.update({ _id: data._id }, {
              ip: data.ip,
              userId: data.userId,
              createdDate: data.createDate,
              userAgent: data.userAgent,
              referer: data.referer,
              qty: data.qty++,
              matches: data.matches
            }).exec(function (err) {
              return cb(matched);
            });
          }
        });
        
        
        // if no matches, pass the spamFilter
        


    });

};

module.exports = new Util();


/*
 function loadSpamFilter(callback){}

 function checkforSpam(string){
 // pull in from database collection
 var regMatch = new RegExp('Free,HD/ig');

 }*/
