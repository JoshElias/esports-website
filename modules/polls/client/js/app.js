'use strict';

var polls = angular.module('app.polls', [
    'app',
    'polls.controllers',
    'polls.services',
    'polls.filters',
    'polls.directives',
    'polls.animations',
])
.run([
    function() {
    }
])
.config(['$stateProvider', '$controllerProvider', '$compileProvider', '$filterProvider', '$provide',
    function($stateProvider, $controllerProvider, $compileProvider, $filterProvider, $provide) {

        polls.controller = $controllerProvider.register;
        polls.directive  = $compileProvider.directive;
        polls.filter     = $filterProvider.register;
        polls.factory    = $provide.factory;
        polls.service    = $provide.service;
        polls.constant   = $provide.constant;
        polls.value      = $provide.value;

        // cdn templates
        var moduleTpl = (tpl !== './') ? tpl + 'views/polls/client/views/' : 'dist/views/polls/client/views/';

        $stateProvider
        .state('app.polls', {
            url: 'vote',
            views: {
                content: {
                    templateUrl: moduleTpl + 'frontend/polls.html',
                    controller: 'PollsCtrl',
                    resolve: {
                      dataPollsMain: ['Poll', function (Poll) {
                        return Poll.find({
                            filter: {
                                where: {
                                    viewType: 'main'
                                },
                                include: ['items']
                            }
                        }).$promise;
                      }],
                      dataPollsSide: ['Poll', function (Poll) {
                        return Poll.find({
                            filter: {
                                where: {
                                    viewType: 'side'
                                },
                                include: ['items']
                            }
                        }).$promise;
                      }]
                    }
                }
            },
            seo: { title: 'Vote', description: 'Vote on TempoStorm', keywords: '' }
        })
        .state('app.admin.polls', {
            abstract: true,
            url: '/polls',
            views: {
                admin: {
                    templateUrl: moduleTpl + 'admin/polls.html'
                }
            },
            access: { auth: true, admin: true },
            seo: { title: 'Admin', description: '', keywords: '' }
        })
        .state('app.admin.polls.list', {
            url: '',
            views: {
                polls: {
                    templateUrl: moduleTpl + 'admin/polls.list.html',
                    controller: 'AdminPollListCtrl',
                    resolve: {
                        paginationParams: [function() {
                            return {
                                page: 1,
                                perpage: 50,
                                options: {
                                    filter: {
                                        fields: {
                                            id: true,
                                            title: true
                                        },
                                        limit: 50,
                                        order: 'createdDate DESC'
                                    }
                                }
                            };
                        }],
                        pollsCount: ['Poll', 'paginationParams', function (Poll, paginationParams) {
                            return Poll.count({})
                            .$promise
                            .then(function (pollCount) {
                                paginationParams.total = pollCount.count;
                                return pollCount;
                            })
                            .catch(function (err) {
                                console.log('Poll.count err: ',err);
                            });
                        }],
                        polls: ['Poll', 'paginationParams', function (Poll, paginationParams) {
                            return Poll.find(
                                paginationParams.options
                            ).$promise
                            .then(function (allPolls) {
                                return allPolls;
                            })
                            .catch(function (err) {
                                console.log('Poll.find err: ', err);
                            });
                        }]
                    }
                }
            },
            access: { auth: true, admin: true },
            seo: { title: 'Admin', description: '', keywords: '' }
        })
        .state('app.admin.polls.add', {
            url: '/add',
            views: {
                polls: {
                    templateUrl: moduleTpl + 'admin/polls.poll.html',
                    controller: 'AdminPollAddCtrl'
                }
            },
            access: { auth: true, admin: true },
            seo: { title: 'Admin', description: '', keywords: '' }
        })
        .state('app.admin.polls.edit', {
            url: '/edit/:pollID',
            views: {
                polls: {
                    templateUrl: moduleTpl + 'admin/polls.poll.html',
                    controller: 'AdminPollEditCtrl',
                    resolve: {
                        poll: ['$stateParams', 'Poll', function($stateParams, Poll){
                            var pollID = $stateParams.pollID;
                            return Poll.findOne({
                                filter: {
                                    where: {
                                        id: pollID
                                    },
                                    include: 'items'
                                }
                            })
                            .$promise;
                        }]

                    }
                }
            },
            access: { auth: true, admin: true },
            seo: { title: 'Admin', description: '', keywords: '' }
        })
        ;
    }
]);

angular.module('polls.controllers', []);
angular.module('polls.services', []);
angular.module('polls.directives', []);
angular.module('polls.filters', []);
angular.module('polls.animations', []);
