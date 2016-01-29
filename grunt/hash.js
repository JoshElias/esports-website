module.exports = {
    options: {
        mapping: 'server/configs/assets.json',
        flatten: true,
        hashLength: 8,
        hashFunction: function(source, encoding){
            return require('crypto').createHash('sha1').update(source, encoding).digest('hex');
        }
    },
    js: {
        src: ['client/dist/js/angular.min.js', 'client/dist/js/app.min.js', 'client/dist/js/vendor.min.js', 'client/dist/js/modules.min.js', 'client/dist/js/lb-services.min.js'],
        dest: 'client/dist/js/'
    },
    css: {
        src: ['client/dist/css/style.min.css', 'client/dist/css/vendor.min.css', 'client/dist/css/modules.min.css'],
        dest: 'client/dist/css/'
    },
    modules_: {
        js: {
            src: ['client/dist/js/modules.min.js'],
            dest: 'client/dist/js/'
        },
        css: {
            src: ['client/dist/css/modules.min.css'],
            dest: 'client/dist/css/'
        },
    }
};