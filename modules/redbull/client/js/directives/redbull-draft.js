angular.module('redbull.directives')
.directive('redbullDraft', ['$q', '$timeout', '$interval', '$rootScope', 'Util', 
    function ($q, $timeout, $interval, $rootScope, Util){
        return {
            restrict: 'A',
            templateUrl: ((tpl !== './') ? tpl + 'views/redbull/client/views/' : 'dist/views/redbull/client/views/') + 'directives/redbull-draft.html',
            scope: {
                packs: '=',
                isLoading: '=',
                currentPack: '=',
                audioFiles: '=',
                volume: '=',
                muted: '=',
            },
            link: function (scope, el, attrs) {
                var startShake = null,
                    shakeLoop = null,
                    shakeInterval = 10000,
                    packDropped = false,
                    isDragging = false,
                    done = false,
                    audioPath = (tpl !== './') ? 'audio/' : 'dist/audio/',
                    fastForwardSpeed = 500,
                    fastForward = false,
                    fadeDuration = 1000,
                    fadeDurationFF = 200,
                    doneDurationFF = 500,
                    currentExpansion = null;
                
                scope.mobileCardpool = false;
                scope.draftComplete = false;
                scope.cardPool = [];
                scope.expansions = [];
                scope.packsCount = [];
                scope.cardsFlipped = 0;
                
                // init expansions and currentPack
                for (var key in scope.packs) {
                    scope.expansions.push(key);
                    scope.currentPack[key] = 0;
                    scope.packsCount[key] = scope.packs[key].packs.length;
                };
                
                // watch current pack
                scope.$watch('currentPack', function (newValue) {
                    scope.currentPack = newValue;
                });
                
                // watch loading
                scope.$watch('isLoading', function (newValue) {
                    scope.isLoading = newValue;
                });
                
                scope.getIsLoading = function () {
                    return scope.isLoading;
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
                
                // return number of packs remaining in stack for given expansion
                scope.packTabCount = function (expansion) {
                    return scope.packsCount[expansion];
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
                
                // expansion to class
                scope.expansionToClass = function (expansion) {
                    return Util.slugify(expansion);
                };
                
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
                    if (scope.volume === 0 || scope.muted) { return false; }
                    var audio = new Audio();
                    audio.src = $rootScope.app.cdn + audioPath + scope.audioFiles[audioName].file;
                    audio.load();
                    audio.volume = scope.audioFiles[audioName].volume * (scope.volume / 100);
                    audio.playbackRate = (!fastForward) ? 1 : 2;
                    audio.play();
                }
                
                // go to next event
                function nextEvent() {
                    var e = $.Event('keydown');
                    e.which = 32;
                    e.keyCode = 32;
                    $timeout(function () {
                        $(window).trigger(e);
                    });
                }
                
                // do next even in fast forward
                scope.fastForwardNext = function () {
                    if (fastForward) {
                        $timeout(nextEvent, fastForwardSpeed);
                    }
                };
                
                // return if fast forwarding
                scope.isFastForward = function () {
                    return fastForward;
                };

                // start fast forwarding
                scope.fastForwardToggle = function () {
                    if (!fastForward) {
                        fastForward = true;
                        el.addClass('fast-forward');
                        nextEvent();
                    } else {
                        fastForward = false;
                        el.removeClass('fast-forward');
                    }
                };
                
                // shake pack
                function shakePack () {
                    scope.playAudio('pack_shake');
                    $('.pack-wrapper').trigger('startRumble');
                    $timeout(function() {
                        $('.pack-wrapper').trigger('stopRumble');
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
                
                // init pack shaking timers
                startShake = $timeout(function() {
                    shakePack();
                    shakeLoop = $interval(shakePack, shakeInterval);
                }, shakeInterval);

                // handle cursor icon changes
                el.mousedown(function(e) {
                    if (!fastForward) {
                        if ($(e.target).is('.pack')) {
                            el.addClass('grabbing');
                        } else {
                            el.addClass('clicking');
                        }
                    }
                }).mouseup(function() {
                    el.removeClass('grabbing clicking');
                });
                
                scope.enablePacks = function () {
                    
                    // pack rumbling
                    $('.pack-wrapper').jrumble();

                    // pack dragging
                    $('.pack').each(function (i) {
                        var pack = this;

                        $(pack).draggable({
                            containment: ".draft",
                            scroll: false,
                            revert: true,
                            start: function() {
                                if (packDropped) {
                                    return false;
                                } else {

                                    // remove one from packs count
                                    var expansion = $(pack).attr('data-expansion');
                                    scope.$apply(function () {
                                        scope.packsCount[expansion]--;
                                    });
                                    
                                    // change mouse icon for grab
                                    el.addClass('grabbing');
                                    
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

                                    // add one to packs count
                                    var expansion = $(pack).attr('data-expansion');
                                    scope.$apply(function () {
                                        scope.packsCount[expansion]++;
                                    });

                                    // play audio
                                    scope.playAudio('pack_release');

                                    // move pack wrapper to bottom
                                    $(pack).closest('.expansion-wrapper').css('z-index', '100');

                                    // fade out glowing background
                                    if ($('.pack.ui-draggable-dragging').length === 1) {
                                        // remove mouse icon for grab
                                        el.removeClass('grabbing');

                                        $('.bg-glow').stop(true).removeClass('glow-pulse').fadeOut(fadeDuration / 2);

                                        // start shaking pack again
                                        stopShakeTimer();
                                        startShakeTimer();
                                    }

                                }
                            }
                        });
                    });

                    $('.pack').mousedown(function(event) {
                        // stop prop
                        event.stopPropagation();

                        if (!packDropped) {

                            var pack = this;

                            // play audio
                            scope.playAudio('pack_grab');

                            // move pack wrapper to top
                            $(pack).closest('.expansion-wrapper').css('z-index', '103');

                            // stop shaking the pack
                            $(pack).trigger('stopRumble');

                            // stop shaking the pack
                            stopShakeTimer();
                            
                        }
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
                        packDrop(expansion, 'mouse');
                    }
                });
                
                // enable spacebar
                $(window).keydown(function(e) {
                    // only spacebar
                    if ((e.keyCode || e.which) === 32) {
                        
                        // don't allow space bar if fast forwarding
                        if (fastForward && e.hasOwnProperty('originalEvent')) { return false };

                        // spacebar to drop pack
                        if (!scope.isLoading && !packDropped && $('.pack.ui-draggable-dragging').length === 0) {
                                
                                // drop pack
                                packDrop(null, 'spacebar');
                        
                        // spacebar to flip card / click done
                        } else if (!scope.isLoading && packDropped) {
                            var card, btn;
                            
                            // flip next
                            if (scope.cardsFlipped < 5) {
                                
                                card = $('.card').not('.flipped-left').not('.flipped-right').eq(0);
                                if (card.is(':visible')) {
                                    card.mousedown();
                                }
                            
                            // click done button
                            } else {
                                
                                btn = $('.btn-done');
                                if (btn.is(':visible')) {
                                    $timeout(function () {
                                        btn.mousedown();
                                    }, (!fastForward) ? 0 : doneDurationFF);
                                }
                            }
                        }
                    }
                });

                // stop scrolling with spacebar
                $(window).onkeydown = function(e) { 
                    return !(e.keyCode == 32);
                };
                
                function packDrop(expansion, droppedBy) {
                    if (!packDropped) {
                        packDropped = true;
                        scope.cardsFlipped = 0;
                        expansion = currentExpansion = expansion || nextExpansion();
                        var anotherPack = hasAnotherPack();
                        var $pack = $('.pack.' + Util.slugify(expansion));

                        // disable pack dragging
                        $(".pack").draggable("disable");
                        
                        // if fast forwarding remove one from pack count
                        if (fastForward || droppedBy === 'spacebar') {
                            scope.$apply(function () {
                                scope.packsCount[expansion]--;
                            });
                        }

                        // stop shaking pack
                        stopShakeTimer();
                        
                        // play audio for pack burst
                        scope.playAudio('pack_burst');

                        // fade out pack
                        $pack.fadeOut(0, function() {
                            if (!anotherPack) {
                                $pack.closest('.expansion-wrapper').slideUp(fadeDuration);
                            }
                            
                            // return hidden pack
                            $pack.css({
                                'left': '0px',
                                'top': '0px',
                                //'transform': 'scale(1) perspective(0) rotateY(0)'
                            });
                            
                            // fade out glow
                            $('.bg-glow').removeClass('glow-pulse').stop().fadeOut(((!fastForward) ? fadeDuration : fadeDurationFF));
                            
                            // blur bg
                            el.addClass('blurred');
                            
                            // set cards and show
                            $('.cards').fadeIn(((!fastForward) ? fadeDuration : fadeDurationFF), function () {
                                if (anotherPack) {
                                    $pack.fadeIn(0);
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
                scope.doneMouseDown = function ($event) {
                    if (fastForward && $event.hasOwnProperty('originalEvent')) { return false; }
                    
                    if (!done) {
                        var anotherPack = hasAnotherPack();
                        done = true;
                        
                        // enable pack dragging
                        $('.pack').draggable('enable');
                        
                        // play audio
                        scope.playAudio('done_fade');
                        
                        // fade out done button
                        $('.btn-done').stop(true, true).fadeOut(((!fastForward) ? fadeDuration / 2 : fadeDurationFF));
                        
                        // remove blur
                        el.removeClass('blurred');

                        $('.cards').fadeOut(((!fastForward) ? fadeDuration / 2 : fadeDurationFF), function() {
                            if (!anotherPack) {
                                scope.expansions.splice(scope.expansions.indexOf(currentExpansion), 1);
                            }
                        
                            packDropped = false;

                            $('.card').removeClass('flipped-left flipped-right');
                            if (anotherPack) {
                                nextPack(currentExpansion);
                            }
                            if (anotherPack || hasMorePacks()) {

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
                                if (fastForward) {
                                    fastForward = false;
                                    el.removeClass('fast-forward');
                                }
                                stopShakeTimer();
                                scope.draftComplete = true;
                            }
                        });
                    }
                };
                
                scope.$on('$destroy', function () {
                    stopShakeTimer();
                });
                
                // card pool
                // check if card exists in pool
                function cardExistsInPool (card) {
                    for (var i = 0; i < scope.cardPool.length; i++) {
                        if (scope.cardPool[i].card.id === card.id) {
                            return i;
                        }
                    }
                    return -1;
                }

                // add card to pool
                scope.addCardToPool = function (card) {
                    var cardIndex = cardExistsInPool(card);
                    if (cardIndex !== -1) {
                        scope.cardPool[cardIndex].qty++;
                    } else {
                        scope.cardPool.push({
                            qty: 1,
                            card: card
                        });
                    }
                }

                // sorted card pool
                scope.sortedPool = function () {
                    var weights = {
                        'Weapon' : 0,
                        'Spell': 1,
                        'Minion': 2
                    };

                    function dynamicSort(property) {
                        return function (a, b) {
                            if (property == 'cardType') {
                                if (weights[a[property]] < weights[b[property]]) return -1;
                                if (weights[a[property]] > weights[b[property]]) return 1;
                            } else {
                                if (a[property] < b[property]) return -1;
                                if (a[property] > b[property]) return 1;
                            }
                            return 0;
                        }
                    }

                    function dynamicSortMultiple() {
                        var props = arguments;
                        return function (a, b) {
                            var i = 0,
                                result = 0;

                            while(result === 0 && i < props.length) {
                                result = dynamicSort(props[i])(a.card, b.card);
                                i++;
                            }
                            return result;
                        }
                    }

                    return scope.cardPool.sort(dynamicSortMultiple('cost', 'cardType', 'name'));
                };

            }
        };
    }
]);