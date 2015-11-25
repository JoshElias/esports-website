angular.module('redbull.directives')
.directive('body', ['$rootScope', '$state',
    function ($rootScope, $state){
        return {
            restrict: 'E',
            link: function (scope, el, attrs) {
                $rootScope.$on("$stateChangeSuccess", function (event, toState, toParams, fromState, fromParams) {
                    if ($state.includes('app.redbull.draft')) {
                        el.addClass('draft');
                    } else {
                        el.removeClass('draft');
                    }
                });
            }
        };
    }
]);