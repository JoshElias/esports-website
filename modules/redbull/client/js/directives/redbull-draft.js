angular.module('redbull.directives')
.directive('redbullDraft', ['$timeout', '$interval', '$rootScope', 'Util',
    function ($timeout, $interval, $rootScope, Util){
        return {
            restrict: 'A',
            templateUrl: tpl + 'dist/views/redbull/client/views/directives/redbull-draft.html',
            scope: {
                packs: '=',
                isLoading: '=',
                currentPack: '=',
                audioFiles: '=',
                addCardToPool: '='
            },
            link: function (scope, el, attrs) {
                var startShake = null,
                    shakeLoop = null,
                    shakeInterval = 10000,
                    packDropped = false,
                    done = false,
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
                
                scope.expansions = [];
                scope.cardsFlipped = 0;
                
                // init expansions and currentPack
                for (var key in scope.packs) {
                    scope.expansions.push(key);
                    scope.currentPack[key] = 0;
                };
                
                // check if any expansion still has packs to open
                function hasMorePacks () {
                    for (var i = 0; i < scope.expansions.length; i++) {
                        var key = scope.expansions[i];
                        if (scope.currentPack[key] < scope.packs[key].packs.length) {
                            return true;
                        }
                    }
                    return false;
                }
                
                // get first expansion that has packs left to be opened
                function nextExpansion () {
                    for (var i = 0; i < scope.expansions.length; i++) {
                        var key = scope.expansions[i];
                        if (scope.currentPack[key] < scope.packs[key].packs.length) {
                            return key;
                        }
                    }
                    return false;
                }
                
                // inc pack for expansion
                function nextPack (expansion) {
                    scope.currentPack[expansion]++;
                }
                
                // play audio clip
                scope.playAudio = function ( audioName ) {
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
                
                scope.fastForwardNext = function () {
                    if (fastForward) {
                        $timeout(nextEvent, fastForwardSpeed);
                    }
                };
                
                // start fast forwarding
                scope.fastForward = function () {
                    if (fastForward) { return false; }
                    fastForward = true;
                    el.addClass('fast-forward');
                    nextEvent();
                };
                
                // shake pack
                function shakePack () {
                    scope.playAudio('pack_shake');
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

                                    scope.playAudio('pack_release');

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
                            
                            scope.playAudio('pack_grab');

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
                        var expansion = ui.draggable.attr('data-expansion');
                        packDrop(expansion);
                    }
                });
                
                // enable spacebar
                $(window).keydown(function(e) {
                    var card,
                        btn,
                        expansion = nextExpansion();
                    
                    // don't allow spacebar when we're not ready
                    if (!scope.isLoading && !packDropped) {
                        if ((e.keyCode || e.which) === 32) {
                            // disable pack dragging
                            $(".pack").draggable("disable");

                            // fade in glowing background
                            $('.bg-glow').stop(true).fadeIn(fadeDuration);

                            // drop pack
                            packDrop(expansion);
                        }
                    } else if (!scope.isLoading && packDropped) {
                        if ((e.keyCode || e.which) === 32) {
                            // flip next cards
                            if (scope.cardsFlipped < 5) {
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
                
                function packDrop(expansion) {
                    if (!packDropped) {
                        packDropped = true;
                        scope.cardsFlipped = 0;
                        currentExpansion = expansion;
                        lastEvent = EVENT_PACK_DROPPED;
                        
                        // stop shaking pack
                        $timeout.cancel(startShake);
                        $interval.cancel(shakeLoop);
                        
                        var $pack = $('.pack.' + Util.slugify(expansion));
                        
                        // move pack to drop zone
                        //$('.pack').css({
                        //    'left': '707px',
                        //    'top': '260px',
                        //    'transform': 'perspective(0) rotateY(0)'
                        //});

                        // TODO: PLAY BURST SOUND

                        // fade out pack
                        $pack.fadeOut(0, function() {
                            // return hidden pack
                            $(this).css({
                                'left': '0px',
                                'top': '0px',
                                'transform': 'perspective(0) rotateY(0)'
                            });
                            
                            // fade out glow
                            $('.bg-glow').stop().fadeOut(0);
                            
                            // blur bg
                            //el.addClass('blurred');
                            
                            // set cards and show
                            $('.cards').fadeIn(((!fastForward) ? fadeDuration : fadeDurationFF), function () {
                                if (scope.currentPack[currentExpansion] + 1 < scope.packs[currentExpansion].packs.length) {
                                    $pack.draggable("enable").fadeIn(0);
                                }
                                
                                if (fastForward) {
                                    nextEvent();
                                }
                            });
                        });

                        // move back to bottom
                        $('.pack-wrapper').css('z-index', '2');
                        
                    }
                };
                
                scope.cardFlip = function ($event, cardElement) {
                    scope.cardsFlipped++;
                    var cardX = $event.pageX - $(cardElement).offset().left;
                    if (cardX < 116) {
                        $(cardElement).addClass('flipped-left');
                    } else {
                        $(cardElement).addClass('flipped-right');
                    }
                };
                
                scope.cards = function () {
                    if (!currentExpansion) { return []; }
                    var cards = scope.packs[currentExpansion].packs[scope.currentPack[currentExpansion]].cards;
                    return cards;
                };
                
                // show done button
                scope.showDoneButton = function () {
                    $timeout(function() {
                        scope.playAudio('done_reveal');
                        $timeout(function() {
                            $('.btn-done').stop(true).fadeIn(((!fastForward) ? fadeDuration : fadeDurationFF), function () {
                                if (fastForward) {
                                    nextEvent();
                                }
                            });
                        }, ((!fastForward) ? fadeDuration / 2 : fadeDurationFF / 2));
                    }, ((!fastForward) ? fadeDuration / 2 : fadeDurationFF / 2));
                };
                
                // done mouse down
                scope.doneMouseDown = function () {
                    if (!done) {
                        var anotherPack = (scope.currentPack[currentExpansion] + 1 < scope.packs[currentExpansion].packs.length);
                        done = true;
                        lastEvent = EVENT_DONE_CLICKED;
                        
                        scope.playAudio('done_fade');

                        $('.btn-done').stop(true, true).fadeOut(((!fastForward) ? fadeDuration : fadeDurationFF));
                        
                        if (!anotherPack) {
                            scope.expansions.splice(scope.expansions.indexOf(currentExpansion), 1);
                        }
                        
                        $('.cards').fadeOut(((!fastForward) ? fadeDuration : fadeDurationFF), function() {
                            $('.card').removeClass('flipped-left flipped-right');
                            if (anotherPack) {
                                nextPack(currentExpansion);
                            }
                            if (anotherPack || hasMorePacks()) {
                                packDropped = false;

                                //el.removeClass('blurred');

                                $interval.cancel(shakeLoop);
                                shakeLoop = $interval(shakePack, shakeInterval);

                                // reset done
                                $timeout(function() {
                                    done = false;
                                }, ((!fastForward) ? fadeDuration : fadeDurationFF));
                                
                                if (fastForward) {
                                    nextEvent();
                                }
                            } else {
                                console.log('goto build');
                                lastEvent = EVENT_DRAFT_COMPLETE;
                                //$state.go(app.redbull.draft.build);
                            }
                        });
                    }
                };
                
                scope.$on('$destroy', function () {
                    $timeout.cancel(startShake);
                    $interval.cancel(shakeLoop);
                });

            }
        };
    }
]);