module.exports = function(grunt) {

    grunt.initConfig({
        distFolder: 'public/dist',
        pkg: grunt.file.readJSON('package.json'),
        concat: {
            options: {
                separator: ';',
                stripBanners: true,
            },
            build: {
                files: {
                    '<%= distFolder %>/vendor.js': ['public/js/vendor/jquery/jquery-2.1.1.min.js', 'public/js/vendor/jquery/jquery-ui.min', 'public/js/vendor/**/*.js'],
                    '<%= distFolder %>/angular.js': ['public/js/angular/angular.js', 'public/js/angular/*.js'],
                    '<%= distFolder %>/app.js': ['public/js/*.js'],
                }
            }
        },
        uglify: {
            options: {
                report: 'min',
                compress: true,
                mangle: true,
            },
            build: {
                files: {
                    '<%= distFolder %>/vendor.min.js': ['<%= distFolder %>/vendor.js'],
                    '<%= distFolder %>/angular.min.js': ['<%= distFolder %>/angular.js'],
                    '<%= distFolder %>/app.min.js': ['<%= distFolder %>/app.js'],
                }
            }
        },
        cssmin: {
            options: {
                rebase: false,
            },
            minify: {
                files: {
                    '<%= distFolder %>/vendor.min.css': ['public/css/vendor/bootstrap/bootstrap.min.css', 'public/css/vendor/**/*.css'],
                    '<%= distFolder %>/style.min.css': 'public/css/style.css',
                }
            }
        },
        watch: {
            scripts: {
                files: ['public/js/**/*.js', 'public/css/**/*.css'],
                tasks: ['concat', 'uglify', 'cssmin'],
                options: {
                    spawn: false,
                    atBegin: true,
                }
            }
        }
    });

    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-cssmin');
    grunt.loadNpmTasks('grunt-contrib-watch');
    
    grunt.registerTask('build', ['concat', 'uglify', 'cssmin']);
    grunt.registerTask('watchFiles', ['watch']);
};