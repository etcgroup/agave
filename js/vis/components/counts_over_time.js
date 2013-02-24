define(['lib/d3', 'underscore'],
    function(d3, _) {

        var CountsOverTimeGraph = function(options) {
            this.options = _.defaults(options, {
                sentimentScale: null,
                color: '#666',
                box: null,
                svg: null,
                className: 'tweets',
                flip: false,
                interactive: false
            });

            this.box = this.options.box;
            this.initCanvas();
        };


        _.extend(CountsOverTimeGraph.prototype, {
            horizontalScale: function(bins) {
                if (typeof this._horizontalScale === 'undefined') {
                    this._horizontalScale = d3.scale.ordinal()
                    .rangeBands([0, this.box.width()], 0, 0)
                    .domain(bins.map(function(d) {
                        return d.time;
                    }));
                }

                return this._horizontalScale;
            },

            countScale: function(data) {
                if (typeof this._countScale === 'undefined') {
                    this._countScale = d3.scale.linear()
                    .range([0, this.box.height()])
                    .domain([0, d3.max(data, function(d) {
                        return d.count;
                    })]);
                }

                return this._countScale;
            },

            transform: function() {
                var transform = arguments[0];
                var args = Array.prototype.slice.call(arguments, 1);

                var property = transform + '(' + args.join(',') + ')';
                return property;
            },

            initCanvas: function() {

                var transform;

                if (this.options.flip) {
                    transform = [
                    this.transform('scale', 1, -1),
                    this.transform('translate', this.box.left(), -this.box.bottom())
                    ].join(',');
                } else {
                    transform = this.transform('translate', this.box.left(), this.box.top())
                }

                this.canvas = this.options.svg.append('g')
                .classed(this.options.className, true)
                .attr('transform', transform)
                .attr('opacity', 0);
            },

            render: function(data) {
                var self = this;

                var horizontalScale = this.horizontalScale(data);
                var countScale = this.countScale(data);
                var brighterColor = d3.hsl(this.options.color).brighter();

                var bars = this.canvas.selectAll('rect.bar')
                .data(data)
                .enter().append('rect')
                .classed('bar', true)
                .attr('x', function(d) {
                    return Math.floor(horizontalScale(d.time));
                })
                .attr('width', Math.ceil(horizontalScale.rangeBand()))
                .attr('height', function(d) {
                    return Math.ceil(countScale(d.count));
                })
                .attr('fill', this.options.color);

                var secondaryBins = this.canvas.selectAll('.secondary.bin')
                .data(data)
                .enter().append('g')
                .classed('secondary bin', true)
                .attr('transform', function(d) {
                    return self.transform('translate', Math.floor(horizontalScale(d.time)), 0);
                });

                var sentimentColorScale = this.options.sentimentScale;

                var secondaries = secondaryBins.selectAll('rect')
                .data(function(d) {
                    return d.groups;
                })
                .enter().append('rect')
                .attr('width', Math.ceil(horizontalScale.rangeBand()))
                .attr('height', 0)
                .attr('y', 0)
                .attr('fill', function(d) {
                    return d3.hsl(sentimentColorScale(d.sentiment)).brighter();
                });

                if (this.options.interactive) {
                    bars.on('mouseover', function(d) {
                        d3.select(this)
                        .attr('fill', brighterColor);
                    })
                    .on('mouseout', function(d) {
                        d3.select(this)
                        .attr('fill', self.options.color);
                    });
                }

                this.canvas.transition()
                .attr('opacity', 1);
            },

            renderSecondary: function(data) {
                var countScale = this.countScale(data);

                var secondaryBins = this.canvas.selectAll('.secondary.bin')
                .data(data);

                secondaryBins.selectAll('rect')
                .data(function(d) {
                    return d.groups;
                })
                .transition()
                .duration(50)
                .attr('height', function(d) {
                    return Math.ceil(countScale(d.count));
                })
                .attr('y', function(d) {
                    return Math.floor(countScale(d.countAccum));
                });
            },

            removeSecondary: function() {
                this.canvas.selectAll('.secondary.bin').selectAll('rect')
                .transition()
                .attr('height', 0)
                .attr('y', 0);
            }
        });

        return CountsOverTimeGraph;
    });