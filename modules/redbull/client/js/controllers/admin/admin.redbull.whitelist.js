angular.module('redbull.controllers')
.controller('AdminRedbullWhitelistCtrl', ['$scope', '$compile', 'Hearthstone', 'bootbox', 'User', 'draftPlayers',
  'RedbullDraft', 'AlertService', '$window',
  function ($scope, $compile, Hearthstone, bootbox, User, draftPlayers,
            RedbullDraft, AlertService, $window){
    var box;
    $scope.draftPlayers = draftPlayers.players;
    // Let's keep a backup for comparison on update.
    var originalPlayers = angular.copy($scope.draftPlayers);
    $scope.users = [];
    $scope.search = '';

    $scope.isUser = function (user) {
        for (var i = 0; i < $scope.draftPlayers.length; i++) {
            if (user.id === $scope.draftPlayers[i].id) {
                return true;
            }
        }
        return false;
    }

    $scope.addUser = function (user) {
        if ($scope.isUser(user)) {
            $scope.removeUser(user);
        } else {
            $scope.draftPlayers.push(user);
        }
    };

    // delete snapshot
    $scope.removeUserPrompt = function removeUserPrompt(user) {
      var box = bootbox.dialog({
        title: 'Remove Player from Whitelist ?',
        message: 'Are you sure you want to remove the player <strong>' + user.username + '</strong> from the whitelist?',
        buttons: {
          delete: {
            label: 'Remove',
            className: 'btn-danger',
            callback: function () {
              $scope.$apply($scope.removeUser(user));
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

    $scope.removeUser = function (user) {
        for (var i = 0; i < $scope.draftPlayers.length; i++) {
            if (user.id === $scope.draftPlayers[i].id) {
                $scope.draftPlayers.splice(i, 1);
                return;
            }
        }
    };

    $scope.getUsers = function (cb) {
        var options = {
            filter: {
                limit: 10,
                order: "createdDate DESC",
                fields: ["username", "email", "id"],
                where: {
                    isActive: true
                }
            }
        }

        if($scope.search) {
            var pattern = '/.*'+$scope.search+'.*/i';
            options.filter.where = {
                isActive: true,
                or: [
                    {username: { regexp: pattern }},
                    {email: { regexp: pattern }}
                ]
            }
        }

        User.find(options).$promise
        .then(function (data) {
            $scope.users = data;
            if (cb !== undefined) { return cb(); }
        });
    };

    $scope.addUserWnd = function () {
        $scope.getUsers(function () {
            box = bootbox.dialog({
                message: $compile('<redbull-whitelist-add-user></redbull-whitelist-add-user>')($scope),
                animate: true,
                closeButton: false
            });
            box.modal('show');
        });
    };

    $scope.closeBox = function () {
        box.modal('hide');
        $scope.search = '';
    };

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
                msg: 'Settings have been updated successfully.',
                lbErr: err
              });
            } else {
              // Update our originalPlayers for seamless updating
              originalPlayers = angular.copy($scope.draftPlayers);
              $window.scrollTo(0, 0);
              return AlertService.setSuccess({
                show: true,
                msg: 'Settings have been updated successfully.'
              });
            }
          }
        )
      );
  };

}]);
