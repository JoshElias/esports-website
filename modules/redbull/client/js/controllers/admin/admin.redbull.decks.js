angular.module('redbull.controllers')
.controller('AdminRedbullDecksCtrl', ['$scope', 'Hearthstone', 'officialDrafts', 'officialPlayers', 'draftPlayers',
    'RedbullDraft', 'RedbullDeck',
  function ($scope, Hearthstone, officialDrafts, officialPlayers, draftPlayers,
            RedbullDraft, RedbullDeck){

    // FOR CLARIFICATION:
    // officialPlayers are players that have completed an official draft, and are found by that draft's authorId
    // draftPlayers are ALL whitelisted players.

    $scope.officialDrafts = officialDrafts;
    $scope.officialPlayers = officialPlayers;
    $scope.draftPlayers = draftPlayers.players;

    console.log("officialPlayers:", $scope.officialPlayers);

    var officialPlayerIds = [];
    var draftPlayerIds = [];

    _.forEach($scope.officialPlayers, function(player){
      officialPlayerIds.push(player.id);
      _.forEach(officialDrafts, function(draft){
        if(player.id === draft.authorId){
          var extendDraft = {
            draft:_.clone(JSON.parse(JSON.stringify(draft)))
          };
          _.extend(player, extendDraft);

          console.log(extendDraft.draft);
          console.log("extended player:", player);
        }
      })
    });
    _.forEach(draftPlayers.players, function(player){
      draftPlayerIds.push(player.id);
    });

    var pendingPlayerIds =  _.difference(draftPlayerIds, officialPlayerIds);

    $scope.pendingPlayers = _.filter($scope.draftPlayers, function(player){
      return !(officialPlayerIds.includes(player.id))
    });

    console.log("PENDING PLAYERS", $scope.pendingPlayers);

    console.log("officialDrafts", $scope.officialDrafts);




}]);
