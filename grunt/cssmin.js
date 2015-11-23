module.exports = {
    options: {
        rebase: false,
    },
    minify: {
        files: {
            'client/dist/css/vendor.min.css': [
                'client/vendor/bootstrap/dist/bootstrap.min.css',
                'client/vendor/bootstrap/dist/bootstrap-theme.min.css',
                'client/css/vendor/megamenu/MegaNavbar.min.css',
                'client/css/vendor/megamenu/simple-line-icons.css',
                'client/vendor/font-awesome/css/font-awesome.min.css',
                'client/vendor/summernote/dist/summernote.css',
                'client/css/vendor/animations/animation.css',
                'client/css/vendor/animate.css',
            ],
            'client/dist/css/style.min.css': [
                'client/dist/css/style.css'
            ],
        }
    }
};