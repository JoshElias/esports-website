module.exports = {
    options: {
        separator: ';',
        stripBanners: true,
    },
    build: {
        files: {
            'dist/js/vendor.js': ['public/js/vendor/jquery/jquery-2.1.1.min.js', 'public/js/vendor/jquery/jquery-ui.min', 'public/js/vendor/**/*.js'],
            'dist/js/angular.js': ['public/js/angular/angular.js', 'public/js/angular/*.js'],
            'dist/js/app.js': ['public/js/*.js'],
        }
    }
};