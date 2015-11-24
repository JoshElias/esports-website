angular.module('redbull.controllers')
.controller('HomeCtrl', ['$scope', '$state', 'User', 'LoginModalService', function ($scope, $state, User, LoginModalService){
    
    $scope.playerLogin = function () {
        if(!User.isAuthenticated()) {
            LoginModalService.showModal('login', function () {
                return $state.transitionTo('redbull.draft.packs');
            });
        } else {
            return $state.transitionTo('redbull.draft.packs');
        }
    };
    
}]);