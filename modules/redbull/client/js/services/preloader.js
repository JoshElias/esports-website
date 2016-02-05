angular.module('redbull.services')
.factory('Preloader', ['$q', '$rootScope',
    function( $q, $rootScope ) {
        // I manage the preloading of file objects. Accepts an array of file URLs.
        function Preloader( fileLocations ) {
            // I am the file SRC values to preload.
            this.fileLocations = fileLocations;
            // As the files load, we'll need to keep track of the load/error
            // counts when announing the progress on the loading.
            this.fileCount = this.fileLocations.length;
            this.loadCount = 0;
            this.errorCount = 0;
            // I am the possible states that the preloader can be in.
            this.states = {
                PENDING: 1,
                LOADING: 2,
                RESOLVED: 3,
                REJECTED: 4
            };

            // I keep track of the current state of the preloader.
            this.state = this.states.PENDING;
            // When loading the files, a promise will be returned to indicate
            // when the loading has completed (and / or progressed).
            this.deferred = $q.defer();
            this.promise = this.deferred.promise;
        }
        // ---
        // STATIC METHODS.
        // ---
        // I reload the given files [Array] and return a promise. The promise
        // will be resolved with the array of file locations.
        Preloader.preloadFiles = function( fileLocations ) {
            var preloader = new Preloader( fileLocations );
            return( preloader.load() );
        };
        // ---
        // INSTANCE METHODS.
        // ---
        Preloader.prototype = {
            // Best practice for "instnceof" operator.
            constructor: Preloader,
            // ---
            // PUBLIC METHODS.
            // ---
            // I determine if the preloader has started loading files yet.
            isInitiated: function isInitiated() {
                return( this.state !== this.states.PENDING );
            },
            // I determine if the preloader has failed to load all of the files.
            isRejected: function isRejected() {
                return( this.state === this.states.REJECTED );
            },
            // I determine if the preloader has successfully loaded all of the files.
            isResolved: function isResolved() {
                return( this.state === this.states.RESOLVED );
            },
            // I initiate the preload of the files. Returns a promise.
            load: function load() {
                // If the files are already loading, return the existing promise.
                if ( this.isInitiated() ) {
                    return( this.promise );
                }
                this.state = this.states.LOADING;
              console.log(this.fileLocations);
                for ( var i = 0 ; i < this.fileCount ; i++ ) {
                    this.loadFileLocation( this.fileLocations[ i ] );
                }
                // Return the deferred promise for the load event.
                return( this.promise );
            },
            // ---
            // PRIVATE METHODS.
            // ---
            // I handle the load-failure of the given file location.
            handleFileError: function handleFileError( fileLocation ) {
                this.errorCount++;
                // If the preload action has already failed, ignore further action.
                if ( this.isRejected() ) {
                    return;
                }
                this.state = this.states.REJECTED;
                this.deferred.reject( fileLocation );
            },
            // I handle the load-success of the given file location.
            handleFileLoad: function handleFileLoad( fileLocation ) {
                this.loadCount++;
                // If the preload action has already failed, ignore further action.
                if ( this.isRejected() ) {
                    return;
                }
                // Notify the progress of the overall deferred. This is different
                // than Resolving the deferred - you can call notify many times
                // before the ultimate resolution (or rejection) of the deferred.
                this.deferred.notify({
                    percent: Math.ceil( this.loadCount / this.fileCount * 100 ),
                    fileLocation: fileLocation
                });
                // If all of the files have loaded, we can resolve the deferred
                // value that we returned to the calling context.
                if ( this.loadCount >= (this.fileCount) ) {
                    this.state = this.states.RESOLVED;
                    this.deferred.resolve( this.fileLocations );
                }
            },
            // I check if the file being loaded is an image
            isImage: function ( fileLocation ) {
                var ext = fileLocation.split('.').pop(),
                    allowedExts = ['jpeg', 'jpg', 'png', 'gif'];

                return ( allowedExts.indexOf(ext) !== -1 );
            },
            // I check if the file being loaded is an audio clip
            isAudio: function ( fileLocation ) {
                var ext = fileLocation.split('.').pop(),
                    allowedExts = ['ogg', 'mp3'];

                return ( allowedExts.indexOf(ext) !== -1 );
            },
            // I load the given file location and then wire the load / error
            // events back into the preloader instance.
            // --
            // NOTE: The load/error events trigger a $digest.
            loadFileLocation: function loadFileLocation( fileLocation ) {
                var preloader = this;
                // check to make sure file is image or audio
                if (!preloader.isImage( fileLocation ) && !preloader.isAudio( fileLocation )) {
                    return preloader.handleFileError( fileLocation );
                }
                // function to handle file loading completion
                function fileLoaded ( event ) {
                    // Since the load event is asynchronous, we have to
                    // tell AngularJS that something changed.
                    $rootScope.$apply(
                        function() {
                            preloader.handleFileLoad( event.target.src );
                            // Clean up object reference to help with the
                            // garbage collection in the closure.
                            preloader = file = event = null;
                        }
                    );
                }
                // function to handle file loading error
                function fileError ( event ) {
                    // Since the load event is asynchronous, we have to
                    // tell AngularJS that something changed.
                    $rootScope.$apply(
                        function() {
                            preloader.handleFileError( event.target.src );
                            // Clean up object reference to help with the
                            // garbage collection in the closure.
                            preloader = file = event = null;
                        }
                    );
                }
                // When it comes to creating the file object, it is critical that
                // we bind the event handlers BEFORE we actually set the file
                // source. Failure to do so will prevent the events from proper
                // triggering in some browsers.
                if (preloader.isImage( fileLocation )) {
                    var file = $( new Image() )
                        .load( fileLoaded )
                        .error( fileError )
                        .prop( "src", fileLocation );
                    ;
                } else {
                    var file = $( new Audio() )
                        .prop( "src", fileLocation );

                    file[0].addEventListener('canplaythrough', fileLoaded, false);
                    file[0].addEventListener('error', fileError, false);
                }
            }
        };
        // Return the factory instance.
        return( Preloader );
    }
]);
