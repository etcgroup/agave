define(['lib/d3', 'underscore'],
    function(d3, _) {

        var SentimentOverTimeGraph = function(options) {
            this.options = _.defaults(options, {
                negativeColor: '#ce2525',
                neutralColor: '#ccc',
                positiveColor: '#2e5f9b',
                box: null,
                svg: null,
                className: 'tweets',
                defaultBarSate: 'normalized'
            });

            this.svg = this.options.svg;
            this.box = this.options.box;

            this.barNormState = this.options.defaultBarState;
        }

        _.extend(SentimentOverTimeGraph.prototype, {
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

                var svg = this.svg;
                svg = svg.append('g')
                .attr('transform', this.transform('translate', this.box.left(), this.box.top()))
                .attr('opacity', 0);

                var horizontalScale = this.horizontalScale(data);

                var bins = svg.selectAll('.bin')
                .data(data)
                .enter().append('g')
                .classed('bin', true)
                .attr('transform', function(d) {
                    return self.transform('translate', Math.floor(horizontalScale(d.time)), 0);
                });

                var sentimentColorScale = this.sentimentScale();

                var buckets = bins.selectAll('rect')
                .data(function(d) {
                    //Sort the sentiment groups
                    d.groups.sort(function(group) {
                        return group.sentiment;
                    });

                    //We need offset values for each sentiment group
                    //so that we can stack the bars
                    var countPercentAccum = 0;
                    var countAccum = 0;
                    d.groups.forEach(function(group) {
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
                })
                .on('mouseover', function(d) {
                    var color = d3.hsl(sentimentColorScale(d.sentiment));
                    d3.select(this)
                    .attr('fill', color.brighter());
                })
                .on('mouseout', function(d) {
                    d3.select(this)
                    .attr('fill', sentimentColorScale(d.sentiment));
                });

                this.maxCount = d3.max(data, function(d) {
                    return d.count;
                });

                this._setSelectedBarsNormalized(buckets, this.areBarsNormalized());

                svg.transition()
                .attr('opacity', 1);
            },

            areBarsNormalized: function() {
                return this.barNormState === 'normalized';
            },

            setBarsNormalized: function(toNormalize) {
                this._setSelectedBarsNormalized(this.svg.selectAll('.bin rect').transition(), toNormalize);
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
