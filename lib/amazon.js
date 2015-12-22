var async = require("async");
var fs = require("graceful-fs");
var mime = require("mime");
var knox = require("knox");
var s3 = require("s3");
var s3Datasource = (process.env.NODE_ENV)
    ? require("../server/configs/datasources."+process.env.NODE_ENV).s3
    : require("../server/configs/datasources.json").s3;


var s3Client = s3.createClient({
    //maxAsyncS3: 20,     // this is the default
    //s3RetryCount: 3,    // this is the default
    //s3RetryDelay: 1000, // this is the default
    //multipartUploadThreshold: 20971520, // this is the default (20 MB)
    //multipartUploadSize: 15728640, // this is the default (15 MB)
    s3Options: {
        accessKeyId: s3Datasource.keyId, //s3Datasource.keyId,
        secretAccessKey: s3Datasource.key,//s3Datasource.key,
        endpoint: s3Datasource.endpoint,
        region: "us-west-2",
        s3BucketEndpoint: true
        // any other options are passed to new AWS.S3()
        // See: http://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/Config.html#constructor-property
    }
});


console.log("AWS KEY:", s3Datasource.keyId);
console.log("AWS SECRET:", s3Datasource.key);
console.log("AWS BUCKET:", s3Datasource.bucket);

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