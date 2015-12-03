angular.module('redbull.directives')
.directive('redbullDraft', ['$timeout', '$interval', '$rootScope',
    function ($timeout, $interval, $rootScope){
        return {
            restrict: 'A',
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
                    audioPath = 'modules/redbull/client/audio/';

                function nextPack () {
                    scope.currentPack++;
                    scope.$apply();
                }
                
                function nextCards () {
                    scope.currentCards++;
                    scope.$apply();
                }
                
                function playAudio ( audioName ) {
                    var audio = new Audio();
                    audio.src = $rootScope.app.cdn + audioPath + scope.audioFiles[audioName].file;
                    audio.load();
                    audio.volume = scope.audioFiles[audioName].volume;
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
                    if ($(e.target).is('.pack')) {
                        $('.draft-wrapper').addClass('grabbing');
                    } else {
                        $('.draft-wrapper').addClass('clicking');
                    }
                }).mouseup(function() {
                    $('.draft-wrapper').removeClass('grabbing clicking');
                });
                                
                $('.pack').draggable({
                    containment: ".draft-wrapper",
                    scroll: false,
                    revert: true,
                    start: function() {
                        if (!packDropped) {

                            $('.pack').data('draggable', true)

                            // stop shaking the pack
                            $timeout.cancel(startShake);
                            $interval.cancel(shakeLoop);

                            // tilt the pack
                            $(this).css('transform', 'scale(1.05) perspective(300px) rotateY(10deg)');

                            // move pack to top
                            $('.pack-wrapper').css('z-index', '6');

                            // fade in glowing background
                            $('.bg-glow').stop(true).fadeIn(1000);
                        }
                    },
                    stop: function() {
                        if (!packDropped) {

                            // untilt the pack
                            $(this).css({
                                'left': '200px',
                                'top': '247px',
                                'transform': 'perspective(0) rotateY(0) scale(1)'
                            });

                            // move pack to bottom
                            $('.pack-wrapper').css('z-index', '2');

                            playAudio('pack_release');

                            // fade out glowing background
                            $('.bg-glow').stop(true).fadeOut(500);
                            
                            // start shaking pack again
                            $interval.cancel(shakeLoop);
                            shakeLoop = $interval(shakePack, shakeInterval);

                        }
                    }
                });

                $('.pack').mousedown(function() {
                    if (!packDropped) {
                        playAudio('pack_grab');

                        // grow pack
                        $(this).css('transform', 'scale(1.05)');

                        // stop shaking the pack
                        $('.pack-wrapper').trigger('stopRumble');
                        $timeout.cancel(startShake);
                        $interval.cancel(shakeLoop);
                    }
                }).mouseup(function() {
                    // if the pack's position is its original location, play the pack release sound
                    var spot = $(this).position();
                    if (Math.round(spot.left) == 192 && Math.round(spot.top) == 241) {
                        playAudio('pack_release');
                    }

                    // shrink pack
                    $(this).css('transform', 'perspective(0) rotateY(0) scale(1)');

                    // start shaking pack again
                    $interval.cancel(shakeLoop);
                    shakeLoop = $interval(shakePack, shakeInterval);
                });

                // handle drop zone
                $('.pack-drop').droppable({
                    tolerance: "touch",
                    drop: function(e, ui) {
                        packDrop();
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
                            $('.bg-glow').stop(true).fadeIn(1000);

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
                
                function packDrop() {
                    if (!packDropped) {
                        packDropped = true;

                        // stop shaking pack
                        $timeout.cancel(startShake);
                        $interval.cancel(shakeLoop);

                        // move pack to drop zone
                        $('.pack').css({
                            'left': '707px',
                            'top': '260px',
                            'transform': 'perspective(0) rotateY(0)'
                        });

                        // TODO: PLAY BURST SOUND

                        // fade out pack
                        $('.pack').fadeOut(0, function() {
                            // return hidden pack
                            $(this).css({
                                'left': '200px',
                                'top': '247px',
                                'transform': 'perspective(0) rotateY(0)'
                            });
                            
                            // fade out glow
                            $('.bg-glow').stop().fadeOut(0);
                            
                            // blur bg
                            el.addClass('blurred');
                            
                            // set cards and show
                            $('.cards').fadeIn(0);
                        });

                        // move back to bottom
                        $('.pack-wrapper').css('z-index', '2');
                        
                        // update card interactions
                        cardInteraction();
                    }
                };
                
                function getCardById (cardId, cards) {
                    for (var i = 0; i < cards.length; i++) {
                        if (cards[i].id === cardId) {
                            return cards[i];
                        }
                    }
                    return false;
                }
                
                function cardInteraction() {
                    cardsFlipped = 0;

                    $('.card').each(function(i) {
                        var card = this,
                            announcerRarities = ['rare', 'epic', 'legendary'];
                        
                        card.turned = false;
                        card.clicked = false;
                        card.rarity = $(card).attr('data-rarity').toLowerCase();
                        card.cardId = $(card).attr('data-card-id');
                        
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
                            
                            if (card.turned && !card.clicked) {
                                card.clicked = true;
                                cardsFlipped++;
                                
                                // add to pool
                                if (typeof scope.addCardToPool === 'function') {
                                    var poolCard = getCardById(card.cardId, scope.packs[scope.currentCards].cards);
                                    if (poolCard) {
                                        scope.$apply(function () {
                                            scope.addCardToPool(poolCard);
                                        });
                                    }
                                }
                                
                                if (cardsFlipped > 4) {
                                    $timeout(function() {
                                        playAudio('done_reveal');
                                        $timeout(function() {
                                            $('.btn-done').stop(true).fadeIn(750);
                                        }, 500);
                                    }, 500);
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
                            }
                        });

                    });

                }
                
                $('.btn-done').mousedown(function() {
                    if (!done) {
                        done = true;

                        playAudio('done_fade');

                        $('.btn-done').stop(true, true).fadeOut(1000);

                        $('.cards').fadeOut(1000, function() {
                            $('.card').removeClass('flipped-left flipped-right');
                            if (scope.currentCards + 1 < scope.packs.length) {
                                nextCards();
                            }
                        });

                        $('.bg-glow').hide(function() {
                            //burst.pause();
                            //burst.currentTime = 0;
                            //$('#pack-burst').css('z-index', '0').show();
                            //$('.bg-blur').fadeOut(1000);
                            
                            if (scope.currentPack + 1 < scope.packs.length) {
                                nextPack();
                                $('.pack').draggable("enable").fadeIn(0, function() {
                                    packDropped = false;
                                    
                                    el.removeClass('blurred');

                                    $interval.cancel(shakeLoop);
                                    shakeLoop = $interval(shakePack, shakeInterval);
                                });
                            } else {
                                console.log('goto build');
                                //$state.go(app.redbull.draft.build);
                            }
                            
                        });
                    }

                    $timeout(function() {
                        done = false;
                    }, 1000);
                });
                
                scope.$on('$destroy', function () {
                    $timeout.cancel(startShake);
                    $interval.cancel(shakeLoop);
                });

            }
        };
    }
]);