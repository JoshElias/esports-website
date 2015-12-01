angular.module('redbull.controllers')
.controller('DraftPacksCtrl', ['$scope', 'Preloader', 'DraftPacks', 'cards', function ($scope, Preloader, DraftPacks, cards){
    // variables
    $scope.isLoading = true;
    $scope.isSuccessful = false;
    $scope.percentLoaded = 0;
    
    var fileLocations = [];
    var imagePath = 'dist/img/modules/redbull/client/img/';
    var ext = '.mp3';
    var audioPath = 'modules/redbull/client/audio/';
    
    // image files
    var imageFiles = [
        'back_button_hover.jpg',
        'bg.jpg',
        'bg_frame.png',
        'bg_glow.jpg',
        'done.png',
        'pack.png',
        'pack-loe.png',
        'pack-naxx.png',
        'pack-brm.png',
    ];
    
    // load images for preloader
    for (var i = 0; i < imageFiles.length; i++) {
        fileLocations.push( $scope.app.cdn + imagePath + imageFiles[i] );
    }

    // audio files
    $scope.audioFiles = {
        'announcer_epic':           'announcer_epic' + ext,
        'announcer_legendary':      'announcer_legendary' + ext,
        'announcer_rare':           'announcer_rare' + ext,
        'card_hover':               'card_hover' + ext,
        'card_turn_over_common':    'card_turn_over_common' + ext,
        'card_turn_over_epic':      'card_turn_over_epic' + ext,
        'card_turn_over_legendary': 'card_turn_over_legendary' + ext,
        'card_turn_over_rare':      'card_turn_over_rare' + ext,
        'card_unhover':             'card_unhover' + ext,
        'done_fade':                'done_fade' + ext,
        'done_reveal':              'done_reveal' + ext,
        'pack_grab':                'pack_grab' + ext,
        'pack_open':                'pack_open' + ext,
        'pack_release':             'pack_release' + ext,
        'pack_shake':               'pack_shake' + ext,
        // TODO: pack_aura.mp3
    };

    // load audio for preloader
    for (var key in $scope.audioFiles) {
        fileLocations.push( $scope.app.cdn + audioPath + $scope.audioFiles[key] );
    }
    
    // handle preload
    Preloader.preloadFiles( fileLocations ).then(
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