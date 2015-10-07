module.exports = {
    first: ['clean:js', 'clean:css'],
    second: ['newer:concat', 'newer:htmlmin:dist'],
    third: ['newer:uglify', 'newer:cssmin', 'newer:imagemin'],
    fourth: ['hash', 'newer:copy:fonts'/*, 'newer:copy:jsAssets'*/]
};