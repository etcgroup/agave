define(['lib/d3', 'underscore', 'lib/extend', 'vis/components/histogram'],
    function(d3, _, extend, Histogram) {

        //Modified expand mode for area generator, based on d3
        var expand = function(data) {
            var n = data.length, m = data[0].length, k = 0, i, j, o, y0 = [];
            for (j = 0; j < m; ++j) {
                for (i = 0, o = 0; i < n; i++) o += data[i][j][1];
                if (o) for (i = 0; i < n; i++) data[i][j][1] /= o; else for (i = 0; i < n; i++) data[i][j][1] = k;
            }
            for (j = 0; j < m; ++j) y0[j] = 0;
            return y0;
        }

        /**
         * A class for rendering stacked histograms. Uses d3's stacked layout.
         */
        var StackHistogram = function() {
            //call the superclass constructor
            Histogram.call(this);

            //Default accessor for the group id
            this._groupIdAccessor = function(d) {
                return d.id;
            }

            //Default accessor for group values
            this._groupValuesAccessor = function(grp) {
                return grp.values
            }

            //Create the color scale
            this._colorScale = d3.scale.ordinal();

            var self = this;

            //Private immutable functions for building stacks
            var stackYAccessor = function(d) {
                return self._yAccessor(d);
            }
            var stackXAccessor = function(d) {
                return self._xAccessor(d);
            }
            //                var stackOut = function(d, y0, y) {
            //                    d.y0 = y0;
            //                    d.y = y;
            //                }
            var stackValuesAccessor = function(grp) {
                return self._groupValuesAccessor(grp);
            }

            //Create a d3 stack layout
            this._expand = true;
            this._stack = d3.layout.stack()
            .values(stackValuesAccessor)
            .y(stackYAccessor)
            .x(stackXAccessor)
            //                .out(stackOut)
            .offset(expand);

            //I can't remember what this does...
            self._bumpValue = -1;

            //Private immutable functions for building areas
            var _scaledX = function(d) {
                return self._xScale(self._xAccessor(d));
            }
            var _scaledY = function(d) {
                return Math.round(self._yScale(d.y0 + d.y)) + self._bumpValue;
            }
            var _scaledY0 = function(d) {
                return Math.round(self._yScale(d.y0));
            }

            //This overwrites the super class's area generator
            this._area = d3.svg.area()
            .x(_scaledX)
            .y1(_scaledY0)
            .y0(_scaledY);

            this._colorValue = function(grp) {
                return self._colorScale(self._groupIdAccessor(grp));
            }
            this._buildArea = function(grp) {
                return self._area(self._groupValuesAccessor(grp));
            }
        }

        //Extend the base histogram class
        extend(StackHistogram, Histogram);

        //Add/override methods
        _.extend(StackHistogram.prototype, {

            /**
             * Get or set whether or not to use a normalized/expanded layout.
             */
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

            /**
             * Update the x and y scales.
             */
            _updateScales: function(data) {
                //Redo the x scale range
                this._xScale.range([0, this._box.width()]);

                //Redo the y scale domain
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
            stack: function() {
                return this._stack;
            },

            /**
             * Override the histogram render function.
             *
             * We don't want to pre-create the path for this one because
             * we don't know how many areas we're drawing without data.
             */
            render: function() {
                this._renderTarget();

                this._updateScales();

                this._updateTargetSize();
            },

            /**
             * Use the stack layout to prepare the data.
             */
            _getStackData: function() {
                var groups = this._target.datum();
                return this._stack(groups);
            },

            /**
             * Override the default update method.
             *
             * We need to prepare the data using the stacked layout and then
             * apply the updates using the prepared data.
             */
            update: function() {
                var stacked = this._getStackData();

                this._updateScales(stacked);
                this._updateTargetSize();
                this._updatePath(stacked);
            },

            /**
             * Given some stacked data, bind it to the paths
             * and redraw the areas.
             */
            _updatePath: function(stacked) {

                //Bind the new data
                var bind = this._target.selectAll('path')
                .data(stacked);

                //Add any needed paths
                bind.enter()
                .append('path');
                //.classed('area', true);

                //Update the path based on the data
                bind.attr('d', this._buildArea)
                .attr('fill', this._colorValue);

            },

            /**
             * Get or set the group id accessor.
             */
            groupIdAccessor: function(fun) {
                if (!arguments.length) {
                    return this._groupIdAccessor;
                }
                this._groupIdAccessor= fun;
                return this;
            },

            /**
             * Get or set the group values accessor.
             */
            groupValuesAccessor: function(fun) {
                if (!arguments.length) {
                    return this._groupValuesAccessor;
                }
                this._groupValuesAccessor= fun;
                return this;
            },

            /**
             * Get or set the color scale.
             */
            colorScale: function(scale) {
                if (!arguments.length) {
                    return this._colorScale;
                }
                this._colorScale = scale;
                return this;
            }
        });

        return StackHistogram;

    });