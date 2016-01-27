module.exports = {
    options: {
        report: 'min',
        compress: {},
        mangle: true,
    },
    build: {
        files: {
            'client/dist/js/vendor.min.js': ['client/dist/js/vendor.js'],
            'client/dist/js/angular.min.js': ['client/dist/js/angular.js'],
            'client/dist/js/app.min.js': ['client/dist/js/app.js'],
            'client/dist/js/modules.min.js': ['client/dist/js/modules.js'],
            'client/dist/js/lb-services.min.js': ['client/dist/js/services/lb-services.js'],
        }
    },
    modules_: {
        files: {
            'client/dist/js/modules.min.js': ['client/dist/js/modules.js'],
        }
    }
};