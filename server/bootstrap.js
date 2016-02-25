var path = require("path");
var fs = require("fs");
var async = require("async");
var loopbackBoot = require('loopback-boot');


function boot(app) {
    return function(finalCb) {

        // Get all the boot script paths
        return getBootDirs(function(err, bootDirs) {
            if(err) return finalCb(err);

            // Initialize boot
            var bootOptions = {
                "appRootDir": path.join(__dirname, "configs"),
                "bootDirs" : bootDirs
            };
            loopbackBoot(app, bootOptions);

            return finalCb();
        });
    }
}

function getBootDirs(finalCb) {

    var bootDirs = [];

    // Add local default boot dir
    bootDirs.push(path.join(__dirname, "boot"));

    // Get module boot dirs
    async.waterfall([

        // check for modules folder
        function (seriesCb) {
            var rootDirPath = path.join(__dirname, "..");
            var modulePath = path.join(rootDirPath, "modules");
            return fs.open(modulePath, 'r', function (err, fd) {
                if (err && err.code == 'ENOENT') {
                    return seriesCb(true);
                } else if(err) return seriesCb(err);
                return seriesCb(undefined, modulePath);
            });
        },
        // Iterate over modules folder
        function (modulesPath, seriesCb) {
            return processModulesDir(modulesPath, seriesCb);
        }
    ],
    function (err) {
        if (err && err !== true) {
            return finalCb(err);
        }

        return finalCb(undefined, bootDirs);
    });

    function processModulesDir(modulesPath, modulesCb) {
        return fs.readdir(modulesPath, function (err, files) {
            if (err) return modulesCb(err);
            return async.eachSeries(files, function (file, eachCb) {
                var newPath = path.join(modulesPath, file);
                return fs.stat(newPath, function (err, stats) {
                    if (err) eachCb(err);

                    if (!stats.isDirectory()) {
                        return eachCb();
                    }

                    return processModuleDir(newPath, eachCb);
                });

            }, modulesCb);
        });
    }

    function processModuleDir(modulePath, moduleCb) {
        return fs.readdir(modulePath, function (err, files) {
            if (err) return moduleCb(err);
            return async.eachSeries(files, function (file, eachCb) {
                var newPath = path.join(modulePath, file);
                return fs.stat(newPath, function (err, stats) {
                    if (err) return eachCb(err);

                    if (!stats.isDirectory()) {
                        return eachCb();
                    }

                    if (file === "server") {
                        return serverHandler(newPath, eachCb);
                    }

                    return eachCb();
                });
            }, moduleCb);
        });
    }

    function serverHandler(serverPath, serverCb) {
        return fs.readdir(serverPath, function (err, files) {
            if (err) return serverCb(err);
            return async.eachSeries(files, function (file, eachCb) {
                var newPath = path.join(serverPath, file)
                return fs.stat(newPath, function (err, stats) {
                    if (err) return eachCb(err);

                    if (!stats.isDirectory()) {
                        return eachCb();
                    }

                    if (file === "boot") {
                        return bootHandler(newPath, eachCb);
                    }

                    return eachCb();
                });
            }, serverCb);
        });
    }

    function bootHandler(bootPath, finalCb) {
        bootDirs.push(bootPath);
        return finalCb();
    }
}

module.exports = boot;