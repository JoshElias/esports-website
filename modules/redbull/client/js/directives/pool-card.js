angular.module('redbull.directives')
.directive('poolCard', ['$compile', function ($compile) {
    return {
        restrict: 'A',
        scope: {
            tooltipImg: '=',
            cardId: '='
        },
        link: function (scope, el, attr) {
            scope.$watch('tooltipImg', function (newValue) {
                scope.tooltipImg = newValue;
                setTooltip();
            });
            
            function setTooltip () {
                var content = $compile('<img ng-src="'+scope.tooltipImg+'" alt="">')(scope);
                var id = 'tooltip-' + scope.cardId;
                if ($('#'+id).length) {
                    $('#'+id).html(content);
                } else {
                    var xPos = (attr['tooltipPos'] && attr['tooltipPos'] === 'left') ? -304 : 60;
                    el.wTooltip({
                        delay: 500,
                        offsetX: xPos,
                        offsetY: -50,
                        content: content,
                        style: false,
                        className: 'hs-card-tooltip',
                        id: id
                    });
                }
            }
            
            scope.$on('$destroy', function () {
                $('.hs-card-tooltip').remove();
            });
            
            setTooltip();
            
        }
    };
}]);