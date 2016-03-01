angular.module('hotsSnapshot', [])
.run(
    ['$rootScope', '$window',
        function ($rootScope, $window) {
            
            
        }
    ]
)
.config(['$locationProvider', '$stateProvider', '$urlRouterProvider', '$controllerProvider', '$compileProvider', '$filterProvider', '$provide', '$httpProvider', '$bootboxProvider', '$sceDelegateProvider',
    function ($locationProvider, $stateProvider, $urlRouterProvider, $controllerProvider, $compileProvider, $filterProvider, $provide, $httpProvider, $bootboxProvider, $sceDelegateProvider) {
        var moduleTpl = (tpl !== './') ? tpl + 'views/hotsSnapshot/client/views/' : 'dist/views/hotsSnapshot/client/views/';
        
        $stateProvider
        .state('app.hots.snapshots', {
            abstract: 'true',
            url: '/meta-snapshot',
            views: {
                hots: {
                    templateUrl: moduleTpl + 'snapshots.html'
                }
            }
        })
        .state('app.hots.snapshots.snapshot', {
            url: '/test',
            views: {
                hotsSnapshots: {
                    templateUrl: moduleTpl + 'snapshot.html'
                }
            }
        })
    }]
)
;