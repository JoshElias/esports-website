module.exports = {
    build: {
        options: {
            outputStyle: 'expanded',
            sassDir:     'client/css/sass',
            cssDir:      'client/dist/css/sass',
            cacheDir:    'client/css/.sass-cache',
        }
    },
    modules_redbull: {
        options: {
            outputStyle: 'expanded',
            sassDir:     'modules/redbull/client/css',
            cssDir:      'client/dist/css/sass/modules',
            cacheDir:    'modules/.sass-cache'
        }
    },
    modules_ads: {
        options: {
            outputStyle: 'expanded',
            sassDir:     'modules/asense/client/css',
            cssDir:      'client/dist/css/sass/modules',
            cacheDir:    'modules/.sass-cache'
        }
    },
    modules_hots: {
        options: {
            outputStyle: 'expanded',
            sassDir:     'modules/hots/client/css',
            cssDir:      'client/dist/css/sass/modules',
            cacheDir:    'modules/.sass-cache'
        }
    },
    modules_polls: {
        options: {
            outputStyle: 'expanded',
            sassDir:     'modules/polls/client/css',
            cssDir:      'client/dist/css/sass/modules',
            cacheDir:    'modules/.sass-cache'
        }
    }
};