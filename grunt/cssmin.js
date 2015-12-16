module.exports = {
    options: {
        rebase: false,
        processImport: false
    },
    minify: {
        files: {
            'client/dist/css/vendor.min.css': [
                'client/dist/css/vendor.css'
            ],
            'client/dist/css/style.min.css': [
                'client/dist/css/style.css'
            ],
            'client/dist/css/modules.min.css': [
                'client/dist/css/modules.css'
            ],
        }
    }
};