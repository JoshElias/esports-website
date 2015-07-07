module.exports = {
    options: {
        spawn: false,
        atBegin: true,
    },
    js: {
        files: ['public/js/**/*.js'],
        tasks: ['clean:js', 'newer:concat', 'newer:uglify', 'hash']
    },
    css: {
        files: ['public/css/**/*.css'],
        tasks: ['clean:css', 'newer:cssmin', 'hash']
    },
    img: {
        files: ['public/img/**/*.{png,jpg,gif}'],
        tasks: ['newer:imagemin']
    },
    html: {
        files: ['public/views/**/*.html'],
        tasks: ['newer:htmlmin:dist']
    }
};