module.exports = {
    fonts: {
        expand: true,
        flatten: true,
        src: ['client/css/fonts/**/*', 'client/vendor/font-awesome/fonts/**/*'],
        dest: 'client/dist/fonts',
        filter: 'isFile'
    },
    modules_audio: {
        expand: true,
        flatten: true,
        src: ['modules/**/client/audio/**/*'],
        dest: 'client/dist/audio',
        filter: 'isFile'
    }
};