define(['jquery',
    'underscore',
    'util/extend',
    'util/transform',
    'util/poll',
    'components/timeline',
    'vis/histogram',
    'util/tooltip',
    'lib/d3'],
    function ($, _, extend, Transform, Poll, Timeline, Histogram, Tooltip, d3) {

        var ANNOTATION_POLL_INTERVAL = 10000;
        var AXIS_OFFSET = 3;
        var ANNOTATION_TOOLTIP_TEMPLATE = _.template(
            "<%=label%> <span class='muted'>(<%=user%>)</span>"
        );

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

            this.user = options.user;

            this._brushedAnnotations = {};

            //A lookup object for tweets by id
            this._tweetCacheLookup = {};

            //Store offset time internally
            var staticExtent = this.extentFromUTC([options.from, options.to]);
            this.from = staticExtent[0];
            this.to = staticExtent[1];

            //Create a vertical scale
            this._countScale = d3.scale.linear();

            this._annotationsPoll = new Poll({
                callback: $.proxy(this._requestAnnotations, this),
                interval: ANNOTATION_POLL_INTERVAL
            });

            this._annotationsPoll.start();

            this.tooltip = new Tooltip();
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
         * Submit a request for new annotation data.
         *
         * @private
         */
        FocusTimeline.prototype._requestAnnotations = function () {
            this.api.annotations();
        };


        /**
         * Set up for the display of already created annotations.
         *
         * @private
         */
        FocusTimeline.prototype._initAnnotations = function () {

            this.api.on('annotations', $.proxy(this._onAnnotationData, this));

            //A group for containing static annotations
            this.ui.annotations = this.ui.chartGroup.append('g')
                .classed('annotations', true);

        };

        /**
         * Called when new annotation data arrives.
         * @private
         */
        FocusTimeline.prototype._onAnnotationData = function (e, result) {

            this.annotations = result.data;

            var boxHeight = this.boxes.inner.height();

            var bind = this.ui.annotations.selectAll('rect')
                .data(this.annotations);

            var self = this;
            bind.enter().append('rect')
                .attr('y', 0)
                .attr('width', 2)
                .on('mousemove', function (d) {
                    self._onAnnotationHover(d3.event, d, true);
                })
                .on('mouseout', function (d) {
                    self._onAnnotationHover(d3.event, d, false);
                })
                .on('click', function (d) {
                    d3.event.preventDefault();
                    d3.event.stopPropagation();

                    self._selectAnnotation(d);

                    return false;
                });

            //Remove un-needed lines
            bind.exit()
                .remove();

            this._updateAnnotations();
        };

        FocusTimeline.prototype._onAnnotationHover = function (event, data, mouseHovering) {
            if (mouseHovering) {
                var label = ANNOTATION_TOOLTIP_TEMPLATE(data);

                this.tooltip.show({
                    top: event.pageY,
                    left: event.pageX
                }, label);
            } else {
                this.tooltip.hide();
            }
        };

        FocusTimeline.prototype._updateAnnotations = function () {
            var boxHeight = this.boxes.inner.height();

            var self = this;
            this.ui.annotations.selectAll('rect')
                .classed('highlight', function (d) {
                    return d.id in self._brushedAnnotations;
                })
                .attr('x', this._annotationXPosition)
                .attr('height', boxHeight);
        };

        /**
         * Set the time scale domain.
         *
         * @param domain
         */
        FocusTimeline.prototype.domain = function (domain) {
            //don't forget to translate from utc to translated time
            this._timeScale.domain(this.extentFromUTC(domain));
        };

        FocusTimeline.prototype.render = function () {
            Timeline.prototype.render.call(this);

            this._initHighlights();
            this._initAnnotations();
            this._renderCountAxis();

            this._requestAnnotations();
        };

        FocusTimeline.prototype.update = function () {
            Timeline.prototype.update.call(this);

            this._updateAnnotations();
        };

        FocusTimeline.prototype.attachEvents = function () {
            Timeline.prototype.attachEvents.call(this);

            //Subscribe to a data stream from the API.
            this.api.on('counts', $.proxy(this._onData, this));

            this.api.on('tweets', $.proxy(this._onTweets, this));

            //If the user clicks on the svg, we'll begin annotation
            var self = this;
            this.ui.svg.on('click', function () {

                //Don't propagate or the listener for outside clicks will cancel annotation mode
                d3.event.preventDefault();
                d3.event.stopPropagation();

                self.beginAnnotation();

                return false;
            });
        };

        FocusTimeline.prototype._renderCountAxis = function () {
            this._verticalAxis = d3.svg.axis()
                .scale(this._countScale)
                .ticks(10)
                .orient('left');

            this.ui.svg.append('g')
                .classed('counts axis chart-label', true)
                .style('opacity', 0);

            this._updateCountAxis();
        };

        FocusTimeline.prototype._updateCountAxis = function () {
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
         * When new tweets arrive, store them in the tweet cache.
         * @param e
         * @param result
         * @returns {Function}
         * @private
         */
        FocusTimeline.prototype._onTweets = function (e, result) {
            var toKeep = 100;
            var self = this;

            //add these items to the tweet cache, which will dedupe for us
            _.each(result.data, function(tweet) {
                self._tweetCacheLookup[tweet.id] = tweet;
            });

            //Now limit to 100 items
            var list = _.keys(self._tweetCacheLookup);
            var toRemove = Math.max(0, list.length - toKeep);
            list.splice(0, toRemove);

            //Now rebuild the cache
            var newCache = {};
            _.each(list, function(id) {
                newCache[id] = self._tweetCacheLookup[id];
            });

            this._tweetCacheLookup = newCache;
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
            this._histograms[params.query_id]._maxCount = d3.max(data, function (d) {
                return d.count;
            });

            //Get the maximum count over all histograms
            var maxCount = d3.max(this._histograms, function (hist) {
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

        /**
         * Set up timeline highlighting.
         *
         * @private
         */
        FocusTimeline.prototype._initHighlights = function () {

            var self = this;

            //A list of highlighted points in time
            this._tweetHighlights = [];

            function findIndexOf(id) {
                //Remove the highlight with that id
                for (var i = 0; i < self._tweetHighlights.length; i++) {
                    if (+self._tweetHighlights[i].id === +id) {
                        return i;
                    }
                }
                return null;
            }

            //A function for positioning highlights
            this._tweetXPosition = function (d) {
                return self._timeScale(d.created_at + self._utcOffset);
            };

            this._annotationXPosition = function (d) {
                return self._timeScale(d.time + self._utcOffset);
            };

            //A group element for containing the highlight points
            this.api.on('brush', function (e, brushed) {
                _.each(brushed, function(item) {

                    switch (item.type) {
                        case 'tweet':
                            //Do we know about this tweet?
                            if (!(item.id in self._tweetCacheLookup)) {
                                return;
                            }

                            //Is it already highlighted?
                            if (findIndexOf(item.id) !== null) {
                                return;
                            }

                            var tweet = self._tweetCacheLookup[item.id];
                            self._tweetHighlights.push(tweet);
                            self._updateTweetHighlights();
                            break;
                        case 'annotation':
                            self._brushedAnnotations[item.id] = true;
                            self._updateAnnotations();
                            break;
                    }

                });
            });

            this.api.on('unbrush', function (e, brushed) {
                _.each(brushed, function(item) {

                    switch (item.type) {
                        case 'tweet':
                            var index = findIndexOf(item.id);
                            if (index !== null) {
                                self._tweetHighlights.splice(index, 1);
                                self._updateTweetHighlights();
                            }
                            break;
                        case 'annotation':
                            delete self._brushedAnnotations[item.id];
                            self._updateAnnotations();
                            break;
                    }

                });
            });
        };

        FocusTimeline.prototype._updateTweetHighlights = function () {

            var boxHeight = this.boxes.inner.height();

            //Set the highlight positions
            var bind = this.ui.chartGroup.selectAll('line.tweet-highlight')
                .data(this._tweetHighlights);

            //Create new lines and position them, but make them have no height
            bind.enter().append('line')
                .classed('tweet-highlight', true)
                .attr('x1', this._tweetXPosition)
                .attr('x2', this._tweetXPosition)
                .attr('y1', boxHeight)
                .attr('y2', boxHeight);

            //Transition un-needed lines out and remove
            bind.exit()
                .attr('y1', boxHeight)
                .attr('y2', boxHeight)
                .remove();

            //Position the lines where they ought to be
            bind.attr('x1', this._tweetXPosition)
                .attr('x2', this._tweetXPosition)
                .attr('y1', 0)
                .attr('y2', boxHeight);
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


        /**
         * Call this to put the timeline in annotation mode.
         */
        FocusTimeline.prototype.beginAnnotation = function () {
            if (this._annotationMode) {
                //Already annotating
                return;
            }

            if (!this.user.signed_in()) {
                alert("You must sign in to annotate");
                return;
            }

            this._annotationMode = true;
            console.log('entering annotation mode');

            //Add a new group for containing the annotation controls
            this.ui.annotationControls = this.ui.chartGroup.append('g')
                .style('opacity', 0)
                .classed('annotation-controls', true);

            //Add a label - we put this behind the box
            this.ui.annotationControls
                .append('text')
                .attr('x', 3)
                .attr('y', 13)
                .text('Click to label a time');

            //Add a box to show that annotation mode is active
            this.ui.annotationIndicator = this.ui.annotationControls.append('rect')
                .attr('width', this.boxes.inner.width())
                .attr('height', this.boxes.inner.height());

            //Add a line for showing where the annotation will fall
            this.ui.annotationTarget = this.ui.annotationControls.append('line');

            //And fade it in
            this.ui.annotationControls
                .transition()
                .style('opacity', 1);

            //When the mouse moves, we need to update the annotation target
            this.ui.annotationIndicator.on('mousemove', $.proxy(this._updateAnnotationTarget, this));

            //At this point, clicking on the timeline creates a new annotation
            this.ui.annotationIndicator.on('click', $.proxy(this._createAnnotation, this));
            this.ui.annotationTarget.on('click', $.proxy(this._createAnnotation, this));
        };

        /**
         * Called when an existing annotation is clicked.
         * @private
         */
        FocusTimeline.prototype._selectAnnotation = function (data) {
            this.api.trigger('reference-selected', {
                type: 'annotation',
                data: data
            });
        };

        /**
         * This is called when the user selects a time for annotation.
         *
         * @private
         */
        FocusTimeline.prototype._createAnnotation = function () {
            if (!this._annotationMode) {
                //Not annotating
                return;
            }

            //Don't let this event go anywhere else
            d3.event.preventDefault();
            d3.event.stopPropagation();

            //Get the coordinate that was clicked
            var x = d3.event.offsetX - this.boxes.inner.left();

            //Convert to a time, in real UTC
            var time = this._timeScale.invert(x) - this._utcOffset;

            console.log('creating annotation at time ' + time);

            if (!this.user.signed_in()) {
                alert('You must sign in to annotate.');
            } else {
                var label = prompt("Label this time");

                if (label) {

                    //Send the annotation up to the server
                    var annotation = {
                        time: time,
                        label: label,
                        user: this.user.name()
                    };
                    this.api.annotate(annotation);

                    this.trigger('new-annotation', annotation);
                }
            }

            //And we're done annotating
            this.endAnnotation();

            return false;
        };

        /**
         * Called when the annotation target line needs to be updated.
         *
         * @private
         */
        FocusTimeline.prototype._updateAnnotationTarget = function () {
            if (!this._annotationMode) {
                //Not annotating
                return;
            }

            //Get the coordinate of the mouse
            var x = d3.event.offsetX - this.boxes.inner.left();

            this.ui.annotationTarget
                .attr('x1', x)
                .attr('x2', x)
                .attr('y1', 0)
                .attr('y2', this.boxes.inner.height());
        };

        /**
         * Call this to take the timeline out of annotation mode.
         */
        FocusTimeline.prototype.endAnnotation = function () {
            if (!this._annotationMode) {
                //Not annotating
                return;
            }

            console.log('leaving annotation mode');
            this._annotationMode = false;

            this.ui.annotationControls
                .transition()
                .style('opacity', 0)
                .remove();

            this.ui.annotationControls = null;
            this.ui.annotationIndicator = null;
            this.ui.annotationTarget = null;
        };

        return FocusTimeline;
    });