angular.module('polls.controllers')
.controller('AdminPollAddCtrl', ['$scope', 'PollBuilder',
    function ($scope, PollBuilder) {

        $scope.mode = 'add';

        $scope.poll = PollBuilder.new();

        /*$scope.options = {
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

        // load Poll
        $scope.poll = angular.copy(defaultPoll);
        $scope.item = angular.copy(defaultItem);
        $scope.currentItem = angular.copy(defaultItem);
        $scope.imgPath = 'polls/';

        $scope.pollType = [
            { name: 'Image', value: 'img' },
            { name: 'Text', value: 'txt' }
        ];

        $scope.pollView = [
            { name: 'Main', value: 'main' },
            { name: 'Sidebar', value: 'side' },
            { name: 'Hide', value: 'hide'}
        ];

        $scope.pollActive = [
            { name: 'Yes', value: 'true'},
            { name: 'No', value: 'false'}
        ];

        $scope.voteLimit = function() {
            var out = [];
            for (var i = 0; i < $scope.poll.items.length; i++) {
                out.push(i + 1);
            }
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

        $scope.editItem = function () {
            box.modal('hide');
        };

        $scope.deleteItem = function (item) {
            var index = $scope.poll.items.indexOf(item);
            $scope.poll.items.splice(index, 1);
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

        // add Poll
        $scope.addPoll = function () {
//				console.log('$scope.poll: ', $scope.poll);
            $scope.fetching = true;
            $scope.poll.createdDate = new Date().toISOString();
            Poll.create($scope.poll)
            .$promise
            .then(function (pollInstance) {
                $scope.fetching = false;
                $state.go('app.admin.polls.list');
                return AlertService.setSuccess({
                    persist: true,
                    show: false,
                    msg: pollInstance.title + ' created successfully'
                });
            })
            .catch(function(err){
                $scope.fetching = false;
                $window.scrollTo(0,0);
                AlertService.setError({
                    show: true,
                    msg: 'Unable to create ' + $scope.poll.title,
                    lbErr: err
                });
            });
        };*/
    }
]);