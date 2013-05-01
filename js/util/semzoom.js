define(['underscore', 'lib/d3', 'util/normalize_range'],
    function(_, d3, normalize_range) {

        /**
         * Class for managing semantic zooming.
         *
         * While monitoring a scale whose domain and range
         * are being used to display data, it can be used
         * to determine if the current data interval and bin width
         * needs to be updated.
         */
        var SemanticZoom = function() {
            this._idealBinCount = 30;
            this._scale = d3.time.scale();
        };

        _.extend(SemanticZoom.prototype, {

            /**
             * Get or set the scale for zooming.
             */
            scale: function(scale) {
                if (!arguments.length) {
                    return this._scale;
                }
                this._scale = scale;
                return this;
            },

            /**
             * Get or set the ideal bin count.
             */
            idealBinCount: function(value) {
                if (!arguments.length) {
                    return this._idealBinCount;
                }
                this._idealBinCount = value;
                return this;
            },

            /**
             * True if the center of the data is more than 50% of the
             * visible domain away from the center of the visible domain.
             */
            _is_center_off: function(visibleDomain, dataCenter) {
                var domainCenter = (visibleDomain[0] + visibleDomain[1]) * 0.5;
                var domainWidth = visibleDomain[1] - visibleDomain[0];

                var centerOffset = Math.abs((domainCenter - dataCenter) / domainWidth);
                return centerOffset > 0.5;
            },

            /**
             * True if the amount of buffer data available on either side
             * is less than 25% of the visible domain.
             */
            _is_close_to_edge: function(visibleDomain, dataInterval) {
                var domainWidth = visibleDomain[1] - visibleDomain[0];

                var dataBufferMinWidth = Math.min(dataInterval[1] - visibleDomain[1],
                    visibleDomain[0] - dataInterval[0]) / domainWidth;

                return dataBufferMinWidth < 0.25;
            },

            /**
             * Given the ideal bin count, returns true if the number
             * of currently visible bins is more than 50% different from the ideal.
             */
            _is_bin_count_wrong: function(visibleDomain, binWidth) {
                var domainWidth = visibleDomain[1] - visibleDomain[0];

                var visibleBins = domainWidth / binWidth;
                var distanceFromIdeal = Math.abs(visibleBins - this._idealBinCount) / this._idealBinCount;
                //If we've deviated from the ideal by over 50%, adjust the granularity
                return distanceFromIdeal > 0.5;
            },

            _recalculate: function(visibleDomain) {
                var domainWidth = visibleDomain[1] - visibleDomain[0];

                //Use the tick calculation code at the bottom to
                //generate the new interval and bin width.
                var from = visibleDomain[0] - domainWidth;
                var to = visibleDomain[1] + domainWidth;
                var desiredDataPoints = this._idealBinCount * 3;

                return normalize_range(from, to, desiredDataPoints);
            },

            /**
             * Check to see if an update is recommended.
             *
             * Provide the interval (from and to) and bin_width for the currently loaded data.
             *
             * If the bin width and data interval being shown should be changed,
             * it returns an object containing the new interval and binWidth.
             */
            recommend: function(from, to, bin_width) {
                from = Number(from);
                to = Number(to);
                bin_width = Number(bin_width);

                if (isNaN(from) || isNaN(to) || isNaN(bin_width)) {
                    throw "Invalid parameters";
                }

                var recommendation;

                var rawDomain = this._scale.domain();
                var visibleDomain = [+rawDomain[0], +rawDomain[1]];

                var recalculate = false;

                //Check to see if we are close to the edge
                recalculate || (recalculate = this._is_close_to_edge(visibleDomain, [from, to]));

                //Check to see if the center is way off
                var dataCenter = (from + to) * 0.5;
                recalculate || (recalculate = this._is_center_off(visibleDomain, dataCenter));

                //Do we have a sliding update?
                if (recalculate) {
                    recommendation = this._recalculate(visibleDomain);
                    if (recommendation.from !== from ||
                        recommendation.to !== to) {
                        return recommendation;
                    }
                }

                //Check the number of visible bins to see if we need to load more/less data
                if (this._is_bin_count_wrong(visibleDomain, bin_width)) {
                    recommendation = this._recalculate(visibleDomain);
                    //If it is a bin update, only return if we actually
                    //managed to change the bin width.
                    //This avoids finicky time threshold updates.
                    if (recommendation.bin_width !== bin_width) {
                        return recommendation;
                    }
                }
                return false;
            }

        });

        return SemanticZoom;
    });