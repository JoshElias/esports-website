var config = require('./../lib/config');

module.exports = {
    staging: {
        options: {
            accessKeyId: config.AMAZON_KEY,
            secretAccessKey: config.AMAZON_SECRET,
            bucket: 'staging-cdn.tempostorm.com',
            region: 'us-west-2',
            access: 'public-read',
            uploadConcurrency: 5,
            differential: true
        },
        params: {
            CacheControl: '630720000'
        },
        files: [
            {
                expand: true,
                cwd: 'dist/js/',
                src: ['*.min.*.js'],
                dest: 'js'
            },
            {
                expand: true,
                cwd: 'dist/js/',
                src: ['**/*', '!**/*.js'],
                dest: 'js'
            },
            {
                expand: true,
                cwd: 'dist/css/',
                src: ['*.min.*.css'],
                dest: 'css'
            },
            {
                expand: true,
                cwd: 'dist/css/fonts/',
                src: ['**/*'],
                dest: 'css/fonts'
            },
            {
                expand: true,
                cwd: 'dist/views/',
                src: ['**/*'],
                dest: 'views'
            },
            {
                expand: true,
                cwd: 'dist/img/',
                src: ['**/*'],
                dest: 'img'
            }
        ]
    },
    production: {
        options: {
            accessKeyId: config.AMAZON_KEY,
            secretAccessKey: config.AMAZON_SECRET,
            bucket: 'cdn.tempostorm.com',
            region: 'us-west-2',
            access: 'public-read',
            uploadConcurrency: 5,
            differential: true
        },
        params: {
            differential: true,
            CacheControl: '630720000'
        },
        files: [
            {
                expand: true,
                cwd: 'dist/js/',
                src: ['*.min.*.js'],
                dest: 'js'
            },
            {
                expand: true,
                cwd: 'dist/js/',
                src: ['**/*', '!**/*.js'],
                dest: 'js'
            },
            {
                expand: true,
                cwd: 'dist/css/',
                src: ['*.min.*.css'],
                dest: 'css'
            },
            {
                expand: true,
                cwd: 'dist/css/fonts/',
                src: ['**/*'],
                dest: 'css/fonts'
            },
            {
                expand: true,
                cwd: 'dist/views/',
                src: ['**/*'],
                dest: 'views'
            },
            {
                expand: true,
                cwd: 'dist/img/',
                src: ['**/*'],
                dest: 'img'
            }
        ]
    }
};