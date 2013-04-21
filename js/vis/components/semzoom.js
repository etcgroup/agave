define(['underscore', 'lib/d3'],
    function(_, d3) {

        /**
         * Class for managing semantic zooming.
         *
         * While monitoring a scale whose domain and range
         * are being used to display data, it can be used
         * to determine if the current data interval and bin width
         * needs to be updated.
         */
        var SemanticZoom = function() {
            this._dataInterval = [0,1];
            this._binWidth = 0.1;
            this._scale = d3.time.scale();
        }

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

            _is_center_off: function(visibleDomain, dataInterval) {
                var domainCenter = (visibleDomain[0] + visibleDomain[1]) * 0.5;
                var dataCenter = (dataInterval[0] + dataInterval[1]) * 0.5;
                var domainWidth = visibleDomain[1] - visibleDomain[0];

                var centerOffset = Math.abs((domainCenter - dataCenter) / domainWidth);

                return centerOffset > 0.5;
            },

            _is_close_to_edge: function(visibleDomain, dataInterval) {
                var domainWidth = visibleDomain[1] - visibleDomain[0];

                var dataBufferMinWidth = Math.min(dataInterval[1] - visibleDomain[1],
                    visibleDomain[0] - dataInterval[0]) / domainWidth;

                return dataBufferMinWidth < 0.25;
            },

            _is_bin_count_wrong: function(visibleDomain, binWidth) {
                var domainWidth = visibleDomain[1] - visibleDomain[0];

                var visibleBins = domainWidth / binWidth;
                var distanceFromIdeal = Math.abs(visibleBins - this._idealBinCount) / this._idealBinCount;
                //If we've deviated from the ideal by over 50%, adjust the granularity
                return distanceFromIdeal > 0.5;
            },

            _recalculate: function(visibleDomain, dataInterval, binWidth) {
                var domainWidth = visibleDomain[1] - visibleDomain[0];

                //Use the tick calculation code at the bottom to
                //generate the new interval and bin width.
                var desiredDataInterval = [visibleDomain[0] - domainWidth, visibleDomain[1] + domainWidth];
                var desiredDataPoints = this._idealBinCount * 3
                var settings = sz_ticks(desiredDataInterval, desiredDataPoints);

                var newDataInterval = [+settings[0], +settings[1]];
                var newBinWidth = settings[2];

                if (newDataInterval[0] != dataInterval[0] ||
                    newDataInterval[1] != dataInterval[1] ||
                    newBinWidth != binWidth) {
                    return {
                        interval: newDataInterval,
                        binWidth: newBinWidth
                    }
                }
                
                return null;
            },

            /**
             * Check to see if an update is recommended.
             *
             * Provide the interval and binWidth for the currently loaded data.
             *
             * If the bin width and data interval being shown should be changed,
             * it returns an object containing the new interval and binWidth.
             */
            recommend: function(interval, binWidth) {
                var rawDomain = this._scale.domain();
                var visibleDomain = [+rawDomain[0], +rawDomain[1]];

                var recalculate = false;

                //Check to see if we are close to the edge
                recalculate || (recalculate = this._is_close_to_edge(visibleDomain, interval));

                //Check to see if the center is way off
                recalculate || (recalculate = this._is_center_off(visibleDomain, interval));

                //Check the number of visible bins to see if we need to load more/less data
                recalculate || (recalculate = this._is_bin_count_wrong(visibleDomain, binWidth));

                if (recalculate) {
                    return this._recalculate(visibleDomain, interval, binWidth);
                }
                return false;
            }

        });

        //////////////////////////////////////////////////////////
        /////// A bunch of modified timing code from d3 //////////
        ///// allows getting time a pre-defined granularities ////
        //////////////////////////////////////////////////////////

        var sz_time_scaleSetYear = function(y) {
            var d = new Date(y, 0, 1);
            d.setFullYear(y);
            return d;
        }
        var sz_time_scaleGetYear = function(d) {
            var y = d.getFullYear(), d0 = sz_time_scaleSetYear(y), d1 = sz_time_scaleSetYear(y + 1);
            return y + (d - d0) / (d1 - d0);
        }
        var sz_time_scaleSteps = [
        1e3,
        2e3,
        5e3,
        10e3,
        15e3,
        30e3,
        6e4,
        12e4,
        3e5,
        6e5,
        9e5,
        18e5,
        36e5,
        72e5,
        108e5,
        216e5,
        432e5,
        864e5,
        1728e5,
        6048e5,
        2592e6,
        7776e6,
        31536e6
        ];

        var sz_time_scaleLocalMethods = [
        [ d3.time.second, 1 ],
        [ d3.time.second, 2 ],
        [ d3.time.second, 5 ],
        [ d3.time.second, 10 ],
        [ d3.time.second, 15 ],
        [ d3.time.second, 30 ],
        [ d3.time.minute, 1 ],
        [ d3.time.minute, 2 ],
        [ d3.time.minute, 5 ],
        [ d3.time.minute, 10 ],
        [ d3.time.minute, 15 ],
        [ d3.time.minute, 30 ],
        [ d3.time.hour, 1 ],
        [ d3.time.hour, 2 ],
        [ d3.time.hour, 3 ],
        [ d3.time.hour, 6 ],
        [ d3.time.hour, 12 ],
        [ d3.time.day, 1 ],
        [ d3.time.day, 2 ],
        [ d3.time.week, 1 ],
        [ d3.time.month, 1 ],
        [ d3.time.month, 3 ],
        [ d3.time.year, 1 ]
        ];
        var sz_time_scaleLinear = d3.scale.linear();
        sz_time_scaleLocalMethods.year = function(extent, m) {
            return sz_time_scaleLinear.domain(extent.map(sz_time_scaleGetYear)).ticks(m).map(sz_time_scaleSetYear);
        };
        var sz_time_scaleExtent = function(domain) {
            var start = domain[0], stop = domain[domain.length - 1];
            return start < stop ? [ start, stop ] : [ stop, start ];
        }

        var sz_time_scaleDate = function(t) {
            return new Date(t);
        }

        var sz_ticks = function(domain, desiredTicks) {
            var extent = sz_time_scaleExtent(domain.map(sz_time_scaleDate));

            var span = extent[1] - extent[0], target = span / desiredTicks, i = d3.bisect(sz_time_scaleSteps, target);

            //At the end of the array -- use special years ticks
            var ticksFallback = null;
            if (i == sz_time_scaleSteps.length) {
                ticksFallback = sz_time_scaleLocalMethods.year(extent, desiredTicks);
            }

            //No reasonable units, so use linear scale
            if (!i) {
                ticksFallback = d3.scale.linear()
                .domain(domain)
                .ticks(desiredTicks).map(sz_time_scaleDate);
            }

            if (ticksFallback) {
                return [ticksFallback[0], ticksFallback[ticksFallback.length - 1], ticksFallback[1] - ticksFallback[0]]
            }

            //Should we use the next smaller unit?
            if (Math.log(target / sz_time_scaleSteps[i - 1]) < Math.log(sz_time_scaleSteps[i] / target)) --i;

            //What units
            //            var units = sz_time_scaleLocalMethods[i][0];

            var width = sz_time_scaleSteps[i];
            var startPoint = Math.ceil(extent[0] / width) * width;
            var endPoint = Math.floor(extent[1] / width) * width;

            //            var startPoint = units.ceil(extent[0]);
            //            var endPoint = units.floor(extent[1]);
            return [startPoint, endPoint, width];
        }

        return SemanticZoom;
    });