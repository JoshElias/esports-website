angular.module('redbull.controllers')
.controller('DraftPacksCtrl', [
    '$scope', '$localStorage', '$window', '$compile', '$state', 'bootbox', 'Preloader', 'AlertService', 'DraftPacks', 'RedbullDraft', 'draftSettings', 'draft',
    function ($scope, $localStorage, $window, $compile, $state, bootbox, Preloader, AlertService, DraftPacks, RedbullDraft, draftSettings, draft){

    if (!$localStorage.sealedDraft) {
        $localStorage.sealedDraft = {
            draftId: draft.id,
            decks: []
        };
    } else {
        if ($localStorage.sealedDraft && $localStorage.sealedDraft.draftId !== draft.id) {
            $localStorage.sealedDraft = {
                draftId: draft.id,
                decks: []
            };
        }
    }

    // TODO: REMOVE THIS BEFORE LAUNCH
    /*document.addEventListener("keydown", skipPacks, false);
    function skipPacks (e) {
        if (e.which === 13) {
            $scope.goingToBuild = true;
            RedbullDraft.finishedOpeningPacks({ draftId: $localStorage.sealedDraft.draftId }).$promise.then(function () {
                return $state.go('^.build');
            }).catch(function (response) {
                console.log(response);
                console.error('Unable to update draft');
            });
        }
    }*/

    function dirtyPacks (packs) {
        var expansionOrders = {
            'Soulbound' : 0,
            'Basic': 1,
            'Naxxramas': 2,
            'Goblins Vs. Gnomes': 3,
            'Blackrock Mountain': 4,
            'The Grand Tournament': 5,
            'League of Explorers': 6
        };
        var newPacks = {
            'Soulbound' : undefined,
            'Basic': undefined,
            'Naxxramas': undefined,
            'Goblins Vs. Gnomes': undefined,
            'Blackrock Mountain': undefined,
            'The Grand Tournament': undefined,
            'League of Explorers': undefined
        };

        _.each(packs, function (pack) {
            var expansion;
            var cards = [];

            _.each(pack.packCards, function (packCard) {
                // expansion
                expansion = packCard.expansion; // name, className, numOfPacks

                // cards for pack
                cards.push(packCard.card);
            });

            if (newPacks[expansion.name] === undefined) {
                newPacks[expansion.name] = {
                    name: expansion.name,
                    className: expansion.className,
                    numOfPacks: expansion.numOfPacks,
                    packs: [],
                    orderNum: expansionOrders[expansion.name]
                };
            }
            newPacks[expansion.name].packs.push({
                cards: cards,
                className: expansion.className,
                expansionName: expansion.name
            });
        });

        return newPacks;
    }

    // variables
    $scope.isLoading = true;
    $scope.isSuccessful = false;
    $scope.percentLoaded = 0;
    $scope.goingToBuild = false;

    // packs
    $scope.currentPack = {};

    if (draft.packOpenerData) {
        $scope.packs = draft.packOpenerData;
    } else {
        $scope.packs = dirtyPacks(draft.packs);
    }

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
                    cardImages.push($scope.packs[key].packs[x].cards[y].photoNames.medium);
                    cardImages.push($scope.packs[key].packs[x].cards[y].photoNames.large);
                }
            }
        }
    }
    for (var i = 0; i < cardImages.length; i++) {
        // TODO: make https
        fileLocations.push( 'https://cdn-tempostorm.netdna-ssl.com/' + cardPath + cardImages[i] );
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
            $scope.percentLoaded = event.percent+"%";
        }
    );

    // go to build
    $scope.goToBuild = function () {
        var mins = draftSettings.deckBuildTimeLimit;
        var decks = draftSettings.numOfDecks;
        var box = bootbox.dialog({
            title: 'Build Decks',
            message: 'You will have <strong>' + mins + ' minutes</strong> to build <strong>' + decks + ' decks</strong>. If you do not complete in the allotted time, your decks will be automatically submitted, and completed with random classes / cards that are remaining. The timer begins once you click the continue button.',
            buttons: {
                continue: {
                    label: 'Continue',
                    className: 'btn-blue',
                    callback: function () {
                        box.modal('hide');
                        $scope.goingToBuild = true;
                        RedbullDraft.finishedOpeningPacks({ draftId: draft.id }).$promise.then(function () {
                            return $state.go('^.build');
                        }).catch(function (response) {
                            console.log(response);
                            console.error('Unable to update draft');
                        });
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
