module.exports = {
    options: {
        report: 'min',
        compress: true,
        mangle: true,
    },
    build: {
        files: {
            'client/dist/js/vendor.min.js': ['client/dist/js/vendor.js'],
            'client/dist/js/angular.min.js': ['client/dist/js/angular.js'],
            'client/dist/js/app.min.js': ['client/dist/js/app.js'],
        }
    }
};