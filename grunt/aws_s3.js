module.exports = {
    staging: {
        options: {
            accessKeyId: 'AKIAI5GMLIWXZP6TQXYQ',
            secretAccessKey: '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',
            bucket: 'tempo-staging',
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
            accessKeyId: 'AKIAI5GMLIWXZP6TQXYQ',
            secretAccessKey: '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',
            bucket: 'tempo-pro',
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