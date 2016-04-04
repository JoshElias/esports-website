angular.module('polls.controllers')
.controller('AdminPollListCtrl', ['$scope', '$window', '$q', '$timeout', '$compile', 'bootbox', 'AlertService', 'polls', 'pollsCount', 'paginationParams', 'Poll', 'AjaxPagination',
    function ($scope, $window, $q, $timeout, $compile, bootbox, AlertService, polls, pollsCount, paginationParams, Poll, AjaxPagination) {

        // load polls
        $scope.polls = polls;
        $scope.page = paginationParams.page;
        $scope.perpage = paginationParams.perpage;
        $scope.total = pollsCount.count;
        $scope.search = '';

        $scope.searchPolls = function() {
            updatePolls(1, $scope.perpage, $scope.search, function (err, data) {
                if (err) return console.log('err: ', err);
            });
        };

        // pagination
        function updatePolls (page, perpage, search, callback) {
            $scope.fetching = true;

            var options = {},
                countOptions = {},
                pattern = '/.*'+search+'.*/i';

            options.filter = {
                fields: paginationParams.options.filter.fields,
                order: "createdDate DESC",
                skip: ((page*perpage)-perpage),
                limit: paginationParams.perpage
            };

            if ($scope.search.length > 0) {
                options.filter.where = {
                    or: [
                        { title: { regexp: pattern } },
                        { subtitle: { regexp: pattern } },
                        { description: { regexp: pattern } },
                        { type: { regexp: pattern } }
                    ]
                }
                countOptions.where = {
                    or: [
                        { title: { regexp: pattern } },
                        { subtitle: { regexp: pattern } },
                        { description: { regexp: pattern } },
                        { type: { regexp: pattern } }
                    ]
                }
            }

            AjaxPagination.update(Poll, options, countOptions, function (err, data, count) {
                $scope.fetching = false;
                if (err) return console.log('got err:', err);
                $scope.pollPagination.page = page;
                $scope.pollPagination.perpage = perpage;
                $scope.users = data;
                $scope.pollPagination.total = count.count;
                if (callback) {
                    callback(null, count);
                }
            });
        }

        // page flipping
        $scope.pollPagination = AjaxPagination.new(paginationParams,
            function (page, perpage) {
                var d = $q.defer();
                updatePolls(page, perpage, $scope.search, function (err, count) {
                    if (err) return console.log('pagination err:', err);
                    d.resolve(count.count);
                });
                return d.promise;
            }
        );

//             delete poll
        $scope.deletePoll = function (poll) {
            var box = bootbox.dialog({
                title: 'Delete poll: ' + poll.title + '?',
                message: 'Are you sure you want to delete the poll <strong>' + poll.title + '</strong>?',
                buttons: {
                    delete: {
                        label: 'Delete',
                        className: 'btn-danger',
                        callback: function () {
                            Poll.destroyById({
                                id:poll.id
                            }).$promise
                            .then(function (data) {
                                var index = $scope.polls.indexOf(poll);
                                $window.scrollTo(0, 0);
                                $scope.polls.splice(index, 1);
                                AlertService.setSuccess({
                                    show: true,
                                    msg: poll.title + ' deleted successfully.'
                                });
                                $scope.pollPagination.total -= 1;
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
                }
            });
            box.modal('show');
        };
    }
]);