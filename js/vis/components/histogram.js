define(['lib/d3', 'underscore', 'lib/rectangle', 'lib/transform'],
    function(d3, _, Rectangle, Transform) {

        var Histogram = function() {
            this.initialize();
        }

        _.extend(Histogram.prototype, {
            initialize: function() {
                var self = this;

                this._box = new Rectangle({
                    top: 0,
                    left: 0,
                    width: 200,
                    height: 200
                });

                this._className = "";

                this._flipped = false;

                this._xAccessor = function(d) {
                    return d.time;
                }
                this._yAccessor = function(d) {
                    return d.count;
                }

                this._xScale = d3.time.scale();
                this._yScale = d3.scale.linear();

                //Private immutable functions
                var scaledX = function(d) {
                    return self._xScale(self._xAccessor(d));
                }
                var scaledY = function(d) {
                    return self._yScale(self._yAccessor(d));
                }

                this._area = d3.svg.area().x(scaledX).y1(scaledY).y0(0);
            },

            _updateScales: function() {
                //Redo the x scale
                this._xScale.range([0, this._box.width()]);

                //Redo the y scale
                this._yScale.range([0, this._box.height()]);


                this.yScaleDomainAuto(this.target().datum());
            },

            container: function(selection) {
                if (!arguments.length) {
                    return this._container;
                }
                this._container = selection;
                return this;
            },

            target: function() {
                return this._target;
            },

            _renderTarget: function() {

                this._svg = this._container.append('svg')
                .classed('histogram', true);

                if (this._className) {
                    this._svg.classed(this._className, true);
                }

                this._target = this._svg.append('g');

                //Bind empty data for now
                this._target.datum([]);
            },

            className: function(value) {
                if (!arguments.length) {
                    return this._className;
                }

                this._className = value;
                return this;
            },

            render: function() {
                this._renderTarget();

                this._updateScales();

                this._updateTargetSize();

                this._renderPath();
                this._updatePath();
            },

            flipped: function(flipped) {
                if (!arguments.length) {
                    return this._flipped;
                }
                this._flipped = flipped;
                return this;
            },

            update: function() {
                this._updateScales();
                this._updateTargetSize();
                this._updatePath();
            },

            _updateTargetSize: function() {
                //Make the box the right size
                this._svg.call(this._box);

                //Flip the target over
                if (!this._flipped) {
                    var transformAttr = new Transform('translate', 0, this._box.height())
                    .and('scale', 1, -1);

                    this._target.attr('transform', transformAttr);
                }
            },

            _renderPath: function() {
                //Add the path
                return this._target.append("path")
                .classed('area', true);
            },

            _updatePath: function() {
                //Adjust the path to fit the data
                var path = this._target.select(".area")

                path.attr("d", this._area);
            },

            interpolate: function(value) {
                if (!arguments.length) {
                    return this._area.interpolate();
                }

                this._area.interpolate(value);
                return this;
            },

            box: function(value) {
                if (!arguments.length) {
                    return this._box;
                }
                this._box = value;
                return this;
            },

            xData: function(fun) {
                if (!arguments.length) {
                    return this._xAccessor;
                }
                this._xAccessor = fun;
                return this;
            },

            yData: function(fun) {
                if (!arguments.length) {
                    return this._yAccessor;
                }
                this._yAccessor = fun;
                return this;
            },

            xScale: function(scale) {
                if (!arguments.length) {
                    return this._xScale;
                }
                this._xScale = scale;
                return this;
            },

            yScale: function(scale) {
                if (!arguments.length) {
                    return this._yScale;
                }
                this._yScale = scale;
                return this;
            },

            xScaleDomainAuto: function(data) {
                this._xScale.domain(d3.extent(data, this._xAccessor));
                return this;
            },

            yScaleDomainAuto: function(data) {
                this._yScale.domain(d3.extent(data, this._yAccessor));
                return this;
            }
        });

        return Histogram;

    });