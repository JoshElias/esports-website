var async = require("async");
var fs = require("graceful-fs");
var mime = require("mime");
var knox = require("knox");
var s3 = require("s3");
var s3Datasource = (process.env.NODE_ENV)
    ? require("../configs/datasources."+process.env.NODE_ENV).s3
    : require("../configs/datasources.json").s3;



var knoxClient = knox.createClient({
    key: s3Datasource.keyId,
    secret: s3Datasource.key,
    bucket: s3Datasource.bucket,
    secure: false
});


function upload(localPath, remotePath, finalCallback) {

    function okayFile (mimetype) {
        return (mimetype.localeCompare('image/jpeg')
        || mimetype.localeCompare('image/pjpeg')
        || mimetype.localeCompare('image/png')
        || mimetype.localeCompare('image/gif'));
    }

    var mimetype = mime.lookup(localPath);
    if (!okayFile(mimetype)) { return finalCallback(); }

    var stream = fs.createReadStream(localPath)
    var req = knoxClient.putStream(stream, remotePath,
        {
            'Content-Type': mimetype,
            'Cache-Control': 'max-age=604800',
            'x-amz-acl': 'public-read',
            'Content-Length': fs.statSync(localPath).size
        },
        function(err, result) {
            if (err) { console.log(err); }
        });

    req.on('response', function(res) {
        if (res.statusCode !== 200) {
            return finalCallback('Error uploading to amazon: Code ' + res.statusCode);
        }
        return finalCallback();
    });
};

module.exports = {
    upload : upload
};