define(['underscore',
    'vis/components/histogram',
    'vis/components/data_cache',
    'vis/components/semzoom'],
    function(_, Histogram, DataCache, SemanticZoom) {

        var ZoomHistogram = function() {
            this._histogram = new Histogram();
            this._cache = new DataCache();
            this._semantic = new SemanticZoom();
            this._dataAccessor = function(response) {
                return response.payload;
            }
            this._onLoad = null;
        }

        _.extend(ZoomHistogram.prototype, {
            responseProcessor: function(fun) {
                if (!arguments.length) {
                    return this._dataAccessor;
                }
                this._dataAcecssor = fun;
                return this;
            },

            histogram: function(hist) {
                if (!arguments.length) {
                    return this._histogram;
                }
                this._histogram = hist;
                return this;
            },

            cache: function(cache) {
                if (!arguments.length) {
                    return this._cache;
                }
                this._cache = cache;
                return this;
            },

            onLoad: function(fun) {
                if (!arguments.length) {
                    return this._onLoad;
                }
                this._onLoad = fun;
                return this;
            },

            semantic: function(semantic) {
                if (!arguments.length) {
                    return this._semantic;
                }
                this._semantic = semantic;
                return this;
            },

            update: function() {
                var self = this;

                var changed = this._semantic
                .interval(this._cache.extent())
                .binWidth(this._cache.zoomLevel())
                .update();

                var alreadyUpdated = false;

                if (changed) {
                    var binWidth = this._semantic.binWidth();
                    var interval = this._semantic.interval()

                    this._latestBinWidth = binWidth;
                    this._latestBinWidthReceived = false;

                    this._cache.load(binWidth, interval)
                    .done(function(response) {

                        //Ignore late responses
                        if (binWidth != self._latestBinWidth && self._latestBinWidthReceived) {
                            console.log("ignoring late request for width " + binWidth);
                            return;
                        }
                        else if (binWidth == self._latestBinWidth) {
                            self._latestBinWidthReceived = true;
                        }

                        self._histogram.target()
                        .datum(self._dataAccessor(response));

                        self._histogram.update();

                        alreadyUpdated = true;

                        if (self._onLoad) {
                            self._onLoad();
                        }
                    });
                }

                if (!alreadyUpdated) {
                    this._histogram.update();
                }
            }
        });

        return ZoomHistogram;

    });