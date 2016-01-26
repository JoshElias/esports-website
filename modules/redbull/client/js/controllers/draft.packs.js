angular.module('redbull.controllers')
.controller('DraftPacksCtrl', ['$scope', '$localStorage', '$window', '$compile', '$state', 'bootbox', 'Preloader', 'AlertService', 'DraftPacks', 'RedbullDraft', 'draft', function ($scope, $localStorage, $window, $compile, $state, bootbox, Preloader, AlertService, DraftPacks, RedbullDraft, draft){
    if (draft.hasOpenedPacks) { return $state.go('^.build'); }
    
    console.log('Draft: ', draft);
    
    if (!$localStorage.draftId) {
        $localStorage.draftId = draft.id;
    }
    
    // variables
    $scope.isLoading = true;
    $scope.isSuccessful = false;
    $scope.percentLoaded = 0;
    $scope.goingToBuild = false;
    
    // packs
    $scope.currentPack = {};
    $scope.packs = JSON.parse(draft.packOpenerString);
    
    console.log('Packs: ', $scope.packs);
    
    // file variables
    var fileLocations = [];
    var imagePath = (tpl !== './') ? 'img/modules/redbull/client/img/' : 'dist/img/modules/redbull/client/img/';
    var ext = getAudioExt();
    var audioPath = (tpl !== './') ? 'audio/' : 'dist/audio/';
    
    function getAudioExt () {
        var audioTest = new Audio();
        return (audioTest.canPlayType('audio/ogg')) ? '.ogg' : '.mp3';
    }
    
    // load cards for preloader
    var cardImages = [];
    var cardPath = 'cards/';
    for (var key in $scope.packs) {
        for (var x = 0; x < $scope.packs[key].packs.length; x++) {
            for (var y = 0; y < $scope.packs[key].packs[x].cards.length; y++) {
                if (cardImages.indexOf($scope.packs[key].packs[x].cards[y].photoNames.small) === -1) {
                    cardImages.push($scope.packs[key].packs[x].cards[y].photoNames.small);
                    cardImages.push($scope.packs[key].packs[x].cards[y].photoNames.large);
                }
            }
        }
    }
    for (var i = 0; i < cardImages.length; i++) {
        // TODO: make https
        fileLocations.push( 'http://cdn.tempostorm.netdna-cdn.com/' + cardPath + cardImages[i] );
    }
    
    // image files
    var imageFiles = [
        'bg.jpg',
        'bg-glow.jpg',
        'done.png',
        'pack.png',
        'book-loe.png',
        'book-naxx.png',
        'book-brm.png',
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
        'pack-frame.png',
        'book-frame.png',
        'pack-tab.png',
        'volume-nob.png',
        'volume-slider.png',
        'hero-select.png',
        'card-bottom.png',
    ];
    
    // load images for preloader
    for (var i = 0; i < imageFiles.length; i++) {
        fileLocations.push( $scope.app.cdn + imagePath + imageFiles[i] );
    }

    // volume
    $scope.volume = ($localStorage.draftVolume !== undefined) ? $localStorage.draftVolume : 35;
    $scope.muted = ($localStorage.draftMuted !== undefined) ? $localStorage.draftMuted : false;
    
    $scope.$watch('volume', function (newValue) {
        $localStorage.draftVolume = $scope.volume;
    });
    
    $scope.$watch('muted', function (newValue) {
        $localStorage.draftMuted = $scope.muted;
    });
    
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
        'pack_burst':               { file: 'pack_burst' + ext, volume: .3 },
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
/*
    $scope.$watch(function () { return $scope.tournament; }, function (newValue) {
        $scope.tournament = newValue;
    }, true);
    
    function settingsError () {
        for (var i = 0; i < $scope.tournament.packs.length; i++) {
            if ($scope.tournament.packs[i].isActive) {
                
                // test packs
                if (isNaN(parseInt($scope.tournament.packs[i].packs)) || parseInt($scope.tournament.packs[i].packs) < 1) {
                    return 'Expansion ' + $scope.tournament.packs[i].expansion + ': Can not have zero packs.';
                }
                
                // test percentage
                var count = 0;
            
                for (key in $scope.tournament.packs[i].chances) {
                    count += $scope.tournament.packs[i].chances[key];
                }

                if (count !== 100) {
                    return 'Expansion ' + $scope.tournament.packs[i].expansion + ': Chances do not add up to 100%.';
                }
            }
        }
        return false;
    }
    
    $scope.settingsWnd = function () {
        AlertService.reset();
        var oldSettings = angular.copy($scope.tournament);
        var box = bootbox.dialog({
            title: 'Pack Settings',
            message: $compile('<pack-settings tournament="tournament"></pack-settings>')($scope),
            buttons: {
                save: {
                    label: 'Save',
                    className: 'btn-blue',
                    callback: function () {
                        var error = settingsError();
                        if (!error) {
                            $localStorage.tournament = $scope.tournament;
                            $window.location.reload();
                        } else {
                            AlertService.setError({ show: true, msg: error });
                            return false;
                        }
                    }
                },
                cancel: {
                    label: 'Cancel',
                    className: 'btn-default pull-left',
                    callback: function () {
                        $scope.tournament = oldSettings;
                        box.modal('hide');
                    }
                }
            }
        });
        box.modal('show');
    };
*/

    $scope.goToBuild = function () {
        $scope.goingToBuild = true;
        
        RedbullDraft.startDraftBuild({ draftId: $localStorage.draftId }).$promise.then(function () {
            return $state.go('^.build');
        }).catch(function () {
            console.error('Unable to update draft');
        });
        
/*
        var box = bootbox.dialog({
            title: 'Build Decks',
            message: 'You will have ',
            buttons: {
                cancel: {
                    label: 'OK',
                    className: 'btn-blue',
                    callback: function () {
                        box.modal('hide');
                    }
                }
            }
        });
        box.modal('show');
*/
    };
    
}]);