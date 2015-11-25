module.exports = {
    options: {
        cache: false
    },

    dist: {
        files: [
            {
                expand: true,
                cwd: 'client/img/',
                src: ['**/*.{png,jpg,gif}'],
                dest: 'client/dist/img/'
            },
            {
                expand: true,
                cwd: 'modules/**/client/img/',
                src: ['**/*.{png,jpg,gif}'],
                dest: 'client/dist/img/'
            }
        ]
    },
    modules: {
        files: [
            {
                expand: true,
                cwd: 'modules/',
                src: ['**/client/img/**/*.{png,jpg,gif}'],
                dest: 'client/dist/img/modules/'
            }
        ]
    }
};