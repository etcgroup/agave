define(['underscore',
    'vis/components/histogram',
    'vis/components/data_cache',
    'vis/components/semzoom'],
    function(_, Histogram, DataCache, SemanticZoom) {

        var ZoomHistogram = function() {
            this._histogram = new Histogram();
            this._cache = new DataCache();
            this._semantic = new SemanticZoom();
        }

        _.extend(ZoomHistogram.prototype, {
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

                if (changed) {
                    var binWidth = this._semantic.binWidth();
                    var interval = this._semantic.interval()

                    this._latestBinWidth = binWidth;

                    this._cache.load(binWidth, interval)
                    .done(function(response) {

                        //Ignore out of date responses
                        if (binWidth != self._latestBinWidth) {
                            console.log("ignoring out of date request for width " + binWidth);
                            return;
                        }

                        self._histogram.target()
                        .datum(response.payload);

                        self._histogram
                        .yScaleDomainAuto(response.payload)
                        .update();
                    });
                }

                this._histogram.update();
            }
        });

        return ZoomHistogram;

    });