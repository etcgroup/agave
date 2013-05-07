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

            this._initHighlights();
            this._renderCountAxis();
        };

        FocusTimeline.prototype.attachEvents = function() {
            Timeline.prototype.attachEvents.call(this);

            //Subscribe to a data stream from the API.
            this.api.on('counts', $.proxy(this._onData, this));
        };

        FocusTimeline.prototype._renderCountAxis = function() {
            this._verticalAxis = d3.svg.axis()
                .scale(this._countScale)
                .ticks(10)
                .orient('left');

            this.ui.svg.append('g')
                .classed('counts axis chart-label', true)
                .style('opacity', 0);

            this._updateCountAxis();
        };

        FocusTimeline.prototype._updateCountAxis = function() {
            this.ui.svg.select('g.counts.axis.chart-label')
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
                    .container(self.ui.svg)
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
            this.ui.svg.select('g.counts.axis.chart-label')
                .transition()
                .style('opacity', 1);

            //Update the counts axis
            this._updateCountAxis();

            //Call the parent method
            Timeline.prototype._onData.call(this, data);
        };

        FocusTimeline.prototype._initHighlights = function() {

            var self = this;

            //A list of highlighted points in time
            this._highlights = [];

            //A function for positioning highlights
            this._highlightXPosition = function(d) {
                return self._timeScale(self._timeAccessor(d));
            };

            //A group element for containing the highlight points
            this.ui.highlightGroup = this.ui.svg.append('g')
                .classed('highlights', true)
                .call(this.boxes.inner);

            this.api.on('highlight-time', function(e, highlight) {
                self._highlights.push(highlight);
                self._updateHighlights();
            });

            this.api.on('highlight-remove', function(e, id) {
                //Remove the highlight with that id
                for (var i = 0; i < self._highlights.length; i++) {
                    if (self._highlights[i].id === id) {
                        self._highlights.splice(i, 1);
                        break;
                    }
                }
                self._updateHighlights();
            });
        };

        FocusTimeline.prototype._updateHighlights = function() {

            //Set the box size
            this.ui.highlightGroup
                .attr('transform', new Transform('translate', this.boxes.inner.left(), this.boxes.inner.top()));

            //Set the highlight positions
            var bind = this.ui.highlightGroup.selectAll('line')
                .data(this._highlights);

            bind.enter().append('line');

            bind.exit().remove();

            bind.attr('x1', this._highlightXPosition)
                .attr('x2', this._highlightXPosition)
                .attr('y1', 0)
                .attr('y2', this.boxes.inner.height());
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