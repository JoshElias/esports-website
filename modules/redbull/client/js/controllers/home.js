angular.module('redbull.controllers')
.controller('RedbullHomeCtrl', ['$scope', '$state', 'User', 'LoginModalService', function ($scope, $state, User, LoginModalService){
    
    function goToDrafts () {
        return $state.transitionTo('app.hs.redbull.home');
    }
    
    function goToPacks () {
        return $state.transitionTo('app.hs.draft.packs');
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
    
    var draftLoading = false;
    // return if fast forwarding
    $scope.isDraftLoading = function () {
        return draftLoading;
    };

    // start fast forwarding
    $scope.draftLoadingToggle = function () {
        if (!draftLoading) {
            draftLoading = true;
            //el.addClass('fast-forward');
           // nextEvent();
        } else {
            draftLoading = false;
            //el.removeClass('fast-forward');
        }
        
        goToPacks();
    };
    
}]);