define(['jquery',
    'util/extend',
    'util/transform',
    'components/timeline',
    'lib/d3'],
    function ($, extend, Transform, Timeline, d3) {

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

            this.from = options.from;
            this.to = options.to;

            //Subscribe to a data stream from the API.
            this.api.on('overview_counts', $.proxy(this._onData, this));
        };

        //The overview extends the basic timeline
        extend(OverviewTimeline, Timeline);

        /**
         * Submit a request for new data.
         * @private
         */
        OverviewTimeline.prototype._requestData = function () {
            this.api.overview_counts({
                from: this.from,
                to: this.to,
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

            //Scale the x axes to the data
            this._histogram.xScaleDomainAuto(data);

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

            //Get some data!
            this._requestData();
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
         * Build the brush elements
         * @private
         */
        OverviewTimeline.prototype._renderBrush = function() {
            //Set up the brush
            this._brush = d3.svg.brush()
                .x(this._timeScale)
                .on("brush", $.proxy(this._onBrushChange, this));

            //Make DOM elements for the brush
            this._svg.append("g")
                .attr("class", "x brush")
                .call(this._brush)
                .selectAll("rect")
                .attr("y", -6);

            this._updateBrush();
        };

        /**
         * Make sure the brush is the right size
         * @private
         */
        OverviewTimeline.prototype._updateBrush = function() {
            //Update the height of the brush
            this._svg.selectAll('g.x.brush')
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

                //Just let 'em know
                this.trigger('selection-change', this._brush.extent());
            }
        };

        return OverviewTimeline;

    });