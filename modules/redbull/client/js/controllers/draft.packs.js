angular.module('redbull.controllers')
.controller('DraftPacksCtrl', ['$scope', 'Preloader', 'DraftPacks', 'cards', function ($scope, Preloader, DraftPacks, cards){
    // preload files
    $scope.isLoading = true;
    $scope.isSuccessful = false;
    $scope.percentLoaded = 0;
    
    $scope.fileLocations = [
        ( $scope.app.cdn + 'dist/img/modules/redbull/client/img/back_button_hover.jpg' ),
        ( $scope.app.cdn + 'dist/img/modules/redbull/client/img/bg.jpg' ),
        ( $scope.app.cdn + 'dist/img/modules/redbull/client/img/bg_frame.png' ),
        ( $scope.app.cdn + 'dist/img/modules/redbull/client/img/bg_glow.jpg' ),
        ( $scope.app.cdn + 'dist/img/modules/redbull/client/img/donation.png' ),
        ( $scope.app.cdn + 'dist/img/modules/redbull/client/img/done.png' ),
        ( $scope.app.cdn + 'dist/img/modules/redbull/client/img/pack.png' ),
        ( $scope.app.cdn + 'dist/img/modules/redbull/client/img/friend_button_hover.jpg' ),
        ( $scope.app.cdn + 'dist/img/modules/redbull/client/img/friend_list.png' ),
        ( $scope.app.cdn + 'dist/img/modules/redbull/client/img/mancer_tooltip.png' ),
        ( $scope.app.cdn + 'dist/img/modules/redbull/client/img/shop_button_hover.jpg' ),
        ( $scope.app.cdn + 'dist/img/modules/redbull/client/img/stats_button_hover.jpg' ),
        ( $scope.app.cdn + 'dist/img/modules/redbull/client/img/stats_panel.png' ),
    ];
    
    Preloader.preloadFiles( $scope.fileLocations ).then(
        function handleResolve( imageLocations ) {
            $scope.isLoading = false;
            $scope.isSuccessful = true;
        },
        function handleReject( fileLocation ) {
            $scope.isLoading = false;
            $scope.isSuccessful = false;
            console.error( "File Failed", fileLocation );
        },
        function handleNotify( event ) {
            $scope.percentLoaded = event.percent;
        }
    );
    
    // get packs
    $scope.currentPack = $scope.currentCards = 0;
    $scope.packs = DraftPacks.getPacks(cards, {});
}]);