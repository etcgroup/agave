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
    'lib/d3'],
    function ($, _, extend, Transform, Poll, Timeline, Histogram, StackHistogram, Tooltip, sentiment, d3) {

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
            this._loadedQueries = {};

            //Call the parent constructor
            Timeline.call(this, options);

            this._brushedAnnotations = {};

            //A lookup object for tweets by id
            this._tweetCacheLookup = {};

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
                    interval: self._binSize * 1000,
                    search: query.search(),
                    rt: query.rt(),
                    min_rt: query.min_rt(),
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

            //Bind the new annotations data
            var bind = this.ui.annotations.selectAll('rect')
                .data(this.annotations);

            var self = this;
            //Add any new annotations
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
            var boxHeight = this.boxes.inner.height();

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
                    .each('end', function() {
                        annotations.style('display', 'none');
                    });
            }

            annotations.selectAll('rect')
                .classed('highlight', function (d) {
                    return d.id in self._brushedAnnotations;
                })
                .attr('x', this._annotationXPosition)
                .attr('height', boxHeight);
        };

        /**
         * Set the time scale domain. This is used by the overview timeline.
         *
         * @param domain
         */
        FocusTimeline.prototype.domain = function (domain) {
            //don't forget to translate from utc to translated time
            this._timeScale.domain(this.extentFromUTC(domain));
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
            this._updateCountScale();

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

            //Subscribe to another data stream
            this.api.on('tweets', $.proxy(this._onTweets, this));

            //When the display mode changes, update
            this.display.on('change', $.proxy(this._onDisplayModeChanged, this));

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

            this._updateCountAxis();
        };

        /**
         * Update the count scale if necessary.
         *
         * @private
         */
        FocusTimeline.prototype._updateCountScale = function() {
            //The stack histograms manage the scale themselves, but the regular histograms do not
            if (this.display.mode() === 'simple') {
                //Get the maximum count over all histograms
                var maxCount = d3.max(this._histograms, function (hist) {
                    return hist._maxCount || 0;
                });

                //Update the scale
                this._countScale.domain([0, maxCount]);
            } else {
                this._stackHistograms.forEach(function(hist) {
                    hist._updateScales();
                });
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
        FocusTimeline.prototype._onDisplayModeChanged = function() {
            this.update();
        };

        /**
         * And replace the histogram update code.
         */
        FocusTimeline.prototype._updateHistogram = function (animate) {
            //Update each histogram
            var mode = this.display.mode();
            var toExpand = mode === 'expand';
            var queryShown = this.display.focus();

            var self = this;
            this.queries.forEach(function (query, index) {
                var histogram = self._histograms[index];
                var stackHistogram = self._stackHistograms[index];

                var sentiment = "";

                //Get the query data that was most recently received from the server (not what is stored in the query object)
                var loaded = self._loadedQueries[index];
                if (loaded) {
                    sentiment = loaded.sentiment;
                }
                var sentimentClass = self._sentimentScale(sentiment);

                if (mode === 'simple') {
                    //Show the histogram, not the stack
                    stackHistogram.hide();

                    histogram.seriesClass(sentimentClass)
                    histogram.show();
                    histogram.update(animate);

                    self.showSillyMessage(false);

                } else if (queryShown !== null && index !== queryShown) {
                    //We're not showing this query at all
                    stackHistogram.hide();
                    histogram.hide();
                } else {
                    //Show the stack, not the histogram
                    histogram.hide();

                    stackHistogram.show();
                    stackHistogram.expand(toExpand);
                    stackHistogram.update(animate);

                    self.showSillyMessage(sentiment !== "" && toExpand);
                }
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
            _.each(result.data, function (tweet) {
                self._tweetCacheLookup[tweet.id] = tweet;
            });

            //Now limit to 100 items
            var list = _.keys(self._tweetCacheLookup);
            var toRemove = Math.max(0, list.length - toKeep);
            list.splice(0, toRemove);

            //Now rebuild the cache
            var newCache = {};
            _.each(list, function (id) {
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

            //Stop the spinner
            this.loader.stop(params.query_id);

            //Save the query data so we know what we have loaded
            //The Query model can change more rapidly
            this._loadedQueries[params.query_id] = params;

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

            //Bind the new data
            this._histograms[params.query_id].data(countsOnly);

            //If some sentiment filter is in use besides all (''), then
            //we'll remove the zero-valued series
            var data = result.data
            if (params.sentiment) {
                data = data.filter(function(layer) {
                    return layer.id == params.sentiment;
                });
            }

            //Bind the un-transformed data
            this._stackHistograms[params.query_id].data(data);

            //Store the max value on the histogram for efficiency
            this._histograms[params.query_id]._maxCount = d3.max(countsOnly, function (d) {
                return d.count;
            });

            //Fade in the counts axis
            this.ui.svg.select('g.counts.axis.chart-label')
                .transition()
                .style('opacity', 1);


            //Update the counts axis
            this._updateCountScale();
            this._updateCountAxis();

            //Call the parent method
            Timeline.prototype._onData.call(this, result);
        };

        /**
         * Set up the display of linked tweets.
         *
         * @private
         */
        FocusTimeline.prototype._initHighlights = function () {

            var self = this;

            //A list of highlighted points in time
            this._tweetHighlights = [];

            //A function for positioning highlights
            this._tweetXPosition = function (d) {
                return self._timeScale(d.created_at + self._utcOffset);
            };

            //A group element for containing the highlight points
            this.api.on('brush', $.proxy(this._onBrush, this));

            this.api.on('unbrush', $.proxy(this._onUnBrush, this));
        };


        /**
         * Checks in the brushed tweet list to see if the tweet with the given
         * id is already there. Returns its index or null.
         *
         * @param id
         * @returns {*}
         * @private
         */
        FocusTimeline.prototype._findIndexOfBrushedTweet = function (id) {
            for (var i = 0; i < this._tweetHighlights.length; i++) {
                if (+this._tweetHighlights[i].id === +id) {
                    return i;
                }
            }
            return null;
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

                switch (item.type) {
                    case 'tweet':
                        //Do we know about this tweet?
                        if (!(item.id in self._tweetCacheLookup)) {
                            return;
                        }

                        //Is it already highlighted?
                        if (self._findIndexOfBrushedTweet(item.id) !== null) {
                            return;
                        }

                        var tweet = self._tweetCacheLookup[item.id];
                        self._tweetHighlights.push(tweet);
                        self._updateTweetHighlights();
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
                        var index = self._findIndexOfBrushedTweet(item.id);
                        if (index !== null) {
                            self._tweetHighlights.splice(index, 1);
                            self._updateTweetHighlights();
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
         * Updates the display of brushed/highlighted tweets.
         *
         * @private
         */
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

            //Hide when escape is pressed
            var self = this;
            $(document)
                .on('keyup.focus-timeline.annotation', function (e) {
                    if (e.which === 27) {
                        self.endAnnotation();
                    }
                })
                .on('click.focus-timeline.annotation', function (e) {
                    self.endAnnotation();
                });

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

            //Don't let this event go anywhere else (such as the document, which would end annotation mode)
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

            //Move the annotation target to the mouse position
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

            //Turn off the key and click listeners
            $(document).off('keyup.focus-timeline.annotation')
                .off('click.focus-timeline.annotation');

            //Fade out and remove
            this.ui.annotationControls
                .transition()
                .style('opacity', 0)
                .remove();

            this.ui.annotationControls = null;
            this.ui.annotationIndicator = null;
            this.ui.annotationTarget = null;
        };

        FocusTimeline.prototype.showSillyMessage = function(toShow) {
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