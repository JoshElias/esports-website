
function start(app, module) {
    return function(finalCb) {

        if (require.main !== module) {
            return finalCb();
        }

        return app.listen(app.get("port"), function() {
            app.emit('started');
            console.log('Web server listening at: %s', app.get('url'));
            return finalCb();
        });
    }
}

module.exports = start;