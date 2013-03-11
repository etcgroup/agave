define(['underscore', 'lib/d3'],
    function(_, d3) {

        var SemanticZoom = function() {
            this._dataInterval = [0,1];
            this._binWidth = 0.1;
            this._scale = d3.time.scale();
        }

        _.extend(SemanticZoom.prototype, {

            scale: function(scale) {
                if (!arguments.length) {
                    return this._scale;
                }
                this._scale = scale;
                return this;
            },

            idealBinCount: function(value) {
                if (!arguments.length) {
                    return this._idealBinCount;
                }
                this._idealBinCount = value;
                return this;
            },

            update: function() {
                var changed = false;

                var rawDomain = this._scale.domain();
                var visibleDomain = [+rawDomain[0], +rawDomain[1]];

                //Check the data interval to see if we are close to the edge
                var newDataInterval = this._dataInterval;

                var domainCenter = (visibleDomain[0] + visibleDomain[1]) * 0.5;
                var domainWidth = visibleDomain[1] - visibleDomain[0];
                var dataCenter = (this._dataInterval[0] + this._dataInterval[1]) * 0.5;

                var centerOffset = Math.abs((domainCenter - dataCenter) / domainWidth);
                var dataBufferWidth = Math.min(this._dataInterval[1] - visibleDomain[1],
                    visibleDomain[0] - this._dataInterval[0]) / domainWidth;
                if (centerOffset > 0.5 || dataBufferWidth < 0.25) {
                    //We've shifted by over 50% of the visible domain, so adjust the data interval
                    newDataInterval = [visibleDomain[0] - domainWidth, visibleDomain[1] + domainWidth];
                    changed = true;
                }

                var newBinWidth = this._binWidth;

                //Check the number of visible bins to see if we need to load more/less data
                var visibleBins = domainWidth / this._binWidth;
                var distanceFromIdeal = Math.abs(visibleBins - this._idealBinCount) / this._idealBinCount;
                if (distanceFromIdeal > 0.5) {
                    //We've deviated from the ideal by over 50%, so adjust the granularity
                    newBinWidth = domainWidth / this._idealBinCount;
                    changed = true;
                }

                this._dataInterval = newDataInterval;
                this._binWidth = newBinWidth;

                return changed;
            },

            interval: function(interval) {
                if (!arguments.length) {
                    return this._dataInterval;
                }
                this._dataInterval = interval;
                return this;
            },

            binWidth: function(width) {
                if (!arguments.length) {
                    return this._binWidth;
                }
                this._binWidth = width;
                return this;
            }

        });

        return SemanticZoom;
    });