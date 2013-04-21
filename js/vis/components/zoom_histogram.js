define(['underscore',
    'vis/components/histogram',
    'vis/components/data_cache',
    'vis/components/semzoom'],
    function(_, Histogram, DataCache, SemanticZoom) {

        /**
         * A class that combines the functionality of semantic zoom,
         * data caching, and a histogram into one object.
         *
         * The bulk of this happens in the update() function below.
         *
         * This can work with multiple histogram types and probably for other chart types as well.
         */
        var ZoomHistogram = function() {
            //Create a histogram, cache, and semantic zoom controller.
            this._histogram = new Histogram();
            this._cache = new DataCache();
            this._semantic = new SemanticZoom();

            //An accessor for the payload part of the ajax responses.
            this._dataAccessor = function(response) {
                return response.payload;
            }

            //An optional callback for when data loads.
            this._onLoad = null;

            //Set the default zoom level and extent
            this._zoomLevel = 0;
            this._extent = [0,1];
        }

        _.extend(ZoomHistogram.prototype, {

            /**
             * Get or set the current data extent.
             */
            extent: function(extent) {
                if (!arguments.length) {
                    return this._extent;
                }
                this._extent = extent;
                return this;
            },

            /**
             * Get or set the current zoom level
             */
            zoomLevel: function(zoomLevel) {
                if (!arguments.length) {
                    return this._zoomLevel;
                }
                this._zoomLevel = zoomLevel;
                return this;
            },

            /**
             * Get or set a function that can convert ajax responses into
             * usable data.
             */
            responseProcessor: function(fun) {
                if (!arguments.length) {
                    return this._dataAccessor;
                }
                this._dataAcecssor = fun;
                return this;
            },

            /**
             * Get or set the histogram.
             */
            histogram: function(hist) {
                if (!arguments.length) {
                    return this._histogram;
                }
                this._histogram = hist;
                return this;
            },

            /**
             * Get or set the data cache.
             */
            cache: function(cache) {
                if (!arguments.length) {
                    return this._cache;
                }
                this._cache = cache;
                return this;
            },

            /**
             * Get or set the onLoad callback.
             */
            onLoad: function(fun) {
                if (!arguments.length) {
                    return this._onLoad;
                }
                this._onLoad = fun;
                return this;
            },

            /**
             * Get or set the semantic zoom controller.
             */
            semantic: function(semantic) {
                if (!arguments.length) {
                    return this._semantic;
                }
                this._semantic = semantic;
                return this;
            },

            /**
             * Update the zoom histogram.
             */
            update: function() {
                var self = this;

                //Check if the semantic zoom controller recommends new data.
                var change = this._semantic.recommend(this.extent(), this.zoomLevel());
                var alreadyUpdated = false;

                if (change) {
                    //Ask the semantic zoom controller what the new data should cover
                    var binWidth = change.binWidth;
                    var interval = change.interval;

                    //Save the current zoom level and extent
                    //This prevents multiple redundant loads while waiting.
                    self.zoomLevel(binWidth)
                    self.extent(interval);

                    //Save the bin width so we know which response to save.
                    //If we emit multiple requests quickly, we can get them
                    //back in the wrong order.
                    this._latestBinWidth = binWidth;
                    this._latestBinWidthReceived = false;

                    //Load the data from the cache (or request).
                    //done() will execute now or later
                    this._cache.load(binWidth, interval)
                    .done(function(response) {

                        //Ignore late responses for the wrong bin width
                        if (binWidth != self._latestBinWidth && self._latestBinWidthReceived) {
                            console.log("ignoring late request for width " + binWidth);
                            return;
                        } else if (binWidth == self._latestBinWidth) {
                            //Note that we've already received the latest data
                            self._latestBinWidthReceived = true;
                        }

                        //Send the data to the histogram
                        self._histogram
                        .data(self._dataAccessor(response))
                        .update();

                        //In case this executed right away, don't do another update
                        alreadyUpdated = true;

                        //Call the onload callback if it is set.
                        if (self._onLoad) {
                            self._onLoad();
                        }
                    });
                }

                //Update the histogram because the zoom has changed
                if (!alreadyUpdated) {
                    this._histogram.update();
                }
            }
        });

        return ZoomHistogram;

    });