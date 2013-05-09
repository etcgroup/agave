define(['jquery',
    'underscore',
    'util/extend',
    'util/transform',
    'components/timeline',
    'lib/d3'],
    function ($, _, extend, Transform, Timeline, d3) {

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
            //Call the parent constructor
            Timeline.call(this, options);

            //Store offset time internally
            var staticExtent = this.extentFromUTC([options.from, options.to]);
            this.from = staticExtent[0];
            this.to = staticExtent[1];

            //Set up the x axis domain, which stays constant, in offset time
            this._timeScale.domain(staticExtent);

            //Subscribe to a data stream from the API.
            this.api.on('overview_counts', $.proxy(this._onData, this));
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

            //Move the brush
            this._brush.extent(this.extentFromUtc([interval.from(), interval.to()]));
        };

        //The overview extends the basic timeline
        extend(OverviewTimeline, Timeline);

        /**
         * Submit a request for new data.
         * @private
         */
        OverviewTimeline.prototype._requestData = function () {

            var utcExtent = this.extentToUTC([this.from, this.to]);

            //Remember to subtract the UTC offset before sending out times
            this.api.overview_counts({
                from: utcExtent[0],
                to: utcExtent[1],
                interval: this._binSize
            });
        };

        /**
         * Update the graph when data arrives.
         *
         * @param e Event
         * @param result
         * @private
         */
        OverviewTimeline.prototype._onData = function(e, result) {
            var params = result.params; //request info
            var data = result.data; //data

            //Bind the data to the histogram first
            this._histogram.data(data);

            //Call through to parent method
            Timeline.prototype._onData.call(this, data);
        };

        /**
         * We have just a few extra things to render over the basic timeline.
         */
        OverviewTimeline.prototype.render = function () {
            //Call the parent render
            Timeline.prototype.render.call(this);

            this._renderBrush();
        };

        /**
         * Update the brush on update.
         */
        OverviewTimeline.prototype.update = function() {
            Timeline.prototype.update.call(this);

            //In addition, update the brush
            this._updateBrush();
        };

        /**
         * Override the update histogram method slightly.
         * @private
         */
        OverviewTimeline.prototype._updateHistogram = function() {

            //Auto-scale the y axis
            var data = this._histogram.data();
            if (data) {
                this._histogram.yScaleDomainAuto(data);
            }

            //Call the default update method now
            Timeline.prototype._updateHistogram.call(this);
        };

        /**
         * Build the brush elements
         * @private
         */
        OverviewTimeline.prototype._renderBrush = function() {
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
                .attr("class", "x brush")
                .call(this._brush)
                .selectAll("rect")
                .attr("y", -6);

            this._updateBrush();

            //Simulate a brush change to kick things off
            this._onBrushChange();
        };

        /**
         * Make sure the brush is the right size
         * @private
         */
        OverviewTimeline.prototype._updateBrush = function() {
            //Update the height of the brush
            this.ui.svg.selectAll('g.x.brush')
                .attr('transform', new Transform('translate', this.boxes.inner.left(), this.boxes.inner.top()))
                .selectAll('rect')
                .attr("height", this.boxes.inner.height() + 7);
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

        OverviewTimeline.prototype._onBrushEnd = function() {
            //convert to utc
            this.trigger('selection-end', this.extentToUTC(this._brush.extent()));
        };

        return OverviewTimeline;

    });