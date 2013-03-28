define(['lib/d3', 'underscore', 'lib/rectangle', 'lib/transform'],
    function(d3, _, Rectangle, Transform) {

        var expand = function(data) {
            var n = data.length, m = data[0].length, k = 0, i, j, o, y0 = [];
            for (j = 0; j < m; ++j) {
                for (i = 0, o = 0; i < n; i++) o += data[i][j][1];
                if (o) for (i = 0; i < n; i++) data[i][j][1] /= o; else for (i = 0; i < n; i++) data[i][j][1] = k;
            }
            for (j = 0; j < m; ++j) y0[j] = 0;
            return y0;
        }

        var StackHistogram = function() {
            this.initialize();
        }

        _.extend(StackHistogram.prototype, {
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

                this._groupIdAccessor = function(d) {
                    return d.id;
                }
                this._groupValuesAccessor = function(grp) {
                    return grp.values
                }

                this._xScale = d3.time.scale();
                this._yScale = d3.scale.linear();
                this._colorScale = d3.scale.ordinal();

                //Private immutable functions for building stacks
                var stackYAccessor = function(d) {
                    return self._yAccessor(d);
                }
                var stackXAccessor = function(d) {
                    return self._xAccessor(d);
                }
                var stackOut = function(d, y0, y) {
                    d.y0 = y0;
                    d.y = y;
                }
                var stackValuesAccessor = function(grp) {
                    return self._groupValuesAccessor(grp);
                }

                this._expand = true;
                this._stack = d3.layout.stack()
                .values(stackValuesAccessor)
                .y(stackYAccessor)
                .x(stackXAccessor)
                .out(stackOut)
                .offset(expand);

                self._bumpValue = -1;

                //Private immutable functions for building areas
                this._scaledX = function(d) {
                    return self._xScale(self._xAccessor(d));
                }
                this._scaledY = function(d) {
                    return Math.round(self._yScale(d.y0 + d.y)) + self._bumpValue;
                }
                this._scaledY0 = function(d) {
                    return Math.round(self._yScale(d.y0));
                }

                this._area = d3.svg.area()
                .x(this._scaledX)
                .y1(this._scaledY0)
                .y0(this._scaledY);

                this._colorValue = function(grp) {
                    return self._colorScale(self._groupIdAccessor(grp));
                }
                this._buildArea = function(grp) {
                    return self._area(self._groupValuesAccessor(grp));
                }
            },

            expand: function(toExpand) {
                if (!arguments.length) {
                    return this._expand;
                }
                this._expand = toExpand;

                if (toExpand) {
                    this._stack.offset(expand);
                } else {
                    this._stack.offset('zero');
                }
                return this;
            },

            _updateScales: function(data) {
                //Redo the x scale
                this._xScale.range([0, this._box.width()]);

                //Redo the y scale
                if (data) {
                    var lastGroupValues = this._groupValuesAccessor(data[data.length - 1]);
                    var firstGroupValues = this._groupValuesAccessor(data[0]);
                    var min = d3.min(firstGroupValues, function(d) {
                        return d.y0;
                    })
                    var max = d3.max(lastGroupValues, function(d) {
                        return d.y0 + d.y;
                    });

                    this._yScale.domain([min, max]);
                }

                //Redo the y scale
                if (this._flipped) {
                    this._bumpValue = 1;
                    this._yScale.range([0, this._box.height()]);
                } else {
                    this._bumpValue = -1;
                    this._yScale.range([this._box.height(), 0]);
                }
            },

            stack: function() {
                return this._stack;
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
            },

            flipped: function(flipped) {
                if (!arguments.length) {
                    return this._flipped;
                }
                this._flipped = flipped;
                return this;
            },

            _getStackData: function() {
                var groups = this._target.datum();
                return this._stack(groups);
            },

            update: function() {
                var stacked = this._getStackData();

                this._updateScales(stacked);
                this._updateTargetSize();
                this._updatePath(stacked);
            },

            _updateTargetSize: function() {
                //Make the box the right size
                this._svg.call(this._box);
            },

            _updatePath: function(stacked) {

                //Bind the new data
                var bind = this._target.selectAll('path')
                .data(stacked);

                //Add any needed paths
                bind.enter()
                .append('path');
                //                .classed('area', true);

                //Update the path based on the data
                bind.attr('d', this._buildArea)
                .attr('fill', this._colorValue);

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

            groupIdAccessor: function(fun) {
                if (!arguments.length) {
                    return this._groupIdAccessor;
                }
                this._groupIdAccessor= fun;
                return this;
            },

            groupValuesAccessor: function(fun) {
                if (!arguments.length) {
                    return this._groupValuesAccessor;
                }
                this._groupValuesAccessor= fun;
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

            colorScale: function(scale) {
                if (!arguments.length) {
                    return this._colorScale;
                }
                this._colorScale = scale;
                return this;
            },

            xScaleDomainAuto: function(data) {
                this._xScale.domain(d3.extent(data, this._xAccessor));
                return this;
            }
        });

        return StackHistogram;

    });