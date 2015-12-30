module.exports = {
    dist: {
        options: {
            removeComments: true,
            collapseWhitespace: true
        },
        files: [
            {
                expand: true,
                cwd: 'client/views',
                src: '**/*.html',
                dest: 'client/dist/views'
            },
            {
                expand: true,
                cwd: 'modules',
                src: '**/client/views/**/*.html',
                dest: 'client/dist/views/',
            },
        ]
    },
    modules_: {
        options: {
            removeComments: true,
            collapseWhitespace: true
        },
        files: [
            {
                expand: true,
                cwd: 'modules',
                src: '**/client/views/**/*.html',
                dest: 'client/dist/views/',
            }
        ]
    }
};