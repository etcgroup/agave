define(['lib/d3', 'underscore', 'jquery', 'lib/bootstrap'],
    function(d3, _, $, bootstrap) {

        var Circular = function(options) {

            this.options = _.defaults(options, {
                thickness: 1,
                positiveColor: '#2e5f9b',
                negativeColor: '#ce2525',
                neutralColor: '#bfbfbf',
                maxDotRadius: 40,
                minDotRadius: 5,
                radius: 300,
                margin: 10,
                data: []
            });

            this.target = d3.select(this.options.target);

            this.width = this.height = this.options.radius * 2 + 2 * this.options.margin;
            this.data = this.options.data;
        }

        _.extend(Circular.prototype, {

            widget: function() {
                return "M0 0L-0.5 2L0.5 2Z";
            },

            render: function() {
//
//                this.data = _.filter(this.data, function(d) {
//                    return d.text.indexOf('RT') != 0;
//                });

                var self = this;

                //Build the angular scale
                var maxTime = d3.max(this.data, function(d) {
                    return d.creation;
                });
                var minTime= d3.min(this.data, function(d) {
                    return d.creation;
                });
                var theta = d3.scale.linear()
                .range([Math.PI / 2, -3 * Math.PI / 2])
                .domain([minTime, maxTime]);

                //Build the radial scale
                var maxtweet_count = d3.max(this.data, function(d) {
                    return d.tweet_count;
                });
                var mintweet_count = d3.min(this.data, function(d) {
                    return d.tweet_count;
                });
                var radial = d3.scale.log()
                .range([0, this.options.radius])
                .domain([maxtweet_count,mintweet_count]);

                //Build the sentiment scale
                var color = d3.scale.ordinal()
                .range(['negative-gradient', 'neutral-gradient', 'positive-gradient'])
                .domain([0, 1, 2]);

                //Build the retweet scale
                var maxRetweets = d3.max(this.data, function(d) {
                    return d.rt_count;
                });
                var minRetweets = d3.min(this.data, function(d) {
                    return d.rt_count;
                });
                var dotRadius = d3.scale.sqrt()
                .range([this.options.minDotRadius, this.options.maxDotRadius])
                .domain([minRetweets, maxRetweets]);

                //Build the main SVG object
                this.svg = this.target.append('svg')
                .attr('width', this.width)
                .attr('height', this.height);

                var defs = this.svg.append('svg:defs');

                this.insertGradient(defs, this.options.negativeColor, 'negative-gradient');
                this.insertGradient(defs, this.options.neutralColor, 'neutral-gradient');
                this.insertGradient(defs, this.options.positiveColor, 'positive-gradient');

                this.svg = this.svg.append('g')
                .attr('transform', this.transform('translate', this.options.margin, this.options.margin));

                //Build the outer border and background
                this.svg.append("circle")
                .attr('r', this.options.radius)
                .attr("transform", this.transform('translate', this.options.radius, this.options.radius))
                .classed('circular-border', true);

                this.svg.append("g")
                .attr('transform', this.transform('translate', this.options.radius, this.options.radius))
                .selectAll('.dot')
                .data(this.data)
                .enter()
                .append('path')
                //                .append('circle')
                //                .attr('r', '5')
                .attr('vector-effect', 'non-scaling-stroke')
                .attr('d', this.widget())
                .attr('fill', function(d) {
                    if ('sentiment' in d) {
                        return 'url(#' + color(d.sentiment) + ')';
                    } else {
                        return 'url(#neutral-gradient)';
                    }
                })
                .attr('transform', function(d, i) {
                    var scale = dotRadius(d.rt_count);

                    var r = radial(d.tweet_count);
                    var angle = theta(d.creation);

                    var x = r * Math.cos(angle);
                    var y = - r * Math.sin(angle);

                    angle = -angle * 180 / Math.PI;

                    return [
                    self.transform('translate', x, y),
                    self.transform('scale', scale),
                    self.transform('rotate', angle),
                    ].join(' ');
                })
                //                .attr('r', function(d, i) {
                //                    return dotRadius(d.rt_count);
                //                })
                //                .attr('fill', function(d, i) {
                //                    return color(d.sentiment);
                //                })
                //                .attr('transform', function(d, i) {
                //                    var r = radial(d.tweet_count);
                //                    var angle = theta(i);
                //
                //                    var x = r * Math.cos(angle);
                //                    var y = - r * Math.sin(angle);
                //                    return self.transform('translate', x, y);
                //                })
                .classed('dot', true)
                .append('title')
                .text(function(d) {
                    return "text: " + d.text + " [rt " + d.rt_count + "]";
                });
            },

            transform: function() {
                var transform = arguments[0];
                var args = Array.prototype.slice.call(arguments, 1);

                var property = transform + '(' + args.join(',') + ')';
                return property;
            },

            insertGradient: function(defs, color, id) {
                var gradient = defs.append("svg:radialGradient")
                .attr("id", id)
                .attr("cx", "50%")
                .attr("cy", "0%")
                .attr("r", "100%")
                .attr("fx", "50%")
                .attr("fy", "0%")
                .attr("spreadMethod", "pad");

                gradient.append("svg:stop")
                .attr("offset", "0%")
                .attr("stop-color", color)
                .attr("stop-opacity", 1);

                gradient.append("svg:stop")
                .attr("offset", "100%")
                .attr("stop-color", color)
                .attr("stop-opacity", 0);
            }
        });

        return Circular;

    });