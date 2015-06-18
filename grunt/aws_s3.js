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
                dest: 'dist/js/'
            },
            {
                expand: true,
                cwd: 'dist/css/',
                src: ['*.min.*.css'],
                dest: 'dist/css'
            },
            {
                expand: true,
                cwd: 'dist/html/',
                src: ['**/*'],
                dest: 'dist/html'
            },
            {
                expand: true,
                cwd: 'dist/img/',
                src: ['**/*'],
                dest: 'dist/img'
            }
        ]
    },
    production: {
        options: {
            accessKeyId: config.AMAZON_KEY,
            secretAccessKey: config.AMAZON_SECRET,
            bucket: 'cdn.tempostorm.com',
            region: 'us-west-1',
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
                dest: 'dist/js/'
            },
            {
                expand: true,
                cwd: 'dist/css/',
                src: ['*.min.*.css'],
                dest: 'dist/css'
            },
            {
                expand: true,
                cwd: 'dist/html/',
                src: ['**/*'],
                dest: 'dist/html'
            },
            {
                expand: true,
                cwd: 'dist/img/',
                src: ['**/*'],
                dest: 'dist/img'
            }
        ]
    }
};