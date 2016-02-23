angular.module('hotsModule', [
    'hotsSnapshot'
])
.run(
    ['$rootScope', '$window',
        function ($rootScope, $window) {
            
            console.log('sup');
            
        }
    ]
)
.config(
    ['$locationProvider', '$stateProvider', '$urlRouterProvider', '$controllerProvider', '$compileProvider', '$filterProvider', '$provide', '$httpProvider', '$bootboxProvider', '$sceDelegateProvider',
    function ($locationProvider, $stateProvider, $urlRouterProvider, $controllerProvider, $compileProvider, $filterProvider, $provide, $httpProvider, $bootboxProvider, $sceDelegateProvider) {

        app.controller = $controllerProvider.register;
        app.directive  = $compileProvider.directive;
        app.filter     = $filterProvider.register;
        app.factory    = $provide.factory;
        app.service    = $provide.service;
        app.constant   = $provide.constant;
        app.value      = $provide.value;

        Stripe.setPublishableKey('pk_live_2BNbCCvFcOfU0awquAaYrHZo');

        $bootboxProvider.setDefaults({ locale: "en" });

        $locationProvider.html5Mode(true);
        $httpProvider.interceptors.push('AuthInterceptor');

        // cdn templates
        tpl = tpl || '';

        $sceDelegateProvider.resourceUrlWhitelist([
            'self',
            tpl + '**'
        ]);

        var throw404 = function ($state) {
            var options = {
                location: "replace",
                inherit: true,
                notify: true,
                relative: $state.$current
            }

            $state.transitionTo('app.404', {}, options);
        }

        // ignore ng-animate on font awesome spin
        //$animateProvider.classNameFilter(/^((?!(fa-spin)).)*$/);

        $urlRouterProvider.otherwise(function ($injector, $location) {
            $injector.invoke(['$state', function ($state) {
                return throw404($state)
            }]);
        });

        $stateProvider
        .state('app', {
            abstract: true,
            url: '/',
            views: {
                root: {
                    templateUrl: tpl + 'views/frontend/index.html',
                    controller: 'RootCtrl'
                }
            },
            resolve: {
              // Load the current user data if we don't have it
                currentUser: ['User', 'LoopBackAuth',
                    function(User, LoopBackAuth) {
                        if(User.isAuthenticated() && !LoopBackAuth.currentUserData) {
                          return User.getCurrent().$promise;
                        }
                        return LoopBackAuth.currentUserData;
                    }
                ]
            },
            onEnter: ['$cookies', '$state', 'EventService', 'LoginModalService', 'AlertService', 'Util', function($cookies, $state, EventService, LoginModalService, AlertService, Util) {
                // look for redirect cookie
                var redirectState = $cookies.get("redirectStateString");
                if(redirectState) {
                    redirectState = JSON.parse(redirectState);
                    $cookies.remove("redirectStateString");
                    $state.go(redirectState.name, redirectState.params);
                    return;
                }

                var thirdPartyError = Util.getAuthCookie("thirdPartyError");
                if(thirdPartyError) {
                    if (!redirectState) {
                        $cookies.remove("thirdPartyError");
                        LoginModalService.showModal('login');
                    }

                    AlertService.setError({ persist: true, show: true, msg: thirdPartyError });
                }
            }]
        })
    }]
)
;