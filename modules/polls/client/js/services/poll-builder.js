angular.module('polls.services')
.factory('PollBuilder', ['$upload', '$compile', '$rootScope', '$timeout', 'bootbox', 'User', 'Util', 'AlertService', 'Poll', 'PollItem', 
    function ($upload, $compile, $rootScope, $timeout, bootbox, User, Util, AlertService, Poll, PollItem) {
        var pollTypes = [
            { key: 'Image', value: 'img' },
            { key: 'Text', value: 'txt' }
        ];
        var viewTypes = [
            { key: 'Main', value: 'main' },
            { key: 'Sidebar', value: 'side' },
            { key: 'Hide', value: 'hide'}            
        ];
        var summernoteOptions = {
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
        var poll = {};
        var defaultPoll = {
            title: '',
            subtitle: '',
            description: '',
            pollType: 'img',
            voteLimit: 1,
            viewType: '',
            items: [],
            mode: 'add',
            activePollItem: null
        };
        var defaultPollItem = {
            name: 'New Item',
            photoNames: {
                thumb: '',
                large: ''
            },
            votes: 0,
            orderNum: 1,
            pollId: null
        };

        poll.new = function (mode, data) {
            // start with default poll
            var pb = angular.copy(defaultPoll);
            pb.deleted = {
                pollItems: []
            };
            pb.updated = {
                poll: false,
                pollItems: []
            };

            // init
            pb.init = function(mode, data) {
                // set mode
                pb.mode = mode;
                
                // if we have data, load it
                if (data) {
                    // load data
                    pb.load(data);
                }
            };

            // load data into service
            pb.load = function (data) {
                pb.loaded = true;
                
                pb.id = data.id;
                pb.title = data.title;
                pb.subtitle = data.subtitle;
                pb.description = data.description;
                pb.pollType = data.pollType;
                pb.viewType = data.viewType;
                pb.items = data.items;
                pb.voteLimit = data.voteLimit;
                
            };
            
            // get summernote options
            pb.getSummernoteOptions = function () {
                return summernoteOptions;
            };
            
            // get poll types
            pb.getPollTypes = function () {
                return pollTypes;
            };
            
            // get view types
            pb.getViewTypes = function () {
                return viewTypes;
            };
            
            // get vote limits
            pb.getVoteLimits = function () {
                var out = [];
                if (!pb.items || !pb.items.length || pb.items.length < 2) { return out; }
                
                for (var i = 1; i < pb.items.length; i++) {
                    out.push(i);
                }
                
                return out;
            };
            
            // toggle active poll item
            pb.toggleActivePollItem = function (pollItem) {
                pb.activePollItem = (pb.activePollItem !== pollItem) ? pollItem : null;
            };
            
            // add poll item
            pb.addPollItem = function () {
                // create new poll item
                var newPollItem = angular.copy(defaultPollItem);
                
                // set ordernum
                newPollItem.orderNum = pb.items.length + 1;
                
                // add to poll items
                pb.items.push(newPollItem);
                
                // set new poll item to active
                pb.activePollItem = newPollItem;
            };
            
            // get pollItem by id
            pb.getPollItemById = function (pollItemId) {
                for (var i = 0; i < pb.items.length; i++) {
                    if (pb.items[i].id === pollItemId) {
                        return pb.items[i];
                    }
                }
                return false;
            };
            
            // delete poll item
            pb.pollItemDelete = function (pollItem) {
                // flag item as deleted
                pb.pollItemDeleted(pollItem);
                
                // check if active poll item is one being deleted
                if (pb.activePollItem === pollItem) {
                    pb.activePollItem = null;
                }
                
                // remove poll item
                var index = pb.items.indexOf(pollItem);
                pb.items.splice(index, 1);
            };
            
            // photo upload
            pb.pollItemPhotoUpload = function ($files) {
                if (!$files.length) return false;
                var newScope = $rootScope.$new(true);
                newScope.uploading = 0;
                var box = bootbox.dialog({
                    message: $compile('<div class="progress progress-striped active" style="margin-bottom: 0px;"><div class="progress-bar" role="progressbar" aria-valuenow="{{uploading}}" aria-valuemin="0" aria-valuemax="100" style="width: {{uploading}}%;"><span class="sr-only">{{uploading}}% Complete</span></div></div>')(newScope),
                    closeButton: false,
                    animate: false
                });
                box.modal('show');
                for (var i = 0; i < $files.length; i++) {
                    var file = $files[i];
                    newScope.upload = $upload.upload({
                        url: '/api/images/uploadPoll',
                        method: 'POST',
                        file: file
                    }).progress(function(evt) {
                        newScope.uploading = parseInt(100.0 * evt.loaded / evt.total);
                    }).success(function(data, status, headers, config) {
                        pb.activePollItem.photoNames = {
                            large: data.large,
                            thumb: data.thumb,
                        };
                        //var URL = (tpl === './') ? cdn2 : tpl;
                        //sb.snapshotImg = URL + data.path + data.thumb;
                        box.modal('hide');
                        
                        // mark poll as updated
                        pb.pollUpdated();
                    });
                }
            };

            // get snapshot image url
            pb.getPollItemImage = function () {
                var imgPath = 'polls/';
                return (pb.activePollItem && pb.activePollItem.photoNames && pb.activePollItem.photoNames.thumb === '') ?  tpl + 'img/blank.png' : cdn2 + imgPath + pb.activePollItem.photoNames.thumb;
            };
            
            // remove poll item image
            pb.removePollItemPhoto = function (pollItem) {
                pollItem.photoNames.thumb = '';
                pollItem.photoNames.large = '';
                
                // flag poll item as updated
                pb.pollItemUpdated(pollItem);
            };
            
            // prompt for pollItem delete
            pb.pollItemDeletePrompt = function (pollItem) {
                var box = bootbox.dialog({
                    title: "Remove Poll Item?",
                    message: "Are you sure you want to remove the poll item <strong>" + pollItem.name + "</strong>?",
                    buttons: {
                        confirm: {
                            label: "Delete",
                            className: "btn-danger",
                            callback: function () {
                                $timeout(function () {
                                    pb.pollItemDelete(pollItem);
                                    box.modal('hide');
                                });
                            }
                        },
                        cancel: {
                            label: "Cancel",
                            className: "btn-default pull-left",
                            callback: function () {
                                box.modal('hide');
                            }
                        }
                    },
                    className: 'modal-admin modal-admin-remove',
                    show: false
                });
                box.modal('show');
            };
            
            // flag poll as updated
            pb.pollUpdated = function () {
                pb.updated.poll = true;
            };
            
            // flag pollItem as updated
            pb.pollItemUpdated = function (pollItem) {
                // don't flag if no id
                if (!pollItem.id) { return false; }
                
                // check if already flagged
                var index = pb.updated.pollItems.indexOf(pollItem.id);
                if (index === -1) {
                    // add id to flags
                    pb.updated.pollItems.push(pollItem.id);
                }
            };
            
            // flag pollItem as deleted
            pb.pollItemDeleted = function (pollItem) {
                // don't flag if no id
                if (!pollItem.id) { return false; }
                
                // check if already flagged
                var index = pb.deleted.pollItems.indexOf(pollItem.id);
                if (index === -1) {
                    // check if we need to remove from updated
                    var updatedIndex = pb.updated.pollItems.indexOf(pollItem.id);
                    if (updatedIndex !== -1) {
                        pb.updated.pollItems.splice(updatedIndex, 1);
                    }
                    
                    // add id to flags
                    pb.deleted.pollItems.push(pollItem.id);
                }
            };

            // handle drag and drop for pollItems
            pb.pollItemsUpdateDND = function (list, index) {
                // if we're dragging the active pollItem, unset active pollItem
                if (list[index] === pb.activePollItem) {
                    $timeout(function () {
                        pb.activePollItem = null;
                    });
                }
                
                // remove old item from list
                list.splice(index, 1);
                
                // update list
                for (var i = 0; i < list.length; i++) {
                    // update orderNum
                    list[i].orderNum = i + 1;
                    
                    // mark item as updated
                    pb.pollItemUpdated(list[i]);
                }
            };
            
            // check poll before save
            pb.saveCheck = function (callback) {
                async.series([
                    // check poll
                    function (cb) {
                        
                        return cb();
                    },
                    // check poll items
                    function (cb) {
                        // 
                        
                        return cb();
                    }
                ], function (err) {
                    return callback(err);
                });
            };
            
            // delete items on save
            pb.saveDelete = function (callback) {
                console.log('begin deleted: ', pb.deleted);
                async.series([
                    // delete poll items
                    function (cb) {
                        console.log('deleting poll items');
                        // skip if nothing to delete
                        if (!pb.deleted.pollItems.length) { return cb(); }
                        
                        async.each(pb.deleted.pollItems, function (pollItemId, eachCallback) {
                            PollItem.deleteById({ id: pollItemId })
                            .$promise
                            .then(function (data) {
                                console.log('deleted poll item: ', pollItemId);
                                // reset deleted flags
                                var index = pb.deleted.pollItems.indexOf(pollItemId);
                                if (index !== -1) {
                                    pb.deleted.pollItems.splice(index, 1);
                                }
                                // next
                                return eachCallback();
                            })
                            .catch(function (response) {
                                return eachCallback(response);
                            });
                        }, function (err) {
                            if (err) {
                                console.log('delete poll item error: ', err);
                            }
                            return cb(err);
                        });
                    }
                ], function (err) {
                    console.log('done deleting');
                    console.log('deleted: ', pb.deleted);
                    return callback();
                });
            };
            
            // update items on save
            pb.saveUpdate = function (callback) {
                console.log('begin updated: ', pb.updated);
                async.series([
                    // update poll items
                    function (cb) {
                        console.log('updating poll items');
                        // skip if nothing to update
                        if (!pb.updated.pollItems.length) { return cb(); }
                        
                        async.each(pb.updated.pollItems, function (pollItemId, eachCallback) {
                            var pollItem = pb.getPollItemById(pollItemId);
                            PollItem.update({
                                where: {
                                    id: pollItemId
                                }
                            }, {
                                name: pollItem.name,
                                photoNames: pollItem.photoNames,
                                orderNum: pollItem.orderNum
                            })
                            .$promise
                            .then(function (data) {
                                console.log('updated poll item: ', pollItemId);
                                // reset updated flags
                                var index = pb.updated.pollItems.indexOf(pollItemId);
                                if (index !== -1) {
                                    pb.updated.pollItems.splice(index, 1);
                                }
                                // next
                                return eachCallback();
                            })
                            .catch(function (response) {
                                return eachCallback(response);
                            });
                        }, function (err) {
                            if (err) {
                                console.log('update poll item error: ', err);
                            }
                            return cb(err);
                        });
                    },
                    // update poll
                    function (cb) {
                        console.log('updating poll');
                        // skip if nothing to update
                        if (!pb.updated.poll || !pb.id) { return cb(); }
                        
                        Poll.update({
                            where: {
                                id: pb.id
                            }
                        }, {
                            title: pb.title,
                            subtitle: pb.subtitle,
                            description: pb.description,
                            pollType: pb.pollType,
                            voteLimit: pb.voteLimit,
                            viewType: pb.viewType
                        })
                        .$promise
                        .then(function (data) {
                            console.log('updated poll: ', pb.id);
                            // reset updated flags
                            pb.updated.poll = false;
                            // next
                            return cb();
                        })
                        .catch(function (response) {
                            console.log('update poll error: ', response);
                            return cb(response);
                        });
                    }
                ], function (err) {
                    console.log('done updating');
                    console.log('updated: ', pb.updated);
                    return callback();
                });
            };
            
            // create new items on save
            pb.saveCreate = function (callback) {
                async.waterfall([
                    // create poll
                    function (cb) {
                        if (pb.id) { return cb(null, pb.id); }
                        Poll.create({
                            title: pb.title,
                            subtitle: pb.subtitle,
                            description: pb.description,
                            pollType: pb.pollType,
                            voteLimit: pb.voteLimit,
                            viewType: pb.viewType
                        })
                        .$promise
                        .then(function (data) {
                            pb.id = data.id;
                            return cb(null, data.id);
                        })
                        .catch(function (response) {
                            return cb(response);
                        });
                    },
                    // create poll items
                    function (pollId, cb) {
                        async.each(pb.items, function (pollItem, eachCallback) {
                            // only create poll items without ids
                            if (pollItem.id) { return eachCallback(); }
                            // create new poll item
                            PollItem.create({
                                name: pollItem.name,
                                photoNames: pollItem.photoNames,
                                votes: 0,
                                orderNum: pollItem.orderNum,
                                pollId: pollId
                            })
                            .$promise
                            .then(function (data) {
                                pollItem.id = data.id;
                                return eachCallback();
                            })
                            .catch(function (response) {
                                return eachCallback(response);
                            });
                        }, function (err) {
                            if (err) { return cb(err); }
                            return cb(null, pollId);
                        });
                    }
                ], function (err) {
                    if (err) {
                        console.error('Save create error: ', err);
                        return callback(err);
                    }
                    console.log('done creating');
                    return callback();
                });
            };
            
            // save poll
            pb.save = function () {
                console.log('poll: ', pb);
                pb.saving = true;
                
                // reset errors
                AlertService.reset();
                
                async.waterfall([
                    pb.saveCheck,
                    pb.saveDelete,
                    pb.saveUpdate,
                    pb.saveCreate
                ], function (err) {
                    $timeout(function () {
                        pb.saving = false;
                    });
                    
                    if (err) {
                        if (typeof err === 'string') {
                            AlertService.setError({
                                msg: 'Poll Error',
                                errorList: [err],
                                show: true
                            });
                        } else {
                            AlertService.setError({
                                msg: 'Poll Error',
                                lbErr: err,
                                show: true
                            });
                        }
                    } else {
                        var action = (pb.mode === 'add') ? 'added' : 'updated';
                        
                        AlertService.setSuccess({
                            show: true,
                            msg: 'Poll ' + action + ' successfully'
                        });
                        
                        if (pb.mode === 'add') {
                            pb.mode = 'edit';
                        }
                    }
                    
                    console.log('done saving');
                });
                
            };

            // run init
            pb.init(mode, data);

            // return instance
            return pb;
        };

        // return service
        return poll;
    }
]);