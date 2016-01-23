angular.module('redbull.directives')
.directive('redbullWhitelistAddUser', [function () {
    return {
        restrict: 'E',
        templateUrl: ((tpl !== './') ? tpl + 'views/redbull/client/views/' : 'dist/views/redbull/client/views/') + 'admin/admin.redbull.whitelist.add-user.html',
    };
}]);