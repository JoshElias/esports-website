var path = require("path");
var fs = require("fs");
var async = require("async");


function generateBootOptions(finalCb) {

    // Initialize the boot options
    var loopbackBootOptions = {
        bootDirs: [],
        modelSourceDirs: []
    };

    // Add default config
    loopbackBootOptions.appRootDir = path.join(__dirname, "..", "..", "..", "..", "server", "configs"),

    // Add default boot dir
    loopbackBootOptions.bootDirs.push(path.join(__dirname, "..", "..", "..", "..", "server", "boot"));

    // Get module dirs
    async.waterfall([

        // check for modules folder
        function (seriesCb) {
            var rootDirPath = path.join(__dirname, "..", "..", "..", "..");
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
            return crawlModulesDir(modulesPath, seriesCb);
        }
    ],
    function (err) {
        if (err && err !== true) {
            return finalCb(err);
        }

        return finalCb(undefined, loopbackBootOptions);
    });

    function crawlModulesDir(modulesPath, modulesCb) {
        return fs.readdir(modulesPath, function (err, files) {
            if (err) return modulesCb(err);
            return async.eachSeries(files, function (file, eachCb) {
                var newPath = path.join(modulesPath, file);
                return fs.stat(newPath, function (err, stats) {
                    if (err) eachCb(err);

                    if (!stats.isDirectory()) {
                        return eachCb();
                    }

                    return crawlModuleDir(newPath, eachCb);
                });

            }, modulesCb);
        });
    }

    function crawlModuleDir(modulePath, moduleCb) {
        return fs.readdir(modulePath, function (err, files) {
            if (err) return moduleCb(err);
            return async.eachSeries(files, function (file, eachCb) {
                var newPath = path.join(modulePath, file);
                return fs.stat(newPath, function (err, stats) {
                    if (err) return eachCb(err);

                    if (!stats.isDirectory()) {
                        return eachCb();
                    }

                    // Handlers
                    if (file === "server") {
                        return serverHandler(newPath, eachCb);
                    } else if(file === "common") {
                        return commonHandler(newPath, eachCb);
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

                    // Handlers
                    if (file === "boot") {
                        return bootHandler(newPath, eachCb);
                    }

                    return eachCb();
                });
            }, serverCb);
        });
    }

    function bootHandler(bootPath, finalCb) {
        loopbackBootOptions.bootDirs.push(bootPath);
        return finalCb();
    }


    function commonHandler(commonPath, commonCb) {
        return fs.readdir(commonPath, function (err, files) {
            if (err) return commonCb(err);
            return async.eachSeries(files, function (file, eachCb) {
                var newPath = path.join(commonPath, file);
                return fs.stat(newPath, function (err, stats) {
                    if (err) return eachCb(err);

                    if (!stats.isDirectory()) {
                        return eachCb();
                    }

                    // Handlers
                    if (file === "models") {
                        return modelHandler(newPath, eachCb);
                    }

                    return eachCb();
                });
            }, commonCb);
        });
    }

    function modelHandler(modelSourcePath, finalCb) {
        loopbackBootOptions.modelSourceDirs.push(modelSourcePath);
        return finalCb();
    }
}

module.exports = {
    generateBootOptions : generateBootOptions
};