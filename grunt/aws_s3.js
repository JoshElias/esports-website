module.exports = {
    staging: {
        options: {
            accessKeyId: "AKIAIRC7VKIUNLLUQJPA",
            secretAccessKey: "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",
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
                cwd: 'client/dist/js/services/',
                src: ['**/*'],
                dest: 'js/services'
            },
            {
                expand: true,
                cwd: 'client/dist/css/',
                src: ['*.min.*.css'],
                dest: 'css'
            },
            {
                expand: true,
                cwd: 'client/dist/fonts/',
                src: ['**/*'],
                dest: 'fonts'
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
            },
            {
                expand: true,
                cwd: 'client/dist/audio/',
                src: ['**/*.mp3', '**/*.ogg'],
                dest: 'audio'
            },
        ]
    },
    production: {
        options: {
            accessKeyId: "AKIAIRC7VKIUNLLUQJPA",
            secretAccessKey: "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",
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
                src: ['**/*', '!**/*.js', 'showads.js'],
                dest: 'js'
            },
            {
                expand: true,
                cwd: 'client/dist/js/services/',
                src: ['**/*'],
                dest: 'js/services'
            },
            {
                expand: true,
                cwd: 'client/dist/css/',
                src: ['*.min.*.css'],
                dest: 'css'
            },
            {
                expand: true,
                cwd: 'client/dist/fonts/',
                src: ['**/*'],
                dest: 'fonts'
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
            },
            {
                expand: true,
                cwd: 'client/dist/audio/',
                src: ['**/*.mp3', '**/*.ogg'],
                dest: 'audio'
            },
        ]
    }
};