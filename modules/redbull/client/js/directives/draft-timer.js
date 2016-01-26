angular.module('redbull.directives')
.directive('draftTimer', ['$interval', function ($interval) {
    return {
        restrict: 'E',
        replace: true,
        templateUrl: ((tpl !== './') ? tpl + 'views/redbull/client/views/' : 'dist/views/redbull/client/views/') + 'directives/draft-timer.html',
        scope: {
            startTime: '=',
            timeLimit: '=',
            onTimeUp: '='
        },
        link: function (scope, el, attrs) {
            // vars
            var endTime = (scope.startTime + (scope.timeLimit * 60 * 1000)),
                currentTime, timeLeft, draftTimer;
            
            console.log(scope.timeLimit);
            
            init();
            
            function init() {
                updateTimes();
                setTime();
                if (currentTime < endTime) {
                    draftTimer = $interval(setTime, 1000);
                }
            }
            
            function updateTimes() {
                currentTime = new Date().getTime();
                timeLeft = endTime - currentTime;
            }
            
            
            scope.getTimeLeft = function () {
                return scope.timeLeft;
            };
            
            function getMins (time) {
                return Math.floor((time / 1000) / 60);
            }
            
            function getSecs(time) {
                var mins = getMins(time);
                var secs = Math.floor((time - (mins * 60 * 1000)) / 1000);
                if (secs < 10) { secs = '0' + secs; }
                return secs;
            }
            
            function setTime () {
                updateTimes();
                if (currentTime < endTime) {
                    scope.timeLeft = getMins(timeLeft) + ':' + getSecs(timeLeft);
                } else {
                    scope.timeLeft = '0:00';
                    $interval.cancel(draftTimer);
                    if (typeof scope.onTimeUp === 'function') {
                        scope.onTimeUp();
                    }
                }
            }
            
            
            scope.$on('destroy', function () {
                $interval.cancel(draftTimer);
            });
            
        }
    };
}]);