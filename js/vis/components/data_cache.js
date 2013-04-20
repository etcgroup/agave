define(['underscore'],
    function(_) {

        var globalRequestCounter = 0;

        var dummyRequest = function(zoomLevel, extent) {
            console.log('requesting data for ' + extent + ' at zoom ' + zoomLevel);
        }
        dummyRequest.prototype.done = function() {
            return [];
        }
        dummyRequest.prototype.abort = function() {
        }


        /**
         * Class for caching data requests.
         *
         * If you ask it for data with a particular extent and zoom level,
         * it will give you back a jQuery ajax promise object.
         *
         * You can call done(function(data){}) on the object and get back
         * some data, which will either happen immediately if the data is cached,
         * or eventually if it needs to be requested fresh.
         *
         * It currently caches values for multiple zoom levels, but only one request for each
         * zoom level.
         */
        var DataCache = function() {

            //Set a default requester function
            this._requester = function(zoomLevel, extent) {
                return new dummyRequest(zoomLevel, extent);
            }

            //Initialize the cache
            this._cache = {};
        }

        _.extend(DataCache.prototype, {

            /**
             * Request some data at a given zoom level (granularity setting)
             * and extent. The extent must be a range array [min, max], while
             * the zoom level can be whatever.
             *
             * An ajax promise is returned, meaning that you can call
             * done() on the result with a callback function. The callback
             * function will be invoked immediately if the data is available already (from cache).
             *
             * Otherwise the callback will be invoked once the data has loaded.
             */
            load: function(zoomLevel, extent) {
                var cached = this._cache[zoomLevel];
                if (cached) {
                    if (extent[0] >= cached.extent[0] &&
                        extent[1] <= cached.extent[1]) {
                        console.log('using cached data from ' + cached.id + ' for ' + extent + ' at zoom ' + zoomLevel);
                        return cached.request;
                    }
                }
                var requestId = globalRequestCounter++;

                console.log('new request #' + requestId + ' for ' + extent + ' at zoom ' + zoomLevel);
                var request = this._requester(requestId, zoomLevel, extent);
                this._cacheRequest(requestId, zoomLevel, extent, request);

                request.done(function() {
                    console.log('request #' + requestId + ' fulfilled');
                });

                return request;
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
                }
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