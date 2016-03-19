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
    $scope.snapshot = HOTSSnapshot(snapshot.hotsSnapshots[0]);
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

    $scope.selectFilter = function ($event, arr, obj) {
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
.config(['$locationProvider', '$stateProvider',
    function ($locationProvider, $stateProvider) {
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
                    console.log('1');
                    return HotsSnapshot.find({
                        filter: {
                            order: "createdDate DESC",
                            where: { isActive: true },
                            fields: ['id'],
                            include: ['slugs']
                        }
                    })
                    .$promise
                    .then(function (data) {
                        console.log('2', data);
                        return data;
                    });
                }],
                redirect: ['$q', '$state', 'data', function ($q, $state, data) {
                    console.log('3', data);
                    $state.go('app.hots.snapshots.snapshot', { slug: data });
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
                        snapshot: ['$stateParams', '$state', 'Slug', function ($stateParams, $state, Slug) {
                            var slug = $stateParams.slug;

                            return Slug.findOne({
                                filter: {
                                    where: {
                                        slug: slug,
                                        parentModelName: "hotsSnapshot"
                                    },
                                    include: [
                                        {
                                            relation: "hotsSnapshots",
                                            scope: {
                                                include: [
                                                    {
                                                        relation: "heroTiers",
                                                        scope: {
                                                            include: [
                                                                {
                                                                    relation: "guides",
                                                                    scope: {
                                                                        include: [
                                                                            {
                                                                                relation: "guide",
                                                                                include: ["slugs"]
                                                                            }
                                                                        ]
                                                                    }
                                                                },
                                                                {
                                                                    relation: "hero"
                                                                }
                                                            ]
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
                                        }
                                    ]
                                }
                            })
                            .$promise
                            .then(function (data) {
                                return data;
                            })
                            .catch(function (e) {
                                console.log("ERR", e);
                                $state.transitionTo('otherwise');
                            });
                        }]
                    }
                }
            }
        })
    }]
)
;