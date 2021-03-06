define(['lib/d3', 'underscore',
    'util/extend',
    'vis/histogram'],
    function (d3, _, extend, Histogram) {

        //Modified expand mode for area generator, based on d3
        var expand = function (data) {
            var n = data.length, m = data[0].length, k = 0, i, j, o, y0 = [];
            for (j = 0; j < m; ++j) {
                for (i = 0, o = 0; i < n; i++) {
                    o += data[i][j][1];
                }
                if (o) {
                    for (i = 0; i < n; i++) {
                        data[i][j][1] /= o;
                    }
                } else {
                    for (i = 0; i < n; i++) {
                        data[i][j][1] = k;
                    }
                }
            }
            for (j = 0; j < m; ++j) {
                y0[j] = 0;
            }
            return y0;
        };

        /**
         * A class for rendering stacked histograms. Uses d3's stacked layout.
         */
        var StackHistogram = function () {
            //call the superclass constructor
            Histogram.call(this);

            //Default accessor for the group id
            this._groupIdAccessor = function (d) {
                return d.id;
            };

            //Default accessor for group values
            this._groupValuesAccessor = function (grp) {
                return grp.values;
            };

            //Create the color scale
            this._colorScale = d3.scale.ordinal();

            var self = this;

            //Private immutable functions for building stacks
            var stackYAccessor = function (d) {
                return self._yAccessor(d);
            };
            var stackXAccessor = function (d) {
                return self._xAccessor(d);
            };
            var stackValuesAccessor = function (grp) {
                return self._groupValuesAccessor(grp);
            };

            //Create a d3 stack layout
            this._expand = true;
            this._stack = d3.layout.stack()
                .values(stackValuesAccessor)
                .y(stackYAccessor)
                .x(stackXAccessor)
                .offset('expand');

            //I can't remember what this does...
            self._bumpValue = -1;

            //Private immutable functions for building areas
            var _scaledX = function (d) {
                return self._xScale(self._xAccessor(d));
            };
            var _scaledY = function (d) {
                return Math.round(self._yScale(d.y0 + d.y)) + self._bumpValue;
            };
            var _scaledY0 = function (d) {
                return Math.round(self._yScale(d.y0));
            };

            this._defined = function (d, i) {
                return (self._totals[i] !== 0);
            };

            //This overwrites the super class's area generator
            this._area = d3.svg.area()
                .x(_scaledX)
                .y1(_scaledY0)
                .y0(_scaledY)
                .defined(this._defined);

            this._colorValue = function (grp) {
                return self._colorScale(self._groupIdAccessor(grp));
            };
            this._buildArea = function (grp) {
                return self._area(self._groupValuesAccessor(grp));
            };
        };

        //Extend the base histogram class
        extend(StackHistogram, Histogram);

        //Add/override methods
        _.extend(StackHistogram.prototype, {

            /**
             * Get or set whether or not to use a normalized/expanded layout.
             */
            expand: function (toExpand) {
                if (!arguments.length) {
                    return this._expand;
                }
                if (toExpand !== this._expand) {
                    this._expand = toExpand;

                    if (toExpand) {
                        this._stack.offset("expand");
                        this._area.defined(this._defined);
                    } else {
                        this._stack.offset('zero');
                        this._area.defined(function () {
                            return true;
                        });
                    }

                    //Re-stack the data (force a restack)
                    this._stacked_data = null;
                }
                return this;
            },

            /**
             * Update the x and y scales.
             */
            _updateScales: function () {
                //Redo the x scale range
                this._xScale.range([0, this._box.width()]);


                //Redo the y scale domain
                if (this._raw_data) {

                    if (!this._stacked_data) {
                        this._stacked_data = this._stack(this._raw_data);
                        this._calculateTotals();
                    }

                    var stacked = this._stacked_data;

                    var lastGroupValues = this._groupValuesAccessor(stacked[stacked.length - 1]);
                    var firstGroupValues = this._groupValuesAccessor(stacked[0]);
                    var min = d3.min(firstGroupValues, function (d) {
                        return d.y0;
                    });
                    var max = d3.max(lastGroupValues, function (d) {
                        return d.y0 + d.y;
                    });

                    this._yScale.domain([min, max]);
                }

                //Redo the y scale range
                if (this._flipped) {
                    this._bumpValue = 1;
                    this._yScale.range([0, this._box.height()]);
                } else {
                    this._bumpValue = -1;
                    this._yScale.range([this._box.height(), 0]);
                }
            },

            /**
             * Get the stack layout.
             */
            stack: function () {
                return this._stack;
            },

            /**
             * Override the histogram render function.
             *
             * We don't want to pre-create the path for this one because
             * we don't know how many areas we're drawing without data.
             */
            render: function () {
                this._renderTarget();

                this._updateScales();

                this._updateTarget();
            },

            /**
             * Get or set the data for the stacked histogram
             */
            data: function (data) {

                if (!arguments.length) {
                    return this._raw_data;
                }

                //Stack the data
                this._stacked_data = null;
                this._raw_data = data;
                return this;
            },

            _calculateTotals: function() {
                var data = this._raw_data;
                this._raw_totals = [];
                var num = data.length;
                var i, j;
                for (i = 0; i < data[0].values.length; i++) {
                    var sum = 0;
                    for (j = 0; j < num; j++) {
                        sum += data[j].values[i].count;
                    }
                    this._raw_totals.push(sum);
                }
            },

            /**
             * Given some stacked data, bind it to the paths
             * and redraw the areas.
             */
            _updatePath: function (animate) {
                //Only update if we have data ready
                if (!this._raw_data) {
                    return;
                }

                if (!this._stacked_data) {
                    this._stacked_data = this._stack(this._raw_data);
                    this._calculateTotals();
                }

                var data = this._stacked_data;
                this._totals = this._raw_totals;
                if (Histogram.USE_VISIBLE_SECTION) {
                    //Select the part of the data we are showing
                    var firstGroupValues = data[0].values;
                    var visibleRange = this._visibleRange(firstGroupValues);
                    if (visibleRange) {
                        var self = this;
                        data = data.map(function (grp) {
                            return {
                                id: grp.id,
                                values: grp.values.slice(visibleRange[0], visibleRange[1])
                            };
                        });
                        this._totals = this._raw_totals.slice(visibleRange[0], visibleRange[1]);
                    }
                }

                //Bind the new data
                var bind = this._target.selectAll('path')
                    .data(data);

                //Add any needed paths
                bind.enter()
                    .append('path');

                //Remove any unneeded paths
                bind.exit()
                    .remove('path');

                //Update the path based on the data
                //if (animate) {
                //    bind.transition()
                //        .attr('d', this._buildArea);
                //} else {
                bind.attr('d', this._buildArea);
                //}

                bind.attr('class', this._colorValue)
                    .classed('area', true);
            },

            /**
             * Get or set the group id accessor.
             */
            groupIdAccessor: function (fun) {
                if (!arguments.length) {
                    return this._groupIdAccessor;
                }
                this._groupIdAccessor = fun;
                return this;
            },

            /**
             * Get or set the group values accessor.
             */
            groupValuesAccessor: function (fun) {
                if (!arguments.length) {
                    return this._groupValuesAccessor;
                }
                this._groupValuesAccessor = fun;
                return this;
            },

            /**
             * Get or set the color scale.
             */
            colorScale: function (scale) {
                if (!arguments.length) {
                    return this._colorScale;
                }
                this._colorScale = scale;
                return this;
            }
        });

        return StackHistogram;

    });