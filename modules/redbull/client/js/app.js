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
        .state('app.hs.redbull', {
            abstract: true,
            url: '/redbull',
            views: {
                hs: {
                    templateUrl: moduleTpl + 'index.html'
                }
            }
        })
        .state('app.hs.redbull.home', {
            url: '',
            views: {
                redbull: {
                    templateUrl: moduleTpl + 'home.html',
                    controller: 'RedbullHomeCtrl'
                }
            },
            seo: { title: 'Red Bull Team Brawl: Hearthstone Presented by Honda', description: 'Tempo Storm is proud to announce we have partnered with the amazing team at Red Bull and in connection with Honda will be providing the worlds first Hearthstone Sealed Deck tournament! Featuring your favorite teams and players, battling it out in this new format to determine a champion!', keywords: '' }
        })
        .state('app.hs.draft', {
            abstract: true,
            url: '/sealed',
            views: {
                hs: {
                    templateUrl: moduleTpl + 'draft.html',
                    controller: 'DraftCtrl'
                }
            }
        })
        .state('app.hs.draft.packs', {
            url: '',
            views: {
                'redbull-draft': {
                    templateUrl: moduleTpl + 'draft.packs.html',
                    controller: 'DraftPacksCtrl',
                    resolve: {
                        draftSettings: ['RedbullDraftSettings', function (RedbullDraftSettings) {
                            return RedbullDraftSettings.findOne().$promise;
                        }],
                        draft: ['$localStorage', 'RedbullDraft', function ($localStorage, RedbullDraft) {
                            if ($localStorage.draftId) {
                                return RedbullDraft.findOne({
                                    filter: {
                                        where: {
                                            id: $localStorage.draftId
                                        },
                                        include: {
                                            relation: 'packs',
                                            scope: {
                                                include: [{
                                                    relation: 'packCards',
                                                    scope: {
                                                        include: [{
                                                            relation: 'card',
                                                            scope: {
                                                                fields: ['cardType', 'cost', 'expansion', 'mechanics', 'name', 'photoNames', 'playerClass', 'race', 'rarity', 'text']
                                                            }
                                                        },{
                                                            relation: 'expansion'
                                                        }],
                                                        order: 'orderNum ASC'
                                                    }
                                                }],
                                                order: 'orderNum ASC'
                                            }
                                        }
                                    }
                                }).$promise.then(function (data) {
                                    return data;
                                }).catch(function (response) {
                                    if (response.statusCode === 404) {
                                        delete $localStorage.draftId;
                                        return RedbullDraft.create().$promise;
                                    }
                                });
                            } else {
                                return RedbullDraft.create().$promise;
                            }
                        }]
                    }
                }
            },
            seo: { title: 'Sealed Deck Generator', description: '', keywords: '' }
            //access: { auth: true }
        })
        .state('app.hs.draft.build', {
            url: '/build',
            views: {
                'redbull-draft': {
                    templateUrl: moduleTpl + 'draft.build.html',
                    controller: 'DraftBuildCtrl',
                    resolve: {
                        draftSettings: ['RedbullDraftSettings', function (RedbullDraftSettings) {
                            return RedbullDraftSettings.findOne().$promise;
                        }],
                        draft: ['$localStorage', '$state', '$q', 'RedbullDraft', function ($localStorage, $state, $q, RedbullDraft) {
                            if ($localStorage.draftId) {
                                return RedbullDraft.findOne({
                                    filter: {
                                        where: {
                                            id: $localStorage.draftId
                                        },
                                        fields: ['id', 'hasOpenedPacks'],
                                        include: [
                                            {
                                                relation: 'cards',
                                                scope: {
                                                    fields: ['cardType', 'cost', 'expansion', 'mechanics', 'name', 'photoNames', 'playerClass', 'race', 'rarity', 'text'],
                                                    order: ['cost ASC', 'name ASC']
                                                }
                                            }
                                        ]
                                    }
                                }).$promise.then(function (data) {
                                    if (!data.hasOpenedPacks) {
                                        $state.go('app.hs.draft.packs');
                                        return $q.reject();
                                    } else {
                                        return data;
                                    }
                                });
                            } else {
                                $state.go('app.hs.draft.packs');
                                return $q.reject();
                            }
                        }],
                        draftCards: ['draft', function (draft) {
                            return draft.cards;
                        }],
                        draftBuildStart: ['$localStorage', 'RedbullDraft', 'draft', function ($localStorage, RedbullDraft, draft) {
                            return RedbullDraft.startDraftBuild({ draftId: draft.id }).$promise;
                        }]
                    }
                }
            },
            seo: { title: 'Sealed Deck Generator', description: '', keywords: '' }
        })
        .state('app.hs.draft.decks', {
            url: '/decks/:draftId',
            views: {
                'redbull-draft': {
                    templateUrl: moduleTpl + 'draft.build.html',
                    controller: 'DraftDecksCtrl',
                    resolve: {
                        draft: ['$stateParams', '$state', '$q', 'RedbullDraft', function ($stateParams, $state, $q, RedbullDraft) {
                            return RedbullDraft.findOne({
                                filter: {
                                    where: {
                                        id: $stateParams.draftId
                                    },
                                    fields: ['id', 'hasDecksConstructed'],
                                    include: [
                                        {
                                            relation: 'cards',
                                            scope: {
                                                fields: ['cardType', 'cost', 'expansion', 'mechanics', 'name', 'photoNames', 'playerClass', 'race', 'rarity', 'text'],
                                                order: ['cost ASC', 'name ASC']
                                            }
                                        },
                                        {
                                            relation: 'decks',
                                            include: [{
                                                relation: 'deckCards',
                                                include: [{
                                                    relation: 'cards',
                                                    fields: ['cardType', 'cost', 'expansion', 'mechanics', 'name', 'photoNames', 'playerClass', 'race', 'rarity', 'text']
                                                }]
                                            }]
                                        }
                                    ]
                                }
                            }).$promise.then(function (data) {
                                if (!data.hasDecksConstructed) {
                                    $state.go('app.404');
                                    return $q.reject();
                                } else {
                                    return data;
                                }
                            }).catch(function () {
                                $state.go('app.404');
                                return $q.reject();
                            });
                        }],
                        draftCards: ['draft', function (draft) {
                            return draft.cards;
                        }],
                        draftDecks: ['draft', 'RedbullDeck', function (draft, RedbullDeck) {
                            var deckIds = [];
                        
                            for (var i = 0; i < draft.decks.length; i++) {
                                deckIds.push(draft.decks[i].id);
                            }
                            
                            return RedbullDeck.find({
                                filter: {
                                    where: {
                                        id: { inq: deckIds }
                                    },
                                    include: {
                                        relation: 'deckCards',
                                        scope: {
                                            include: {
                                                relation: 'card',
                                                fields: ['cardType', 'cost', 'expansion', 'mechanics', 'name', 'photoNames', 'playerClass', 'race', 'rarity', 'text']
                                            }
                                        }
                                    }
                                }
                            }).$promise;
                        }]
                    }
                }
            },
            seo: { title: 'Sealed Deck Generator', description: '', keywords: '' }
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
            url: '/settings',
            views: {
                redbull: {
                    templateUrl: moduleTpl + 'admin/admin.redbull.settings.html',
                    controller: 'AdminRedbullSettingsCtrl',
                    resolve: {
                        expansions: ['RedbullExpansion', function (RedbullExpansion) {
                            return RedbullExpansion.find({
                                filter: {
                                    include: 'rarityChances'
                                }
                            }).$promise;
                        }],
                    }
                }
            },
            access: { auth: true, admin: true }
        })
        .state('app.admin.redbull.whitelist', {
            url: '/whitelist',
            views: {
                redbull: {
                    templateUrl: moduleTpl + 'admin/admin.redbull.whitelist.html',
                    controller: 'AdminRedbullWhitelistCtrl',
                    resolve: {
                        draftPlayers: ['RedbullDraft', function (RedbullDraft) {
                            return RedbullDraft.getDraftPlayers().$promise;
                        }]
                    }
                }
            },
            access: { auth: true, admin: true }
        })
        .state('app.admin.redbull.decks', {
            url: '/decks',
            views: {
                redbull: {
                    templateUrl: moduleTpl + 'admin/admin.redbull.decks.html',
                    controller: 'AdminRedbullDecksCtrl',
                }
            },
            access: { auth: true, admin: true }
        })
        ;
    }
]);

/*
        .state('app.hs.redbull.draft', {
            abstract: true,
            url: '/tournament',
            views: {
                redbull: {
                    templateUrl: moduleTpl + 'draft.html',
                    controller: 'DraftCtrl'
                }
            },
            access: { auth: true }
        })
        .state('app.hs.redbull.draft.packs', {
            url: '',
            views: {
                'redbull-draft': {
                    templateUrl: moduleTpl + 'draft.packs.html',
                }
            },
            seo: { title: 'Redbull' },
            access: { auth: true }
        })
        .state('app.hs.redbull.draft.build', {
            url: '/build',
            views: {
                'redbull-draft': {
                    templateUrl: moduleTpl + 'draft.build.html',
                    controller: 'DraftBuildCtrl',
                    resolve: {
                        cards: ['$state', 'DraftCards', function ($state, DraftCards) {
                            var cards = DraftCards.getCards();
                            if (!cards.length) {
                                return $state.go('app.hs.redbull.draft.packs');
                            }
                            return cards;
                        }]
                    }
                }
            },
            seo: { title: 'Redbull' },
            access: { auth: true }
        })
*/

angular.module('redbull.controllers', []);
angular.module('redbull.services', []);
angular.module('redbull.directives', []);
angular.module('redbull.filters', []);
angular.module('redbull.animations', []);
