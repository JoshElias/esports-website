'use strict';

angular.module('app.animations', ['ngAnimate'])
.animation('.slide-animation', function () {
        return {
            addClass: function (element, className, done) {
                var scope = element.scope();

                if (className == 'active') {
                    element.addClass('active');
                    
                    var startPoint = element.parent().width();
                    if(scope.banner.direction !== 'right') {
                        startPoint = -startPoint;
                    }
                    
                    element.css({ left: startPoint });
                    element.find('.banner-panel').css({ left: startPoint });
                    
                    TweenMax.to(element, 1, { left: 0, ease: Power2.easeInOut }, done);
                    TweenMax.to(element.find('.banner-panel'), 1.2, { left: '50%', ease: Back.easeOut });
                }
                else {
                    done();
                }
            },
            beforeRemoveClass: function (element, className, done) {
                var scope = element.scope();

                if (className == 'active') {
                    var endPoint = element.parent().width();
                    if(scope.banner.direction === 'right') {
                        endPoint = -endPoint;
                    }
                    
                    TweenMax.to(element, 1, { left: endPoint, ease: Power2.easeInOut }, done);
                    TweenMax.to(element.find('.banner-panel'), 1.2, { left: endPoint, ease: Back.easeOut });
                }
                else {
                    done();
                }
            }
        };
    });