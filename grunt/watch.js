module.exports = {
    options: {
        spawn: false,
        atBegin: true,
    },
    js: {
        files: ['client/js/**/*.js'],
        tasks: ['clean:js', 'newer:concat', 'newer:uglify', 'hash']
    },
    css: {
        files: ['client/css/**/*.css'],
        tasks: ['clean:css', 'newer:cssmin', 'hash']
    },
    sass: {
        files: ['client/css/sass/*.scss'],
        tasks: ['clean:sass', 'compass:build', 'newer:concat', 'newer:cssmin', 'hash:css']
    },
    img: {
        files: ['client/img/**/*.{png,jpg,gif}'],
        tasks: ['newer:imagemin']
    },
    html: {
        files: ['client/views/**/*.html'],
        tasks: ['newer:htmlmin:dist']
    }
};