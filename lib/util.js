function Util () {
}


Util.prototype.ucfirst = function (string) {
    return string.toLowerCase().charAt(0).toUpperCase() + string.slice(1);
};

Util.prototype.slugify = function (string) {
    return (string) ? string.toLowerCase().replace(/-+/g, '').replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') : '';
};

module.exports = new Util();