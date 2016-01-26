angular.module('redbull.controllers')
.controller('AdminRedbullWhitelistCtrl', ['$scope', '$compile', 'Hearthstone', 'bootbox', 'User', 'draftPlayers', function ($scope, $compile, Hearthstone, bootbox, User, draftPlayers){
    var box;
    $scope.draftPlayers = draftPlayers.players;
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
    
}]);