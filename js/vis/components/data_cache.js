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
            this._requester = function(zoomLevel, extent) {
                return new dummyRequest(zoomLevel, extent);
            }
            this._cache = {};
            this._zoomLevel = 0;
            this._extent = [0,1];
        }

        _.extend(DataCache.prototype, {
            extent: function(extent) {
                if (!arguments.length) {
                    return this._extent;
                }
                this._extent = extent;
                return this;
            },

            zoomLevel: function(zoomLevel) {
                if (!arguments.length) {
                    return this._zoomLevel;
                }
                this._zoomLevel = zoomLevel;
                return this;
            },

            load: function(zoomLevel, extent) {
                this._zoomLevel = zoomLevel;
                this._extent = extent;

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

            _cacheRequest: function(id, zoomLevel, extent, request) {
                if (this._cache[zoomLevel]) {

                    var existing = this._cache[zoomLevel];

                    if (existing.request.abort) {
                        if (!existing.request.state || existing.request.state() === 'pending') {
                            //There's already a request cached
                            //so cancel the request
                            console.log("Canceling request #" + existing.id + " for " + existing.extent + " at zoom " + zoomLevel);
                            existing.request.abort();
                        }
                    }
                }

                this._cache[zoomLevel] = {
                    id: id,
                    extent: extent,
                    request: request
                }
            },

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