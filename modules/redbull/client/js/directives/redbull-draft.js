angular.module('redbull.directives')
.directive('redbullDraft', ['$timeout', '$interval',
    function ($timeout, $interval){
        return {
            restrict: 'A',
            scope: {
                packs: '=',
                isLoading: '=',
                currentPack: '=',
                currentCards: '='
            },
            link: function (scope, el, attrs) {
                var volume = .5,
                    startShake = null,
                    shakeLoop = null,
                    shakeInterval = 3000,
                    packDropped = false,
                    done = false,
                    burst = $('#pack-burst')[0],
                    cardsFlipped = 0;

                function nextPack () {
                    scope.currentPack++;
                    scope.$apply();
                }
                
                function nextCards () {
                    scope.currentCards++;
                    scope.$apply();
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
                    //shakeSound();
                    $('.pack-wrapper').trigger('startRumble');
                    $timeout(function() {
                        $('.pack-wrapper').trigger('stopRumble');
                    }, 750);
                }

                function shakeSound () {
                    var packShake = new Audio();
                    packShake.src = allAudio['pack_shake'];
                    packShake.volume = volume;
                    packShake.play();
                };
                
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
                
                // back button audio
                $('#back_button').mouseenter(function() {
                    var menu_button_hover = new Audio();
                    menu_button_hover.src = allAudio['menu_button_hover'];
                    menu_button_hover.volume = volume;
                    menu_button_hover.play();
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

                            // play release sound
                            /*var pack_release = new Audio();
                            pack_release.src = allAudio['pack_release'];
                            pack_release.volume = volume;
                            pack_release.play();*/

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
                        // audio
                        /*var pack_grab = new Audio();
                        pack_grab.src = allAudio['pack_grab'];
                        pack_grab.volume = volume;
                        pack_grab.play();*/

                        // grow pack
                        $(this).css('transform', 'scale(1.05)');

                        // stop shaking the pack
                        $('.pack-wrapper').trigger('stopRumble');
                        $timeout.cancel(startShake);
                        $interval.cancel(shakeLoop);
                    }
                }).mouseup(function() {
                    // if the pack's position is its original location, play the pack release sound
                    /*var spot = $(this).position();
                    
                    if (Math.round(spot.left) == 192 && Math.round(spot.top) == 241) {
                        var pack_release = new Audio();
                        pack_release.src = allAudio['pack_release'];
                        pack_release.volume = volume;
                        pack_release.play();
                    }*/

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

                        $('#pack-burst').css('z-index', '5');
                        burst.volume = volume / 2;
                        burst.play();

                        // fade out pack
                        $('.pack').fadeOut(0, function() {
                            // return hidden pack
                            $(this).css({
                                'left': '200px',
                                'top': '247px',
                                'transform': 'perspective(0) rotateY(0)'
                            });

                            // blur bg
                            $('.bg-blur').fadeIn(0);
                            
                            // set cards and show
                            $('.cards').delay(3250).fadeIn(0);
                            
                            // hide pack burst video
                            $('#pack-burst').delay(3250).fadeOut(1000);
                        });

                        // move back to bottom
                        $('.pack-wrapper').css('z-index', '2');
                        
                        // update card interactions
                        cardInteraction();
                    }
                };


                function cardInteraction() {
                    cardsFlipped = 0;

                    $('.card').each(function(i) {
                        this.turned = false;
                        this.clicked = false;

                        // TODO: CHECK RARITY OF CARD
                        
                        $(this).unbind('mouseenter').mouseenter(function() {
                            if (!this.turned) {
                                // TODO: PLAY CARD MOUSEOVER SOUND
                            }
                        })
                        .unbind('mouseleave').mouseleave(function() {
                            if (!this.turned) {
                                // TODO: PLAY CARD MOUSELEAVE SOUND
                            }
                        })
                        .unbind('mousedown').mousedown(function(e) {
                            this.turned = true, this.clicked;
                            
                            if (this.turned && !this.clicked) {
                                this.clicked = true;
                                cardsFlipped++;

                                if (cardsFlipped > 4) {
                                    $timeout(function() {
                                        // TODO: PLAY DONE REVEAL SOUND
                                        $timeout(function() {
                                            $('.btn-done').stop(true).fadeIn(750);
                                            // TODO: PLAY
                                        }, 500);
                                    }, 500);
                                }

                                // TODO: PLAY CARD RARITY SOUND
                                $timeout(function() {
                                    // TODO: PLAY
                                }, 200);

                                // TODO: PLAY ANNOUNCER RARITY SOUND

                                var cardX = e.pageX - $(this).offset().left;
                                if (cardX < 116) {
                                    $(this).addClass('flipped-left');
                                } else {
                                    $(this).addClass('flipped-right');
                                }
                            }
                        });

                    });

                }
                
                $('.btn-done').mousedown(function() {
                    if (!done) {
                        done = true;

                        // TODO: PLAY DONE FADE SOUND

                        $('.btn-done').stop(true, true).fadeOut(1000);

                        $('.cards').fadeOut(1000, function() {
                            $('.card').removeClass('flipped-left flipped-right');
                            if (scope.currentCards + 1 < scope.packs.length) {
                                nextCards();
                            }
                        });

                        $('.bg-glow').hide(function() {
                            burst.pause();
                            burst.currentTime = 0;
                            $('#pack-burst').css('z-index', '0').show();
                            $('.bg-blur').fadeOut(1000);
                            
                            if (scope.currentPack + 1 < scope.packs.length) {
                                nextPack();
                                $('.pack').draggable("enable").fadeIn(1000, function() {
                                    packDropped = false;
                                    
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
            }
        };
    }
]);