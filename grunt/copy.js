module.exports = {
    fonts: {
        expand: true,
        flatten: true,
        src: ['public/css/fonts/**/*'],
        dest: 'dist/css/fonts',
        filter: 'isFile'
    },
    jsAssets: {
        expand: true,
        flatten: true,
        src: ['public/js/**/*', '!public/js/**/*.{js,map}'],
        dest: 'dist/js',
        filter: 'isFile'
    }
};