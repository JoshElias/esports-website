#!/usr/bin/env node

var fs = require('fs');
var path = require('path');
var semver = require('semver');
var generator = require('loopback-sdk-angular');

var appFile = path.join(__dirname, "..", "..", "..", "..", "server", "server.js");
var outputFile = path.join(__dirname, "..", "..", "..", "..", "client", "dist", "js", "services", "lb-services.js");

console.error('Loading LoopBack app %j', appFile);
console.log("AppFile", appFile);
var app = require(appFile);
assertLoopBackVersion();


app.on('booted', runGenerator);

function runGenerator() {
    var ngModuleName = 'lbServices';
    var apiUrl = app.get('restApiRoot') || '/api';

    console.error('Generating %j for the API endpoint %j', ngModuleName, apiUrl);
    var result = generator.services(app, ngModuleName, apiUrl);

    if (outputFile) {
        outputFile = path.resolve(outputFile);
        console.error('Saving the generated services source to %j', outputFile);
        fs.writeFileSync(outputFile, result);
    } else {
        console.error('Dumping to stdout');
        process.stdout.write(result);
    }

    // The app.js scaffolded by `slc lb project` loads strong-agent module that
    // used to have a bug where it prevented the application from exiting.
    // To work around that issue, we are explicitly exiting here.
    //
    // The exit is deferred to the next tick in order to prevent the Node bug:
    // https://github.com/joyent/node/issues/3584
    process.nextTick(function() {
        process.exit();
    });
}

//--- helpers ---//

function assertLoopBackVersion() {
    var Module = require('module');

    // Load the 'loopback' module in the context of the app.js file,
    // usually from node_modules/loopback of the project of app.js
    var loopback = Module._load('loopback', Module._cache[appFile]);

    if (semver.lt(loopback.version, '1.6.0')) {
        console.error(
            '\nThe code generator does not support applications based\n' +
            'on LoopBack versions older than 1.6.0. Please upgrade your\n' +
            'project to a recent version of LoopBack and run this tool again.\n');
        process.exit(1);
    }
}
