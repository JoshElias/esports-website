angular.module('redbull.directives')
.directive('poolCard', ['$compile', function ($compile) {
    return {
        restrict: 'A',
        scope: {
            tooltipImg: '='
        },
        link: function (scope, el, attr) {
            scope.$watch('tooltipImg', function (newValue) {
                scope.tooltipImg = newValue;
                el.wTooltip(false);
                setTooltip();
            });
            
            function setTooltip () {
                var xPos = (attr['tooltipPos'] && attr['tooltipPos'] === 'left') ? -344 : 60;
                el.wTooltip({
                    delay: 500,
                    offsetX: xPos,
                    offsetY: -40,
                    content: $compile('<img ng-src="'+scope.tooltipImg+'" alt="">')(scope),
                    style: false,
                    className: 'hs-card-tooltip'
                });
            }
            
            setTooltip();
        }
    };
}]);