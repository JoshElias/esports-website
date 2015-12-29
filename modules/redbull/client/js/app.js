'use strict';

var redbull = angular.module('app.redbull', [
    'app',
    'redbull.controllers',
    'redbull.services',
    'redbull.filters',
    'redbull.directives',
    'redbull.animations',
])
.run([
    function() {
    }
])
.config(['$stateProvider', '$controllerProvider', '$compileProvider', '$filterProvider', '$provide',
    function($stateProvider, $controllerProvider, $compileProvider, $filterProvider, $provide) {

        redbull.controller = $controllerProvider.register;
        redbull.directive  = $compileProvider.directive;
        redbull.filter     = $filterProvider.register;
        redbull.factory    = $provide.factory;
        redbull.service    = $provide.service;
        redbull.constant   = $provide.constant;
        redbull.value      = $provide.value;
        
        // cdn templates
        var moduleTpl = (tpl !== './') ? tpl + 'views/redbull/client/views/' : 'dist/views/redbull/client/views/';

        
        $stateProvider
        .state('app.redbull', {
            abstract: true,
            url: 'redbull',
            views: {
                content: {
                    templateUrl: moduleTpl + 'index.html'
                }
            }
        })
        .state('app.redbull.home', {
            url: '',
            views: {
                redbull: {
                    templateUrl: moduleTpl + 'home.html',
                    controller: 'RedbullHomeCtrl'
                }
            }
        })
        .state('app.redbull.draft', {
            abstract: true,
            url: '/draft',
            views: {
                redbull: {
                    templateUrl: moduleTpl + 'draft.html',
                    controller: 'DraftCtrl'
                }
            }
        })
        .state('app.redbull.draft.packs', {
            url: '',
            views: {
                'redbull-draft': {
                    templateUrl: moduleTpl + 'draft.packs.html',
                    controller: 'DraftPacksCtrl',
                    resolve: {
                        cards: ['Card', function (Card) {
                            return Card.find({
                                filter: {
                                    where: {
                                        deckable: true,
                                        isActive: true
                                    }
                                }
                            }).$promise;
                        }]
                    }
                }
            },
            seo: { title: 'Redbull' },
            //access: { auth: true }
        })
        .state('app.redbull.draft.build', {
            url: '/build',
            views: {
                'redbull-draft': {
                    templateUrl: moduleTpl + 'draft.build.html',
                    controller: 'DraftBuildCtrl',
                    resolve: {
                        cards: ['Card', function (Card) {
                            return Card.find({
                                filter: {
                                    where: {
                                        deckable: true,
                                        isActive: true
                                    },
                                    order: ['cost ASC', 'name ASC']
                                }
                            }).$promise;
                        }]
                    }
                }
            },
            seo: { title: 'Redbull' },
            //access: { auth: true }
        })
        .state('app.admin.redbull', {
            abstract: true,
            url: '/redbull',
            views: {
                admin: {
                    templateUrl: moduleTpl + 'admin/admin.redbull.html',
                }
            },
            access: { auth: true, admin: true }
        })
        .state('app.admin.redbull.settings', {
            url: '',
            views: {
                redbull: {
                    templateUrl: moduleTpl + 'admin/admin.redbull.settings.html',
                    controller: 'AdminRedbullCtrl',
                }
            },
            access: { auth: true, admin: true }
        })
        ;
    }
]);

angular.module('redbull.controllers', []);
angular.module('redbull.services', []);
angular.module('redbull.directives', []);
angular.module('redbull.filters', []);
angular.module('redbull.animations', []);
