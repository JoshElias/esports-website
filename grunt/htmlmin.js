module.exports = {
    dist: {
        options: {
            removeComments: true,
            collapseWhitespace: true
        },
        files: [{
            expand: true,
            cwd: 'public/views',
            src: '{,*/}*.html',
            dest: 'dist/html'
        }]
    }
};