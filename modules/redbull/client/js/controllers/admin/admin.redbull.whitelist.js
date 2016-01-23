angular.module('redbull.controllers')
.controller('AdminRedbullWhitelistCtrl', ['$scope', '$compile', 'Hearthstone', 'bootbox', 'User', 'whitelistUsers', function ($scope, $compile, Hearthstone, bootbox, User, whitelistUsers){
    var box;
    $scope.whitelistUsers = whitelistUsers;
    $scope.search = '';
    
    $scope.isUser = function (user) {
        var index = $scope.users.indexOf(user);
        return ( index !== -1 );
    }
    
    $scope.addUser = function (user) {
        if ($scope.isUser(user)) {
            $scope.removeUser(user);
        } else {
            $scope.users.push(user);
        }
    };

    $scope.removeUser = function (user) {
        var index = $scope.users.indexOf(user);
        if (index !== -1) {
            $scope.users.splice(index, 1);
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