module.exports = function mountLoopBackExplorer(server) {
    if (process.env.NODE_ENV === "production") {
        return;
    }


    var explorer;
    try {
        explorer = require('loopback-component-explorer');
    } catch (err) {
        console.log(
            'Run `npm install loopback-component-explorer` to enable the LoopBack explorer'
        );
        return;
    }

    var restApiRoot = server.get('restApiRoot');


    var explorerApp = explorer.routes(server, {basePath: restApiRoot});
    server.use('/explorer', explorerApp);
    server.once('started', function () {
        var baseUrl = server.get('url').replace(/\/$/, '');
        //var explorerPath = server.get('loopback-component-explorer').mountPath;
        // express 4.x (loopback 2.x) uses `mountpath`
        // express 3.x (loopback 1.x) uses `route`
        //var explorerPath = explorerApp.mountpath || explorerApp.route;
        console.log('Browse your REST API at %s%s', baseUrl, "/explorer");
    });
};
