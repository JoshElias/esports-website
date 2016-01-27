angular.module('redbull.controllers')
.controller('AdminRedbullSettingsCtrl', ['$scope', '$window', 'AlertService', 'RedbullExpansion', 'RedbullRarityChance', 'expansions', function ($scope, $window, AlertService, RedbullExpansion, RedbullRarityChance, expansions){
    // expansions
    $scope.saving = false;
    $scope.expansions = expansions;

    // fix slider string error
    function Chances (id, redbullExpansionId, rarity, percentage) {
        var percentage = percentage;

        this.id = id;
        this.redbullExpansionId = redbullExpansionId;
        this.rarity = rarity;

        this.__defineGetter__("percentage", function () {
            return percentage;
        });

        this.__defineSetter__("percentage", function (val) {
            val = parseInt(val);
            percentage = val;
        });
    }

    for (var i = 0; i < $scope.expansions.length; i++) {
        for (var j = 0; j < $scope.expansions[i].rarityChances.length; j++) {
            var chance = $scope.expansions[i].rarityChances[j];
            $scope.expansions[i].rarityChances[j] = new Chances(chance.id, chance.redbullExpansionId, chance.rarity, chance.percentage);
        }
    }

    // hide rarities for specific expansions
    $scope.hasRarity = function (expansion, rarity) {
        switch (expansion.name) {
            case 'Soulbound':
                return (rarity === 'basic');
            case 'Blackrock Mountain':
                return (rarity !== 'epic' && rarity !== 'basic');
            default:
                return (rarity !== 'basic');
        }
    };

    // settings error check
    function settingsError () {
        var error = {
            msg: 'Error: Unable to update settings',
            errors: []
        };
        for (var i = 0; i < $scope.expansions.length; i++) {
            if ($scope.expansions[i].isActive) {

                // test packs
                if (isNaN(parseInt($scope.expansions[i].numOfPacks)) || parseInt($scope.expansions[i].numOfPacks) < 1) {
                    error.errors.push('Expansion ' + $scope.expansions[i].name + ': Can not have zero packs.');
                }

                // test percentage
                var count = 0;

                for (var j = 0; j < $scope.expansions[i].rarityChances.length; j++) {
                    count += $scope.expansions[i].rarityChances[j].percentage;
                }

                if (count !== 100) {
                    error.errors.push('Expansion ' + $scope.expansions[i].name + ': Chances do not add up to 100%.');
                }
            }
        }
      
        return (error.errors.length) ? error : false;
    }

    // save settings
    $scope.updateSettings = function () {
        var error = settingsError();
        if (error) {
            AlertService.setError({ show: true, msg: error.msg, errorList: error.errors });
            $window.scrollTo(0,0);
            return false;
        } else {
            $scope.saving = true;

            async.forEach($scope.expansions, function (expansion, expansionEachCallback) {

                RedbullExpansion.prototype$updateAttributes(expansion).$promise
                .then(function (expansionValue) {

                    async.forEach(expansion.rarityChances, function (chance, chanceEachCallback) {

                        RedbullRarityChance.prototype$updateAttributes(chance).$promise
                        .then(function (chanceValue) {
                            return chanceEachCallback();
                        })
                        .catch(function (err) {
                            return chanceEachCallback(err);
                        });
                    }, function (err) {
                        return expansionEachCallback(err);
                    });

                })
                .catch(function (err) {
                    return expansionEachCallback(err);
                });

            }, function (err) {
                $scope.saving = false;
                $window.scrollTo(0,0);
                if (err) {
                    return AlertService.setError({
                        show: true,
                        msg: 'Error: Could not update settings',
                        lbErr: err
                    });
                } else {
                    return AlertService.setSuccess({
                        show: true,
                        msg: 'Settings have been updated successfully.'
                    });
                }
            });
            /*OverwatchHero.upsert($scope.hero).$promise
                .then(function (heroValue) {

                    _.each($scope.hero.overwatchAbilities, function (ability) {
                        ability.heroId = heroValue.id;
                    });

                    async.forEach($scope.hero.overwatchAbilities, function(ability, eachCallback) {
                        OverwatchAbility.upsert(ability).$promise
                        .then(function (abilityValue) {
                            return eachCallback();
                        })
                        .catch(function (httpResponse) {
//                            console.log('httpResponse: ', httpResponse);
                            return eachCallback(httpResponse);
                        });
                    }, function (err) {
						$scope.fetching = false;
                        if (err) {
                            $window.scrollTo(0,0);
                            return AlertService.setError({
								show: true,
								msg: 'Could not update ' + $scope.hero.heroName,
								lbErr: err
							});
                        }
						$window.scrollTo(0, 0);
                        AlertService.setSuccess({
							persist: true,
							show: false,
							msg: $scope.hero.heroName + ' has been updated successfully.'
						});
                        return $state.go('app.admin.overwatch.heroes.list');
                    });

                })
                .catch(function (err) {
					$scope.fetching = false;
					$window.scrollTo(0,0);
					return AlertService.setError({
						show: true,
						msg: 'Could not update ' + $scope.hero.heroName,
						lbErr: err
					});
                });
            */
        }
    };
}]);
