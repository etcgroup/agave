define(['lib/d3', 'underscore', 'lib/rectangle'],
    function(d3, _, Rectangle) {

        /**
         * Basic histogram visualization, created via an area chart.
         */
        var Histogram = function() {
            var self = this;

            //Set up a default box for the histogram
            this._box = new Rectangle({
                top: 0,
                left: 0,
                width: 200,
                height: 200
            });

            //Optional classname to add to the histogram container
            this._className = "";

            //Whether or not the histogram is vertically flipped
            this._flipped = false;

            //Function that retrieves the x dimension from the data
            this._xAccessor = function(d) {
                return d.time;
            }
            //Function that retrieves the y dimension from the data
            this._yAccessor = function(d) {
                return d.count;
            }

            //Set up the scales
            this._xScale = d3.time.scale();
            this._yScale = d3.scale.linear();

            //Immutable functions for scaling the x and y data, not meant to be changed.
            //Only the scales and the accessors should be changeable.
            var _scaledX = function(d) {
                return self._xScale(self._xAccessor(d));
            }
            var _scaledY = function(d) {
                return self._yScale(self._yAccessor(d));
            }

            //The svg area generator uses the scaling functions
            this._area = d3.svg.area()
            .x(_scaledX)
            .y1(_scaledY);
        }

        _.extend(Histogram.prototype, {

            /**
             * Update the scales based on the data
             */
            _updateScales: function() {
                //Redo the x range in case the box has changed
                this._xScale.range([0, this._box.width()]);

                //Redo the y range in case the box or flipped has changed
                if (this._flipped) {
                    this._yScale.range([0, this._box.height()]);
                } else {
                    this._yScale.range([this._box.height(), 0]);
                }

                //Set the y domain based on the current data
                var data = this.data();
                if (data) {
                    this.yScaleDomainAuto(data);
                }

                //Update the area baseline with any changes to the y scale.
                //Unlike y1, y0 does not update based on the data.
                this._area.y0(this._yScale(0));
            },

            /**
             * Render the histogram background elements.
             */
            _renderTarget: function() {

                //Add an svg document. It is ok if this is nested inside another svg.
                this._svg = this._container.append('svg')
                .classed('histogram', true);

                //Set the classname if one has been provided. This is useful for css styling.
                if (this._className) {
                    this._svg.classed(this._className, true);
                }

                //Create a group to be the rendering target.
                this._target = this._svg.append('g');
            },

            /**
             * Render the histogram.
             */
            render: function() {
                this._renderTarget();

                this._updateScales();

                this._updateTargetSize();

                this._renderPath();
            },

            /**
             * Update the histogram.
             */
            update: function() {
                this._updateScales();
                this._updateTargetSize();
                this._updatePath();
            },

            /**
             * Update the size of the target, if the box size has changed.
             */
            _updateTargetSize: function() {
                this._svg.call(this._box);
            },

            /**
             * Add the path element for rendering the area.
             */
            _renderPath: function() {
                return this._target.append("path")
                .classed('area', true);

                this._updatePath();
            },

            /**
             * Update the path using the area generator.
             */
            _updatePath: function() {
                //Only update if there is data
                if (this.data()) {
                    //Adjust the path to fit the data
                    this._target.select(".area")
                    .attr("d", this._area);
                }
            },

            /**
             * Auto size the x scale domain to the data.
             */
            xScaleDomainAuto: function(data) {
                this._xScale.domain(d3.extent(data, this._xAccessor));
                return this;
            },

            /**
             * Auto size the y scale domain to the data.
             */
            yScaleDomainAuto: function(data) {
                this._yScale.domain(d3.extent(data, this._yAccessor));
                return this;
            }
        });

        /**
         * Add a bunch of accessors/mutators
         */
        _.extend(Histogram.prototype, {
            /**
             * Get or set the histogram's container element.
             *
             * An svg element will be added to the container.
             */
            container: function(selection) {
                if (!arguments.length) {
                    return this._container;
                }
                this._container = selection;
                return this;
            },

            /**
             * Get or set the data for the histogram
             */
            data: function(data) {
                if (!arguments.length) {
                    return this._target.datum();
                }

                this._target.datum(data);
                return this;
            },

            /**
             * Get the histogram's render target.
             */
            target: function() {
                return this._target;
            },

            /**
             * Get or set the classname that will be added to the histogram's svg element.
             */
            className: function(value) {
                if (!arguments.length) {
                    return this._className;
                }

                this._className = value;
                return this;
            },

            /**
             * Get or set whether or not the histogram is flipped vertically.
             */
            flipped: function(flipped) {
                if (!arguments.length) {
                    return this._flipped;
                }
                this._flipped = flipped;
                return this;
            },

            /**
             * Get or set the interpolation mode for the histogram area.
             */
            interpolate: function(value) {
                if (!arguments.length) {
                    return this._area.interpolate();
                }

                this._area.interpolate(value);
                return this;
            },

            /**
             * Get or set the histogram box.
             */
            box: function(value) {
                if (!arguments.length) {
                    return this._box;
                }
                this._box = value;
                return this;
            },

            /**
             * Get or set the x accessor function.
             */
            xData: function(fun) {
                if (!arguments.length) {
                    return this._xAccessor;
                }
                this._xAccessor = fun;
                return this;
            },

            /**
             * Get or set the y accessor function.
             */
            yData: function(fun) {
                if (!arguments.length) {
                    return this._yAccessor;
                }
                this._yAccessor = fun;
                return this;
            },

            /**
             * Get or set the x scale.
             */
            xScale: function(scale) {
                if (!arguments.length) {
                    return this._xScale;
                }
                this._xScale = scale;
                return this;
            },

            /**
             * Get or set the y scale.
             */
            yScale: function(scale) {
                if (!arguments.length) {
                    return this._yScale;
                }
                this._yScale = scale;
                return this;
            }
        })

        return Histogram;

    });