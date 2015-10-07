module.exports = {
    dist: {
        options: {
            removeComments: true,
            collapseWhitespace: true
        },
        files: [{
            expand: true,
            cwd: 'client/views',
            src: '**/*.html',
            dest: 'client/dist/views'
        }]
    }
};