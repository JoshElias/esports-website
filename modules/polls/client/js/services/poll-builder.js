angular.module('polls.services')
.factory('PollBuilder', ['$upload', '$compile', '$rootScope', '$timeout', 'bootbox', 'User', 'Util', 'AlertService', 'Poll', 'PollItem', 
    function ($upload, $compile, $rootScope, $timeout, bootbox, User, Util, AlertService, Poll, PollItem) {
        var pollTypes = [
            { key: 'Image', value: 'img' },
            { key: 'Text', value: 'txt' }
        ];
        var pollViews = [
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
            voteLimit: 0,
            viewType: ''
        };
        var defaultPollItem = {
            name: '',
            photoNames: {
                small: '',
                large: ''
            },
            votes: 0,
            orderNum: 1,
            pollId: null
        };

        poll.new = function (data) {
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
            pb.init = function(data) {
                // if we have data, load it
                if (data) {
                    // load data
                    pb.load(data);
                }
            };

            pb.load = function (data) {
                pb.loaded = true;
            };
            
            pb.getSummernoteOptions = function () {
                return summernoteOptions;
            };
            
            // check snapshot before save
            pb.saveCheck = function (callback) {
                async.series([
                    // check poll
                    function (cb) {
                        
                    },
                    // check poll items
                    function (cb) {
                        
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
                            var pollItem = pb.getPollItemId(pollItemId);
                            PollItem.update({
                                where: {
                                    id: pollItemId
                                }
                            }, {
                                // TODO: ADD POLL ITEM FIELDS TO UPDATE
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
                            // TODO: ADD POLL FIELDS TO UPDATE
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
                            // TODO: ADD POLL FIELDS TO CREATE
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
                        async.each(pb.pollItems, function (pollItem, eachCallback) {
                            // only create poll items without ids
                            if (pollItem.id) { return eachCallback(); }
                            // create new poll item
                            PollItem.create({
                                // TODO: ADD FIELDS FOR CREATE POLL ITEM
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
            
            // save snapshot
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
                    }
                    
                    console.log('done saving');
                });
                
            };

            // run init
            pb.init(data);

            // return instance
            return pb;
        };

        // return service
        return poll;
    }
]);