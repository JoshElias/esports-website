module.exports = {
    fonts: {
        expand: true,
        flatten: true,
        src: ['client/css/fonts/**/*', 'client/vendor/font-awesome/fonts/**/*'],
        dest: 'client/dist/css/fonts',
        filter: 'isFile'
    },
    modules_audio: {
        expand: true,
        flatten: true,
        src: ['modules/**/client/audio/**/*'],
        dest: 'client/dist/css/audio',
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