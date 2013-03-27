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

        var TweetTimeline = function() {
            this.initialize();
        }

        _.extend(TweetTimeline.prototype, {

            initialize: function() {
                this._normalize = true;

                this._retweetHeight = 50;
                this._noiseHeight = 50;

                this._positiveColor = "#69C5F5";
                this._negativeColor = "#F26522";
                this._neutralColor = "#F8FDFF";

                this._interpolation = 'linear';

                this._sentimentScale = d3.scale.ordinal()
                .domain([-1, 0, 1]);

                this._timeScale = d3.time.scale.utc();

                this._timeAxis = d3.svg.axis()
                .scale(this._timeScale)
                .orient("bottom");

                this._idealBinCount = 50;
                this._noiseThreshold = 1;

                this._utcOffset = 0;

                var self = this;
                this._timeAccessor = function(d) {
                    return d.time + self._utcOffset;
                }
            },

            utcOffsetMillis: function(offset) {
                if (!arguments.length) {
                    return this._utcOffset;
                }
                this._utcOffset = offset;
                return this;
            },

            noiseThreshold: function(threshold) {
                if (!arguments.length) {
                    return this._noiseThreshold;
                }
                this._noiseThreshold = threshold;
                return this;
            },

            interpolate: function(interpolation) {
                if (!arguments.length) {
                    return this._interpolation;
                }
                this._interpolation = interpolation;
                return this;
            },

            neutralColor: function(color) {
                if (!arguments.length) {
                    return this._neutralColor;
                }
                this._neutralColor = color;
                return this;
            },

            negativeColor: function(color) {
                if (!arguments.length) {
                    return this._negativeColor;
                }
                this._negativeColor = color;
                return this;
            },

            positiveColor: function(color) {
                if (!arguments.length) {
                    return this._positiveColor;
                }

                this._positiveColor = color;
                return this;
            },

            sentimentScale: function(scale) {
                if (!arguments.length) {
                    return this._sentimentScale;
                }
                this._sentimentScale = scale;
                return this;
            },

            timeScale: function(scale) {
                if (!arguments.length) {
                    return this._timeScale;
                }
                this._timeScale = scale;
                return this;
            },

            timeAxis: function(axis) {
                if (!arguments.length) {
                    return this._timeAxis;
                }
                this._timeAxis = axis;
                return this;
            },

            width: function(value) {
                if (!arguments.length) {
                    return this._width;
                }
                this._width = value;
                return this;
            },

            height: function(value) {
                if (!arguments.length) {
                    return this._height;
                }
                this._height = value;
                return this;
            },

            noiseHeight: function(value) {
                if (!arguments.length) {
                    return this._noiseHeight;
                }
                this._noiseHeight = value;
                return this;
            },

            retweetHeight: function(value) {
                if (!arguments.length) {
                    return this._retweetHeight;
                }
                this._retweetHeight = value;
                return this;
            },

            normalize: function(toNormalize) {
                if (!arguments.length) {
                    return this._normalize;
                }
                this._normalize = toNormalize;
                return this;
            },

            container: function(selection) {
                if (!arguments.length) {
                    return this._container;
                }
                this._container = selection;
                return this;
            },

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

            update: function() {
                this._buildBoxes();
                this._updateSentimentScaleRange();
                this._updateTimeScaleRange();

                this._updateContent();
            },

            _renderTarget: function() {
                this._svg = this._container.append('svg');

                this._updateTarget();
            },

            _updateTarget: function() {
                this._svg.call(this.boxes.outer);
            },

            _updateForeground: function() {
                this._svg.selectAll('rect.foreground')
                .call(this.boxes.inner);
            },

            _configureZoom: function() {
                var self = this;

                this._zoom = d3.behavior.zoom()
                .x(this._timeScale)
                .on('zoom', function() {
                    self._updateContent();
                });

                this._svg.append('rect')
                .classed('foreground', true)
                .call(this._zoom);

                this._updateForeground();
            },

            _updateZoomScale: function() {
                this._zoom.x(this._timeScale);
            },

            _updateTimeScaleRange: function() {
                this._timeScale.range([0, this.boxes.inner.width()])
            },

            _updateSentimentScaleRange: function() {
                this._sentimentScale.range([this._negativeColor, this._neutralColor, this._positiveColor]);
            },

            _buildBoxes: function() {

                var margin = {
                    left: 20,
                    right: 20,
                    top: 20,
                    bottom: 20
                }

                var originalsTopMargin = 5;
                var originalsBottomMargin = 5;

                this.boxes = {};

                this.boxes.outer = new Rectangle({
                    top: 0,
                    left: 0,
                    width: this._width,
                    height: this._height
                });

                this.boxes.inner = new Rectangle({
                    top: this.boxes.outer.top() + margin.top,
                    left: this.boxes.outer.left() + margin.left,
                    right: this.boxes.outer.width() - margin.right,
                    bottom: this.boxes.outer.height() - margin.bottom
                });

                this.boxes.noise = this.boxes.inner.extend({
                    height: this._noiseHeight
                });

                this.boxes.retweets = this.boxes.inner.extend({
                    top: this.boxes.inner.bottom() - this._retweetHeight,
                    height: this._retweetHeight
                });

                this.boxes.originals = this.boxes.inner.extend({
                    top: this.boxes.noise.bottom() + originalsTopMargin,
                    bottom: this.boxes.retweets.top() - originalsBottomMargin
                });
            },

            _renderBackground: function() {
                //Add a background
                this._svg.append('rect')
                .classed('main background', true);

                this._updateBackground();
            },

            _updateBackground: function() {
                //Size the background
                this._svg.select('rect.main.background')
                .call(this.boxes.outer);
            },

            _renderContent: function() {
                this._renderTimeAxis();
                this._configureSemanticZoom();
                this._renderNoiseHistogram();
                this._renderRetweetHistogram();
                this._renderOriginalsHistogram();
            },

            _updateContent: function() {
                this._updateTimeAxis();
                this._updateNoiseHistogram();
                this._updateRetweetHistogram();
                this._updateOriginalsHistogram();
            },

            _configureSemanticZoom: function() {
                this._semantic = new SemanticZoom();
                this._semantic
                .scale(this._timeScale)
                .idealBinCount(this._idealBinCount);
            },

            _dummyCountData: function() {
                return [{
                    time: 1,
                    count: 1
                }];
            },

            _dummyGroupData: function() {
                return [
                {
                    name: 0,
                    values: [{
                        time: 1,
                        count: 1
                    }]
                }
                ];
            },

            _renderNoiseHistogram: function() {
                var self = this;

                var data = this._dummyCountData();

                this._noiseHistogram = new ZoomHistogram();

                this._noiseHistogram.histogram()
                .className('noise')
                .container(this._svg)
                .box(this.boxes.noise)
                .xData(this._timeAccessor)
                .xScale(this._timeScale)
                .yScaleDomainAuto(data)
                .interpolate(this._interpolation)
                .render();

                this._noiseHistogram.cache()
                .requester(function(zoomLevel, extent) {
                    return $.getJSON('http://localhost/twittervis/data/noise.php', {
                        from: Math.round(extent[0] - self._utcOffset),
                        to: Math.round(extent[1] - self._utcOffset),
                        interval: Math.round(zoomLevel),
                        noise_threshold: self._noiseThreshold
                    }, 'json');
                });

                this._noiseHistogram.semantic(this._semantic);

                this._updateNoiseHistogram();
            },

            _updateNoiseHistogram: function() {
                this._noiseHistogram.update();
            },

            _renderRetweetHistogram: function() {

                var data = this._dummyCountData();

                this._retweetHistogram = new ZoomHistogram();

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

                var self = this;
                this._retweetHistogram.cache()
                .requester(function(zoomLevel, extent) {
                    return $.getJSON('http://localhost/twittervis/data/retweets.php', {
                        from: Math.round(extent[0] - self._utcOffset),
                        to: Math.round(extent[1] - self._utcOffset),
                        interval: Math.round(zoomLevel)
                    }, 'json');
                });

                this._retweetHistogram.semantic(this._semantic);

                this._updateRetweetHistogram();
            },

            _updateRetweetHistogram: function() {
                this._retweetHistogram.update();
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
                .datum(this._dummyGroupData());

                var self = this;
                this._originalsHistogram.cache()
                .requester(function(zoomLevel, extent) {
                    return $.getJSON('http://localhost/twittervis/data/by_time.php', {
                        from: Math.round(extent[0] - self._utcOffset),
                        to: Math.round(extent[1] - self._utcOffset),
                        interval: Math.round(zoomLevel),
                        noise_threshold: self._noiseThreshold
                    }, 'json');
                });

                this._originalsHistogram.semantic(this._semantic);

                this._updateOriginalsHistogram();
            },

            _updateOriginalsHistogram: function() {
                this._originalsHistogram.update()
            },

            _renderTimeAxis: function() {
                //Add an x axis
                this._svg.append('g')
                .classed('x axis chart-label', true);

                this._updateTimeAxis();
            },

            _updateTimeAxis: function() {
                //Update the x axis scale
                this._timeAxis.scale(this._timeScale);

                //Position and render the axis
                this._svg.select('g.x.axis.chart-label')
                .attr('transform', new Transform('translate', this.boxes.inner.left(), this.boxes.inner.bottom()))
                .call(this._timeAxis);
            },

            _renderHTMLOverlay: function() {
                this._renderToggleButton();
            },

            _renderToggleButton: function() {
                var newButton = this._container.append('div')
                .classed('graph-align-toggle', true);

                var icon = newButton.append('i')
                .classed('icon-white', true);

                var self = this;
                newButton.on('click', function() {
                    var toNormalize = !icon.classed('normalized');

                    //self.originalsGraph.setBarsNormalized(toNormalize);
                    icon.classed('icon-align-left', !toNormalize)
                    .classed('icon-align-justify normalized', toNormalize);

                    self._originalsHistogram.histogram().expand(toNormalize);
                    self._originalsHistogram.update();
                });

                this._updateToggleButton();
            },

            _updateToggleButton: function() {
                var toggleButtonOffset = {
                    top: 14,
                    left: 18
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