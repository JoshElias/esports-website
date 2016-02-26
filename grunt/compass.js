module.exports = {
    build: {
        options: {
            outputStyle: 'expanded',
            sassDir:     'client/css/sass',
            cssDir:      'client/dist/css/sass',
            cacheDir:    'client/css/.sass-cache',
        }
    },
    modules_: {
        options: {
            outputStyle: 'expanded',
            sassDir:     'modules/redbull/client/css',
            cssDir:      'client/dist/css/sass/modules',
            cacheDir:    'modules/.sass-cache',
        }
    },
    adsense: {
        options: {
            outputStyle: 'expanded',
            sassDir:     'modules/adsense/client/css',
            cssDir:      'client/dist/css/sass/modules',
            cacheDir:    'modules/.sass-cache',
        }
    }
};