angular.module('redbull.services')
.factory('DraftCards', ['$localStorage', function ($localStorage) {
    var draftCards = $localStorage.draftCards || [];
    
    return {
        setCards: function (cards) {
            $localStorage.draftCards = draftCards = cards;
        },
        getCards: function () {
            return draftCards;
        }
    };
}]);
