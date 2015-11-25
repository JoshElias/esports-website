module.exports = {
    build: {
        options: {
            style: 'expanded',
            sourcemap: 'none',
        },
        files: {
            'client/dist/css/sass.css': 'client/css/sass/main.scss',
            'client/dist/css/modules.css': 'client/css/sass/modules.scss'
        }
    },
    modules: {
        options: {
            style: 'expanded',
            sourcemap: 'none',
        },
        files: {
            'client/dist/css/modules.css': 'client/css/sass/modules.scss'
        }
    }
};