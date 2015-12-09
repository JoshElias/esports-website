angular.module('redbull.directives')
.directive('redbullDraft', ['$q', '$timeout', '$interval', '$rootScope', 'Util',
    function ($q, $timeout, $interval, $rootScope, Util){
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

                // watch current pack
                scope.$watch('currentPack', function (newValue) {
                    scope.currentPack = newValue;
                });
                
                // watch loading
                scope.$watch('isLoading', function (newValue) {
                    scope.isLoading = newValue;
                });

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
                
                // return number of packs remaining in stack for given expansion
                scope.packTabCount = function (expansion) {
                    var isOpening = $('.pack.' + Util.slugify(expansion)).is('.ui-draggable-dragging') || (packDropped && currentExpansion === expansion);
                    var packCount = scope.packs[expansion].packs.length - scope.currentPack[expansion];
                    if (isOpening) {
                        packCount--;
                    }
                    return packCount;
                };
                
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
                
                function hasAnotherPack () {
                    if (!currentExpansion) { return false; }
                    return (scope.currentPack[currentExpansion] + 1 < scope.packs[currentExpansion].packs.length);
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
                
                // temp start fast forward for debugging
                $(window).keydown(function(e) {
                    if ((e.keyCode || e.which) == 65) {
                        scope.fastForward();
                    }
                });
                
                // go to next event for fast forward
                function nextEvent() {
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
                    $('.pack').trigger('startRumble');
                    $timeout(function() {
                        $('.pack').trigger('stopRumble');
                    }, 750);
                }
                
                // start shaking pack timer
                function startShakeTimer () {
                    shakeLoop = $interval(shakePack, shakeInterval);
                }
                
                // stop shaking pack timer
                function stopShakeTimer () {
                    $timeout.cancel(startShake);
                    $interval.cancel(shakeLoop);
                }
                
                // pack rumbling
                //$('.pack').each(function (i) {
                //    this.jrumble();
                //});
                
                // init pack shaking timers
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

                                    // enable draggable
                                    $(pack).data('draggable', true);

                                    // stop shaking the pack
                                    stopShakeTimer();

                                    // fade in glowing background
                                    $('.bg-glow').stop(true).fadeIn(fadeDuration, function () {
                                        $(this).addClass('glow-pulse');
                                    });

                                }
                            },
                            stop: function() {
                                if (!packDropped) {

                                    // play audio
                                    scope.playAudio('pack_release');

                                    // move pack wrapper to bottom
                                    $(pack).closest('.pack-wrapper').css('z-index', '100');

                                    // fade out glowing background
                                    $('.bg-glow').stop(true).removeClass('glow-pulse').fadeOut(fadeDuration / 2);

                                    // start shaking pack again
                                    stopShakeTimer();
                                    startShakeTimer();
                                
                                }
                            }
                        });
                    });

                    $('.pack').mousedown(function(event) {
                        if (packDropped) { return false; }

                        // stop prop
                        event.stopPropagation();
                        
                        var pack = this;

                        // play audio
                        scope.playAudio('pack_grab');
                        
                        // move pack wrapper to top
                        $(pack).closest('.pack-wrapper').css('z-index', '103');
                        
                        // stop shaking the pack
                        $(pack).trigger('stopRumble');

                        // stop shaking the pack
                        stopShakeTimer();
                    
                    }).mouseup(function() {
                        // TODO: doesn't work
                        // if the pack's position is its original location, play the pack release sound
                        //var spot = $(this).position();
                        //if (Math.round(spot.left) == 192 && Math.round(spot.top) == 241) {
                        //    playAudio('pack_release');
                        //}

                        // start shaking pack again
                        stopShakeTimer();
                        startShakeTimer();
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
                    // don't allow spacebar when we're not ready
                    if (!scope.isLoading && !packDropped) {
                        if ((e.keyCode || e.which) === 32) {
                            // disable pack dragging
                            $(".pack").draggable("disable");

                            // drop pack
                            packDrop();
                        }
                    } else if (!scope.isLoading && packDropped) {
                        if ((e.keyCode || e.which) === 32) {
                            var card, btn;
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
                        expansion = currentExpansion = expansion || nextExpansion();
                        var anotherPack = hasAnotherPack();
                        var $pack = $('.pack.' + Util.slugify(expansion));
                        
                        // stop shaking pack
                        stopShakeTimer();
                        
                        // TODO: PLAY BURST SOUND

                        // fade out pack
                        $pack.fadeOut(0, function() {
                            if (!anotherPack) {
                                $pack.closest('.pack-wrapper').slideUp(fadeDuration);
                            }
                            
                            // return hidden pack
                            $pack.css({
                                'left': '0px',
                                'top': '0px',
                                //'transform': 'scale(1) perspective(0) rotateY(0)'
                            });
                            
                            // fade out glow
                            $('.bg-glow').stop().fadeOut(0);
                            
                            // blur bg
                            el.addClass('blurred');
                            
                            // set cards and show
                            $('.cards').fadeIn(((!fastForward) ? fadeDuration : fadeDurationFF), function () {
                                if (anotherPack) {
                                    $pack.draggable("enable").fadeIn(0);
                                }
                                
                                if (fastForward) {
                                    nextEvent();
                                }
                            });
                        });

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
                        var anotherPack = hasAnotherPack();
                        done = true;
                        
                        // play audio
                        scope.playAudio('done_fade');
                        
                        // fade out done button
                        $('.btn-done').stop(true, true).fadeOut(((!fastForward) ? fadeDuration : fadeDurationFF));
                        
                        // remove blur
                        el.removeClass('blurred');
                        
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

                                // start shaking pack
                                stopShakeTimer();
                                startShakeTimer();

                                // reset done
                                $timeout(function() {
                                    done = false;
                                }, ((!fastForward) ? fadeDuration : fadeDurationFF));
                                
                                if (fastForward) {
                                    nextEvent();
                                }
                            } else {
                                console.log('goto build');
                                //$state.go(app.redbull.draft.build);
                            }
                        });
                    }
                };
                
                scope.$on('$destroy', function () {
                    stopShakeTimer();
                });

            }
        };
    }
]);