module.exports = {
    /* build */
    first: ['clean:js', 'clean:css', 'clean:sass'],
    second: ['compass:build', 'compass:modules_redbull', 'compass:modules_ads', 'compass:modules_hots', 'compass:modules_polls'/*, 'loopback_sdk_angular:build'*/],
    third: ['execute:lb_services', 'newer:concat', 'newer:htmlmin:dist', 'newer:htmlmin:modules_'],
    fourth: ['newer:uglify', 'newer:cssmin'/*, 'newer:imagemin'*/],
    fifth: ['hash', 'newer:copy:fonts', 'newer:copy:modules_audio'],
    /* modules */
    modules1: ['compass:modules_', 'newer:htmlmin:modules_'],
    modules2: ['newer:concat', 'newer:imagemin:modules_'],
    modules3: ['newer:uglify:modules_', 'newer:cssmin:modules_'],
    modules4: ['hash:modules_', 'newer:copy:modules_audio'],
    /* images */
    images1: ['newer:imagemin']
};