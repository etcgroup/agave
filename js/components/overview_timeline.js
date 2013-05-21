define(['jquery',
    'underscore',
    'util/extend',
    'util/transform',
    'components/timeline',
    'util/sentiment',
    'util/sampling',
    'util/rectangle',
    'lib/d3'],
    function ($, _, extend, Transform, Timeline, sentiment, sampling, Rectangle, d3) {

        //Color defaults
        var COLOR_DOMAIN = sentiment.numbers;
        var COLOR_RANGE = sentiment.classes;
        var ANNOTATIONS_PERCENT_HEIGHT = 0.1;


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
            var staticExtent = this.extentFromUTC(this.interval.getRangeExtent());

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

            var utc = this.interval.getExtent();
            var local = this.extentFromUTC(utc);

            var rangeExtent = this.interval.getRangeExtent();
            if(utc[0] === rangeExtent[0] &&
                utc[1] === rangeExtent[1]) {
                this._brush.clear();
            } else {
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

                var getCounts = function(d) {
                    return d.count;
                };

                for (var queryId in this._series) {
                    var sum = d3.sum(this._series[queryId], getCounts);
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

            this._initHighlights();
            this._initAnnotations();

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
         * Set up all the rectangles used to calculate sub-component sizes and positions.
         */
        OverviewTimeline.prototype._buildBoxes = function () {
            Timeline.prototype._buildBoxes.call(this);

            this.boxes.annotations = new Rectangle();
            this.boxes.chart = new Rectangle();
        };

        OverviewTimeline.prototype._updateBoxes = function () {
            Timeline.prototype._updateBoxes.call(this);

            //This one is relative to the inner box
            this.boxes.annotations.set({
                top: 0,
                left: 0,
                right: this.boxes.inner.width(),
                bottom: this.boxes.inner.height() * ANNOTATIONS_PERCENT_HEIGHT
            });

            //This one is relative to the outer box
            this.boxes.chart.set({
                top: this.boxes.annotations.bottom(),
                left: this.boxes.inner.left(),
                width: this.boxes.inner.width(),
                bottom: this.boxes.inner.height()
            });
        };

        /**
         * Render the timeline.
         */
        OverviewTimeline.prototype._renderHistogram = function () {
            Timeline.prototype._renderHistogram.call(this);

            this._histogram.box(this.boxes.chart);

            this._updateHistogram(false);
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
            var selectionInterval = this.extentFromUTC(this.interval.getExtent());
            var staticDomain = this.extentFromUTC(this.interval.getRangeExtent());
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
                this.trigger('selection-change', this.interval.getRangeExtent());
            }
        };

        OverviewTimeline.prototype._onBrushEnd = function () {
            //convert to utc
            var extent = this._brush.extent();

            if (this._brush.empty()) {
                extent = this.interval.getRangeExtent();
            } else {
                extent = this.extentToUTC(extent);
            }

            //When the timeline zoom/pan changes, we need to update the query object
            this.interval.set({
                from: extent[0],
                to: extent[1]
            });
        };

        OverviewTimeline.prototype._initAnnotations = function() {
            Timeline.prototype._initAnnotations.call(this);

            //A group for containing static annotations
            this.ui.annotations = this.ui.chartGroup.append('g')
                .classed('annotations', true);
        };

        OverviewTimeline.prototype._renderAnnotations = function(annotations) {
            var boxHeight = this.boxes.annotations.height();

            //Bind the new annotations data
            var bind = this.ui.annotations.selectAll('line.annotation')
                .data(annotations);

            var self = this;

            //Add any new annotations
            bind.enter().append('line')
                .classed('annotation', true);

            //Remove un-needed lines
            bind.exit()
                .remove();
        };

        /**
         * Update the annotations being displayed. This needs to be called
         * when the annotation data have changed, or when the graph is being updated
         * overall.
         *
         * @private
         */
        OverviewTimeline.prototype._updateAnnotations = function () {
            var boxHeight = this.boxes.annotations.height();
            var boxWidth = this.boxes.annotations.width();

            var self = this;

            var annotations = this.ui.annotations;
            if (this.display.annotations()) {
                annotations
                    .style('display', 'inline')
                    .transition()
                    .style('opacity', 1);
            } else {
                annotations
                    .transition()
                    .style('opacity', 0)
                    .each('end', function () {
                        annotations.style('display', 'none');
                    });
            }

            annotations.selectAll('line.annotation')
                .classed('highlight', function (d) {
                    return d.id in self._brushedAnnotations;
                })
                .attr('x1', this._highlightXPosition)
                .attr('x2', this._highlightXPosition)
                .attr('y1', 0)
                .attr('y2', boxHeight);
        };

        return OverviewTimeline;

    });