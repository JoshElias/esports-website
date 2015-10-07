module.exports = {
    options: {
        mapping: 'assets.json',
        flatten: true,
        hashLength: 8,
        hashFunction: function(source, encoding){
            return require('crypto').createHash('sha1').update(source, encoding).digest('hex');
        }
    },
    js: {
        src: ['client/dist/js/angular.min.js', 'client/dist/js/app.min.js', 'client/dist/js/vendor.min.js'],
        dest: 'client/dist/js/'
    },
    css: {
        src: ['client/dist/css/style.min.css', 'client/dist/css/vendor.min.css'],
        dest: 'client/dist/css/'
    }
};