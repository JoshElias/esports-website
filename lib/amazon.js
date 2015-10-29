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
        endpoint: "staging-cdn.tempostorm.com.s3-website-us-west-2.amazonaws.com",
        region: "us-west-2",
        s3BucketEndpoint: true
        // any other options are passed to new AWS.S3()
        // See: http://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/Config.html#constructor-property
    }
});

var knoxClient = knox.createClient({
    key: "AKIAIQZRXBQLHFBKCGSQ",
    secret: "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",
    bucket: "staging-cdn.tempostorm.com",
    secure: false
});


function upload(localPath, remotePath, finalCallback) {
    console.log("uploading size:", fs.statSync(localPath).size);
    console.log("localPath:", localPath);
    console.log("remotePath:", remotePath);

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