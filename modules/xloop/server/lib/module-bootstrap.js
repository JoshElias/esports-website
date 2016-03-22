var path = require("path");
var fs = require("fs");
var async = require("async");


function generateBootOptions(app, finalCb) {


    var appDir = path.dirname(require.main.filename);
    console.log("this is my app dir");

    // Initialize the boot options
    var loopbackBootOptions = {
        bootDirs: [],
        modelSources: [],
        mixinSources: []
    };

    var configsPath = path.join(__dirname, "..", "..", "..", "..", "server", "configs")

    // Add default loopback directories
    loopbackBootOptions.appRootDir = path.join(__dirname, "..", "..", "..", "..", "server");
    loopbackBootOptions.appConfigRootDir = configsPath;
    loopbackBootOptions.modelsRootDir = configsPath;
    loopbackBootOptions.dsRootDir = configsPath;
    loopbackBootOptions.middleware = require(path.join(__dirname, "..", "..", "..", "..", "server", "configs", "middleware"));
    loopbackBootOptions.bootDirs.push(path.join(__dirname, "..", "..", "..", "..", "server", "boot"));
    loopbackBootOptions.modelSources.push(path.join(__dirname, "..", "..", "..", "..", "common", "models"));
    loopbackBootOptions.mixinSources.push(path.join(__dirname, "..", "..", "..", "..", "server", "mixins"));
    loopbackBootOptions.mixinSources.push(path.join(__dirname, "..", "..", "..", "..", "common", "mixins"));

    // Add directories listed in the model-config
    loopbackBootOptions.modelSources.push( path.join(__dirname, "..", "..", "..", "..", "common", "models"));



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
                        bootHandler(newPath, eachCb);
                    } else if(file === "mixins") {
                        mixinsHandler(newPath, eachCb);
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

    function mixinsHandler(bootPath, finalCb) {
        loopbackBootOptions.mixinSources.push(bootPath);
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
        loopbackBootOptions.modelSources.push(modelSourcePath);
        return finalCb();
    }
}

module.exports = {
    generateBootOptions : generateBootOptions
};