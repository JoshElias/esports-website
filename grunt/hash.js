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
        src: ['dist/js/angular.min.js', 'dist/js/app.min.js', 'dist/js/vendor.min.js'],
        dest: 'dist/js/'
    },
    css: {
        src: ['dist/css/style.min.css', 'dist/css/vendor.min.css'],
        dest: 'dist/css/'
    }
};