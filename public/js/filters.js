'use strict';

angular.module('app.filters', [])
.filter('startFrom', function () {
    return function (input, start) {
        start = +start;
        return input.slice(start);
    }
})
.filter('filterAll', ['$filter', function ($filter) {
    var filter = $filter('filter');
    return function (input, search) {
        
        Array.prototype.diff = function(arr2) {
            var ret = [];
            for(i in this) {
                if(arr2.indexOf( this[i] ) > -1){
                    ret.push( this[i] );
                }
            }
            return ret;
        };
        
        search = search || '';
        search = search.split('+');
        
        var results = [];
        for (var i = 0; i < search.length; i++) {
            if (i === 0) {
                results = results.concat(filter(input, search[i]));
            } else {
                results = results.diff(filter(input, search[i]));
            }
        }
        
        return results;
    };
}])
;