define(['lib/d3', 'underscore', 'backbone'],
    function(d3, _, Backbone) {

        var SentimentOverTimeGraph = function(options) {
            this.options = _.defaults(options, {
                negativeColor: '#ce2525',
                neutralColor: '#ccc',
                positiveColor: '#2e5f9b',
                box: null,
                svg: null,
                className: 'tweets',
                defaultBarSate: 'normalized',
                interactive: false
            });

            this.box = this.options.box;

            this.barNormState = this.options.defaultBarState;

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
            sentimentScale: function() {
                if (typeof this._sentimentScale === 'undefined') {
                    this._sentimentScale = d3.scale.ordinal()
                    .range([this.options.negativeColor, this.options.neutralColor, this.options.positiveColor])
                    .domain([-1, 0, 1]);
                }

                return this._sentimentScale;
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

                var bins = this.canvas.selectAll('.bin')
                .data(data)
                .enter().append('g')
                .classed('bin', true)
                .attr('transform', function(d) {
                    return self.transform('translate', Math.floor(horizontalScale(d.time)), 0);
                });

                var sentimentColorScale = this.sentimentScale();

                var buckets = bins.selectAll('rect')
                .data(function(d, i) {
                    //Sort the sentiment groups
                    d.groups.sort(function(group) {
                        return group.sentiment;
                    });

                    //We need offset values for each sentiment group
                    //so that we can stack the bars
                    var countPercentAccum = 0;
                    var countAccum = 0;
                    d.groups.forEach(function(group) {
                        group.time = d.time;
                        group.bin_index = i;
                        group.countPercent = group.count / d.count;
                        group.countPercentAccum = countPercentAccum;
                        group.countAccum = countAccum;
                        countPercentAccum += group.countPercent;
                        countAccum += group.count;
                    });
                    return d.groups;
                })
                .enter().append('rect')
                .attr('width', Math.ceil(horizontalScale.rangeBand()))
                .attr('fill', function(d) {
                    return sentimentColorScale(d.sentiment);
                });

                if (this.options.interactive) {
                    buckets.on('mouseover', function(d, i) {
                        var color = d3.hsl(sentimentColorScale(d.sentiment));
                        d3.select(this)
                        .attr('fill', color.brighter());

                        var rtHists = self.getRetweetHistogramFor(d.time, d.bin_index, d.sentiment);
                        if (rtHists) {
                            self.trigger('mouseover', rtHists);
                        }
                    })
                    .on('mouseout', function(d) {
                        d3.select(this)
                        .attr('fill', sentimentColorScale(d.sentiment));

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

            updateRetweetHistograms: function(retweetHistograms) {
                this.retweetHistograms = retweetHistograms;
            },

            getRetweetHistogramFor: function(time, index, sentiment) {
                if (this.retweetHistograms && index in this.retweetHistograms) {
                    var hist = this.retweetHistograms[index];
                    if (typeof sentiment !== 'undefined') {
                        hist = _.map(hist, function(bin) {

                            var match = _.find(bin.groups, function(group) {
                                return group.sentiment == sentiment;
                            });

                            return match || 0;
                        });
                    }
                    console.log(hist[0]);
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
