angular.module('redbull.directives')
.directive('redbullDraft', ['$timeout', '$interval',
    function ($timeout, $interval){
        return {
            restrict: 'A',
            scope: {
                packs: '=',
                isLoading: '=',
                currentPack: '='
            },
            link: function (scope, el, attrs) {
                var volume = .5,
                    startShake = null,
                    shakeLoop = null,
                    shakeInterval = 3000,
                    packDropped = false;

                function nextPack () {
                    scope.currentPack++;
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

                            // fade out non-glowing background
                            $('.bg').stop(true).fadeOut(1000);
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

                            // fade in non-glowing background
                            $('.bg').stop(true).fadeIn(500);
                            
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
                    // don't allow spacebar when we're not ready
                    if (!scope.isLoading && !packDropped) {
                        if ((e.keyCode || e.which) == 32) {
                            // disable pack dragging
                            $(".pack").draggable("disable");

                            // fade out non-glowing background
                            $('.bg').stop(true).fadeOut(1000);

                            // drop pack
                            packDrop();
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
                        var burst = $('#pack-burst')[0];
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
                    }
                };

                
                function drawCards(quality, cards) {
                    /*
                    // 
                    $('.card').each(function(i) {
                        $('div.card_front img', this).attr('src', cards[i]);
                    });

                    //Now for the fun stuff...
                    cardInteraction(quality);
                    */
                };

/*
function cardInteraction(quality) {

	//This variable will count the number of cards that have been clicked/shown each pack
	var cards_shown = 0;

	//For each card...
	$('.card').each(function(i) {

		//Start by clearing this card's flags
		this.turned = false, this.clicked = false;

		//Get this particular card's rarity
		var card_rarity;
		if (quality[i].indexOf('common') != -1)
			card_rarity = 'common';
		if (quality[i].indexOf('rare') != -1)
			card_rarity = 'rare';
		if (quality[i].indexOf('epic') != -1)
			card_rarity = 'epic';
		if (quality[i].indexOf('legendary') != -1)
			card_rarity = 'legendary';

		//When a card is hovered over...
		$(this).unbind('mouseenter').mouseenter(function() {

				//And it hasn't been turned over yet...
				if (!this.turned) {

					//Play the card mouseover sound
					this.card_hover = new Audio();
					this.card_hover.src = allAudio['card_hover'];
					this.card_hover.volume = volume;
					this.card_hover.play();

					//Then determine its rarity and set the background glow to the appropriate color
					var card_color;
					if (card_rarity == 'rare')
						card_color = '#0066ff';
					if (card_rarity == 'epic')
						card_color = '#cc33ff';
					if (card_rarity == 'legendary')
						card_color = '#ff8000';

					//Make it pretty, bitches (slightly enlarge the card and give it a hover glow)
					$(this).css({
						'transform': 'scale(1.15) rotate(0.0001deg)',
						'-webkit-transform': 'scale(1.15) rotate(0.0001deg)',
						'transition': 'transform 300ms',
						'-webkit-transition': '-webkit-transform 300ms'
					});
					$('.card_glow', this).css({
						'box-shadow': '0 0 75px ' + card_color,
						'transition': 'box-shadow 1000ms',
						'-webkit-transition': 'box-shadow 1000ms'
					});

				}

		})

		//When the user stops hovering over a card...
		.unbind('mouseleave').mouseleave(function() {
			if (!this.turned) {

				//Return it to its original size, and turn off the glow
				$(this).css({
					'transform': 'scale(1)',
					'-webkit-transform': 'scale(1)',
					'transition': 'transform 500ms',
					'-webkit-transition': '-webkit-transform 500ms'
				});
				$('.card_glow', this).css({
					'box-shadow': 'none',
					'transition': 'box-shadow 600ms',
					'-webkit-transition': 'box-shadow 600ms'
				});

				//Play a sound which denotes the user stopped hovering
				this.card_unhover = new Audio();
				this.card_unhover.src = allAudio['card_unhover'];
				this.card_unhover.volume = volume / 6;
				this.card_unhover.play();

			}
		})

		//When a card is clicked...
		.unbind('mousedown').mousedown(function(e) {

			//Set some flags for the element to prevent subsequent clicks and sound plays
			this.turned = true, this.clicked;
			if (this.turned && !this.clicked) {

				//Flag that the element has been clicked, and increment cards_shown
				this.clicked = true, cards_shown++;

				//Send the card's quality to be tallied for the stats panel
				tallyStats(quality[i]);

				//If all five cards have been revealed...
				if (cards_shown > 4) {
					//Then after a brief delay, show the 'Done' button and play its reveal sound
					setTimeout(function() {
						var done_reveal = new Audio();
						done_reveal.src = allAudio['done_reveal'];
						done_reveal.volume = volume;
						setTimeout(function() {
							$('#done').stop(true).fadeIn(750);
							done_reveal.play();
						}, 500);
					}, 500);
				}

				//Play the appropriate card turn effect for the card's rarity
				var turn_rarity = new Audio();
				turn_rarity.src = allAudio['card_turn_over_'+card_rarity]
				turn_rarity.volume = volume / 8; //These are so damn loud
				setTimeout(function() {
					turn_rarity.play();
				}, 200);

				//Play the appropriate announcer quote for the card's rarity
				var announcer = new Audio();
				if (quality[i] != 'common') {
					announcer.src = allAudio['announcer_'+quality[i]];
					announcer.volume = volume / 4; //These are loud too
					announcer.play();
				}

				//Determine which side of the card the user clicked on
				var cardX = e.pageX - $(this).offset().left;
				if (cardX < 116) {
					//Have it turn from the left
					var backDir = '-180deg',
						frontDir = '0deg';
				} else {
					//Have it turn from the right
					var backDir	= '180deg',
						frontDir = '360deg';
				}

				//Turn the card around
				$('div.card_back', this).css({
					'transform': 'perspective(1000px) rotateY('+backDir+')',
					'-webkit-transform': 'perspective(1000px) rotateY('+backDir+')',
					//'-webkit-filter': 'drop-shadow(0 0 3px white)',
					'transition': 'transform 800ms ease-in-out 300ms',
					'-webkit-transition': '-webkit-transform 800ms ease-in-out 300ms'
					//'-webkit-transition': '-webkit-filter 1667ms 333ms'
				});
				$('div.card_front', this).css({
					'transform': 'perspective(1000px) rotateY('+frontDir+')',
					'-webkit-transform': 'perspective(1000px) rotateY('+frontDir+')',
					//'-webkit-filter': 'drop-shadow(0 0 0 white)',
					'transition': 'transform 800ms ease-in-out 300ms',
					'-webkit-transition': '-webkit-transform 800ms ease-in-out 300ms'
					//'-webkit-transition': '-webkit-filter 333ms 1667ms'
				});
				$('.card_glow', this).css({
					'box-shadow': 'none',
					'transition': 'box-shadow 600ms',
					'-webkit-transition': 'box-shadow 600ms'
				});

			}

		});

	});

};
*/
            }
        };
    }
]);