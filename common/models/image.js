module.exports = function(Image) {
    var async = require("async");
    var formidable = require("formidable");
    var fs = require("graceful-fs");
    var gm = require('gm').subClass({ imageMagick: true });
    var amazon = require("../../lib/amazon");




    Image.uploadBanner = function (ctx, options, done) {
        var req = ctx.req;
        var res = ctx.res;

        var defaultError = new Error('image upload failed');
        defaultError.statusCode = 500;
        defaultError.code = 'IMAGE_UPLOAD_FAILED';

        var form = new formidable.IncomingForm();

        form.parse(req, function(err, fields, files) {
            if(err) {
                console.log("ERR parsing form:", err);
                return done(defaultError);
            }

            var file = files[Object.keys(files)[0]]; // get first property in dict files
            console.log("file:", file);

            var types = ['image/png', 'image/jpeg', 'image/gif'];
            if (types.indexOf(file.type) === -1) {
                fs.unlink(file.path, function(err){
                    if(err) console.log("err unlinking file:", err);
                    done(defaultError)
                });
            } else {
                var arr = file.name.split('.'),
                    name = arr.splice(0, arr.length - 1).join('.'),
                    ext = '.' + arr.pop(),
                    large = name + ext,
                    path = __dirname+'/../../server/uploads/photos/banners/';
                copyFile(function () {
                    var fileArr = [];
                    fileArr.push({
                        path: path + large,
                        name: large
                    });
                    amazon.upload(fileArr, 'banners/', function (err) {
                        return done(err, {
                            success: true,
                            large: large,
                            path: '/photos/banners'
                        });
                    });
                });
                function copyFile(callback) {
                    // read file
                    fs.readFile(file.path, function(err, data){
                        if (err) return done(err);
                        // write file
                        fs.writeFile(path + large, data, function(err){
                            if (err) return done(err);
                            // chmod new file
                            fs.chmod(path + large, 0777, function(err){
                                if (err) return done(err);
                                // delete tmp file
                                fs.unlink(file.path, function(err){
                                    if (err) return done(err);
                                    // resize
                                    gm(path + large).quality(100).resize(1900, 499, ">").write(path + large, function(err){
                                        if (err) return done(err);
                                        return callback();
                                    });
                                });
                            });
                        });
                    });
                }
            }
        });

        // check if image file
        /*

        */
    };

    Image.remoteMethod(
        'uploadBanner',
        {
            description: 'Uploads a file',
            accepts: [
                { arg: 'ctx', type: 'object', http: { source:'context' } },
                { arg: 'options', type: 'object', http:{ source: 'query'} }
            ],
            returns: {
                arg: 'fileObject', type: 'object', root: true
            },
            http: {verb: 'post'}
        }
    );
};
