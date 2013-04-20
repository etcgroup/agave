define([
    'jquery',
    'lib/d3',
    'underscore',
    'lib/rectangle',
    'lib/transform',
    'vis/components/zoom_histogram',
    'vis/components/stack_histogram',
    'vis/components/semzoom'],
    function($, d3, _, Rectangle, Transform, ZoomHistogram, StackHistogram, SemanticZoom) {

        var AXIS_OFFSET = 3;

        /**
         * Generates some useless but functional timeline data to ensure the
         * timeline is able to render before proper data arrives.
         */
        var _dummyCountData = function() {
            return [{
                time: 1,
                count: 1
            }];
        }

        /**
         * Generates some dummy timeline data for grouped timelines (i.e. sentiment timeline)
         * so that it can render before receiving real data.
         */
        var _dummyGroupData = function() {
            return [
            {
                name: 0,
                values: [{
                    time: 1,
                    count: 1
                }]
            }
            ];
        }

        /**
         * TweetTimeline is the class used for configuring, intitializing, and maintaining
         * the tweet timeline area of the UI.
         *
         * This includes all three smaller timelines, since they share the same axis and
         * have synchronized panning/zooming.
         *
         * It builds itself out of simpler histogram components and then orchestrates
         * connections between them.
         */
        var TweetTimeline = function() {
            this.initialize();
        }

        _.extend(TweetTimeline.prototype, {

            /**
             * Set defaults for the tweet timeline.
             * Most of these can be changed using the mutator methods further down.
             */
            initialize: function() {
                this._normalize = true;

                //The height of the retweet timeline.
                this._retweetHeight = 50;
                //The height of the noise timeline.
                this._noiseHeight = 50;

                //Color defaults
                this._positiveColor = "#69C5F5";
                this._negativeColor = "#F26522";
                this._neutralColor = "#F8FDFF";

                //Type of interpolation for all sub-timelines.
                this._interpolation = 'linear';

                //Set up the color scale. Just the domain for now... range later.
                this._sentimentScale = d3.scale.ordinal()
                .domain([-1, 0, 1]);

                //Set up the time scale. Use a UTC timescale.
                this._timeScale = d3.time.scale.utc();

                //Set up the time axis generator.
                this._timeAxis = d3.svg.axis()
                .scale(this._timeScale)
                .tickSubdivide(true)
                .orient("bottom");

                //Some tweet data constants. Ideal bin count
                //is used when switching zoom levels to determine a binning
                //granularity based on viewable time range.
                this._idealBinCount = 50;
                //The minimum retweets for a tweet to not be considered noise.
                this._noiseThreshold = 1;

                //The utc offset to render times at.
                this._utcOffset = 0;

                //An optional callback that will be called when the zoom changes.
                this._onZoomChanged = null;

                var self = this;
                //The function used to get the time value from count bins.
                //The utc offset is added to convert the time *out* of UTC, but
                //we pretend it is still in UTC.
                this._timeAccessor = function(d) {
                    return d.time + self._utcOffset;
                }

                //The search query. Storing this here a hack. It should not be maintained
                //by the timeline.
                this._searchQuery = null;
            },

            /**
             * Get or set the viewed time extent [lower, upper].
             */
            timeExtent: function(extent) {
                if (!arguments.length) {
                    return this._timeScale.domain();
                }
                this._timeScale.domain([extent[0] + this._utcOffset, extent[1] + this._utcOffset]);
                return this;
            },

            /**
             * Get or set the zoom change callback.
             */
            onZoomChanged: function(fun) {
                if (!arguments.length) {
                    return this._onZoomChanged;
                }
                this._onZoomChanged = fun;
                return this;
            },

            /**
             * Get or set the utc offset in millis.
             */
            utcOffsetMillis: function(offset) {
                if (!arguments.length) {
                    return this._utcOffset;
                }
                this._utcOffset = offset;
                return this;
            },

            /**
             * Get or set the search query.
             * This should be removed.
             */
            searchQuery: function(query) {
                if (!arguments.length) {
                    return this._searchQuery;
                }
                this._searchQuery = query;
                return this;
            },

            /**
             * Get or set the noise threshold.
             */
            noiseThreshold: function(threshold) {
                if (!arguments.length) {
                    return this._noiseThreshold;
                }
                this._noiseThreshold = threshold;
                return this;
            },

            /**
             * Get or set the d3 area interpolation type.
             */
            interpolate: function(interpolation) {
                if (!arguments.length) {
                    return this._interpolation;
                }
                this._interpolation = interpolation;
                return this;
            },

            /**
             * Get or set the neutral tweet color.
             */
            neutralColor: function(color) {
                if (!arguments.length) {
                    return this._neutralColor;
                }
                this._neutralColor = color;
                return this;
            },

            /**
             * Get or set the negative tweet color.
             */
            negativeColor: function(color) {
                if (!arguments.length) {
                    return this._negativeColor;
                }
                this._negativeColor = color;
                return this;
            },

            /**
             * Get or set the positive tweet color.
             */
            positiveColor: function(color) {
                if (!arguments.length) {
                    return this._positiveColor;
                }

                this._positiveColor = color;
                return this;
            },

            /**
             * Get the sentiment scale for configuration.
             */
            sentimentScale: function() {
                return this._sentimentScale;
            },

            /**
             * Get the time scale for configuration.
             */
            timeScale: function() {
                return this._timeScale;
            },

            /**
             * Get the time axis for configuration.
             */
            timeAxis: function() {
                return this._timeAxis;
            },

            /**
             * Get or set the timeline width.
             */
            width: function(value) {
                if (!arguments.length) {
                    return this._width;
                }
                this._width = value;
                return this;
            },

            /**
             * Get or set the timeline height.
             */
            height: function(value) {
                if (!arguments.length) {
                    return this._height;
                }
                this._height = value;
                return this;
            },

            /**
             * Get or set the noise timeline height.
             */
            noiseHeight: function(value) {
                if (!arguments.length) {
                    return this._noiseHeight;
                }
                this._noiseHeight = value;
                return this;
            },

            /**
             * Get or set the retweet timeline height.
             */
            retweetHeight: function(value) {
                if (!arguments.length) {
                    return this._retweetHeight;
                }
                this._retweetHeight = value;
                return this;
            },

            /**
             * Get or set whether or not the main histogram is normalized.
             */
            normalize: function(toNormalize) {
                if (!arguments.length) {
                    return this._normalize;
                }
                this._normalize = toNormalize;
                return this;
            },

            /**
             * Get or set the container into which the timeline will render.
             *
             * Accepts a d3 selection or a selector string.
             */
            container: function(selection) {
                if (!arguments.length) {
                    return this._container;
                }
                this._container = selection;

                if (typeof this._container == 'string') {
                    this._container = d3.select(this._container);
                }

                return this;
            },

            /**
             * Render the timeline. Only should be called once.
             * Subsequently, use update.
             */
            render: function() {

                this._buildBoxes();
                this._updateSentimentScaleRange();
                this._updateTimeScaleRange();

                this._renderTarget();

                this._renderBackground();
                this._renderContent();

                this._configureZoom();
                this._renderHTMLOverlay();
            },

            /**
             * Update the timeline. Only should be called after render.
             */
            update: function() {
                this._buildBoxes();
                this._updateSentimentScaleRange();
                this._updateTimeScaleRange();

                this._updateContent();

                this._udpateZoom();
            },

            /**
             * Render and configure the main svg element.
             */
            _renderTarget: function() {
                this._svg = this._container.append('svg');

                this._updateTarget();
            },

            /**
             * Update the svg element configuration.
             */
            _updateTarget: function() {
                this._svg.call(this.boxes.outer);
            },

            /**
             * Render and size the background rectangle.
             */
            _renderBackground: function() {
                //Add a background
                this._svg.append('rect')
                .classed('main background', true);

                this._updateBackground();
            },

            /**
             * Update the size of the background rectangle, in case it has changed.
             */
            _updateBackground: function() {
                //Size the background
                this._svg.select('rect.main.background')
                .call(this.boxes.outer);
            },

            /**
             * Configure the zoom behavior.
             *
             * Meant to be executed once.
             */
            _configureZoom: function() {
                var self = this;

                //Initialize the zoom behavior
                this._zoom = d3.behavior.zoom()
                .on('zoom', function() {
                    //On zoom change, use one of our update functions
                    self._updateContent();
                });

                //We also need our own special zoom handler so we can pass on
                //zoom events to the optional onZoomChanged handler.
                //TODO: couldn't we just do this in the regular zoom handler above?
                var zoomChange = function() {
                    if (self._onZoomChanged) {
                        var domain = self._timeScale.domain();
                        var utcDomain = [domain[0] - self._utcOffset, domain[1] - self._utcOffset];
                        self._onZoomChanged(utcDomain);
                    }
                }

                //Add a rectangle in front of all the content to catch mouse events.
                this._svg.append('rect')
                .classed('foreground', true)
                .call(this._zoom)
                //Add our special event handler on mouse click and wheel
                .on('mouseup.zchange', zoomChange)
                .on('mousewheel.zchange', zoomChange);

                this._updateZoom();
            },

            /**
             * Update the zoom behavior
             */
            _updateZoom: function() {
                //Make sure the zoom is using the right timescale, in case it has changed.
                this._zoom.x(this._timeScale);

                //Set the size of the foreground
                this._svg.selectAll('rect.foreground')
                .call(this.boxes.inner);
            },

            /**
             * Update the range of the timescale in case the box has changed sizes.
             */
            _updateTimeScaleRange: function() {
                this._timeScale.range([0, this.boxes.inner.width()])
            },

            /**
             * Update the range of the sentiment scale in case the colors have changed.
             */
            _updateSentimentScaleRange: function() {
                this._sentimentScale.range([this._negativeColor, this._neutralColor, this._positiveColor]);
            },

            /**
             * Set up all the rectangles used to calculate sub-component sizes and positions.
             */
            _buildBoxes: function() {

                var margin = {
                    left: 40,
                    right: 20,
                    top: 10,
                    bottom: 25
                }

                //The margin above and below the middle timeline
                var originalsTopMargin = 10;
                var originalsBottomMargin = 10;

                this.boxes = {};

                //The outer box, outside the margin.
                this.boxes.outer = new Rectangle({
                    top: 0,
                    left: 0,
                    width: this._width,
                    height: this._height
                });

                //The inner box, inside the margin.
                this.boxes.inner = new Rectangle({
                    top: this.boxes.outer.top() + margin.top,
                    left: this.boxes.outer.left() + margin.left,
                    right: this.boxes.outer.width() - margin.right,
                    bottom: this.boxes.outer.height() - margin.bottom
                });

                //The noise timeline box
                this.boxes.noise = this.boxes.inner.extend({
                    height: this._noiseHeight
                });

                //The retweet timeline box
                this.boxes.retweets = this.boxes.inner.extend({
                    top: this.boxes.inner.bottom() - this._retweetHeight,
                    height: this._retweetHeight
                });

                //The originals timeline box
                this.boxes.originals = this.boxes.inner.extend({
                    top: this.boxes.noise.bottom() + originalsTopMargin,
                    bottom: this.boxes.retweets.top() - originalsBottomMargin
                });
            },

            /**
             * Render the timeline contents. This calls a bunch of other render functions.
             */
            _renderContent: function() {
                this._renderTimeAxis();
                this._configureSemanticZoom();
                this._renderNoiseHistogram();
                this._renderRetweetHistogram();
                this._renderOriginalsHistogram();
            },

            /**
             * Update a bunch of timeline contents.
             */
            _updateContent: function() {
                this._updateTimeAxis();
                this._updateNoiseHistogram();
                this._updateRetweetHistogram();
                this._updateOriginalsHistogram();
            },

            /**
             * Make a group for the timeline x axis.
             */
            _renderTimeAxis: function() {
                //Add an x axis
                this._svg.append('g')
                .classed('x axis chart-label', true);

                this._updateTimeAxis();
            },

            /**
             * Position and render the x axis.
             */
            _updateTimeAxis: function() {
                this._svg.select('g.x.axis.chart-label')
                .attr('transform', new Transform('translate',
                    this.boxes.inner.left(), this.boxes.inner.bottom() + AXIS_OFFSET))
                .call(this._timeAxis);
            },

            /**
             * Set up the semantic zoom component.
             *
             * There's nothing about this component that might need updating, apparently... (TODO)
             */
            _configureSemanticZoom: function() {
                this._semantic = new SemanticZoom();
                this._semantic
                .scale(this._timeScale)
                .idealBinCount(this._idealBinCount);
            },

            /**
             * Render the noise timeline.
             */
            _renderNoiseHistogram: function() {
                var self = this;

                //Get some dummy data
                var data = _dummyCountData();

                //We'll render this using a zoom histogram component
                this._noiseHistogram = new ZoomHistogram();

                //Get and set up the histogram part of the zoom histogram
                this._noiseHistogram.histogram()
                .className('noise')
                .container(this._svg)
                .box(this.boxes.noise)
                .xData(this._timeAccessor)
                .xScale(this._timeScale)
                .yScaleDomainAuto(data)
                .interpolate(this._interpolation)
                .render();

                //Set a callback for when new data loads
                this._noiseHistogram
                .onLoad(function() {
                    //Make sure the vertical noise axis is showing
                    self._svg.select('g.noise.axis.chart-label')
                    .transition()
                    .style('opacity', 1);

                    //Update the noise vertical axis
                    self._updateNoiseAxis();
                });

                //Set the requester function for the data cache
                this._noiseHistogram.cache()
                .requester(function(id, zoomLevel, extent) {
                    //Generate an ajax request
                    var query = {
                        rid: id,
                        from: Math.round(extent[0] - self._utcOffset),
                        to: Math.round(extent[1] - self._utcOffset),
                        interval: Math.round(zoomLevel),
                        noise_threshold: self._noiseThreshold
                    };
                    if (self._searchQuery) {
                        query['search'] = self._searchQuery;
                    }
                    return $.getJSON('data/noise.php', query, 'json');
                });

                //Tell the noise histogram about our shared semantic zoom controller
                this._noiseHistogram.semantic(this._semantic);

                //Initialize the vertical noise axis
                this._noiseAxis = d3.svg.axis()
                .scale(this._noiseHistogram.histogram().yScale())
                .ticks(3)
                .orient('left');

                //Add the vertical axis group
                this._svg.append('g')
                .classed('noise axis chart-label', true)
                .style('opacity', 0);

                //Do some final configuration
                this._updateNoiseHistogram();
            },

            /**
             * Update the noise timeline and its axis.
             */
            _updateNoiseHistogram: function() {
                //Just pass on the update
                this._noiseHistogram.update();

                this._updateNoiseAxis();
            },

            /**
             * Update the noise timeline vertical axis.
             */
            _updateNoiseAxis: function() {
                //Position and render the axis
                this._svg.select('g.noise.axis.chart-label')
                .attr('transform', new Transform('translate',
                    this.boxes.inner.left() - AXIS_OFFSET, this.boxes.inner.top()))
                .call(this._noiseAxis);
            },

            /**
             * Render the retweet timeline.
             */
            _renderRetweetHistogram: function() {

                //Get some dummy data
                var data = _dummyCountData();

                //Render the retweet histogram using a zoom histogram component.
                this._retweetHistogram = new ZoomHistogram();

                //Configure the histogram itself
                this._retweetHistogram.histogram()
                .className('retweet')
                .container(this._svg)
                .flipped(true)
                .box(this.boxes.retweets)
                .xData(this._timeAccessor)
                .xScale(this._timeScale)
                .yScaleDomainAuto(data)
                .interpolate(this._interpolation)
                .render();

                //When the retweet histogram loads data, refresh the vertical axis
                this._retweetHistogram
                .onLoad(function() {
                    //Make sure the axis is visible
                    self._svg.select('g.retweet.axis.chart-label')
                    .transition()
                    .style('opacity', 1);

                    //Update the retweet vertical axis
                    self._updateRetweetAxis();
                });

                var self = this;
                //Set the requester function for the retweet timeline data cache
                this._retweetHistogram.cache()
                .requester(function(id, zoomLevel, extent) {
                    //Build the ajax query
                    var query = {
                        rid: id,
                        from: Math.round(extent[0] - self._utcOffset),
                        to: Math.round(extent[1] - self._utcOffset),
                        interval: Math.round(zoomLevel),
                        noise_threshold: self._noiseThreshold
                    };
                    if (self._searchQuery) {
                        query['search'] = self._searchQuery;
                    }
                    return $.getJSON('data/retweets.php', query, 'json');
                });

                this._retweetHistogram.semantic(this._semantic);

                this._retweetAxis = d3.svg.axis()
                .scale(this._retweetHistogram.histogram().yScale())
                .ticks(3)
                .orient('left');

                //Add an x axis
                this._svg.append('g')
                .classed('retweet axis chart-label', true)
                .style('opacity', 0);

                this._updateRetweetHistogram();
            },

            _updateRetweetHistogram: function() {
                this._retweetHistogram.update();
                this._updateRetweetAxis();
            },

            _updateRetweetAxis: function() {
                //Position and render the axis
                this._svg.select('g.retweet.axis.chart-label')
                .attr('transform', new Transform('translate',
                    this.boxes.inner.left() - AXIS_OFFSET, this.boxes.retweets.top()))
                .call(this._retweetAxis);
            },

            _renderOriginalsHistogram: function() {
                this._originalsHistogram = new ZoomHistogram();

                this._originalsHistogram.histogram(new StackHistogram());

                this._originalsHistogram.histogram()
                .className('originals')
                .container(this._svg)
                .box(this.boxes.originals)
                .xData(this._timeAccessor)
                .xScale(this._timeScale)
                .colorScale(this._sentimentScale)
                .interpolate(this._interpolation)
                .render();

                this._originalsHistogram.histogram()
                .target()
                .datum(_dummyGroupData());

                this._originalsHistogram
                .onLoad(function() {
                    self._container.select('div.graph-align-toggle')
                    .transition()
                    .style('opacity', 1)

                    self._updateOriginalsAxis();
                });

                var self = this;
                this._originalsHistogram.cache()
                .requester(function(id, zoomLevel, extent) {
                    var query = {
                        rid: id,
                        from: Math.round(extent[0] - self._utcOffset),
                        to: Math.round(extent[1] - self._utcOffset),
                        interval: Math.round(zoomLevel),
                        noise_threshold: self._noiseThreshold
                    };
                    if (self._searchQuery) {
                        query['search'] = self._searchQuery;
                    }
                    return $.getJSON('data/by_time.php', query, 'json');
                });

                this._originalsHistogram.semantic(this._semantic);

                this._originalsAxis = d3.svg.axis()
                .scale(this._originalsHistogram.histogram().yScale())
                .ticks(10)
                .orient('left');

                //Add an x axis
                this._svg.append('g')
                .classed('originals axis chart-label', true)
                .style('opacity', 0);

                this._updateOriginalsHistogram();
            },

            _updateOriginalsHistogram: function() {
                this._originalsHistogram.update()
                this._updateOriginalsAxis();
            },

            _updateOriginalsAxis: function() {
                //Position and render the axis
                if (!this._normalize) {
                    this._svg.select('g.originals.axis.chart-label')
                    .attr('transform', new Transform('translate',
                        this.boxes.inner.left() - AXIS_OFFSET, this.boxes.originals.top()))
                    .call(this._originalsAxis)
                    .transition()
                    .style('opacity', 1);
                } else {
                    this._svg.select('g.originals.axis.chart-label')
                    .transition()
                    .style('opacity', 0);
                }
            },

            _renderHTMLOverlay: function() {
                this._renderToggleButton();
            },

            _renderToggleButton: function() {
                var newButton = this._container.append('div')
                .classed('graph-align-toggle', true)
                .style('opacity', 0);

                var icon = newButton.append('i')
                .classed('icon-white', true);

                var self = this;
                newButton.on('click', function() {
                    self._normalize = !icon.classed('normalized');

                    //self.originalsGraph.setBarsNormalized(toNormalize);
                    icon.classed('icon-align-left', !self._normalize)
                    .classed('icon-align-justify normalized', self._normalize);

                    self._originalsHistogram.histogram().expand(self._normalize);
                    self._originalsHistogram.update();

                    self._updateOriginalsAxis();
                });

                this._updateToggleButton();
            },

            _updateToggleButton: function() {
                var toggleButtonOffset = {
                    top: 5,
                    left: -5
                };

                //Update the button's position
                var button = this._container.select('div.graph-align-toggle');

                button.style('top', (this.boxes.originals.top() + toggleButtonOffset.top) + "px")
                .style('left', (this.boxes.originals.left() - toggleButtonOffset.left) + "px");

                //Update the button's normalization display
                button.select('i')
                .classed('icon-align-left', !this._normalize)
                .classed('icon-align-justify normalized', this._normalize);
            },

            idealBinCount: function(bins) {
                if (!arguments.length) {
                    return this._idealBinCount;
                }
                this._idealBinCount = bins;
                return this;
            }

        });

        return TweetTimeline;
    });