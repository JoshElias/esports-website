angular.module('hotsSnapshot', [])
.run(
    ['$rootScope', '$window',
        function ($rootScope, $window) {


        }
    ]
)
.controller('hotsSnapshotCtrl', ['$scope', '$window', '$state', '$filter', '$sce', 'HOTSSnapshot', 'HotsSnapshot', 'snapshot', 'HOTS',
    function ($scope, $window, $state, $filter, $sce, HOTSSnapshot, HotsSnapshot, snapshot, HOTS) {
        var foldedTiers = {};
        var filter = {
            role: HOTS.roles,
            universe: HOTS.universes,
            filtered: false
        };

        $scope.activeFilters = {};
        $scope.heroAnim = {};
        $scope.HOTS = HOTS;
        $scope.service = HotsSnapshot;
        $scope.snapshot = HOTSSnapshot(snapshot);
        $scope.votableSnapshot = { hotsSnapshot: $scope.snapshot };
        $scope.snapshot.buildTiers();

        _.each($scope.snapshot.tiers, function (val) {
            if(!$scope.activeFilters[val.tier])
                $scope.activeFilters[val.tier] = angular.copy(filter);

            $scope.activeFilters[val.tier].filtered = val.heroes;
        });

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

        $scope.getContent = function (content) {
            return $sce.trustAsHtml(content);
        };

        $scope.isFolded = function (tierNum) {
            return foldedTiers[tierNum];
        };

        $scope.getNgNumberScore = function (value) {
            var clamp = Math.min(Math.max(value, 2), 10);

            return (clamp * 10) - ((clamp != 10) ? 1 : 7);
        };

        $scope.foldTier = function (tierNum) {
            if(foldedTiers[tierNum] === undefined)
                foldedTiers[tierNum] = false;

            foldedTiers[tierNum] = !foldedTiers[tierNum];
        };

        $scope.triggerAnimation = function (hero) {
            var s = $scope.heroAnim[hero.id];

            hero.burstScore = s.burstScore;
            hero.pushScore = s.pushScore;
            hero.surviveScore = s.surviveScore;
            hero.scaleScore = s.scaleScore;
            hero.utilityScore = s.utilityScore;
        };

        $scope.selectFilter = function ($event, arr, obj, tier, heroes) {
            $event.stopPropagation();
            var filt = $scope.activeFilters[tier][arr];

            if (!_.find(filt, function (val) { return val == obj })) {
                filt.push(obj);
            } else {
                var idx = filt.indexOf(obj);

                filt.splice(idx,1);
            }

            $scope.activeFilters[tier].filtered = $scope.getFilteredHeroes(heroes, tier);
        };

        $scope.getFilteredHeroes = function (heroes, tier) {
            var out;
            var filt = [];

            _.each($scope.activeFilters[tier], function (val) {
                if (Array.isArray(val))
                    filt = filt.concat(val);
            });

            out = _.filter(heroes, function (hVal) {
                var r = _.find($scope.activeFilters[tier].role, function (rVal) {
                    return hVal.hero.role == rVal;
                });

                var u = _.find($scope.activeFilters[tier].universe, function (uVal) {
                    return hVal.hero.universe == uVal;
                });

                return (r && u);
            });

            return out;
        };

        $scope.getIsActive = function (arr, obj, tier) {
            return !!_.find($scope.activeFilters[tier][arr], function (val) { return val == obj; });
        };

        $scope.goToGuide = function ($event, slug) {
            var url = $state.href('app.hots.guides.guide', { slug: slug });

            $event = $event || window.event;
            $event.stopPropagation();

            $window.open(url, '_blank');
        }
    }
])
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
        var moduleTpl = (tpl !== './') ? tpl + 'views/hots/client/views/snapshot/' : 'dist/views/hots/client/views/snapshot/';

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
                    var slug = data[0].slugs[0].slug;

                    $state.go('app.hots.snapshots.snapshot', { slug: slug });
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
                        snapshot: ['$stateParams', '$state', 'HotsSnapshot', 'Util', function ($stateParams, $state, HotsSnapshot, Util) {
                            var slug = $stateParams.slug;

                            return HotsSnapshot.findBySlug({
                                slug: slug,
                                filter: {
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
                                                                    relation: "talents",
                                                                    scope: {
                                                                        include: ['talent']
                                                                    }
                                                                }
                                                            ]
                                                        }
                                                    },
                                                    {
                                                        relation: "hero",
                                                        scope: {
                                                            fields: [
                                                                'className',
                                                                'name',
                                                                'universe',
                                                                'role',
                                                                'title',
                                                                'characters'
                                                            ]
                                                        }
                                                    }
                                                ]
                                            }
                                        },
                                        {
                                            relation: "authors",
                                            scope: {
                                                order: "orderNum ASC",
                                                include: ["user"]
                                            }
                                        },
                                        {
                                            relation: "comments",
                                            scope: {
                                                include: {
                                                    relation: "author",
                                                    scope: {
                                                        fields: [
                                                            'username',
                                                            'email'
                                                        ]
                                                    }
                                                }
                                            }
                                        }
                                    ]
                                }
                            })
                            .$promise
                            .then(function (data) {
                                var intro = data.intro;
                                var thoughts = data.thoughts;

                                data.intro = Util.replaceLineBreak(intro);
                                data.thoughts = Util.replaceLineBreak(thoughts);
                                _.each(data.heroTiers, function (val) {
                                    var summary = val.summary;

                                    val.summary = Util.replaceLineBreak(summary);
                                });

                                return data;

                            })
                            .catch(function (e) {
                                console.log("ERR", e);
                                $state.transitionTo('app.404');
                            });
                        }]
                    }
                }
            },
            seo: { title: 'Heroes of the Storm', description: 'Heroes of the Storm guide builder.', keywords: '' }
        })
    }]
)
;