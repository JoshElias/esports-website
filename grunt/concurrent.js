module.exports = {
    first: ['clean:js', 'clean:css', 'clean:sass'],
    second: ['compass:build', 'compass:modules', 'loopback_sdk_angular:build'],
    third: ['newer:concat', 'newer:htmlmin:dist', 'newer:htmlmin:modules'],
    fourth: ['newer:uglify', 'newer:cssmin', 'newer:imagemin'],
    fifth: ['hash', 'newer:copy:fonts', 'newer:copy:modules_audio'/*, 'newer:copy:jsAssets'*/]
};