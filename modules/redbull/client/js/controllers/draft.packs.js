angular.module('redbull.controllers')
.controller('DraftPacksCtrl', ['$scope', '$localStorage', '$compile', 'bootbox', 'Preloader', 'DraftPacks', 'cards', function ($scope, $localStorage, $compile, bootbox, Preloader, DraftPacks, cards){
    // temp tournament settings
    var defaultTournament = {
            packs: [
                {
                    expansion: 'Soulbound',
                    packs: 10,
                    chances: {
                        basic: 100,
                        common: 0,
                        rare: 0,
                        epic: 0,
                        legendary: 0
                    },
                    isActive: true
                },
                {
                    expansion: 'Basic',
                    packs: 10,
                    chances: {
                        basic: 0,
                        common: 74,
                        rare: 21,
                        epic: 4,
                        legendary: 1
                    },
                    isActive: true
                },
                {
                    expansion: 'Naxxramas',
                    packs: 5,
                    chances: {
                        basic: 0,
                        common: 74,
                        rare: 21,
                        epic: 4,
                        legendary: 1
                    },
                    isActive: true
                },
                {
                    expansion: 'Goblins Vs. Gnomes',
                    packs: 10,
                    chances: {
                        basic: 0,
                        common: 74,
                        rare: 21,
                        epic: 4,
                        legendary: 1
                    },
                    isActive: true
                },
                {
                    expansion: 'Blackrock Mountain',
                    packs: 5,
                    chances: {
                        basic: 0,
                        common: 74,
                        rare: 25,
                        epic: 0,
                        legendary: 1
                    },
                    isActive: true
                },
                {
                    expansion: 'The Grand Tournament',
                    packs: 9,
                    chances: {
                        basic: 0,
                        common: 74,
                        rare: 21,
                        epic: 4,
                        legendary: 1
                    },
                    isActive: true
                },
                {
                    expansion: 'League of Explorers',
                    packs: 5,
                    chances: {
                        basic: 0,
                        common: 74,
                        rare: 21,
                        epic: 4,
                        legendary: 1
                    },
                    isActive: true
                },
            ]
        };
    
    $scope.tournament = $localStorage.tournament || defaultTournament;
    
    // variables
    $scope.isLoading = true;
    $scope.isSuccessful = false;
    $scope.percentLoaded = 0;
    // packs
    $scope.currentPack = {};
    $scope.packs = DraftPacks.getPacks(cards, $scope.tournament);
    
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
        'back-basic.png',
        'back-brm.png',
        'back-gvg.png',
        'back-loe.png',
        'back-naxx.png',
        'back-soulbound.png',
        'back-tgt.png',
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
        'pack_aura':                { file: 'pack_aura' + ext, volume: .05 },
        'pack_burst':               { file: 'pack_burst' + ext, volume: .5 },
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

    // temp settings window
    $scope.settingsWnd = function () {
        var box = bootbox.dialog({
            title: 'Pack Settings',
            message: $compile('<pack-settings tournament="tournament"></pack-settings>')($scope),
            buttons: {
                save: {
                    label: 'Save',
                    className: 'btn-blue',
                    callback: function () {
                        
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
    
}]);