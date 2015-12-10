angular.module('redbull.controllers')
.controller('DraftPacksCtrl', ['$scope', 'Preloader', 'DraftPacks', 'cards', function ($scope, Preloader, DraftPacks, cards){
    // variables
    $scope.isLoading = true;
    $scope.isSuccessful = false;
    $scope.percentLoaded = 0;
    // packs
    $scope.currentPack = {};
    $scope.packs = DraftPacks.getPacks(cards, {});
    
    // file variables
    var fileLocations = [];
    var imagePath = 'dist/img/modules/redbull/client/img/';
    var ext = '.mp3';
    var audioPath = 'modules/redbull/client/audio/';
    
    // image files
    var imageFiles = [
        'bg.jpg',
        'bg-glow.jpg',
        'done.png',
        'pack.png',
        'pack-loe.png',
        'pack-naxx.png',
        'pack-brm.png',
        'pack-gvg.png',
        'pack-tgt.png',
        'pack-soulbound.png',
        'deck-top.png',
    ];
    
    // load images for preloader
    for (var i = 0; i < imageFiles.length; i++) {
        fileLocations.push( $scope.app.cdn + imagePath + imageFiles[i] );
    }

    // audio files
    $scope.audioFiles = {
        'announcer_epic':           { file: 'announcer_epic' + ext, volume: .3 },
        'announcer_legendary':      { file: 'announcer_legendary' + ext, volume: .3 },
        'announcer_rare':           { file: 'announcer_rare' + ext, volume: .3 },
        'card_hover':               { file: 'card_hover' + ext, volume: .5 },
        'card_turn_over_basic':     { file: 'card_turn_over_common' + ext, volume: .2 },
        'card_turn_over_common':    { file: 'card_turn_over_common' + ext, volume: .2 },
        'card_turn_over_epic':      { file: 'card_turn_over_epic' + ext, volume: .2 },
        'card_turn_over_legendary': { file: 'card_turn_over_legendary' + ext, volume: .2 },
        'card_turn_over_rare':      { file: 'card_turn_over_rare' + ext, volume: .2 },
        'card_unhover':             { file: 'card_unhover' + ext, volume: .5 },
        'done_fade':                { file: 'done_fade' + ext, volume: .5 },
        'done_reveal':              { file: 'done_reveal' + ext, volume: .5 },
        'pack_grab':                { file: 'pack_grab' + ext, volume: .5 },
        'pack_open':                { file: 'pack_open' + ext, volume: .5 },
        'pack_release':             { file: 'pack_release' + ext, volume: .5 },
        'pack_shake':               { file: 'pack_shake' + ext, volume: .5 },
        // TODO: pack_aura.mp3
    };

    // load audio for preloader
    for (var key in $scope.audioFiles) {
        fileLocations.push( $scope.app.cdn + audioPath + $scope.audioFiles[key].file );
    }
    
    // handle preload
    Preloader.preloadFiles( fileLocations ).then(
        function handleResolve( fileLocations ) {
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
    
}]);