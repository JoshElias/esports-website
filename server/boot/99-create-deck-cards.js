
var async = require("async");
var util = require("util");


module.exports = function(server) {
/*
     var Deck = server.models.deck;
     var Card = server.models.card;
     var DeckCard = server.models.deckCard;


    async.waterfall([
            // Get all the users
            function(seriesCallback) {
                console.log("Finding decks");
                Deck.find({}, seriesCallback);
            },
            // Create user identity for each user
            function(decks, seriesCallback) {
                console.log("creating card decks");
                async.eachSeries(decks, function(deck, callback) {
                    async.eachSeries(deck.oldCards, function(card, innerCallback) {
                        DeckCard.create({
                            cardId: card.card.toString(),
                            deckId: deck.id.toString(),
                            cardQuantity: card.qty
                        }, function(err, newDeckCard) {
                            if(err) console.log(err);git st
                            else console.log("successfully added DeckCard:", newDeckCard.id);
                            innerCallback(err);
                        });
                    }, callback);
                }, seriesCallback);
            }],
        function(err) {
            if(err) console.log("ERR creating card decks:", err);
            else console.log("Donerino");
        });
        */
};
