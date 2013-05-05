define(['jquery',
    'util/extend',
    'util/transform',
    'components/timeline',
    'vis/histogram',
    'lib/d3'],
    function ($, extend, Transform, Timeline, Histogram, d3) {

        var AXIS_OFFSET = 3;

        /**
         * A class for rendering and maintaining a focus timeline.
         *
         * The focus timeline renders multiple layered histograms.
         *
         * Options are the same as for Timeline.
         *
         * @param options
         * @constructor
         */
        var FocusTimeline = function (options) {
            //Call the parent constructor
            Timeline.call(this, options);

            //Store offset time internally
            var staticExtent = this.extentFromUTC([options.from, options.to]);
            this.from = staticExtent[0];
            this.to = staticExtent[1];

            //Create a vertical scale
            this._countScale = d3.scale.linear();

            //Subscribe to a data stream from the API.
            this.api.on('counts', $.proxy(this._onData, this));
        };

        //The focus extends the basic timeline
        extend(FocusTimeline, Timeline);


        /**
         * Submit a request for new data.
         *
         * If a query is provided, data will only be requested for
         * that query. Otherwise, data will be requested for both queries.
         *
         * @param [query]
         * @private
         */
        FocusTimeline.prototype._requestData = function (query) {

            var self = this;

            //Helper to request the data for a query
            function request(query) {

                //TODO: make this actually the right parameters
                var utcExtent = self.extentToUTC([self.from, self.to]);

                //The interval doesn't need to be translated because it is already in UTC
                self.api.counts({
                    query_id: query.id(),
                    from: utcExtent[0],
                    to: utcExtent[1],
                    interval: self._binSize * 1000,
                    search: query.search()
                });
            }

            if (query) {
                request(query);
            } else {
                this.queries.forEach(request);
            }
        };


        /**
         * Set the time scale domain.
         *
         * @param domain
         */
        FocusTimeline.prototype.domain = function(domain) {
            //don't forget to translate from utc to translated time
            this._timeScale.domain(this.extentFromUTC(domain));
        };

        FocusTimeline.prototype.render = function() {
            Timeline.prototype.render.call(this);

            this._renderCountAxis();
        };

        FocusTimeline.prototype._renderCountAxis = function() {
            this._verticalAxis = d3.svg.axis()
                .scale(this._countScale)
                .ticks(10)
                .orient('left');

            this._svg.append('g')
                .classed('counts axis chart-label', true)
                .style('opacity', 0);

            this._updateCountAxis();
        };

        FocusTimeline.prototype._updateCountAxis = function() {
            this._svg.select('g.counts.axis.chart-label')
                .attr('transform', new Transform('translate',
                    this.boxes.inner.left() - AXIS_OFFSET, this.boxes.inner.top()))
                .call(this._verticalAxis);
        };

        /**
         * We need to replace the histogram rendering code.
         */
        FocusTimeline.prototype._renderHistogram = function () {

            this._histograms = [];

            var self = this;
            this.queries.forEach(function (query) {
                //Use a Histogram to draw the timeline
                var histogram = new Histogram();

                //Configure the histogram itself
                histogram
                    .className('focus histogram id-' + query.id())
                    .container(self._svg)
                    .box(self.boxes.inner)
                    .xData(self._timeAccessor)
                    .xScale(self._timeScale)
                    .yScale(self._countScale)
                    .interpolate(self._interpolation)
                    .render();

                self._histograms.push(histogram);
            });

            this._updateHistogram();
        };

        /**
         * And replace the histogram update code.
         */
        FocusTimeline.prototype._updateHistogram = function () {
            //Update each histogram
            this._histograms.forEach(function (histogram) {
                histogram.update();
            });
        };

        /**
         * When new data arrives, bind to the proper histogram and update.
         *
         * @param e Event
         * @param result
         * @private
         */
        FocusTimeline.prototype._onData = function (e, result) {

            var params = result.params; //request info
//            var data = result.data; //data

            var data = result.data.reduce(function (prev, layer) {
                return {
                    values: layer.values.map(function (v, i) {
                        return {
                            count: prev.values[i].count + v.count,
                            time: prev.values[i].time
                        };
                    })
                };
            }).values;

            //Bind the new data
            this._histograms[params.query_id].data(data);

            //Store the max value on the histogram for efficiency
            this._histograms[params.query_id]._maxCount = d3.max(data, function(d) {
                return d.count;
            });

            //Get the maximum count over all histograms
            var maxCount = d3.max(this._histograms, function(hist) {
                return hist._maxCount || 0;
            });

            //Update the scale
            this._countScale.domain([0, maxCount]);

            //Fade in the counts axis
            this._svg.select('g.counts.axis.chart-label')
                .transition()
                .style('opacity', 1);

            //Update the counts axis
            this._updateCountAxis();

            //Call the parent method
            Timeline.prototype._onData.call(this, data);
        };

        /**
         * Called when the interval model changes.
         *
         * @param e Event
         * @param interval
         * @param field
         * @private
         */
//        FocusTimeline.prototype._onIntervalChanged = function (e, interval, field) {
//            //Call the parent method
//            Timeline.prototype._onIntervalChanged.call(this, interval, field);
//
//            //Get new data
//            this._requestData();
//        };

        /**
         * When the query changes, request some new data.
         *
         * @param e Event
         * @param query
         * @param field
         * @private
         */
        FocusTimeline.prototype._onQueryChanged = function (e, query, field) {
            //Call the parent method
            Timeline.prototype._onQueryChanged.call(this, query, field);

            //Get new data
            this._requestData(query);
        };

        return FocusTimeline;
    });