module.exports = {
    build: {
        options: {
            style: 'expanded',
            sourcemap: 'none',
        },
        files: {
            'client/dist/css/sass.css': 'client/css/sass/main.scss'
        }
    }
};