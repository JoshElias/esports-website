angular.module('redbull.directives')
.directive('body', ['$rootScope', '$state',
    function ($rootScope, $state){
        return {
            restrict: 'E',
            link: function (scope, el, attrs) {
                $rootScope.$on("$stateChangeSuccess", function (event, toState, toParams, fromState, fromParams) {
                    if ($state.includes('app.hs.draft') || $state.includes('app.hs.redbull.draft')) {
                        el.addClass('draft');
                    } else {
                        el.removeClass('draft');
                    }
                });
            }
        };
    }
]);