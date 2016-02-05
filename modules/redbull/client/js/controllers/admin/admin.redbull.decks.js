angular.module('redbull.controllers')
.controller('AdminRedbullDecksCtrl', ['$scope', 'Hearthstone', 'officialDrafts', 'officialPlayers', 'draftPlayers',
    'RedbullDraft', 'RedbullDeck', 'User', 'DeckBuilder', 'LoopBackAuth', 'AlertService', '$window',
  function ($scope, Hearthstone, officialDrafts, officialPlayers, draftPlayers,
            RedbullDraft, RedbullDeck, User, DeckBuilder, LoopBackAuth, AlertService, $window){


    User.isInRoles({uid: LoopBackAuth.currentUserId, roleNames: ['$admin']}).$promise
      .then(function(res){
        $scope.userIsAdmin = (res.isInRoles.$admin);
      });


    // FOR CLARIFICATION:
    // officialPlayers are players that have completed an official draft, and are found by that draft's authorId
    // draftPlayers are ALL whitelisted players.

    $scope.officialDrafts = officialDrafts;
    $scope.officialPlayers = officialPlayers;
    $scope.draftPlayers = draftPlayers.players;

    //console.log("officialPlayers:", $scope.officialPlayers);

    var officialPlayerIds = [];
    var draftPlayerIds = [];

    _.forEach($scope.officialPlayers, function(player){
      officialPlayerIds.push(player.id);
      var extendDraft = {
        drafts: []
      };
      _.forEach(officialDrafts, function(draft){
        if(player.id === draft.authorId && draft.hasDecksConstructed === true){

          extendDraft.drafts.push(_.clone(JSON.parse(JSON.stringify(draft))));

          //console.log(extendDraft.drafts);
        }
      });

      // Now extend the player with all the drafts found.
      _.extend(player, extendDraft);

      //console.log("extended player:", player);

    });
    _.forEach(draftPlayers.players, function(player){
      draftPlayerIds.push(player.id);
    });


   // console.log("officialDrafts", $scope.officialDrafts);

    $scope.activeDrafts = function(player){
      var match = false;
      _.forEach(player.drafts, function(draft){
        if (draft.isActive === true){
          match = true;
            return true
        }
      });
        return !(match === false)
    };

    $scope.noActiveDrafts = function(player){
      var match = false;
      _.forEach(player.drafts, function(draft){
        if (draft.isActive === false){
          match = true;
          return true
        }
      });
      return !(match === false)
    };

    $scope.promptInactive = function (draft, username) {

      var box = bootbox.dialog({
        title: 'Set Draft as INACTIVE',
        message: 'Are you sure you want to deactive this draft for the player: <strong>' +
        username + '</strong>? <br/><br /> This cannot be undone.',
        buttons: {
          delete: {
            label: 'Set Inactive',
            className: 'btn-danger',
            callback: function () {
              console.log("set Inactive: ", draft);
              draft.isActive = false;
              RedbullDraft.upsert(draft).$promise.then(function(res){
                //console.log("result", res);
                $window.scrollTo(0, 0);
                AlertService.setSuccess({
                  show:true,
                  msg: 'Draft has been set as Inactive'
                });

              }).catch(function(err){
                console.log(err);
                $window.scrollTo(0, 0);
                AlertService.setError({
                  show:true,
                  msg: 'Could not deactive deck',
                  lbErr: err
                });

              });
              }
            },
          cancel: {
            label: 'Cancel',
            className: 'btn-default pull-left',
            callback: function () {
              box.modal('hide');
            }
          }
        }
      });
      box.modal('show');
    };

    $scope.promptDelete = function (draft, username) {

      var box = bootbox.dialog({
        title: 'DELETE Draft',
        message: 'Are you sure you want to DELETE this draft for the player: <strong>' +
        username + '</strong>? <br/><br /> This cannot be undone',
        buttons: {
          delete: {
            label: 'DELETE Draft',
            className: 'btn-danger',
            callback: function () {
              draft.isActive = false;
              RedbullDraft.deleteById({ id: draft.id }).$promise.then(function(res){
                //console.log("result", res);
                $window.scrollTo(0, 0);
                AlertService.setSuccess({
                  show:true,
                  msg: 'Draft has been Deleted'
                });

              }).catch(function(err){
                console.log(err);
                AlertService.setError({
                  show:true,
                  msg: 'Could not delete Draft',
                  lbErr: err
                });
              });
            }
          },
          cancel: {
            label: 'Cancel',
            className: 'btn-default pull-left',
            callback: function () {
              box.modal('hide');
            }
          }
        }
      });
      box.modal('show');
    };

}])


;
