module.exports = {
    options: {
        cache: false
    },

    dist: {
        files: [{
            expand: true,
            cwd: 'client/img/',
            src: ['**/*.{png,jpg,gif}'],
            dest: 'client/dist/img/'
        }]
    }
};