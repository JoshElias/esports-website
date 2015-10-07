module.exports = {
    options: {
        separator: ';',
        stripBanners: true,
    },
    build: {
        files: {
            'client/dist/js/vendor.js': [
                'client/vendor/jquery/dist/jquery.min.js',
                'client/vendor/jquery-ui/jquery-ui.min.js',
                'client/vendor/bootstrap/dist/js/bootstrap.min.js',
                'client/vendor/moment/min/moment.min.js',
                'client/vendor/summernote/dist/summernote.min.js',
                'client/vendor/bootbox/bootbox.js',
                'client/js/vendor/angular-file-upload-shim.min.js'
                'client/js/vendor/wtooltip.js',
            ],
            'client/dist/js/angular.js': [
                'client/vendor/angular/angular.min.js',
                'client/vendor/angular-ui-router/angular-ui-router.min.js',
                'client/vendor/angular-cookies/angular-cookies.min.js',
                'client/vendor/angular-ui-date/src/date.js',
                'client/vendor/angular-ui-utils/jq.min.js',
                'client/vendor/angular-ui-load/ui-load.js',
                'client/vendor/angular-ui-validate/dist/validate.min.js',
                'client/js/vendor/angular-bootbox.js',
                'client/vendor/angular-drag-and-drop-lists/angular-drag-and-drop-lists.min.js',
                'client/vendor/angular-file-upload/dist/angular-file-upload.min.js',
                'client/vendor/angular-gravatar/build/angular-gravatar.min.js',
                'client/vendor/angular-moment/angular-moment.min.js',
                'client/vendor/angular-payments/lib/angular-payments.min.js',
                'client/vendor/angular-sanitize/angular-sanitize.min.js',
                'client/vendor/angular-summernote/dist/angular-summernote.min.js',
                'client/js/vendor/angular-md5.min.js',
                'client/vendor/ngStorage/ngStorage.min.js',
                'client/vendor/angular-youtube-mb/dist/angular-youtube-embed.min.js',
            ],
            'client/dist/js/app.js': [
                'client/js/app.js',
                'client/js/controllers.js',
                'client/js/services.js',
                'client/js/directives.js',
                'client/js/filters.js',
                'client/js/animations.js',                
            ],
        }
    }
};