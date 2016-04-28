angular.module('polls.controllers')
.controller('PollsCtrl', ['$scope', '$sce', '$compile', 'bootbox', 'PollService', 'dataPollsMain', 'dataPollsSide', 'Poll', 'PollItem',
    function ($scope, $sce, $compile, bootbox, PollService, dataPollsMain, dataPollsSide, Poll, PollItem) {

        var box;
        var votes = {};
        var submitting = false;

        $scope.pollsMain = dataPollsMain;
        $scope.pollsSide = dataPollsSide;

        $scope.toggleItem = function (poll, item) {
            if (!votes[poll.id]) { votes[poll.id] = []; }

            if ($scope.hasVoted(poll, item)) {
                votes[poll.id].splice(votes[poll.id].indexOf(item.id), 1);
            } else {
                if (votes[poll.id].length >= poll.voteLimit) { return false; }
                votes[poll.id].push(item.id);
            }
        };

        $scope.disableButton = function (poll) {
            return (!votes[poll.id] || votes[poll.id].length !== 0) ? true : false;
        }

        $scope.getContent = function (content) {
            return $sce.trustAsHtml(content);
        };

        $scope.btnText = function (poll, item) {
            return ($scope.hasVoted(poll, item)) ? 'Unpick' : 'Pick';
        }

        $scope.voteCurve = function (item, poll) {
            var v = item.votes,
                big = 0,
                item,
                cnt;

            for (var i = 0; i < poll.items.length; i++) {
                cnt = poll.items[i].votes;
                if (cnt > big) { big = cnt; }
            }
            if (big === 0) { return 0; }
            return Math.ceil(v / big * 100);
        };

        $scope.votePercentage = function (item, poll) {
            var v = item.votes,
                cnt = 0;
            for (var i = 0; i < poll.items.length; i++) {
                cnt = parseInt(cnt + poll.items[i].votes);
            }
            if (cnt === 0) { return 0; }
            return Math.ceil(v / cnt * 100);
        };

        $scope.hasVoted = function (poll, item) {
            if (!votes[poll.id]) { return false; }
            return (votes[poll.id].indexOf(item.id) !== -1);
        };


        $scope.isDoneVoting = function (poll) {
            if (PollService.getStorage(poll)) {
                return PollService.getStorage(poll);
            }
            return null;
        };

        $scope.setDoneVoting = function (poll, votes) {
            return PollService.setStorage(poll.id, votes[poll.id]);
        };

        $scope.getVotes = function (poll) {
            return poll.votes;
        };

        $scope.getLocalVotes = function (poll, item) {
            var localVotes = PollService.getStorage(poll.id);
            for (var i = 0; i < localVotes.length; i++) {
                if(item.id == localVotes[i]) {
                    return true;
                }
            }
        }

        $scope.bigImg = function (item) {
            box = bootbox.dialog({
                message: $compile('<a ng-click="closeBox()"><img class="img-responsive" ng-src="https://cdn-tempostorm.netdna-ssl.com/polls/' +item.photoNames.large+ '" alt=""></a>')($scope),
                backdrop: true
            });

            box.modal('show');
        };

        $scope.closeBox = function () {
            box.modal('hide');
        }

        $scope.submitVote = function (poll) {
          if (!submitting) {
            submitting = true;
            var v = [];
            _.each(votes[poll.id], function (vote) {
              v.push(_.find(poll.items, function (item) {
                return item.id === vote;
              }));
            })

            async.each(v, function(pollItem, pollItemCB) {
              pollItem.votes++;

              PollItem.upsert(pollItem)
              .$promise
              .then(function (pollItemUpdated) {
                return pollItemCB();
              })
              .catch(function (err) {
                return pollItemCB(err);
              });
            }, function(err, results) {
              if (err) { return console.log('err:', err); }

              $scope.setDoneVoting(poll, votes);
              submitting = false;
            });
          }
        };
    }
]);