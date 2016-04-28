module.exports = function(Image) {
    var async = require("async");
    var formidable = require("formidable");
    var fs = require("graceful-fs");
    var gm = require('gm').subClass({ imageMagick: true });
    var amazon = require("../../server/lib/amazon");


    var defaultError = new Error('image upload failed');
    defaultError.statusCode = 500;
    defaultError.code = 'IMAGE_UPLOAD_FAILED';

    Image.uploadCard = function (ctx, options, done) {
        var req = ctx.req;
        var res = ctx.res;

        var form = new formidable.IncomingForm();

        form.parse(req, function(err, fields, files) {
            if (err) {
                console.log("ERR parsing form:", err);
                return done(defaultError);
            }

            var file = files[Object.keys(files)[0]]; // get first property in dict files

            // check if image file
            var types = ['image/png', 'image/jpeg', 'image/gif'];
            if (types.indexOf(file.type) === -1) {
                fs.unlink(file.path, function(err){
                    if (err) return done(err);
                    var output = {
                        success: false,
                        error: 'Invalid photo uploaded.',
                    };
                    return done(err, output);
                });
            } else {
                var arr = file.name.split('.'),
                    name = arr.splice(0, arr.length - 1).join('.'),
                    ext = '.' + arr.pop(),
                    large = name + '.large' + ext,
                    medium = name + '.medium' + ext,
                    path = __dirname+'/../../server/uploads/photos/cards/';
                copyFile(function () {
                    var filePaths = [
                        {
                            localPath: path+medium,
                            remotePath: "cards/"+medium
                        },
                        {
                            localPath: path+large,
                            remotePath: "cards/"+large
                        }
                    ];
                    async.eachSeries(filePaths, function(filePath, littLeCallback) {
                        amazon.upload(filePath.localPath, filePath.remotePath, littLeCallback);
                    }, function (err) {
                        return done(err, {
                            success: true,
                            large: large,
                            medium: medium,
                            path: 'cards/'
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
                                    gm(path + large).quality(100).resize(251, 350, "!").write(path + large, function(err){ //284, 395
                                        if (err) return done(err);
                                        gm(path + large).quality(100).resize(160, 221, "!").write(path + medium, function(err){
                                            if (err) return done(err);
                                            fs.chmod(path + medium, 0777, function(err){
                                                if (err) return done(err);
                                                return callback();
                                            });
                                        });
                                    });
                                });
                            });
                        });
                    });
                }
            }
        });
    }

    Image.uploadDeck = function (ctx, options, done) {
        var req = ctx.req;
        var res = ctx.res;

        var form = new formidable.IncomingForm();

        form.parse(req, function(err, fields, files) {
            if (err) {
                console.log("ERR parsing form:", err);
                return done(defaultError);
            }

            var file = files[Object.keys(files)[0]]; // get first property in dict files

            // check if image file
            var types = ['image/png', 'image/jpeg', 'image/gif'];
            if (types.indexOf(file.type) === -1) {
                fs.unlink(file.path, function(err){
                    if (err) return done(err);
                    return done(err, {
                        success: false,
                        error: 'Invalid photo uploaded.',
                    });
                });
            } else {
                var arr = file.name.split('.'),
                    name = arr.splice(0, arr.length - 1).join('.'),
                    ext = '.' + arr.pop(),
                    small = name + '.small' + ext,
                    path = __dirname+'/../../server/uploads/photos/decks/';
                copyFile(function () {
                    var files = [];
                    files.push({
                        path: path + small,
                        name: small
                    }); // HAhhahahahahHAHAHahahhah
                    console.log('small:', 'cards/'+small);
                    amazon.upload(path+small, 'cards/'+small, function(err) {
                        return done(err, {
                            success: true,
                            small: small,
                            path: 'cards/'
                        });
                    });
                });

                function copyFile(callback) {
                    // read file
                    fs.readFile(file.path, function(err, data){
                        if (err) return done(err);
                        // write file
                        fs.writeFile(path + small, data, function(err){
                            if (err) return done(err);
                            // chmod new file
                            fs.chmod(path + small, 0777, function(err){
                                if (err) return done(err);
                                // delete tmp file
                                fs.unlink(file.path, function(err){
                                    if (err) return done(err);
                                    // resize
                                    gm(path + small).quality(100).resize(110, 26, "!").write(path + small, function(err){
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
    }

    Image.uploadArticle = function (ctx, options, done) {
        var req = ctx.req;
        var res = ctx.res;

        var form = new formidable.IncomingForm();

        form.parse(req, function (err, fields, files) {
            if (err) {
                console.log("ERR parsing form:", err);
                return done(err);
            }

            var file = files[Object.keys(files)[0]]; // get first property in dict files

            var arr = file.name.split('.'),
                name = arr.splice(0, arr.length - 1).join('.'),
                ext = '.' + arr.pop(),
                large = slugify(name) + '.large' + ext,
                medium = slugify(name) + '.medium' + ext,
                small = slugify(name) + '.small' + ext,
                square = slugify(name) + '.square' + ext,
                path = __dirname+'/../../server/uploads/photos/articles/';
            copyFile(function () {
                var filePaths = [];
                filePaths.push({
                    localPath: path + large,
                    remotePath: 'articles/'+large
                });
                filePaths.push({
                    localPath: path + medium,
                    remotePath: 'articles/'+medium
                });
                filePaths.push({
                    localPath: path + small,
                    remotePath: 'articles/'+small
                });
                filePaths.push({
                    localPath: path + square,
                    remotePath: 'articles/'+square
                });
                async.eachSeries(filePaths, function(filePath, callback) {
                    amazon.upload(filePath.localPath, filePath.remotePath, callback);
                }, function (err) {
                    return done(err, {
                        success: true,
                        large: large,
                        medium: medium,
                        small: small,
                        square: square,
                        path: 'articles/'
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
                                gm(path + large).quality(100).gravity('Center').crop(1920, 480, 0, 0).write(path + large, function(err){
                                    if (err) return done(err);
                                    gm(path + large).quality(100).resize(null, 200).write(path + square, function(err) {
                                        if (err) return done(err);
                                        gm(path + square).quality(100).gravity('Center').crop(200, 200, 0, 0).write(path + square, function(err) {
                                            if (err) return done(err);
                                            gm(path + large).quality(100).resize(800, 200, "!").write(path + medium, function(err){
                                                if (err) return done(err);
                                                fs.chmod(path + medium, 0777, function(err){
                                                    if (err) return done(err);
                                                    gm(path + large).quality(100).resize(400, 100, "!").write(path + small, function(err){
                                                        if (err) return done(err);
                                                        fs.chmod(path + small, 0777, function(err){
                                                            if (err) return done(err);
                                                            return callback();
                                                        });
                                                    });
                                                });
                                            });
                                        });
                                    });
                                });
                            });
                        });
                    });
                });
            }
        })
    }

    Image.uploadPoll = function (ctx, options, done) {
        var req = ctx.req;
        var res = ctx.res;

        var form = new formidable.IncomingForm();

        form.parse(req, function (err, fields, files) {
            if (err) {
                console.log("ERR parsing form:", err);
                return done(defaultError);
            }

            var file = files[Object.keys(files)[0]]; // get first property in dict files

            // check if image file
            var types = ['image/png', 'image/jpeg', 'image/gif'];
            if (types.indexOf(file.type) === -1) {
                fs.unlink(file.path, function (err) {
                    if (err) return done(err);
                    var output = {
                        success: false,
                        error: 'Invalid photo uploaded.',
                    };
                    return done(err, output);
                });
            } else {
                var arr = file.name.split('.'),
                    name = arr.splice(0, arr.length - 1).join('.'),
                    ext = '.' + arr.pop(),
                    large = name + '.large' + ext,
                    thumb = name + '.thumb' + ext,
                    path = __dirname+'/../../server/uploads/photos/polls/';
                copyFile(function () {
                    var filePaths = [];
                    filePaths.push({
                        localPath: path + large,
                        remotePath: "polls/"+large
                    });
                    filePaths.push({
                        localPath: path + thumb,
                        remotePath: "polls/"+thumb
                    });

                    async.eachSeries(filePaths, function(filePath, callback) {
                        amazon.upload(filePath.localPath, filePath.remotePath, callback);
                    }, function (err) {
                        return done(err, {
                            success: true,
                            large: large,
                            thumb: thumb,
                            path: 'polls/'
                        });
                    });
                });

                function copyFile(callback) {
                    // read file
                    fs.readFile(file.path, function (err, data) {
                        if (err) return done(err);
                        // write file
                        fs.writeFile(path + large, data, function (err) {
                            if (err) return done(err);
                            // chmod new file
                            fs.chmod(path + large, 0777, function (err) {
                                if (err) return done(err);
                                // delete tmp file
                                fs.unlink(file.path, function (err) {
                                    if (err) return done(err);
                                    // resize
                                    gm(path + large).quality(100).resize(800, 600, ">").write(path + large, function (err) {
                                        if (err) return done(err);
                                        gm(path + large).quality(100).resize(140, 140, "^").write(path + thumb, function (err) {
                                            if (err) return done(err);
                                            gm(path + thumb).quality(100).gravity('Center').crop(140, 140).write(path + thumb, function (err) {
                                                if (err) return done(err);
                                                fs.chmod(path + thumb, 0777, function (err) {
                                                    if (err) return done(err);
                                                    return callback();
                                                });
                                            });
                                        });
                                    });
                                });
                            });
                        });
                    });
                }
            }
        })
    };


    Image.uploadBanner = function (ctx, options, done) {
        var req = ctx.req;
        var res = ctx.res;

        var form = new formidable.IncomingForm();

        form.parse(req, function(err, fields, files) {
            if(err) {
                console.log("ERR parsing form:", err);
                return done(defaultError);
            }

            var file = files[Object.keys(files)[0]]; // get first property in dict files

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
                    amazon.upload(path+large, "banners/"+large,  function (err) {
                        return done(err, {
                            success: true,
                            large: large,
                            path: 'banners/'
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
                                    gm(path + large).quality(100).resize(1900, 499, ">").write(path + large, function(err) {
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
    };

    Image.uploadSnapshot = function (ctx, options, done) {
        var req = ctx.req;
        var res = ctx.res;

        var form = new formidable.IncomingForm();

        form.parse(req, function(err, fields, files) {
            if(err) {
                console.log("ERR parsing form:", err);
                return done(defaultError);
            }

            var file = files[Object.keys(files)[0]]; // get first property in dict files

            var arr = file.name.split('.'),
                name = arr.splice(0, arr.length - 1).join('.'),
                ext = '.' + arr.pop(),
                large = slugify(name) + '.large' + ext,
                medium = slugify(name) + '.medium' + ext,
                small = slugify(name) + '.small' + ext,
                square = slugify(name) + '.square' + ext,
                path = __dirname+'/../../server/uploads/photos/snapshots/';
            copyFile(function () {
                var filePaths = [];
                filePaths.push({
                    localPath: path + large,
                    remotePath: "snapshots/"+large
                });
                filePaths.push({
                    localPath: path + medium,
                    remotePath: "snapshots/"+medium
                });
                filePaths.push({
                    localPath: path + small,
                    remotePath: "snapshots/"+small
                });
                filePaths.push({
                    localPath: path + square,
                    remotePath: "snapshots/"+square
                });
                async.eachSeries(filePaths, function(filePath, callback) {
                    amazon.upload(filePath.localPath, filePath.remotePath, callback);
                }, function (err) {
                    return done(err, {
                        success: true,
                        large: large,
                        medium: medium,
                        small: small,
                        square: square,
                        path: 'snapshots/'
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
                                gm(path + large).quality(100).gravity('Center').crop(1920, 480, 0, 0).write(path + large, function(err){
                                    if (err) return done(err);
                                    gm(path + large).quality(100).resize(null, 200).write(path + square, function(err) {
                                        if (err) return done(err);
                                        gm(path + square).quality(100).gravity('Center').crop(200, 200, 0, 0).write(path + square, function(err) {
                                            if (err) return done(err);
                                            gm(path + large).quality(100).resize(800, 200, "!").write(path + medium, function(err){
                                                if (err) return done(err);
                                                fs.chmod(path + medium, 0777, function(err){
                                                    if (err) return done(err);
                                                    gm(path + large).quality(100).resize(400, 100, "!").write(path + small, function(err){
                                                        if (err) return done(err);
                                                        fs.chmod(path + small, 0777, function(err){
                                                            if (err) return done(err);
                                                            return callback();
                                                        });
                                                    });
                                                });
                                            });
                                        });
                                    });
                                });
                            });
                        });
                    });
                });
            }
        })
    }


    Image.uploadTeam = function (ctx, options, done) {
        var req = ctx.req;
        var res = ctx.res;

        var form = new formidable.IncomingForm();

        form.parse(req, function(err, fields, files) {
            if(err) {
                console.log("ERR parsing form:", err);
                return done(defaultError);
            }


            var teamHeight = 368;
            var teamWidth = 698;

            var file = files[Object.keys(files)[0]]; // get first property in dict files

            // check if image file
            var types = ['image/png', 'image/jpeg', 'image/gif'];
            if (types.indexOf(file.type) === -1) {
                fs.unlink(file.path, function(err){
                    if (err) return done(err);
                    var output = {
                        success: false,
                        error: 'Invalid photo uploaded.',
                    };
                    return done(err, output);
                });
            } else {
                var arr = file.name.split('.'),
                    name = arr.splice(0, arr.length - 1).join('.'),
                    ext = '.' + arr.pop(),
                    photo = slugify(name) + ext,
                    path = __dirname+'/../../server/uploads/photos/teams/';
                copyFile(function () {
                    var files = [];
                    files.push({
                        path: path + photo,
                        name: photo
                    });
                    amazon.upload(path + photo, 'team/'+photo, function (err) {
                        return done(err, {
                            success: true,
                            photo: photo,
                            path: 'team/'
                        });
                    });
                });
                function copyFile(callback) {
                    // read file
                    fs.readFile(file.path, function(err, data) {
                        if (err) return done(err);
                        // write file
                        fs.writeFile(path + photo, data, function(err) {
                            if (err) return done(err);
                            // delete tmp file
                            fs.unlink(file.path, function(err) {
                                if (err) return done(err);
                                // resize
                                gm(path + photo)
                                    .quality(100)
                                    .resize(teamWidth, teamHeight, "^^")
                                    .repage("+")
                                    .gravity("Center")
                                    .crop(teamWidth, teamHeight, 0, 0)
                                    .write(path + photo, function(err) {
                                        if (err) return done(err);
                                        fs.chmod(path + photo, 0777, function(err) {
                                            if (err) return done(err);
                                            return callback();
                                        });
                                    }
                                );
                            });
                        });
                    });
                }
            }
        })
    }

    function slugify(string) {
        return (string) ? string.toLowerCase().replace(/-+/g, '').replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') : '';
    };

    Image.remoteMethod(
        'uploadCard',
        {
            description: 'Uploads a card',
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

    Image.remoteMethod(
        'uploadDeck',
        {
            description: 'Uploads a deck',
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

    Image.remoteMethod(
        'uploadArticle',
        {
            description: 'Uploads an article',
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

    Image.remoteMethod(
        'uploadPoll',
        {
            description: 'Uploads a poll',
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

    Image.remoteMethod(
        'uploadBanner',
        {
            description: 'Uploads a banner',
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

    Image.remoteMethod(
        'uploadSnapshot',
        {
            description: 'Uploads a snapshot',
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

    Image.remoteMethod(
        'uploadTeam',
        {
            description: 'Uploads a team',
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
