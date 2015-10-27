
var async = require("async");
var util = require("util");


module.exports = function(server) {
/*
  var Deck = server.models.deck;
  var Mulligan = server.models.mulligan;
  var CardWithCoin = server.models.cardWithCoin;
  var CardWithoutCoin = server.models.cardWithoutCoin;


  async.waterfall([
      // Get all the decks
      function(seriesCallback) {
        console.log("Finding decks");
        Deck.find({}, seriesCallback);
      },
      // Create mulligans for each deck
      function(decks, seriesCallback) {
        console.log("creating deck mulligans");
        var mullCount = 0;
        async.eachSeries(decks, function(deck, callback) {
          async.eachSeries(deck.oldMulligans, async.ensureAsync(function(mulligan, innerCallback) {
            Mulligan.create({
              className: mulligan.klass,
              instructionsWithCoin: mulligan.withCoin.instructions,
              instuctionsWithoutCoin: mulligan.withoutCoin.instructions,
            }, function(err, newMulligan) {
              if(err) innerCallback(err);
              else {
                console.log("created new mulligan:", mullCount++);
                mulligan.newMulligan = newMulligan;
                innerCallback();
              }
            });
          }), callback);
        }, function(err) {
          seriesCallback(err, decks);
        });
      },
      // Create CardWithCoin
      function(decks, seriesCallback) {
        console.log("creating cardWithCoin mulligans");
        var count = 0;
        async.eachSeries(decks, function(deck, callback) {
          async.eachSeries(deck.oldMulligans, function(mulligan, innerCallback) {
            async.eachSeries(mulligan.withCoin.cards, async.ensureAsync(function(cardId, superInnerCallback) {
              CardWithCoin.create({
                cardId: cardId.toString(),
                mulliganId: mulligan.newMulligan.id.toString()
              }, function(err) {
                if(err) superInnerCallback(err)
                else {
                  console.log("created cardwithcoin:", count++);
                  superInnerCallback();
                }
              });
            }), innerCallback)
          }, callback);
        }, function(err) {
          seriesCallback(err, decks)
        });
      },
      // Create CardWithoutCoin
      function(decks, seriesCallback) {
        console.log("creating cardWithoutCoin mulligans");
        var count = 0;
        async.eachSeries(decks, function(deck, callback) {
          async.eachSeries(deck.oldMulligans, function(mulligan, innerCallback) {
            async.eachSeries(mulligan.withoutCoin.cards, async.ensureAsync(function(cardId, superInnerCallback) {
              CardWithoutCoin.create({
                cardId: cardId.toString(),
                mulliganId: mulligan.newMulligan.id.toString()
              }, function(err) {
                if(err) superInnerCallback(err)
                else {
                  console.log("created cardwithoutcoin:", count++);
                  superInnerCallback();
                }
              });
            }), innerCallback)
          }, callback);
        }, seriesCallback);
      }
    ],
    function(err) {
      if(err) console.log("ERR creating mulligan models:", err);
      else console.log("Donerino");
    });
*/
};
