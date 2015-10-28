var async = require("async");
var fs = require("graceful-fs");
var mime = require("mime");
var knox = require("knox");
var s3Datasource = (process.env.NODE_ENV)
    ? require("../server/configs/datasources."+process.env.NODE_ENV).s3
    : require("../server/configs/datasources.json").s3;

var knoxClient = knox.createClient({
    key: s3Datasource.keyId,
    secret: s3Datasource.key,
    bucket: s3Datasource.bucket,
    secure: false
});

exports.upload = function (files, folder, callback) {
    function okayFile (mimetype) {
        return (mimetype.localeCompare('image/jpeg')
        || mimetype.localeCompare('image/pjpeg')
        || mimetype.localeCompare('image/png')
        || mimetype.localeCompare('image/gif'));
    }

    function uploadFile(file, callback) {
        var mimetype = mime.lookup(file.path);
        if (!okayFile(mimetype)) { return callback(); }

        var stream = fs.createReadStream(file.path)
        var req = knoxClient.putStream(stream, folder + file.name,
            {
                'Content-Type': mimetype,
                'Cache-Control': 'max-age=604800',
                'x-amz-acl': 'public-read',
                'Content-Length': fs.statSync(file.path).size
            },
            function(err, result) {
                if (err) { console.log(err); }
            });

        req.on('response', function(res){
            console.log("response:", res);
            if (res.statusCode !== 200) {
                return callback(new Error('Error uploading to amazon: Code ' + res.statusCode))
            }
            return callback();
        });
    }

    async.each(files, uploadFile, function () {
        return callback();
    });
}