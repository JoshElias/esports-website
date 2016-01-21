angular.module('redbull.controllers')
.controller('RedbullHomeCtrl', ['$scope', '$state', 'User', 'LoginModalService', function ($scope, $state, User, LoginModalService){
    
    function goToDrafts () {
        return $state.transitionTo('app.redbull.tournament.draft.packs');
    }
    
    $scope.playerLogin = function () {
        if(!User.isAuthenticated()) {
            LoginModalService.showModal('login', function () {
                return goToDrafts();
            });
        } else {
            return goToDrafts();
        }
    };
    
}]);