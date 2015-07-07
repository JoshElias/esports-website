module.exports = {
    options: {
        rebase: false,
    },
    minify: {
        files: {
            'dist/css/vendor.min.css': ['public/css/vendor/bootstrap/bootstrap.min.css', 'public/css/vendor/**/*.css'],
            'dist/css/style.min.css': 'public/css/style.css',
        }
    }
};