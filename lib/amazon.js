var config = require('./config'),
    knox = require('knox').createClient({
        key: config.AMAZON_KEY,
        secret: config.AMAZON_SECRET,
        bucket: config.AMAZON_BUCKET,
        secure: false
    }),
    async = require('async'),
    fs = require('graceful-fs'),
    mime = require('mime');

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
        var req = knox.putStream(stream, folder + file.name,
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
            if (res.statusCode !== 200) { console.log('Error uploading to amazon: Code ' + res.statusCode); }
            return callback();
        });
    }

    async.each(files, uploadFile, function () {
        return callback();
    });
}