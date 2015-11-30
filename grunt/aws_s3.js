var configStaging = require('./../server/configs/datasources.staging').s3;
var configProduction = require('./../server/configs/datasources.production').s3;

module.exports = {
    staging: {
        options: {
            accessKeyId: configStaging.keyId,
            secretAccessKey: configStaging.key,
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
                cwd: 'client/dist/js/',
                src: ['*.min.*.js'],
                dest: 'js'
            },
            {
                expand: true,
                cwd: 'client/dist/js/',
                src: ['**/*', '!**/*.js'],
                dest: 'js'
            },
            {
                expand: true,
                cwd: 'client/dist/css/',
                src: ['*.min.*.css'],
                dest: 'css'
            },
            {
                expand: true,
                cwd: 'client/dist/css/fonts/',
                src: ['**/*'],
                dest: 'css/fonts'
            },
            {
                expand: true,
                cwd: 'client/dist/views/',
                src: ['**/*'],
                dest: 'views'
            },
            {
                expand: true,
                cwd: 'client/dist/img/',
                src: ['**/*'],
                dest: 'img'
            }
        ]
    },
    production: {
        options: {
            accessKeyId: configProduction.AMAZON_KEY,
            secretAccessKey: configProduction.AMAZON_SECRET,
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
                cwd: 'client/dist/js/',
                src: ['*.min.*.js'],
                dest: 'js'
            },
            {
                expand: true,
                cwd: 'client/dist/js/',
                src: ['**/*', '!**/*.js'],
                dest: 'js'
            },
            {
                expand: true,
                cwd: 'client/dist/css/',
                src: ['*.min.*.css'],
                dest: 'css'
            },
            {
                expand: true,
                cwd: 'client/dist/css/fonts/',
                src: ['**/*'],
                dest: 'css/fonts'
            },
            {
                expand: true,
                cwd: 'client/dist/views/',
                src: ['**/*'],
                dest: 'views'
            },
            {
                expand: true,
                cwd: 'client/dist/img/',
                src: ['**/*'],
                dest: 'img'
            }
        ]
    }
};