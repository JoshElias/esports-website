angular.module('redbull.directives')
.directive('redbullDraft', ['$timeout', '$interval', '$rootScope',
    function ($timeout, $interval, $rootScope){
        return {
            restrict: 'A',
            templateUrl: tpl + 'dist/views/redbull/client/views/directives/redbull-draft.html',
            scope: {
                packs: '=',
                isLoading: '=',
                currentPack: '=',
                currentCards: '=',
                audioFiles: '=',
                addCardToPool: '='
            },
            link: function (scope, el, attrs) {
                var startShake = null,
                    shakeLoop = null,
                    shakeInterval = 10000,
                    packDropped = false,
                    done = false,
                    cardsFlipped = 0,
                    audioPath = 'modules/redbull/client/audio/',
                    fastForwardSpeed = 500,
                    fastForward = false,
                    lastEvent = false,
                    EVENT_PACK_DROPPED = 1,
                    EVENT_CARD1_FLIPPED = 2,
                    EVENT_CARD2_FLIPPED = 3,
                    EVENT_CARD3_FLIPPED = 4,
                    EVENT_CARD4_FLIPPED = 5,
                    EVENT_CARD5_FLIPPED = 6,
                    EVENT_DONE_CLICKED = 7,
                    EVENT_DRAFT_COMPLETE = 8,
                    EVENT_MAX = 20,
                    fadeDuration = 1000,
                    fadeDurationFF = 200,
                    currentExpansion = null;
                
                // init currentCards and currentPack
                for (var key in scope.packs) {
                    scope.currentPack[key] = 0;
                    scope.currentCards[key] = 0;
                };
                
                function nextPack (expansion) {
                    scope.currentPack[expansion]++;
                    scope.$apply();
                }
                
                function nextCards (expansion) {
                    scope.currentCards[expansion]++;
                    scope.$apply();
                }
                
                function playAudio ( audioName ) {
                    var audio = new Audio();
                    audio.src = $rootScope.app.cdn + audioPath + scope.audioFiles[audioName].file;
                    audio.load();
                    audio.volume = scope.audioFiles[audioName].volume;
                    audio.playbackRate = (!fastForward) ? 1 : 2;
                    audio.play();
                }
                
                // watch current pack
                scope.$watch('currentPack', function (newValue) {
                    scope.currentPack = newValue;
                });
                
                // watch loading
                scope.$watch('isLoading', function (newValue) {
                    scope.isLoading = newValue;
                });
                
                // temp start fast forward for debugging
                $(window).keydown(function(e) {
                    if ((e.keyCode || e.which) == 65) {
                        scope.fastForward();
                    }
                });
                
                // go to next event for fast forward
                function nextEvent() {
                    if (lastEvent === EVENT_DRAFT_COMPLETE) {
                        return false;
                    }
                    var e = $.Event('keydown');
                    e.which = 32;
                    e.keyCode = 32;
                    $(window).trigger(e);
                }
                
                // start fast forwarding
                scope.fastForward = function () {
                    if (fastForward) { return false; }
                    fastForward = true;
                    el.addClass('fast-forward');
                    nextEvent();
                };
                
                // shake pack
                function shakePack () {
                    playAudio('pack_shake');
                    $('.pack-wrapper').trigger('startRumble');
                    $timeout(function() {
                        $('.pack-wrapper').trigger('stopRumble');
                    }, 750);
                }

                $('.pack-wrapper').jrumble();
                startShake = $timeout(function() {
                    shakePack();
                    shakeLoop = $interval(shakePack, shakeInterval);
                }, shakeInterval);

                // handle cursor icon changes
                el.mousedown(function(e) {
                    if (!fastForward) {
                        if ($(e.target).is('.pack')) {
                            $('.draft-wrapper').addClass('grabbing');
                        } else {
                            $('.draft-wrapper').addClass('clicking');
                        }
                    }
                }).mouseup(function() {
                    $('.draft-wrapper').removeClass('grabbing clicking');
                });
                
                scope.enablePacks = function () {
                    $('.pack').each(function (i) {
                        var pack = this;

                        $(pack).draggable({
                            containment: ".draft",
                            scroll: false,
                            revert: true,
                            start: function() {
                                if (!packDropped) {

                                    $(pack).data('draggable', true)

                                    // stop shaking the pack
                                    $timeout.cancel(startShake);
                                    $interval.cancel(shakeLoop);

                                    // tilt the pack
                                    $(this).css('transform', 'scale(1.05) perspective(300px) rotateY(10deg)');

                                    // move pack to top
                                    $(pack).closest('.pack-wrapper').css('z-index', '6');

                                    // fade in glowing background
                                    $('.bg-glow').stop(true).fadeIn(fadeDuration);
                                }
                            },
                            stop: function() {
                                if (!packDropped) {

                                    // untilt the pack
                                    $(this).css({
                                        'left': '0px',
                                        'top': '0px',
                                        'transform': 'perspective(0) rotateY(0) scale(1)'
                                    });

                                    // move pack to bottom
                                    $(pack).closest('.pack-wrapper').css('z-index', '2');

                                    playAudio('pack_release');

                                    // fade out glowing background
                                    $('.bg-glow').stop(true).fadeOut(fadeDuration / 2);

                                    // start shaking pack again
                                    $interval.cancel(shakeLoop);
                                    shakeLoop = $interval(shakePack, shakeInterval);

                                }
                            }
                        });
                    });

                    $('.pack').mousedown(function() {
                        if (!packDropped) {
                            var pack = this;
                            
                            playAudio('pack_grab');

                            // grow pack
                            $(pack).css('transform', 'scale(1.05)');

                            // stop shaking the pack
                            $(pack).closest('.pack-wrapper').trigger('stopRumble');
                            $timeout.cancel(startShake);
                            $interval.cancel(shakeLoop);
                        }
                    }).mouseup(function() {
                        // TODO: doesn't work
                        // if the pack's position is its original location, play the pack release sound
                        //var spot = $(this).position();
                        //if (Math.round(spot.left) == 192 && Math.round(spot.top) == 241) {
                        //    playAudio('pack_release');
                        //}

                        // shrink pack
                        $(this).css('transform', 'perspective(0) rotateY(0) scale(1)');

                        // start shaking pack again
                        $interval.cancel(shakeLoop);
                        shakeLoop = $interval(shakePack, shakeInterval);
                    });
                };

                // handle drop zone
                $('.pack-drop').droppable({
                    tolerance: "touch",
                    drop: function(e, ui) {
                        var pack = ui.draggable;
                        packDrop(pack);
                    }
                });
                
                // enable spacebar
                $(window).keydown(function(e) {
                    var card,
                        btn;
                    
                    // don't allow spacebar when we're not ready
                    if (!scope.isLoading && !packDropped) {
                        if ((e.keyCode || e.which) == 32) {
                            // disable pack dragging
                            $(".pack").draggable("disable");

                            // fade in glowing background
                            $('.bg-glow').stop(true).fadeIn(fadeDuration);

                            // drop pack
                            packDrop();
                        }
                    } else if (!scope.isLoading && packDropped) {
                        if ((e.keyCode || e.which) == 32) {
                            // flip next cards
                            if (cardsFlipped < 5) {
                                card = $('.card').not('.flipped-left').not('.flipped-right').eq(0);
                                if (card.is(':visible')) {
                                    card.mousedown();
                                }
                            } else {
                                btn = $('.btn-done');
                                if (btn.is(':visible')) {
                                    btn.mousedown();
                                }
                            }
                        }
                    }
                });

                // stop scrolling with spacebar
                $(window).onkeydown = function(e) { 
                    return !(e.keyCode == 32);
                };
                
                function packDrop(pack) {
                    if (!packDropped) {
                        packDropped = true;
                        currentExpansion = $(pack).attr('data-expansion');
                        lastEvent = EVENT_PACK_DROPPED;

                        // stop shaking pack
                        $timeout.cancel(startShake);
                        $interval.cancel(shakeLoop);

                        // move pack to drop zone
                        //$('.pack').css({
                        //    'left': '707px',
                        //    'top': '260px',
                        //    'transform': 'perspective(0) rotateY(0)'
                        //});

                        // TODO: PLAY BURST SOUND

                        // fade out pack
                        $(pack).fadeOut(0, function() {
                            // return hidden pack
                            $(this).css({
                                'left': '0px',
                                'top': '0px',
                                'transform': 'perspective(0) rotateY(0)'
                            });
                            
                            // fade out glow
                            $('.bg-glow').stop().fadeOut(0);
                            
                            // blur bg
                            el.addClass('blurred');
                            
                            // update card interactions
                            //cardInteraction();

                            // set cards and show
                            $('.cards').fadeIn(0, function () {
                                if (fastForward) {
                                    nextEvent();
                                }
                            });
                        });

                        // move back to bottom
                        $('.pack-wrapper').css('z-index', '2');
                        
                    }
                };
                
                scope.cards = function () {
                    if (!currentExpansion) { return []; }
                    var cards = scope.packs[currentExpansion].packs[scope.currentCards[currentExpansion]].cards;
                    return cards;
                };
                
                function getCardById (cardId, cards) {
                    for (var i = 0; i < cards.length; i++) {
                        if (cards[i].id === cardId) {
                            return cards[i];
                        }
                    }
                    return false;
                }
                
                // card mouse enter
                scope.cardMouseEnter = function ($event, card) {
                    if (!card.turned) {
                        playAudio('card_hover');
                    }
                };
                
                // card mouse leave
                scope.cardMouseLeave = function ($event, card) {
                    if (!card.turned) {
                        playAudio('card_unhover');
                    }
                };
                
                // card mouse down
                scope.cardMouseDown = function ($event, card) {
                    var cardElement = $event.currentTarget,
                        cardRarity = card.rarity.toLowerCase(),
                        announcerRarities = ['rare', 'epic', 'legendary'];
                    
                    card.turned = true;
                    
                    if (card.turned && !card.clicked) {
                        card.clicked = true;
                        cardsFlipped++;

                        // set last event
                        switch ( cardsFlipped ) {
                            case 1:
                                lastEvent = EVENT_CARD1_FLIPPED;
                                break;
                            case 2:
                                lastEvent = EVENT_CARD2_FLIPPED;
                                break;
                            case 3:
                                lastEvent = EVENT_CARD3_FLIPPED;
                                break;
                            case 4:
                                lastEvent = EVENT_CARD4_FLIPPED;
                                break;
                            case 5:
                                lastEvent = EVENT_CARD5_FLIPPED;
                                break;
                        }

                        // add to pool
                        if (typeof scope.addCardToPool === 'function') {
                            var poolCard = getCardById(card.id, scope.packs[card.expansion].packs[scope.currentCards[card.expansion]].cards);
                            if (poolCard) {
                                scope.$apply(function () {
                                    scope.addCardToPool(poolCard);
                                });
                            }
                        }

                        playAudio('card_turn_over_' + cardRarity);

                        if (announcerRarities.indexOf(cardRarity) !== -1) {
                            playAudio('announcer_' + cardRarity);
                        }

                        var cardX = $event.pageX - $(cardElement).offset().left;
                        if (cardX < 116) {
                            $(cardElement).addClass('flipped-left');
                        } else {
                            $(cardElement).addClass('flipped-right');
                        }

                        if (cardsFlipped > 4) {
                            $timeout(function() {
                                playAudio('done_reveal');
                                $timeout(function() {
                                    $('.btn-done').stop(true).fadeIn(((!fastForward) ? fadeDuration : fadeDurationFF), function () {
                                        if (fastForward) {
                                            nextEvent();
                                        }
                                    });
                                }, ((!fastForward) ? fadeDuration / 2 : fadeDurationFF / 2));
                            }, ((!fastForward) ? fadeDuration / 2 : fadeDurationFF / 2));
                        } else {
                            if (fastForward) {
                                $timeout(nextEvent, fastForwardSpeed);
                            }
                        }
                    }
                };
                
                function cardInteraction() {
                    cardsFlipped = 0;
                    console.log('cardInteraction');
                    $('.card').each(function(i) {
                        var card = this,
                            announcerRarities = ['rare', 'epic', 'legendary'];
                        
                        console.log(i);
                        
                        card.turned = false;
                        card.clicked = false;
                        card.rarity = $(card).attr('data-rarity').toLowerCase();
                        card.cardId = $(card).attr('data-card-id');
                        card.expansion = $(card).attr('data-expansion');
                        
                        $(card).unbind('mouseenter').mouseenter(function() {
                            if (!card.turned) {
                                playAudio('card_hover');
                            }
                        })
                        .unbind('mouseleave').mouseleave(function() {
                            if (!card.turned) {
                                playAudio('card_unhover');
                            }
                        })
                        .unbind('mousedown').mousedown(function(e) {
                            card.turned = true;
                            console.log('mousedown');
                            if (card.turned && !card.clicked) {
                                card.clicked = true;
                                cardsFlipped++;
                                
                                // set last event
                                switch ( cardsFlipped ) {
                                    case 1:
                                        lastEvent = EVENT_CARD1_FLIPPED;
                                        break;
                                    case 2:
                                        lastEvent = EVENT_CARD2_FLIPPED;
                                        break;
                                    case 3:
                                        lastEvent = EVENT_CARD3_FLIPPED;
                                        break;
                                    case 4:
                                        lastEvent = EVENT_CARD4_FLIPPED;
                                        break;
                                    case 5:
                                        lastEvent = EVENT_CARD5_FLIPPED;
                                        break;
                                }
                                
                                // add to pool
                                if (typeof scope.addCardToPool === 'function') {
                                    var poolCard = getCardById(card.cardId, scope.packs[card.expansion].packs[scope.currentCards[card.expansion]].cards);
                                    if (poolCard) {
                                        scope.$apply(function () {
                                            scope.addCardToPool(poolCard);
                                        });
                                    }
                                }
                                
                                playAudio('card_turn_over_' + card.rarity);
                                
                                if (announcerRarities.indexOf(card.rarity) !== -1) {
                                    playAudio('announcer_' + card.rarity);
                                }

                                var cardX = e.pageX - $(card).offset().left;
                                if (cardX < 116) {
                                    $(card).addClass('flipped-left');
                                } else {
                                    $(card).addClass('flipped-right');
                                }
                                
                                if (cardsFlipped > 4) {
                                    $timeout(function() {
                                        playAudio('done_reveal');
                                        $timeout(function() {
                                            $('.btn-done').stop(true).fadeIn(((!fastForward) ? fadeDuration : fadeDurationFF), function () {
                                                if (fastForward) {
                                                    nextEvent();
                                                }
                                            });
                                        }, ((!fastForward) ? fadeDuration / 2 : fadeDurationFF / 2));
                                    }, ((!fastForward) ? fadeDuration / 2 : fadeDurationFF / 2));
                                } else {
                                    if (fastForward) {
                                        //nextEvent();
                                        $timeout(nextEvent, fastForwardSpeed);
                                    }
                                }
                            }
                        });

                    });

                }
                
                $('.btn-done').mousedown(function() {
                    if (!done) {
                        done = true;
                        lastEvent = EVENT_DONE_CLICKED;
                        
                        playAudio('done_fade');

                        $('.btn-done').stop(true, true).fadeOut(((!fastForward) ? fadeDuration : fadeDurationFF));

                        $('.cards').fadeOut(((!fastForward) ? fadeDuration : fadeDurationFF), function() {
                            $('.card').removeClass('flipped-left flipped-right');
                            if (scope.currentCards + 1 < scope.packs.length) {
                                nextCards();
                                if (fastForward) {
                                    nextEvent();
                                }
                            }
                        });

                        $('.bg-glow').hide(function() {

                            if (scope.currentPack[currentExpansion] + 1 < scope.packs[currentExpansion].packs.length) {
                                nextPack(currentExpansion);
                                $('.pack').draggable("enable").fadeIn(0, function() {
                                    packDropped = false;
                                    
                                    el.removeClass('blurred');

                                    $interval.cancel(shakeLoop);
                                    shakeLoop = $interval(shakePack, shakeInterval);
                                });
                            } else {
                                console.log('goto build');
                                lastEvent = EVENT_DRAFT_COMPLETE;
                                //$state.go(app.redbull.draft.build);
                            }
                            
                        });
                    }

                    $timeout(function() {
                        done = false;
                        currentExpansion = null;
                    }, ((!fastForward) ? fadeDuration : fadeDurationFF));
                });
                
                scope.$on('$destroy', function () {
                    $timeout.cancel(startShake);
                    $interval.cancel(shakeLoop);
                });

            }
        };
    }
]);