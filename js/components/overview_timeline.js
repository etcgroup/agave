define(['jquery',
    'underscore',
    'util/extend',
    'util/transform',
    'components/timeline',
    'util/sentiment',
    'util/sampling',
    'lib/d3'],
    function ($, _, extend, Transform, Timeline, sentiment, sampling, d3) {

        //Color defaults
        var COLOR_DOMAIN = sentiment.numbers;
        var COLOR_RANGE = sentiment.classes;


        /**
         * A class for rendering and maintaining an overview timeline,
         * with brushing to select regions of the timeline.
         *
         * Options are the same as for Timeline, in addition to:
         * - from: the fixed from-time for the overview Timeline
         * - to: the fixed to-time for the overview Timeline
         *
         * @param options
         * @constructor
         */
        var OverviewTimeline = function (options) {
            //For storing the data from two series
            this._series = {};
            this._loadedQueries = {};

            this.display = options.display;

            //Call the parent constructor
            Timeline.call(this, options);

            //Store offset time internally
            var staticExtent = this.extentFromUTC([options.from, options.to]);
            this.from = staticExtent[0];
            this.to = staticExtent[1];
            this.from_utc = options.from;
            this.to_utc = options.to;

            //Set up the x axis domain, which stays constant, in offset time
            this._timeScale.domain(staticExtent);

            //Create a color scale
            this._sentimentScale = d3.scale.ordinal()
                .domain(COLOR_DOMAIN)
                .range(COLOR_RANGE);

            //Subscribe to a data stream from the API.
            this.api.on('counts', $.proxy(this._onData, this));

        };

        //The overview extends the basic timeline
        extend(OverviewTimeline, Timeline);

        OverviewTimeline.prototype.attachEvents = function() {
            Timeline.prototype.attachEvents.call(this);

            this.display.on('change', $.proxy(this._onDisplayModeChanged, this));
        };

        /**
         * Called when the display mode changes.
         *
         * @private
         */
        OverviewTimeline.prototype._onDisplayModeChanged = function() {
            this._updateDataBinding();
            this.update();
        };

        /**
         * Called when the interval model changes.
         *
         * @param e Event
         * @param interval
         * @param field
         * @private
         */
        OverviewTimeline.prototype._onIntervalChanged = function (e, interval, field) {
            //Call the parent method
            Timeline.prototype._onIntervalChanged.call(this, interval, field);

            var utc = [interval.from(), interval.to()];
            var local = this.extentFromUTC(utc);

            if (local[0] === this.from &&
                local[1] === this.to) {
                //Clear the rectangle
                this._brush.clear();
                utc = [this.from_utc, this.to_utc];
                local = [this.from, this.to];
            } else {
                //Move the rectangle
                this._brush.extent(local);
            }
            //Let other people know we moved
            this.trigger('selection-change', utc);

            this._updateBrush();
        };

        /**
         * Update the graph when data arrives.
         *
         * @param e Event
         * @param result
         * @private
         */
        OverviewTimeline.prototype._onData = function (e, result) {

            var data = result.data; //data

            var countsOnly = result.data.reduce(function (prev, layer) {
                return {
                    values: layer.values.map(function (v, i) {
                        return {
                            count: prev.values[i].count + v.count,
                            time: prev.values[i].time
                        };
                    })
                };
            }).values;

            this._loadedQueries[result.params.query_id] = result.params;
            this._series[result.params.query_id] = countsOnly;
            this._lastUpdated = result.params.query_id;

            this._updateDataBinding();

            //Call through to parent method
            Timeline.prototype._onData.call(this, data);
        };

        /**
         * Given the state of the view and the most recently updated data series,
         * show the appropriate data.
         *
         * By default, show the data with the largest sum -- approximately the taller series.
         * However, when a particular series is showing, only show data from that series.
         *
         * @private
         */
        OverviewTimeline.prototype._updateDataBinding = function() {
            var selectedQuery = 0;

            if (this.display.mode() === 'simple') {
                //Find the bigger series
                var max = -1;
                var maxId = -1;
                for (var queryId in this._series) {
                    var sum = d3.sum(this._series[queryId], function(d) {
                        return d.count;
                    });
                    if (sum > max) {
                        max = sum;
                        maxId = queryId;
                    }
                }

                if (maxId >= 0) {
                    selectedQuery = maxId;
                }

            } else if (this.display.focus() in this._loadedQueries) {
                selectedQuery = this.display.focus();
            } else {
                selectedQuery = this._lastUpdated;
            }

            if (!(selectedQuery in this._loadedQueries)) {
                return;
            }

            var sentiment = "";

            //Get the query data that was most recently received from the server (not what is stored in the query object)
            var loaded = this._loadedQueries[selectedQuery];
            if (loaded) {
                sentiment = loaded.sentiment;
            }
            var sentimentClass = this._sentimentScale(sentiment);
            this._histogram.seriesClass(sentimentClass);

            var downsampled = this._series[selectedQuery];
            if (this._downsamplingFactor !== 1) {
                downsampled = sampling.downsample(downsampled, this._downsamplingFactor);
            }

            this._histogram.data(downsampled);
        };

        /**
         * We have just a few extra things to render over the basic timeline.
         */
        OverviewTimeline.prototype.render = function () {
            //Call the parent render
            Timeline.prototype.render.call(this);

            //Add a muted class to the histogram
            this._histogram
                .className('histogram muted')
                .seriesClass('sentiment-combined');

            this._renderBrush();
        };

        /**
         * Update the brush on update.
         */
        OverviewTimeline.prototype.update = function (animate) {
            Timeline.prototype.update.call(this, animate);

            //In addition, update the brush
            this._updateBrush();
        };

        /**
         * Override the update histogram method slightly.
         * @private
         */
        OverviewTimeline.prototype._updateHistogram = function (animate) {

            //Auto-scale the y axis
            var data = this._histogram.data();
            if (data) {
                this._histogram.yScaleDomainAuto(data);
            }

            //Call the default update method now
            Timeline.prototype._updateHistogram.call(this, animate);
        };

        /**
         * Build the brush elements
         * @private
         */
        OverviewTimeline.prototype._renderBrush = function () {
            //Set up the brush
            this._brush = d3.svg.brush()
                .x(this._timeScale)
                .on("brush", $.proxy(this._onBrushChange, this))
                .on("brushend", $.proxy(this._onBrushEnd, this));

            //Check if there is a selection
            var selectionInterval = this.extentFromUTC([this.interval.from(), this.interval.to()]);
            var staticDomain = [this.from, this.to];
            if (!_.isEqual(staticDomain, selectionInterval)) {
                this._brush.extent(selectionInterval);
            }

            //Make DOM elements for the brush
            this.ui.svg.append("g")
                .attr("class", "x brush");

            this._updateBrush();

            //Simulate a brush change to kick things off
            this._onBrushChange();
        };

        /**
         * Make sure the brush is the right size
         * @private
         */
        OverviewTimeline.prototype._updateBrush = function () {
            //Update the height of the brush
            this.ui.svg.selectAll('g.x.brush')
                .attr('transform', new Transform('translate', this.boxes.inner.left(), this.boxes.inner.top()))
                .call(this._brush)
                .selectAll('rect')
                .attr("height", this.boxes.inner.height());
        };

        /**
         * Called when the brush changes.
         *
         * @private
         */
        OverviewTimeline.prototype._onBrushChange = function () {
            if (!this._brush.empty()) {

                //Convert to utc
                this.trigger('selection-change', this.extentToUTC(this._brush.extent()));
            } else {
                //Notify the outside about our selection (in utc time)
                var utcSelection = this.extentToUTC([this.from, this.to]);
                this.trigger('selection-change', utcSelection);
            }
        };

        OverviewTimeline.prototype._onBrushEnd = function () {
            //convert to utc
            var extent = this._brush.extent();

            if (this._brush.empty()) {
                extent = [this.from, this.to];
            }

            extent = this.extentToUTC(extent);

            //When the timeline zoom/pan changes, we need to update the query object
            this.interval.set({
                from: extent[0],
                to: extent[1]
            });
        };

        return OverviewTimeline;

    });