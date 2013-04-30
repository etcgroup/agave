define(['underscore'],
    function(_) {

        var globalRequestCounter = 0;

        var DummyRequest = function(zoomLevel, extent) {
            console.log('requesting data for ' + extent + ' at zoom ' + zoomLevel);
        };
        DummyRequest.prototype.done = function() {
            return [];
        };
        DummyRequest.prototype.abort = function() {
        };


        /**
         * Class for caching data requests.
         *
         * It currently caches values for multiple zoom levels, but only one request for each
         * zoom level.
         */
        var DataCache = function() {

            //Set a default requester function
            this._requester = function(zoomLevel, extent) {
                return new DummyRequest(zoomLevel, extent);
            };

            //Initialize the cache
            this._cache = {};
        };

        _.extend(DataCache.prototype, {

            /**
             * Request some data at a given zoom level (granularity setting)
             * and extent. The extent must be a range array [min, max], while
             * the zoom level can be whatever.
             *
             * The callback will be called with the parsed response data
             * once the request has completed, or immediately if the response
             * was cached.
             */
            load: function(zoomLevel, extent, callback) {
                var cached = this._cache[zoomLevel];
                if (cached) {
                    if (extent[0] >= cached.extent[0] &&
                        extent[1] <= cached.extent[1]) {
                        console.log('using cached data from ' + cached.id + ' for ' + extent + ' at zoom ' + zoomLevel);

                        cached.request.done(callback);
                    }
                }
                var requestId = globalRequestCounter++;

                console.log('new request #' + requestId + ' for ' + extent + ' at zoom ' + zoomLevel);
                var self = this;
                var tries = 0;
                var tryRequest = function() {
                    var request = self._requester(requestId, zoomLevel, extent);
                    tries++;

                    self._cacheRequest(requestId, zoomLevel, extent, request);

                    request.done(function(data) {
                        console.log('request #' + requestId + ' fulfilled');
                        callback(data);
                    });

                    request.fail(function(xhr) {
                        if (xhr.statusText !== 'abort') {
                            if (tries < 2) {
                                console.log('retrying request #' + requestId + ' for ' + extent + ' at zoom ' + zoomLevel);
                                tryRequest();
                            } else {
                                console.log('giving up on request #' + requestId);
                            }
                        }
                    });
                };

                tryRequest();
            },

            /**
             * Store a request in the cache.
             */
            _cacheRequest: function(id, zoomLevel, extent, request) {
                //If there is already a request at this zoom level
                if (this._cache[zoomLevel]) {

                    var existing = this._cache[zoomLevel];

                    //And it has the ability to be cancelled
                    if (existing.request.abort) {
                        //And it has not already been canceled or completed
                        if (!existing.request.state || existing.request.state() === 'pending') {
                            //There's already a request cached
                            //so cancel the request
                            console.log("Canceling request #" + existing.id + " for " + existing.extent + " at zoom " + zoomLevel);
                            existing.request.abort();
                        }
                    }
                }

                //Store the new request in the cache
                this._cache[zoomLevel] = {
                    id: id,
                    extent: extent,
                    request: request
                };
            },

            /**
             * Get or set the function used to make data requests.
             *
             * The requester should return a jQuery AJAX promise object.
             */
            requester: function(fun) {
                if (!arguments.length) {
                    return this._requester;
                }

                this._requester = fun;
                return this;
            }
        });

        return DataCache;
    });