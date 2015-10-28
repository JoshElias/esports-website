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
        if (!okayFile(mimetype)) {
            return callback(new Error("err uploading unknown mimetype"));
        }

        var fileStream = fs.createReadStream(file.path);
        var knoxHeaders = {
            'Content-Type': mimetype,
            'Cache-Control': 'max-age=604800',
            'x-amz-acl': 'public-read',
            'Content-Length': fs.statSync(file.path).size
        };

        console.log("file:", folder+file.name);
        knoxClient.putStream(fileStream, folder + file.name, knoxHeaders, function(err, result) {
            if (err) console.log("ERR uploading to s3:", err);
            else console.log("successfully upploaded");
            return callback(err);
        });
/*
        req.on('response', function(res) {
            console.log("response:", res);
            if (res.statusCode !== 200) {
                return callback(new Error('Error uploading to amazon: Code ' + res.statusCode))
            }
            return callback();
        });
        */
    }

    async.eachSeries(files, uploadFile, function (err) {
        return callback(err);
    });
}