var path = require("path");
var fs = require("fs");
var async = require("async");


function generateBootOptions(app, options, finalCb) {

    // Initialize the boot options
    var loopbackBootOptions = {
        bootDirs: [],
        modelSources: options.modelSources || [],
        mixinSources: options.mixinSources || []
    };

    // Get the root app directory
    var appDir = path.join(__dirname, "..", "..", "..", "..", "server");
    var configsPath = path.join(appDir, "configs");

    // Add default loopback directories
    loopbackBootOptions.appRootDir = path.join(appDir);
    loopbackBootOptions.appConfigRootDir = configsPath;
    loopbackBootOptions.modelsRootDir = configsPath;
    loopbackBootOptions.dsRootDir = configsPath;
    loopbackBootOptions.middleware = require(path.join(appDir, "configs", "middleware"));
    loopbackBootOptions.bootDirs.push(path.join(appDir, "boot"));
    loopbackBootOptions.modelSources.push(path.join(appDir, "..", "common", "models"));

    // MIXIN PATHS ARE ALL RELATIVE TO tempostorm/server
    loopbackBootOptions.mixinSources.push(path.join("mixins"));
    loopbackBootOptions.mixinSources.push(path.join("..", "common", "mixins"));

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

                    var mixinPath = path.join("..", "modules", file);
                    return crawlModuleDir(newPath, mixinPath, eachCb);
                });

            }, modulesCb);
        });
    }

    function crawlModuleDir(modulePath, mixinPath, moduleCb) {
        return fs.readdir(modulePath, function (err, files) {
            if (err) return moduleCb(err);
            return async.eachSeries(files, function (file, eachCb) {
                var newPath = path.join(modulePath, file);
                return fs.stat(newPath, function (err, stats) {
                    if (err) return eachCb(err);

                    if (!stats.isDirectory()) {
                        return eachCb();
                    }

                    var newMixinPath = path.join(mixinPath, file);

                    // Handlers
                    if (file === "server") {
                        return serverHandler(newPath, newMixinPath, eachCb);
                    } else if(file === "common") {
                        return commonHandler(newPath, eachCb);
                    }


                    return eachCb();
                });
            }, moduleCb);
        });
    }

    function serverHandler(serverPath, mixinPath, serverCb) {
        return fs.readdir(serverPath, function (err, files) {
            if (err) return serverCb(err);
            return async.eachSeries(files, function (file, eachCb) {
                var newPath = path.join(serverPath, file);
                return fs.stat(newPath, function (err, stats) {
                    if (err) return eachCb(err);

                    if (!stats.isDirectory()) {
                        return eachCb();
                    }


                    // Handlers
                    if (file === "boot") {
                        bootHandler(newPath);
                    } else if(file === "mixins") {
                        var newMixinPath = path.join(mixinPath, file);
                        return mixinsHandler(newPath, newMixinPath, eachCb);
                    }

                    return eachCb();
                });
            }, serverCb);
        });
    }

    function bootHandler(bootPath) {
        loopbackBootOptions.bootDirs.push(bootPath);
    }

    function mixinsHandler(bootPath, mixinPath, finalCb) {
        return fs.readdir(bootPath, function (err, files) {
            if (err) return finalCb(err);
            return async.eachSeries(files, function (file, eachCb) {
                var newPath = path.join(bootPath, file);
                return fs.stat(newPath, function (err, stats) {
                    if (err) return eachCb(err);

                    if (!stats.isDirectory()) {
                        return eachCb();
                    }

                    var newMixinPath = path.join(mixinPath, file);
                    //loopbackBootOptions.mixinSources.push(newMixinPath);

                    return eachCb();
                });
            }, finalCb);
        });
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
        loopbackBootOptions.modelSources.push(modelSourcePath);
        return finalCb();
    }
}

module.exports = {
    generateBootOptions : generateBootOptions
};