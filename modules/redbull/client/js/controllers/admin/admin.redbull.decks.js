angular.module('redbull.controllers')
.controller('AdminRedbullDecksCtrl', ['$timeout', '$scope', 'Hearthstone', 'officialDrafts', 'officialPlayers', 'draftPlayers', 'RedbullDraft', 'RedbullDeck', 'User', 'DeckBuilder', 'LoopBackAuth', 'AlertService', '$window',
    function ($timeout, $scope, Hearthstone, officialDrafts, officialPlayers, draftPlayers, RedbullDraft, RedbullDeck, User, DeckBuilder, LoopBackAuth, AlertService, $window) {

        User.isInRoles({
                uid: LoopBackAuth.currentUserId,
                roleNames: ['$admin']
            }).$promise
            .then(function (res) {
                $scope.userIsAdmin = (res.isInRoles.$admin);
            });

        // FOR CLARIFICATION:
        // officialPlayers are players that have completed an official draft, and are found by that draft's authorId
        // draftPlayers are ALL whitelisted players.

        $scope.officialDrafts = officialDrafts;
        $scope.officialPlayers = draftPlayers.players;

        var officialPlayerIds = [];

        _.forEach($scope.officialPlayers, function (player) {
            officialPlayerIds.push(player.id);
            var extendDraft = {
                activeDraft: {},
                inactiveDrafts: []
            };
            var hasActive = {
                hasActive: false,
                hasInactive: false,
                incompleteDraft: false,
                noDraft: false
            };
            _.forEach(officialDrafts, function (draft) {
                if (player.id === draft.authorId && draft.hasDecksConstructed === true) {
                    var trimmedDraft = _.clone(JSON.parse(JSON.stringify(draft)));
                    if (draft.isActive === true) {
                        extendDraft.activeDraft = trimmedDraft;
                        hasActive.hasActive = true;
                    } else {
                        extendDraft.inactiveDrafts.push(trimmedDraft);
                        hasActive.hasInactive = true;
                    }
                    //console.log(extendDraft.drafts);
                } else if (player.id === draft.authorId && draft.hasDecksConstructed === false) {
                    //console.log("incomplete draft:", draft);
                    hasActive.incompleteDraft = true;
                }
            });

            if (hasActive.hasInactive === false && hasActive.hasActive === false && hasActive.incompleteDraft == false) {
                //console.log("no drafts...");
                hasActive.noDraft = true;
            }

            // Now extend the player with all the drafts found.
            _.extend(player, extendDraft, hasActive);
            //console.log("extended player:", player);

        });


        // console.log("officialDrafts", $scope.officialDrafts);

        $scope.activeDrafts = function (player) {
            var match = false;
            _.forEach(player.drafts, function (draft) {
                if (draft.isActive === true) {
                    match = true;
                    return true
                }
            });
            return !(match === false)
        };

        $scope.noActiveDrafts = function (player) {
            var match = false;
            _.forEach(player.drafts, function (draft) {
                if (draft.isActive === false) {
                    match = true;
                    return true
                }
            });
            return !(match === false)
        };
        
        $scope.promptInactive = function ($event, player) {
            $event.stopPropagation();

            var box = bootbox.dialog({
                title: 'Archive Draft',
                message: 'Are you sure you want to archive this draft for the player: <strong>' +
                    player.username + '</strong>?<br/><br />This will allow the player to draft again and cannot be undone.',
                buttons: {
                    delete: {
                        label: 'Archive',
                        className: 'btn-danger',
                        callback: function () {
                            var draft = player.activeDraft;
                            draft.isActive = false;
                            
                            RedbullDraft.upsert(draft).$promise.then(function (res) {
                                $timeout(function () {
                                    player.inactiveDrafts.push(player.activeDraft);
                                    player.activeDraft = null;
                                    player.hasActive = false;
                                    player.hasInactive = true;
                                });

                                $window.scrollTo(0, 0);
                                AlertService.setSuccess({
                                    show: true,
                                    msg: 'Draft has been archived successfully'
                                });

                            }).catch(function (err) {
                                console.error(err);
                                $window.scrollTo(0, 0);
                                AlertService.setError({
                                    show: true,
                                    msg: 'Could not archive draft',
                                    lbErr: err
                                });

                            });
                        }
                    },
                    cancel: {
                        label: 'Cancel',
                        className: 'btn-default pull-left',
                        callback: function () {
                            box.modal('hide');
                        }
                    }
                },
                className: 'modal-admin modal-admin-remove'
            });
            box.modal('show');
        };
        
        $scope.promptDelete = function ($event, draft, player) {
            $event.stopPropagation();
            var box = bootbox.dialog({
                title: 'DELETE Draft',
                message: 'Are you sure you want to DELETE this draft for the player: <strong>' +
                    player.username + '</strong>? <br/><br /> This process may take several minutes and cannot be undone',
                buttons: {
                    delete: {
                        label: 'DELETE Draft',
                        className: 'btn-danger',
                        callback: function () {
                            var idx = player.inactiveDrafts.indexOf(draft);
                            if (idx !== -1) {
                                player.inactiveDrafts.splice(idx, 1);
                                
                                if (!player.inactiveDrafts.length) {
                                    player.hasInactive = false;
                                }
                                    
                                RedbullDraft.deleteById({
                                    id: draft.id
                                }).$promise.then(function (res) {
                                    draft = null;

                                    $window.scrollTo(0, 0);
                                    AlertService.setSuccess({
                                        show: true,
                                        msg: 'Draft has been Deleted'
                                    });

                                }).catch(function (err) {
                                    console.error(err);
                                    AlertService.setError({
                                        show: true,
                                        msg: 'Could not delete Draft',
                                        lbErr: err
                                    });
                                });
                            }
                        }
                    },
                    cancel: {
                        label: 'Cancel',
                        className: 'btn-default pull-left',
                        callback: function () {
                            box.modal('hide');
                        }
                    }
                },
                className: 'modal-admin modal-admin-remove'
            });
            box.modal('show');
        };
    }
]);
