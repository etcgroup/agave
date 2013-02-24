define(['lib/d3', 'underscore'],
    function(d3, _) {

        var CountsOverTimeGraph = function(options) {
            this.options = _.defaults(options, {
                color: '#666',
                box: null,
                svg: null,
                className: 'tweets',
                flip: false,
                interactive: false
            });

            this.svg = this.options.svg;
            this.box = this.options.box;
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

            render: function(data) {
                var self = this;
                var transform;

                if (this.options.flip) {
                    transform = [
                    this.transform('scale', 1, -1),
                    this.transform('translate', this.box.left(), -this.box.bottom())
                    ].join(',');
                } else {
                    transform = this.transform('translate', this.box.left(), this.box.top())
                }

                var svg = this.svg;
                svg = svg.append('g')
                .classed(this.options.className, true)
                .attr('transform', transform)
                .attr('opacity', 0);

                var horizontalScale = this.horizontalScale(data);
                var countScale = this.countScale(data);
                var colorHSL = d3.hsl(this.options.color);

                var bars = svg.selectAll('rect.bar')
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

                if (this.options.interactive) {
                    bars.on('mouseover', function(d) {
                        d3.select(this)
                        .attr('fill', colorHSL.brighter());
                    })
                    .on('mouseout', function(d) {
                        d3.select(this)
                        .attr('fill', self.options.color);
                    });
                }
                svg.transition()
                .attr('opacity', 1);
            }
        });

        return CountsOverTimeGraph;
    });