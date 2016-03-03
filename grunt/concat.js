module.exports = {
    js: {
        options: {
            separator: '\n',
            stripBanners: true,
        },
        files: {
            'client/dist/js/vendor.js': [
                'client/js/showads.js',
                'client/vendor/jquery/dist/jquery.js',
                'client/vendor/jquery-ui/jquery-ui.js',
                'client/vendor/bootstrap/dist/js/bootstrap.js',
                'client/vendor/moment/min/moment.min.js',
                'client/vendor/summernote/dist/summernote.js',
                'client/vendor/bootbox/bootbox.js',
                'client/js/vendor/wtooltip.js',
                'client/js/vendor/iscroll.js',
                'client/vendor/underscore/underscore-min.js',
                'client/vendor/async/dist/async.min.js',
                'client/vendor/jrumble/jquery.jrumble.min.js',
                'client/vendor/jqueryui-touch-punch/jquery.ui.touch-punch.js'
            ],
            'client/dist/js/angular.js': [
                'client/vendor/angular/angular.js',
                'client/js/services/lb-services.js',
                'client/js/vendor/angular-md5.min.js',
                'client/vendor/angular-ui-router/release/angular-ui-router.min.js',
                'client/vendor/angular-cookies/angular-cookies.js',
                'client/vendor/angular-resource/angular-resource.js',
                'client/vendor/angular-ui-date/src/date.js',
                'client/vendor/angular-ui-utils/jq.js',
                'client/vendor/angular-ui-load/ui-load.js',
                'client/vendor/angular-ui-validate/dist/validate.js',
                'client/js/vendor/angular-bootbox.js',
                'client/vendor/angular-drag-and-drop-lists/angular-drag-and-drop-lists.js',
                'client/vendor/angular-gravatar/build/angular-gravatar.min.js',
                'client/js/vendor/angular-file-upload-shim.min.js',
                'client/js/vendor/angular-file-upload.min.js',
                'client/vendor/angular-moment/angular-moment.min.js',
                'client/vendor/angular-payments/lib/angular-payments.min.js',
                'client/vendor/angular-sanitize/angular-sanitize.min.js',
                'client/vendor/angular-summernote/dist/angular-summernote.min.js',
                'client/vendor/ngstorage/ngStorage.min.js',
                'client/vendor/angular-youtube-mb/dist/angular-youtube-embed.min.js',
                'client/vendor/angular-animate/angular-animate.min.js',
                'client/vendor/angular-iscroll/dist/lib/angular-iscroll.js'
            ],
            'client/dist/js/app.js': [
                'client/js/app.js',
                'client/js/controllers.js',
                'client/js/services.js',
                'client/js/directives.js',
                'client/js/filters.js',
                'client/js/animations.js',
            ],
            'client/dist/js/modules.js': [
                'modules/**/client/js/**/*.js',
            ]
        }
    },
    css: {
        options: {
            separator: '',
            stripBanners: true,
        },
        files: {
            'client/dist/css/vendor.css': [
                'client/vendor/bootstrap/dist/css/bootstrap.min.css',
                'client/vendor/bootstrap/dist/css/bootstrap-theme.min.css',
                'client/css/vendor/jquery/jquery-ui.min.css',
                'client/css/vendor/megamenu/MegaNavbar.min.css',
                'client/css/vendor/megamenu/simple-line-icons.css',
                'client/vendor/font-awesome/css/font-awesome.min.css',
                'client/vendor/summernote/dist/summernote.css',
                //'client/css/vendor/animations/animation.css',
                //'client/css/vendor/animate.css',
            ],
            'client/dist/css/sass.css': [
                'client/dist/css/sass/*.css'
            ],
            'client/dist/css/modules.css': [
                'client/dist/css/sass/modules/*.css'
            ],
            'client/dist/css/style.css': [
                'client/css/style.css',
                'client/dist/css/sass/*.css',
            ],
        }
    },
    modules_: {
        options: {
            separator: '',
            stripBanners: true,
        },
        files: {
            'client/dist/js/modules.js': [
                'modules/**/client/js/**/*.js',
            ],
            'client/dist/css/modules.css': [
                'client/dist/css/sass/modules/*.css'
            ],
        }
    }
};
