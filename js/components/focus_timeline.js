define(['jquery',
    'underscore',
    'util/extend',
    'util/transform',
    'util/poll',
    'components/timeline',
    'vis/histogram',
    'vis/stack_histogram',
    'util/tooltip',
    'util/sentiment',
    'util/rectangle',
    'util/sampling',
    'lib/d3'],
    function ($, _, extend, Transform, Poll, Timeline, Histogram, StackHistogram, Tooltip, sentiment, Rectangle, sampling, d3) {

        var ANNOTATION_POLL_INTERVAL = 10000;
        var AXIS_OFFSET = 3;
        var ANNOTATION_TOOLTIP_TEMPLATE = _.template(
            "<%=label%> <span class='muted'>(<%=user%>)</span>"
        );

        //Color defaults
        var COLOR_DOMAIN = sentiment.numbers;
        var COLOR_RANGE = sentiment.classes;

        var VALID_MODES = ['simple', 'stack', 'expand'];

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

            this.user = options.user;
            this.display = options.display;

            //For storing query info about the currently loaded data
            this.cache = {counts: {}, layers: {}, max: {}, query: {}};

            //Call the parent constructor
            Timeline.call(this, options);

            this._brushedAnnotations = {};

            //Store offset time internally
            var staticExtent = this.extentFromUTC([options.from, options.to]);
            this.from = staticExtent[0];
            this.to = staticExtent[1];

            //Create a vertical scale
            this._countScale = d3.scale.linear();

            //Create a color scale
            this._sentimentScale = d3.scale.ordinal()
                .domain(COLOR_DOMAIN)
                .range(COLOR_RANGE);

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

                self.loader.start(query.id());

                //TODO: make this actually the right parameters
                var utcExtent = self.extentToUTC([self.from, self.to]);

                //The interval doesn't need to be translated because it is already in UTC
                self.api.counts({
                    query_id: query.id(),
                    from: utcExtent[0],
                    to: utcExtent[1],
                    interval: self._binSize,
                    search: query.search(),
                    rt: query.rt(),
//                    min_rt: query.min_rt(),
                    author: query.author(),
                    sentiment: query.sentiment()
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

            var self = this;
            //A function for generating the x position of an annotation
            this._annotationXPosition = function (d) {
                return self._timeScale(d.time + self._utcOffset);
            };

            //A group for containing static annotations
            this.ui.annotations = this.ui.svg.append('svg')
                .classed('annotations', true);

            this.ui.annotationsBackground = this.ui.annotations.append('rect')
                .classed('background', true);

            //Add a line for showing where the annotation will fall
            this.ui.annotationTarget = this.ui.annotations
                .append('line')
                .classed('annotation-target', true);

            //When the mouse moves, we need to update the annotation target
            this.ui.annotations.on('mousemove', $.proxy(this._updateAnnotationTarget, this));

            //At this point, clicking on the timeline creates a new annotation
            this.ui.annotations.selectAll('.background,.annotation-target')
                .on('click', $.proxy(this._createAnnotation, this));
        };

        /**
         * Called when new annotation data arrives.
         * @private
         */
        FocusTimeline.prototype._onAnnotationData = function (e, result) {

            this.annotations = result.data;

            var boxHeight = this.boxes.annotations.height();

            //Bind the new annotations data
            var bind = this.ui.annotations.selectAll('rect.annotation')
                .data(this.annotations);

            var self = this;
            //Add any new annotations
            bind.enter().append('rect')
                .classed('annotation', true)
                .attr('y', 1)
                .attr('width', 2)
                .on('mousemove', function (d) {
                    self._onAnnotationHover(d3.event, d, true);
                })
                .on('mouseout', function (d) {
                    self._onAnnotationHover(d3.event, d, false);
                })
                .on('click', function (d) {
                    //This prevents the general click event from firing on the graph
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

        /**
         * Called when the mouse enters or leaves an annotation.
         *
         * @param event
         * @param data
         * @param mouseHovering whether or not the mouse is now hovering
         * @private
         */
        FocusTimeline.prototype._onAnnotationHover = function (event, data, mouseHovering) {
            if (mouseHovering) {
                //Show a tooltip near the mouse
                var label = ANNOTATION_TOOLTIP_TEMPLATE(data);
                this.tooltip.show({
                    top: event.pageY,
                    left: event.pageX
                }, label);
            } else {
                //Hide the tooltip
                this.tooltip.hide();
            }
        };

        /**
         * Update the annotations being displayed. This needs to be called
         * when the annotation data have changed, or when the graph is being updated
         * overall.
         *
         * @private
         */
        FocusTimeline.prototype._updateAnnotations = function () {
            var boxHeight = this.boxes.annotations.height();
            var boxWidth = this.boxes.annotations.width();

            var self = this;

            var annotations = this.ui.annotations;

            //Resize the svg and background
            annotations.call(this.boxes.annotations);
            this.ui.annotationsBackground
                .attr('width', boxWidth)
                .attr('height', boxHeight);

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

            annotations.selectAll('rect.annotation')
                .classed('highlight', function (d) {
                    return d.id in self._brushedAnnotations;
                })
                .attr('x', this._annotationXPosition)
                .attr('height', boxHeight - 2);
        };

        /**
         * Set the time scale domain. This is used by the overview timeline.
         *
         * @param domain
         */
        FocusTimeline.prototype.domain = function (domain) {
            //don't forget to translate from utc to translated time
            this._timeScale.domain(this.extentFromUTC(domain));

            if (this._updateDownsamplingFactor() ) {
                this._updateDataBinding();
                this._updateHistogram(true);
            }
        };

        /**
         * Get the margins for the inner (chart) group.
         *
         * We're overriding the parent to make room for the annotation bar.
         *
         * @returns {{left: number, right: number, top: number, bottom: number}}
         * @private
         */
        FocusTimeline.prototype._getMargins = function () {
            var margins = Timeline.prototype._getMargins.call(this);
            margins.top += 15; //make room for annotation bar
            return margins;
        };

        FocusTimeline.prototype._buildBoxes = function () {
            Timeline.prototype._buildBoxes.call(this);
            this.boxes.annotations = new Rectangle();
        };

        FocusTimeline.prototype._updateBoxes = function () {
            Timeline.prototype._updateBoxes.call(this);

            this.boxes.annotations.set({
                top: this.boxes.outer.top(),
                left: this.boxes.inner.left(),
                width: this.boxes.inner.width(),
                bottom: this.boxes.inner.top() - 2
            });
        };

        /**
         * Do an initial render of the focus timeline.
         * Overrides the parent's render method.
         */
        FocusTimeline.prototype.render = function () {
            Timeline.prototype.render.call(this);

            this._initHighlights();
            this._initAnnotations();
            this._renderCountAxis();

            //Request the annotation data now, I guess
            this._requestAnnotations();
        };

        /**
         * Update the focus timeline. Overrides the parent's update method.
         */
        FocusTimeline.prototype.update = function (animate) {
//            this._updateCountScale();

            Timeline.prototype.update.call(this, animate);

            this._updateCountAxis();
            this._updateAnnotations();
        };

        /**
         * Attach some events for the focus timeline. Overrides the parent method.
         */
        FocusTimeline.prototype.attachEvents = function () {
            Timeline.prototype.attachEvents.call(this);

            //Subscribe to a data stream from the API.
            this.api.on('counts', $.proxy(this._onData, this));

            //When the display mode changes, update
            this.display.on('change', $.proxy(this._onDisplayModeChanged, this));
        };

        /**
         * Initial render of the vertical axis.
         * @private
         */
        FocusTimeline.prototype._renderCountAxis = function () {
            this._verticalAxis = d3.svg.axis()
                .scale(this._countScale)
                .ticks(10)
                .orient('left');

            this.ui.svg.append('g')
                .classed('counts axis chart-label', true)
                .style('opacity', 0);

            //Add an axis label
            this.ui.svg.append('text')
                .classed('counts axis-title', true)
                .text('tweets / sec.');
//                .attr('transform', new Transform('rotate', -90));

            this._updateCountAxis();
        };

        /**
         * Update the count scale if necessary.
         *
         * @private
         */
        FocusTimeline.prototype._updateCountScale = function () {
            //The stack histograms manage the scale themselves, but the regular histograms do not
            if (this.display.mode() === 'simple') {
                //Get the maximum count over all histograms
                var maxCount = d3.max(_.values(this.cache.max));

                //Update the scale
                this._countScale.domain([0, maxCount]);
            } else {
                //Get the one that is in focus
                this._stackHistograms[this.display.focus()]._updateScales();
            }
        };

        /**
         * Update the vertical axis.
         * @private
         */
        FocusTimeline.prototype._updateCountAxis = function () {
            this.ui.svg.select('g.counts.axis.chart-label')
                .attr('transform', new Transform('translate',
                    this.boxes.inner.left() - AXIS_OFFSET, this.boxes.inner.top()))
                .call(this._verticalAxis);
        };

        /**
         * We need to replace the parent's histogram rendering code entirely,
         * because we are rendering multiple histograms.
         */
        FocusTimeline.prototype._renderHistogram = function () {

            //Two arrays for keeping track of the histogram components
            this._histograms = [];
            this._stackHistograms = [];

            var self = this;
            this.queries.forEach(function (query) {
                //Use a Histogram to draw the timeline
                var histogram = new Histogram();
                histogram
                    .line(true)
                    .className('focus histogram fade id-' + query.id())
                    .container(self.ui.svg)
                    .box(self.boxes.inner)
                    .xData(self._timeAccessor)
                    .xScale(self._timeScale)
                    .yScale(self._countScale)
                    .interpolate(self._interpolation)
                    .render();

                self._histograms.push(histogram);

                //We also need a StackHistogram to draw the layered versions
                var stackHistogram = new StackHistogram();
                stackHistogram
                    .className('focus histogram fade stack-histogram id-' + query.id())
                    .container(self.ui.svg)
                    .box(self.boxes.inner)
                    .xData(self._timeAccessor)
                    .xScale(self._timeScale)
                    .yScale(self._countScale)
                    .colorScale(self._sentimentScale)
                    .interpolate(self._interpolation)
                    .render();

                self._stackHistograms.push(stackHistogram);
            });
        };

        /**
         * Called when the display mode changes.
         *
         * @private
         */
        FocusTimeline.prototype._onDisplayModeChanged = function () {
            this._updateDataBinding();
            this.update();
        };

        /**
         * And replace the histogram update code.
         */
        FocusTimeline.prototype._updateHistogram = function (animate) {
            var self = this;
            this.queries.forEach(function (query, index) {
                var histogram = self._histograms[index];
                var stackHistogram = self._stackHistograms[index];

                if (histogram.isShowing()) {
                    histogram.update(animate);
                }

                if (stackHistogram.isShowing()) {
                    stackHistogram.update(animate);
                }
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

            if (!(params.query_id in this.queries)) {
                return;
            }

            //Stop the spinner
            this.loader.stop(params.query_id);

            //Compute sum data (ha)
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

            //If some sentiment filter is in use besides all (''), then
            //we'll remove the zero-valued series
            var data = result.data;
            if (params.sentiment) {
                data = data.filter(function (layer) {
                    return +layer.id === +params.sentiment;
                });
            }

            //Get the max value now, for efficiency
            var maxCount = d3.max(countsOnly, function (d) {
                return d.count;
            });

            //Store things in the cache
            this.cache.counts[params.query_id] = countsOnly;
            this.cache.layers[params.query_id] = data;
            this.cache.max[params.query_id] = maxCount;
            this.cache.query[params.query_id] = params

            this._updateDataBinding();

            //Fade in the counts axis
            this.ui.svg.select('g.counts.axis.chart-label')
                .transition()
                .style('opacity', 1);

            //Call the parent method
            Timeline.prototype._onData.call(this, result);
        };

        FocusTimeline.prototype._updateDataBinding = function () {

            //Which series are we showing?
            var mode = this.display.mode();
            var toExpand = mode === 'expand';
            var queryShown = this.display.focus();
            var cache = this.cache;
            var self = this;

            //Find out what kind of sentiment we're dealing with here.
            function sentimentFor(queryIndex) {
                var loaded = cache.query[queryIndex];
                return loaded ? loaded.sentiment : '';
            }

            if (mode === 'simple') {
                //We're showing both histograms
                this.queries.forEach(function (query, index) {
                    //Hide the stack histogram
                    self._stackHistograms[index].hide();

                    if (index in cache.counts) {
                        var histogram = self._histograms[index];

                        var sentiment = sentimentFor(index);
                        histogram.seriesClass(self._sentimentScale(sentiment));

                        var downsampled = cache.counts[index];
                        if (self._downsamplingFactor !== 1) {
                            downsampled = sampling.downsample(downsampled, self._downsamplingFactor);
                        }

                        histogram.data(downsampled);

                        histogram.show();
                    }
                });
            } else {
                //We're showing one of the stacks
                this.queries.forEach(function (query, index) {
                    //Hide the histogram
                    self._histograms[index].hide();

                    var stackHistogram = self._stackHistograms[index];
                    if (queryShown !== null && index !== queryShown) {
                        //not this one
                        stackHistogram.hide();
                    } else if (index in cache.layers) {

                        var downsampled = cache.layers[index];
                        if (self._downsamplingFactor !== 1) {
                            downsampled = cache.layers[index].map(function (layer) {
                                return {
                                    id: layer.id,
                                    values: sampling.downsample(layer.values, self._downsamplingFactor)
                                };
                            });
                        }

                        stackHistogram.data(downsampled);
                        stackHistogram.expand(toExpand);

                        stackHistogram.show();

                        var sentiment = sentimentFor(index);
                        self.showSillyMessage(sentiment !== "" && toExpand);
                    } else {
                        console.log('no data loaded yet for this chart');
                    }
                });
            }

            //Update the counts axis
            this._updateCountScale();
            this._updateCountAxis();
        };

        /**
         * Set up the display of linked tweets.
         *
         * @private
         */
        FocusTimeline.prototype._initHighlights = function () {

            var self = this;

            //A list of highlighted points in time
            this._highlights = [];

            //A lookup object for highlights by id
            this._highlightLookup = {};

            //A function for positioning highlights
            this._highlightXPosition = function (d) {
                return self._timeScale(d.time + self._utcOffset);
            };

            this._highlightClass = function (d) {
                return d.type;
            };

            //A group element for containing the highlight points
            this.api.on('brush', $.proxy(this._onBrush, this));

            this.api.on('unbrush', $.proxy(this._onUnBrush, this));
        };

        /**
         * Called when some elements are brushed.
         *
         * @param e
         * @param brushed
         * @private
         */
        FocusTimeline.prototype._onBrush = function (e, brushed) {
            var self = this;
            _.each(brushed, function (item) {

                var time;

                if (item.type === 'tweet') {
                    time = item.data.created_at;
                }

                switch (item.type) {
                    case 'tweet':
                    case 'keyword':
                        //grab the mid-point if time not already set (by tweet case)
                        time = time || item.data.mid_point;

                        if (!self._highlightLookup[item.data.id]) {
                            //We are not showing it yet
                            self._highlights.push({
                                time: time,
                                type: item.type
                            });

                            self._highlightLookup[item.data.id] = item.data;
                        }

                        self._updateHighlights();
                        break;
                    case 'annotation':
                        //Add mark that the item is being brushed
                        self._brushedAnnotations[item.id] = true;
                        self._updateAnnotations();
                        break;
                    case 'query':
                        //Someone brushed an entire query!
                        if (self.display.mode() === 'simple') {
                            self._histograms[item.id].bold(true);
                        }
                        break;
                }

            });
        };

        /**
         * Called when some elements are un-brushed.
         *
         * @param e
         * @param brushed
         * @private
         */
        FocusTimeline.prototype._onUnBrush = function (e, brushed) {
            var self = this;
            _.each(brushed, function (item) {

                switch (item.type) {
                    case 'tweet':
                    case 'keyword':
                        if (self._highlightLookup[item.data.id]) {
                            //We are showing it
                            delete self._highlightLookup[item.data.id];
                            self._highlights = _.values(self._highlightLookup);
                            self._updateHighlights();
                        }
                        break;
                    case 'annotation':
                        //Mark that the item is not being brushed
                        delete self._brushedAnnotations[item.id];
                        self._updateAnnotations();
                        break;
                    case 'query':
                        //Someone brushed an entire query!
                        if (self.display.mode() === 'simple') {
                            self._histograms[item.id].bold(false);
                        }
                        break;
                }

            });
        };

        /**
         * Updates the display of brushed/highlighted times.
         *
         * @private
         */
        FocusTimeline.prototype._updateHighlights = function () {

            var boxHeight = this.boxes.inner.height();

            //Set the highlight positions
            var bind = this.ui.chartGroup.selectAll('line.highlight')
                .data(this._highlights);

            //Create new lines and position them, but make them have no height
            bind.enter().append('line')
                .classed('highlight', true);

            //Transition un-needed lines out and remove
            bind.exit()
                .remove();

            //Position the lines where they ought to be
            //Apply a class based on the data type
            bind.attr('class', this._highlightClass)
                .classed('highlight', true) //add the highlight class back in
                .attr('x1', this._highlightXPosition)
                .attr('x2', this._highlightXPosition)
                .attr('y1', 0)
                .attr('y2', boxHeight);
        };

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
         * Check if the interval is small enough that we want to get new data.
         *
         * @param e
         * @param interval
         * @param field
         * @private
         */
        FocusTimeline.prototype._onIntervalChanged = function (e, interval, field) {

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

            if (!this.user.signed_in()) {
                alert("You must sign in to annotate");
                return;
            }

            //Don't let this event go anywhere else (such as the document, which would end annotation mode)
            d3.event.preventDefault();
            d3.event.stopPropagation();

            //Get the coordinate that was clicked
            var x = d3.event.offsetX - this.boxes.inner.left();

            //Convert to a time, in real UTC
            var time = this._timeScale.invert(x) - this._utcOffset;

            console.log('creating annotation at time ' + time);


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

            return false;
        };

        /**
         * Called when the annotation target line needs to be updated.
         *
         * @private
         */
        FocusTimeline.prototype._updateAnnotationTarget = function () {
            //Get the coordinate of the mouse
            var x = d3.event.offsetX - this.boxes.inner.left();

            //Move the annotation target to the mouse position
            this.ui.annotationTarget
                .attr('x1', x)
                .attr('x2', x)
                .attr('y1', 0)
                .attr('y2', this.boxes.annotations.height());
        };

        FocusTimeline.prototype.showSillyMessage = function (toShow) {
            var message = this.ui.chartGroup
                .selectAll('text.silly-message');

            if (toShow) {
                var center = this.boxes.inner.center();
                var messageWidth = 353;
                message
                    .data(["Well, this is rather silly, isn't it! Please try a different display mode or remove the filter on sentiment."])
                    .enter()
                    .append('text')
                    .classed('silly-message', true)
                    .attr('x', center.x)
                    .attr('y', center.y)
                    .text(String)
                    .transition()
                    .delay(800)
                    .duration(500)
                    .style('opacity', 1);

            } else {
                message
                    .transition()
                    .duration(500)
                    .style('opacity', 0)
                    .remove();
            }
        };

        return FocusTimeline;
    });