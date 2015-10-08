module.exports = {
    first: ['clean:js', 'clean:css'],
    second: ['compass:build', 'loopback_sdk_angular:build'],
    third: ['newer:concat', 'newer:htmlmin:dist'],
    fourth: ['newer:uglify', 'newer:cssmin', 'newer:imagemin'],
    fifth: ['hash', 'newer:copy:fonts'/*, 'newer:copy:jsAssets'*/]
};