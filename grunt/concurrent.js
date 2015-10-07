module.exports = {
    first: ['clean:js', 'clean:css'],
    second: ['sass:build'],
    third: ['newer:concat', 'newer:htmlmin:dist'],
    fourth: ['newer:uglify', 'newer:cssmin', 'newer:imagemin'],
    fifth: ['hash', 'newer:copy:fonts'/*, 'newer:copy:jsAssets'*/]
};