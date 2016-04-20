angular.module('polls.controllers')
.controller('AdminPollEditCtrl', ['$scope', 'PollBuilder', 'poll', 
    function ($scope, PollBuilder, poll) {

        $scope.page = 'general';

        $scope.poll = PollBuilder.new('edit', poll);
        
/*        var box,
            defaultPoll = {
                title : '',
                subtitle: '',
                description: '',
                pollType: '',
                viewType: '',
                items: [],
                voteLimit: ''
            },
            defaultItem = {
                name: '',
                orderNum: 0,
                photoNames: {
                    large: '',
                    thumb: ''
                }
            },
            onSave = {
                toDelete: [],
                toCreate: []
            };

        $scope.options = {
            disableDragAndDrop: true,
            height: 300,
            fontNames: ['Open Sans Regular', 'Open Sans Bold'],
            defaultFontName: 'Open Sans Regular',
            toolbar: [
                ['style', ['bold', 'italic', 'underline', 'strikethrough', 'clear']],
                ['fontname', ['fontname']],
                ['fontsize', ['fontsize']],
                ['color', ['color']],
                ['para', ['ul', 'ol', 'paragraph']],
                ['table', ['table']],
                ['insert', ['link', 'picture', 'video']],
                ['format', ['hr']],
                ['misc', ['undo', 'redo', 'codeview']]
            ]
        };

//            console.log('poll: ', poll);

        // load Poll
        $scope.poll = poll;
        $scope.item = angular.copy(defaultItem);
        $scope.currentItem = angular.copy(defaultItem);
        $scope.imgPath = 'polls/';

        $scope.pollType = [
            { name: 'Image', value: 'img' },
            { name: 'Text', value: 'txt' }
        ];

        $scope.poll.pollType === 'img' ? $scope.poll.pollType = $scope.pollType[0].value : $scope.poll.pollType = $scope.pollType[1].value;

        $scope.pollView = [
            { name: 'Main', value: 'main' },
            { name: 'Sidebar', value: 'side' },
            { name: 'Hide', value: 'hide'}
        ];

//			console.log('$scope.poll.viewType:', $scope.poll.viewType);
        switch($scope.poll.viewType) {
            case 'main':
                $scope.poll.viewType = $scope.pollView[0].value;
                break;
            case 'sidebar':
                $scope.poll.viewType = $scope.pollView[1].value;
                break;
            case 'hide':
                $scope.poll.viewType = $scope.pollView[2].value;
                break;
        }

        $scope.pollActive = [
            { name: 'Yes', value: 'true'},
            { name: 'No', value: 'false'}
        ];

        $scope.voteLimit = function() {
            var out = [];
            for (var i = 0; i < $scope.poll.items.length; i++) {
                out.push(i + 1);
            }
            $scope.voteLimits = out;
            return out;
        }

        $scope.photoUpload = function ($files) {
            if (!$files.length) return false;
            var uploadBox = bootbox.dialog({
                message: $compile('<div class="progress progress-striped active" style="margin-bottom: 0px;"><div class="progress-bar" role="progressbar" aria-valuenow="{{uploading}}" aria-valuemin="0" aria-valuemax="100" style="width: {{uploading}}%;"><span class="sr-only">{{uploading}}% Complete</span></div></div>')($scope),
                closeButton: false,
                animate: false
            });
            $scope.uploading = 0;
            uploadBox.modal('show');
            for (var i = 0; i < $files.length; i++) {
                var file = $files[i];
                $scope.upload = $upload.upload({
                    url: '/api/images/uploadPoll',
                    method: 'POST',
                    file: file
                }).progress(function(evt) {
                    $scope.uploading = parseInt(100.0 * evt.loaded / evt.total);
                }).success(function(data, status, headers, config) {
//						console.log('data:', data);
                    $scope.currentItem.photoNames = {
                        large: data.large,
                        thumb: data.thumb
                    };
                    uploadBox.modal('hide');
                });
            }
        };

        $scope.itemEditWnd = function (item) {
            $scope.currentItem = item;
            box = bootbox.dialog({
                title: 'Edit Item',
                message: $compile('<div poll-item-edit-form></div>')($scope)
            });
        };

        $scope.editItem = function (currentItem) {
//                console.log('$scope.currentItem:', currentItem);
            box.modal('hide');
//                $scope.currentItem = false;
        };

        $scope.deleteItem = function (item) {
            var index = $scope.poll.items.indexOf(item);
            $scope.poll.items.splice(index, 1);

            if (item.id) {
                onSave.toDelete.push(item);
            }
            var index = onSave.toCreate.indexOf(item);
            if (index !== -1) {
                onSave.toCreate.splice(index, 1);
            }
            for (var i = 0; i < $scope.poll.items.length; i++) {
                $scope.poll.items[i].orderNum = i + 1;
            }
        };

        $scope.itemAddWnd = function () {
            $scope.currentItem = angular.copy($scope.item);
            box = bootbox.dialog({
                title: 'Add Item',
                message: $compile('<div poll-item-add-form></div>')($scope)
            });
        };

        $scope.addItem = function () {
            $scope.currentItem.votes = 0;
            $scope.currentItem.orderNum = $scope.poll.items.length + 1;
            $scope.poll.items.push($scope.currentItem);
            onSave.toCreate.push($scope.currentItem);
            box.modal('hide');
        };

        $scope.updateDND = function (list, index) {
            list.splice(index, 1);
            for (var i = 0; i < list.length; i++) {
                list[i].orderNum = i + 1;
            }
        };

        $scope.getImage = function () {
            var URL = (tpl === './') ? cdn2 : tpl;
            return ($scope.currentItem.photoNames && $scope.currentItem.photoNames.thumb === '') ?  URL + 'img/blank.png' : URL + $scope.imgPath + $scope.currentItem.photoNames.thumb;
        };

        $scope.editPoll = function () {
//				console.log('onSave.toDelete: ', onSave.toDelete);
//				console.log('onSave.toCreate: ', onSave.toCreate);
            $scope.fetching = true;
            async.parallel([
                function(paraCB) {
                    Poll.upsert($scope.poll)
                    .$promise
                    .then(function (data) {
                        return paraCB();
                    })
                    .catch(function(err){
                        return paraCB(err);
                    });
                },
                function(paraCB) {
                    async.each(onSave.toDelete, function(pollToDel, pollToDelCB) {
                        Poll.items.destroyById({
                            id: poll.id,
                            fk: pollToDel.id
                        }).$promise
                        .then(function (pollDeleted) {
                            return pollToDelCB();
                        })
                        .catch(function (err) {
                            return pollToDelCB(err);
                        });
                    }, function(err) {
                        if (err) {
                            return paraCB(err);
                        }
                        return paraCB();
                    });
                },
                function(paraCB) {
                    Poll.items.createMany({
                        id: poll.id
                    }, onSave.toCreate).$promise
                    .then(function (pollsItemsCreated) {
                        return paraCB();
                    })
                    .catch(function (err) {
                        return paraCB(err);
                    });
                }
            ], function(err) {
                $scope.fetching = false;
                $window.scrollTo(0, 0);
                if (err) {
                    return AlertService.setError({
                        show: true,
                        msg: 'Could not edit ' + poll.title,
                        lbErr: err
                    });
                }
                AlertService.setSuccess({
                    persist: true,
                    show: false,
                    msg: poll.title + ' editted successfully'
                });
                $state.go('app.admin.polls.list');
            });


        };
*/
    }
]);