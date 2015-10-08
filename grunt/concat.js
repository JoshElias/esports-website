module.exports = {
    options: {
        separator: ';',
        stripBanners: true,
    },
    build: {
        files: {
            'client/dist/js/vendor.js': [
                'client/vendor/jquery/dist/jquery.js',
                'client/vendor/jquery-ui/jquery-ui.js',
                'client/vendor/bootstrap/dist/js/bootstrap.js',
                'client/vendor/moment/min/moment.js',
                'client/vendor/summernote/dist/summernote.js',
                'client/vendor/bootbox/bootbox.js',
                'client/js/vendor/angular-file-upload-shim.min.js',
                'client/js/vendor/wtooltip.js',
            ],
            'client/dist/js/angular.js': [
                'client/vendor/angular/angular.js',
                'client/js/services/lb-services.js',
                'client/vendor/angular-ui-router/angular-ui-router.js',
                'client/vendor/angular-cookies/angular-cookies.js',
                'client/vendor/angular-resource/angular-resource.js',
                'client/vendor/angular-ui-date/src/date.js',
                'client/vendor/angular-ui-utils/jq.js',
                'client/vendor/angular-ui-load/ui-load.js',
                'client/vendor/angular-ui-validate/dist/validate.js',
                'client/js/vendor/angular-bootbox.js',
                'client/vendor/angular-drag-and-drop-lists/angular-drag-and-drop-lists.js',
                'client/vendor/angular-file-upload/dist/angular-file-upload.js',
                'client/vendor/angular-gravatar/build/angular-gravatar.js',
                'client/vendor/angular-moment/angular-moment.js',
                'client/vendor/angular-payments/lib/angular-payments.js',
                'client/vendor/angular-sanitize/angular-sanitize.js',
                'client/vendor/angular-summernote/dist/angular-summernote.js',
                'client/js/vendor/angular-md5.min.js',
                'client/vendor/ngStorage/ngStorage.js',
                'client/vendor/angular-youtube-mb/dist/angular-youtube-embed.js',
            ],
            'client/dist/js/app.js': [
                'client/js/app.js',
                'client/js/controllers.js',
                'client/js/services.js',
                'client/js/directives.js',
                'client/js/filters.js',
                'client/js/animations.js',                
            ],
            'client/dist/css/sass.css': [
                'client/dist/css/sass/*.css'
            ],
            'client/dist/css/style.css': [
                'client/css/style.css',
                'client/dist/css/sass.css',
            ]
        }
    }
};