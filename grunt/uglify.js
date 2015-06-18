module.exports = {
    options: {
        report: 'min',
        compress: true,
        mangle: true,
    },
    build: {
        files: {
            'dist/js/vendor.min.js': ['dist/js/vendor.js'],
            'dist/js/angular.min.js': ['dist/js/angular.js'],
            'dist/js/app.min.js': ['dist/js/app.js'],
        }
    }
};