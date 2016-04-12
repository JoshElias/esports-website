angular.module('redbull.controllers')
.controller('AdminRedbullWhitelistCtrl', ['$rootScope', '$scope', '$compile', 'bootbox', 'draftPlayers', 'RedbullDraft', 'AlertService', '$window',
    function ($rootScope, $scope, $compile, bootbox, draftPlayers, RedbullDraft, AlertService, $window){
        $scope.draftPlayers = draftPlayers.players;
        // Let's keep a backup for comparison on update.
        var originalPlayers = angular.copy($scope.draftPlayers);

        // user exists by id
        $scope.userExistsById = function (userId) {
            for (var i = 0; i < $scope.draftPlayers.length; i++) {
                if (userId === $scope.draftPlayers[i].id) {
                    return true;
                }
            }
            return false;
        };

        // add user
        $scope.userAdd = function (user) {
            $scope.draftPlayers.push(user);
        };

        // delete user by id
        $scope.userDeleteById = function (userId) {
            if (!$scope.userExistsById(userId)) { return false; }
            
            var index = -1;
            for (var i = 0; i < $scope.draftPlayers.length; i++) {
                if (userId === $scope.draftPlayers[i].id) {
                    index = i;
                }
            }
            if (index !== -1) {
                $scope.draftPlayers.splice(index, 1);
            }
        };
        
        // prompt for adding / removing authors
        $scope.userAddPrompt = function () {
            var newScope = $rootScope.$new(true);
            newScope.userAdd = $scope.userAdd;
            newScope.userExistsById = $scope.userExistsById;
            newScope.userDeleteById = $scope.userDeleteById;

            var box = bootbox.dialog({
                title: "Users",
                message: $compile('<div modal-admin-users></div>')(newScope),
                show: false,
                className: 'modal-admin modal-admin-authors'
            });
            box.modal('show');
        };

        // delete user prompt
        $scope.removeUserPrompt = function removeUserPrompt(user) {
          var box = bootbox.dialog({
            title: 'Remove User from Whitelist?',
            message: 'Are you sure you want to remove the player <strong>' + user.username + '</strong> from the whitelist?',
            buttons: {
              delete: {
                label: 'Remove',
                className: 'btn-danger',
                callback: function () {
                  $scope.$apply($scope.userDeleteById(user.id));
                }
              },
              cancel: {
                label: 'Cancel',
                className: 'btn-default pull-left',
                callback: function () {
                  box.modal('hide');
                }
              }
            },
            className: 'modal-admin modal-admin-remove'
          });
          box.modal('show');
        };
        
        // save settings
        $scope.updateSettings = function () {

          // We need some arrays to do some diff with on usernames to be added or removed on this update
          //console.log($scope.draftPlayers, originalPlayers);

          var incoming = [];
          _.forEach($scope.draftPlayers, function (player) {
            incoming.push(player.username);
          });

          var original = [];
          _.forEach(originalPlayers, function (player) {
            original.push(player.username);
          });

          // If originals aren't in the incoming update, remove them
          var toBeRemoved = _.difference(original, incoming);
          //console.log("remove:", toBeRemoved);

          // If incoming update doesn't contain an original entry, add them.
          var toBeAdded = _.difference(incoming, original);
          //console.log("add:", toBeAdded);

          // Now that we have our diffs, we need to grab the ids again, since RedbullDraft methods need uid.
          var removeables = [];
          var addables = [];

          _.forEach(toBeRemoved, function (username) {
            removeables.push(_.findWhere(originalPlayers, {username: username}).id);
          });
          _.forEach(toBeAdded, function (username) {
            addables.push(_.findWhere($scope.draftPlayers, {username: username}).id);
          });

          async.forEach(addables, function (player, playerCallback) {
              RedbullDraft.addDraftPlayer({uid: player}, playerCallback);
            },
            async.forEach(removeables, function (player, playerCallback) {
                RedbullDraft.removeDraftPlayer({uid: player}, playerCallback);
              },
              function (res, err) {
                if (err) {
                  $window.scrollTo(0, 0);
                  return AlertService.setError({
                    show: true,
                    msg: 'Whitelist Error',
                    lbErr: err
                  });
                } else {
                  // Update our originalPlayers for seamless updating
                  originalPlayers = angular.copy($scope.draftPlayers);
                  $window.scrollTo(0, 0);
                  return AlertService.setSuccess({
                    show: true,
                    msg: 'Whitelist has been updated successfully.'
                  });
                }
              }
            )
          );
        };
    }
]);
