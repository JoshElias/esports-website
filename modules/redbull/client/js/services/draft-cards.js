angular.module('redbull.services')
.factory('DraftCards', ['$localStorage', function ($localStorage) {
    var draftCards = [];
    
    function cardIndex (card) {
        for (var i = 0; i < draftCards.length; i++) {
            if (draftCards[i].card.id === card.id) {
                return i;
            }
        }
        return -1;
    }
    
    return {
        setCards: function (cards) {
            if (!cards.length) { return false; }
            for (var i = 0; i < cards.length; i++) {
                var index = cardIndex(cards[i]);
                if (index !== -1) {
                    draftCards[index].qty++;
                } else {
                    draftCards.push({
                        qty: 1,
                        card: cards[i]
                    });
                }
            }
        },
        getCards: function () {
            return draftCards;
        }
    };
}]);
