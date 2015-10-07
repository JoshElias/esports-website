module.exports = {
    fonts: {
        expand: true,
        flatten: true,
        src: ['client/css/fonts/**/*'],
        dest: 'client/dist/css/fonts',
        filter: 'isFile'
    },
    //jsAssets: {
    //    expand: true,
    //    flatten: true,
    //    src: ['client/js/**/*', '!client/js/**/*.{js,map}'],
    //    dest: 'client/dist/js',
    //    filter: 'isFile'
    //}
};