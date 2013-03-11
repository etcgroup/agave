define(['underscore'],
    function(_) {

        var dummyRequest = function(zoomLevel, extent) {
            console.log('requesting data for ' + extent + ' at zoom ' + zoomLevel);
        }
        dummyRequest.prototype.done = function() {
            return [];
        }
        dummyRequest.prototype.abort = function() {
        }

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
                        console.log('using cached data for ' + extent + ' at zoom ' + zoomLevel);
                        return cached.request;
                    }
                }

                console.log('submitting a new request for ' + extent + ' at zoom ' + zoomLevel);
                var request = this._requester(zoomLevel, extent);
                this._cacheRequest(zoomLevel, extent, request);

                request.done(function() {
                    console.log('request fulfilled');
                });
                
                return request;
            },

            _cacheRequest: function(zoomLevel, extent, request) {
                if (this._cache[zoomLevel]) {

                    var existing = this._cache[zoomLevel];

                    if (existing.request.abort) {
                        if (!existing.request.state || existing.request.state() === 'pending') {
                            //There's already a request cached
                            //so cancel the request
                            console.log("Canceling request for " + existing.extent + " at zoom " + zoomLevel);
                            existing.request.abort();
                        }
                    }
                }

                this._cache[zoomLevel] = {
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