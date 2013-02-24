define(['lib/d3', 'underscore', 'backbone'],
    function(d3, _, Backbone) {

        var SentimentOverTimeGraph = function(options) {
            this.options = _.defaults(options, {
                sentimentScale: null,
                box: null,
                svg: null,
                className: 'tweets',
                defaultBarSate: 'normalized',
                interactive: false
            });

            this.box = this.options.box;

            this.barNormState = this.options.defaultBarState;
            this.sentimentScale = this.options.sentimentScale;
            this.initCanvas();
        }

        _.extend(SentimentOverTimeGraph.prototype, Backbone.Events, {

            initCanvas: function() {
                this.canvas = this.options.svg.append('g')
                .attr('transform', this.transform('translate', this.box.left(), this.box.top()))
                .classed(this.options.className, true)
                .attr('opacity', 0);
            },

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

            countScale: function() {
                if (typeof this._countScale === 'undefined') {
                    this._countScale = d3.scale.linear()
                    .range([0, this.box.height()])
                    .domain([0, 1]); //This domain will be normalized within each bin
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

                var horizontalScale = this.horizontalScale(data);

                this.prepareSentimentGroupedBins(data);

                var bins = this.canvas.selectAll('.bin')
                .data(data)
                .enter().append('g')
                .classed('bin', true)
                .attr('transform', function(d) {
                    return self.transform('translate', Math.floor(horizontalScale(d.time)), 0);
                });

                var sentimentColorScale = this.sentimentScale;

                var buckets = bins.selectAll('rect')
                .data(function(d) {
                    return d.groups;
                })
                .enter().append('rect')
                .attr('width', Math.ceil(horizontalScale.rangeBand()))
                .attr('fill', function(d) {
                    return sentimentColorScale(d.sentiment);
                });

                if (this.options.interactive) {
                    bins.on('mouseover', function(d, i) {
                        d3.select(this).selectAll('rect')
                        .attr('fill', function(group) {
                            return d3.hsl(sentimentColorScale(group.sentiment)).brighter();
                        });

                        var rtHists = self.getRetweetHistogramFor(d.time, i);
                        if (rtHists) {
                            self.trigger('mouseover', rtHists);
                        }
                    })
                    .on('mouseout', function(d) {
                        d3.select(this).selectAll('rect')
                        .attr('fill', function(group) {
                            return sentimentColorScale(group.sentiment);
                        });

                        self.trigger('mouseout');
                    });
                }

                this.maxCount = d3.max(data, function(d) {
                    return d.count;
                });

                this._setSelectedBarsNormalized(buckets, this.areBarsNormalized());

                this.canvas.transition()
                .attr('opacity', 1);
            },

            prepareSentimentGroupedBins: function(sentimentGroupedBins) {
                _.each(sentimentGroupedBins, function(bin) {
                    //Sort the sentiment groups
                    bin.groups.sort(function(group) {
                        return group.sentiment;
                    });

                    //We need offset values for each sentiment group
                    //so that we can stack the bars
                    var countPercentAccum = 0;
                    var countAccum = 0;
                    bin.groups.forEach(function(group) {
                        group.countPercent = group.count / bin.count;
                        group.countPercentAccum = countPercentAccum;
                        group.countAccum = countAccum;
                        countPercentAccum += group.countPercent;
                        countAccum += group.count;
                    });
                });
            },

            updateRetweetHistograms: function(retweetHistograms) {
                var self = this;
                _.each(retweetHistograms, function(histogram) {
                    self.prepareSentimentGroupedBins(histogram);
                });

                this.retweetHistograms = retweetHistograms;
            },

            getRetweetHistogramFor: function(time, index, sentiment) {
                if (this.retweetHistograms && index in this.retweetHistograms) {
                    var hist = this.retweetHistograms[index];
                    return hist;
                }
                return null;
            },

            areBarsNormalized: function() {
                return this.barNormState === 'normalized';
            },

            setBarsNormalized: function(toNormalize) {
                this._setSelectedBarsNormalized(this.canvas.selectAll('.bin rect').transition(), toNormalize);
            },

            _setSelectedBarsNormalized: function(selection, toNormalize) {
                var countScale = this.countScale()

                var domainMax = (toNormalize ? 1 : this.maxCount);
                countScale.domain([0, domainMax]);

                if (toNormalize) {
                    selection
                    .attr('height', function(d) {
                        return Math.ceil(countScale(d.countPercent));
                    })
                    .attr('y', function(d) {
                        return Math.floor(countScale(d.countPercentAccum));
                    });
                } else {
                    countScale.domain([0, this.maxCount]);
                    selection
                    .attr('height', function(d) {
                        return Math.ceil(countScale(d.count));
                    })
                    .attr('y', function(d) {
                        return Math.floor(countScale(d.countAccum));
                    });
                }

                this.barNormState = (toNormalize ? 'normalized' : 'absolute');
            }
        });

        return SentimentOverTimeGraph;
    });
