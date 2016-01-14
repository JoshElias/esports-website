var dust = require('dustjs-linkedin');

module.exports = function(server) {	
	
	/* dust filters */
	dust.filters['uppercase'] = function (value) {
		return String(value).toUpperCase();
	};

	dust.filters['ucwords'] = function (value) {
	    return String(value).replace(/^([a-z\u00E0-\u00FC])|\s+([a-z\u00E0-\u00FC])/g, function($1) {
	        return $1.toUpperCase();
	    });
	};

	dust.filters['money'] = function (value) {
	    return Number(value).toFixed(2);
	};
}