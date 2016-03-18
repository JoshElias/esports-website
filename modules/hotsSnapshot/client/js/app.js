angular.module('hotsSnapshot', [])
    .run(
        ['$rootScope', '$window',
            function ($rootScope, $window) {


            }
        ]
    )
    .controller('hotsSnapshotCtrl', ['$scope', 'HOTSSnapshot', 'snapshot', 'HOTS', function ($scope, HOTSSnapshot, snapshot, HOTS) {
        var activeFilters = {
            role: [],
            universe: []
        }
        $scope.heroAnim = {}

        function find (arr, obj) {
            return _.find(activeFilters[arr], function (val) { return val == obj });
        }

        $scope.HOTS = HOTS;
        $scope.snapshot = HOTSSnapshot(snapshot);
        $scope.snapshot.buildTiers();

        _.each($scope.snapshot.heroTiers, function (val) {
            var tempScores = {
                burstScore: val.burstScore,
                pushScore: val.pushScore,
                surviveScore: val.surviveScore,
                scaleScore: val.scaleScore,
                utilityScore: val.utilityScore
            };

            $scope.heroAnim[val.id] = tempScores;

            val.burstScore = 0;
            val.pushScore = 0;
            val.surviveScore = 0;
            val.scaleScore = 0;
            val.utilityScore = 0;
        });

        console.log($scope.heroAnim);

        $scope.selectFilter = function ($event, arr, obj) {
            console.log('sup');
            $event.stopPropagation();
            var filt = activeFilters[arr];

            if (!find(arr, obj)) {
                filt.push(obj);
            } else {
                var idx = filt.indexOf(obj);

                filt.splice(idx,1);
            }
        }

        $scope.triggerAnimation = function (hero) {
            var s = $scope.heroAnim[hero.id];

            hero.burstScore = s.burstScore;
            hero.pushScore = s.pushScore;
            hero.surviveScore = s.surviveScore;
            hero.scaleScore = s.scaleScore;
            hero.utilityScore = s.utilityScore;
        }

        $scope.getFilters = function () {
            var filt = activeFilters;

            
            return filt['role'] + filt['universe'];
        }

        $scope.getIsActive = function (arr, obj) {
            return !!_.find(activeFilters[arr], function (val) { return val == obj; });
        }
    }])
    .filter('inArray', function($filter){
        return function(list, arrayFilter, element){
            if(arrayFilter){
                return $filter("filter")(list, function(listItem){
                    return arrayFilter.indexOf(listItem[element]) != -1;
                });
            }
        };
    })
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
                    .state('app.hots.snapshots.redirect', {
                        url: '',
                        resolve: {
                            data: ['HotsSnapshot', function (HotsSnapshot) {
                                return HotsSnapshot.findOne({
                                    filter: {
                                        //order: "createdDate DESC",
                                        //where: { isActive: true }
                                    }
                                }).$promise;
                            }],
                            redirect: ['$q', '$state', 'data', function ($q, $state, data) {
                                $state.go('app.hots.snapshots.snapshot', { slug: data.slug.url });
                                return $q.reject();
                            }]
                        }
                    })
                    .state('app.hots.snapshots.snapshot', {
                        url: '/:slug',
                        views: {
                            hotsSnapshots: {
                                controller: 'hotsSnapshotCtrl',
                                templateUrl: moduleTpl + 'snapshot.html',
                                resolve: {
                                    snapshot: ['$stateParams', 'HotsSnapshot', function ($stateParams, HotsSnapshot) {
                                        console.log($stateParams.slug);

                                        return HotsSnapshot.findOne({
                                            filter: {
                                                include: [
                                                    {
                                                        relation: "heroTiers",
                                                        scope: {
                                                            include: ["hero", "guides"]
                                                        }
                                                    },
                                                    {
                                                        relation: "authors",
                                                        scope: {
                                                            include: ["user"]
                                                        }
                                                    }
                                                ]
                                            }
                                        }).$promise;
                                    }]
                                }
                            }
                        }
                    })
            }]
    )
;