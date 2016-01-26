angular.module('redbull.directives')
.directive('draftVolume', [function () {
    return {
        restrict: 'E',
        replace: true,
        transclude: true,
        templateUrl: ((tpl !== './') ? tpl + 'views/redbull/client/views/' : 'dist/views/redbull/client/views/') + 'directives/draft-volume.html',
        link: function (scope, el, attrs) {
            
            var slider = $('#volume-slider'),
                tooltip = $('.volume-tooltip');

            tooltip.hide();
            
            scope.toggleMuted = function () {
                if (scope.volume === 0) { return false; }
                scope.muted = !scope.muted;
            }
            
            slider.slider({
                range: "min",
                min: 0,
                max: 100,
                value: scope.volume,

                start: function(event,ui) {
                    var value = slider.slider('value');
                    tooltip.css('left', value + '%').text(ui.value);
                    scope.volume = value;

                    tooltip.fadeIn('fast');
                },

                slide: function(event, ui) {
                    var value = slider.slider('value');
                    tooltip.css('left', value + '%').text(ui.value);
                    scope.volume = value;
                    
                    if (value === 0) {
                        scope.muted = true;
                    } else {
                        scope.muted = false;
                    }
                },

                stop: function(event,ui) {
                    var value = slider.slider('value');
                    tooltip.css('left', value + '%').text(ui.value);
                    scope.volume = value;

                    tooltip.fadeOut('fast');
                    
                    if (value === 0) {
                        scope.muted = true;
                    } else {
                        scope.muted = false;
                    }
                },
            });
            
        }
    };
}]);