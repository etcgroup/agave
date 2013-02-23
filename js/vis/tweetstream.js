define(['lib/d3', 'underscore', 'lib/rectangle'],
    function(d3, _, Rectangle) {

        /*
     * When far zoomed in, individual tweets are available.
     * Otherwise, aggregated data is provided (below).
     *
     * Aggregated Entity
     * Represents a bin of tweets at a particular time, grouped by sentiment
     * {
     *   //The time of the bin
     *   time: Date,
     *   //The total count of tweets in this bin
     *   count: #,
     *   //The tweets grouped by sentiment
     *   groups: [
     *      //The sentiment of the tweets in this group
     *      sentiment: #,
     *      //The total number of tweets in this group
     *      count: #,
     *      //Data about any echoes (retweets) of these tweets
     *      echoes: {
     *          //The total number of echoes (regardless of frame)
     *          count: #,
     *          //The amount of time over which the echoes span (regardless of frame)
     *          duration: seconds,
     *          //The binned echoes of this bin, in the current frame
     *          items: [
     *              {
     *                  //The time of this echo bin
     *                  time: Date,
     *                  //The size of the bin
     *                  count: #
     *              },
     *              ...
     *          ]
     *      },
     *      //Binned replies to this tweet group, grouped by sentiment
     *      replies: [
     *          {
     *              //The sentiment of this reply bin
     *              sentiment: #,
     *              //The number of tweets in this reply bin (regardless of frame)
     *              count: #,
     *              //The duration spanned by this bin (regardless of frame)
     *              duration: seconds,
     *              //The binned replies in the current frame
     *              items: [
     *                  {
     *                      //The time of this reply bin
     *                      time: Date,
     *                      //The number of replies in this bin
     *                      count: #
     *                  },
     *                  ...
     *              ]
     *          },
     *          ...
     *      },
     *      //Terms used in the tweets in this bin
     *      terms: {
     *          "#sb47": 23,
     *          "@nfl": 45,
     *          ...
     *      },
     *      //Users who produced tweets in this bin
     *      users: {
     *          "@nfl": 40,
     *          ...
     *      }
     *   ]
     * }
     *
     * The individual tweet structure is somewhat different.
     * A colon (:) indicates a new or altered field.
     * {
     *   //The id of this tweet
     * : id: ##
     *   //The id of the speaker
     * : user: #,
     *   //The text of the tweet
     * : text: "asdfasdfas",
     *   //The time of this tweet
     *   time: Date,
     *   //The sentiment of this tweet
     *   sentiment: #,
     *   //The collection of echoes of this tweet
     *   echoes: {
     *      //The total number of echoes (regardless of frame)
     *      count: #,
     *      //The total interval of all echoes (regardless of frame)
     *      duration: seconds,
     *      //The binned echoes of this tweet, in the current frame
     *      items: [
     *          {
     *              //The time of this echo bin
     *              time: Date,
     *              //The size of the bin
     *              count: #
     *          },
     *          ...
     *      ]
     *   },
     *   //Replies to this tweet, grouped by sentiment
     *   replies: [
     *      {
     *          //The sentiment of this reply group
     *          sentiment: #,
     *          //The number of replies in this group (regardless of frame)
     *          count: #,
     *          //The duration of replies by this bin (regardless of frame)
     *          duration: seconds,
     *          //The ids of replies in the current frame
     * :        items: [
     *              ##,
     *              ##,
     *              ...
     *          ]
     *      },
     *      ...
     *   },
     * }
     *
     * Raw echo data is provided in the following format:
     * {
     *   time: Date,
     *   count: #
     * }
     */

        var TweetStream = function(options) {
            this.options = _.defaults(options, {
                negativeColor: '#ce2525',
                neutralColor: '#ccc',
                positiveColor: '#2e5f9b',
                width: 700,
                height: 300,
                retweetHeight: 50,
                noiseHeight: 50,
                timeFrom: 0,
                timeTo: 1,
                interval: 0.1
            });

            this.target = d3.select(this.options.target);

            this.margin = {
                left: 20,
                right: 20,
                top: 20,
                bottom: 20
            }

            this.outerBox = new Rectangle({
                top: 0,
                left: 0,
                width: this.options.width,
                height: this.options.height
            });

            this.innerBox = new Rectangle({
                top: this.outerBox.top() + this.margin.top,
                left: this.outerBox.left() + this.margin.left,
                right: this.outerBox.width() - this.margin.right,
                bottom: this.outerBox.height() - this.margin.bottom
            });

            this.noiseBox = this.innerBox.extend({
                height: this.options.noiseHeight
            });

            this.retweetsBox = this.innerBox.extend({
                top: this.innerBox.bottom() - this.options.retweetHeight,
                height: this.options.retweetHeight
            });

            var originalsTopMargin = 5;
            var originalsBottomMargin = 5;

            this.originalsBox = this.innerBox.extend({
                top: this.noiseBox.bottom() + originalsTopMargin,
                bottom: this.retweetsBox.top() - originalsBottomMargin
            });

            this.timeFrom = this.options.timeFrom;
            this.timeTo = this.options.timeTo;
        }

        _.extend(TweetStream.prototype, {

            horizontalScale: function(bins) {
                if (typeof this._horizontalScale === 'undefined') {
                    this._horizontalScale = d3.scale.ordinal()
                    .rangeBands([0, this.innerBox.width()], 0, 0)
                    .domain(bins.map(function(d) {
                        return d.time;
                    }));
                //.range([0, this.width])
                //.domain([this.timeFrom, this.timeTo]);
                }

                return this._horizontalScale;
            },

            timeScale: function() {
                if (typeof this._timeScale === 'undefined') {
                    this._timeScale = d3.time.scale()
                    .range([0, this.innerBox.width()])
                    .domain([new Date(1000*this.timeFrom), new Date(1000*this.timeTo)]);
                }

                return this._timeScale;
            },

            noiseCountScale: function(noise) {
                if (typeof this._noiseCountScale === 'undefined') {
                    this._noiseCountScale = d3.scale.linear()
                    .range([0, this.noiseBox.height()])
                    .domain([0, d3.max(noise, function(d) {
                        return d.count;
                    })]);
                }

                return this._noiseCountScale;
            },

            retweetCountScale: function(retweets) {
                if (typeof this._retweetCountScale === 'undefined') {
                    this._retweetCountScale = d3.scale.linear()
                    .range([0, this.retweetsBox.height()])
                    .domain([0, d3.max(retweets, function(d) {
                        return d.count;
                    })]);
                }

                return this._retweetCountScale;
            },

            sentimentScale: function() {
                if (typeof this._sentimentScale === 'undefined') {
                    this._sentimentScale = d3.scale.ordinal()
                    .range([this.options.negativeColor, this.options.neutralColor, this.options.positiveColor])
                    .domain([-1, 0, 1]);
                }

                return this._sentimentScale;
            },

            originalCountScale: function() {
                if (typeof this._originalCountScale === 'undefined') {
                    this._originalCountScale = d3.scale.linear()
                    .range([0, this.originalsBox.height()])
                    .domain([0, 1]); //This domain will be normalized within each bin
                }

                return this._originalCountScale;
            },

            svg: function() {
                if (typeof this._svg === "undefined") {
                    this._svg = this.target.append('svg')
                    .attr('width', this.outerBox.width())
                    .attr('height', this.outerBox.height());
                }

                return this._svg;
            },

            transform: function() {
                var transform = arguments[0];
                var args = Array.prototype.slice.call(arguments, 1);

                var property = transform + '(' + args.join(',') + ')';
                return property;
            },

            renderOriginals: function(originals) {
                var self = this;

                var svg = this.svg();
                svg = svg.append('g')
                .attr('transform', this.transform('translate', this.originalsBox.left(), this.originalsBox.top()))
                .attr('opacity', 0);

                svg.append('rect')
                .attr('width', this.innerBox.width())
                .attr('height', this.originalsBox.height())
                .classed('original background', true);

                var horizontalScale = this.horizontalScale(originals);

                var bins = svg.selectAll('.bin')
                .data(originals)
                .enter().append('g')
                .classed('bin', true)
                .attr('transform', function(d) {
                    return self.transform('translate', Math.floor(horizontalScale(d.time)), 0);
                });

                var originalCountScale = this.originalCountScale();
                var sentimentColorScale = this.sentimentScale();

                bins.selectAll('rect')
                .data(function(d) {
                    //Sort the sentiment groups
                    d.groups.sort(function(group) {
                        return group.sentiment;
                    });

                    //We need offset values for each sentiment group
                    //so that we can stack the bars
                    var countPercentAccum = 0;
                    d.groups.forEach(function(group) {
                        group.countPercent = group.count / d.count;
                        group.countPercentAccum = countPercentAccum;
                        countPercentAccum += group.countPercent;
                    });
                    return d.groups;
                })
                .enter().append('rect')
                .attr('width', Math.ceil(horizontalScale.rangeBand()))
                .attr('height', function(d) {
                    return Math.ceil(originalCountScale(d.countPercent));
                })
                .attr('y', function(d) {
                    return Math.floor(originalCountScale(d.countPercentAccum));
                })
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

                svg.transition()
                .attr('opacity', 1);
            },

            renderNoise: function(noise) {
                var self = this;

                var noiseTransform = [
                this.transform('scale', 1, -1),
                this.transform('translate', this.noiseBox.left(), -this.noiseBox.bottom())
                ].join(',');

                var svg = this.svg();
                svg = svg.append('g')
                .attr('transform', noiseTransform)
                .attr('opacity', 0);

                //                svg.append('rect')
                //                .attr('width', this.noiseBox.width())
                //                .attr('height', this.noiseBox.height())
                //                .classed('noise background', true);

                var horizontalScale = this.horizontalScale(noise);

                var noiseCountScale = this.noiseCountScale(noise);

                var bars = svg.selectAll('rect.noise.bar')
                .data(noise)
                .enter().append('rect')
                .classed('noise bar', true)
                .attr('x', function(d) {
                    return Math.floor(horizontalScale(d.time));
                })
                .attr('width', Math.ceil(horizontalScale.rangeBand()))
                .attr('height', function(d) {
                    return Math.ceil(noiseCountScale(d.count));
                });

                svg.transition()
                .attr('opacity', 1);
            },

            renderRetweets: function(retweets) {
                var self = this;

                var svg = this.svg();
                svg = svg.append('g')
                .attr('transform', this.transform('translate', this.retweetsBox.left(), this.retweetsBox.top()))
                .attr('opacity', 0);

                svg.append('rect')
                .attr('width', this.retweetsBox.width())
                .attr('height', this.retweetsBox.height())
                .classed('retweet background', true);

                var horizontalScale = this.horizontalScale(retweets);

                var retweetCountScale = this.retweetCountScale(retweets);

                var bars = svg.selectAll('rect.retweets.bar')
                .data(retweets)
                .enter().append('rect')
                .classed('retweets bar', true)
                .attr('x', function(d) {
                    return Math.floor(horizontalScale(d.time));
                })
                .attr('width', Math.ceil(horizontalScale.rangeBand()))
                .attr('height', function(d) {
                    return Math.ceil(retweetCountScale(d.count));
                });

                svg.transition()
                .attr('opacity', 1);
            },

            renderBackground: function() {
                var svg = this.svg();

                svg.append('rect')
                .attr('width', this.outerBox.width())
                .attr('height', this.outerBox.height())
                .classed('main background', true);

                var timeScale = this.timeScale();
                var xAxis = d3.svg.axis()
                .scale(timeScale)
                .orient("bottom");

                svg.append("g")
                .attr("class", "x axis chart-label")
                .attr("transform", this.transform('translate', this.innerBox.left(), this.innerBox.bottom()))
                .call(xAxis);
                //this.noiseBox.left(), this.noiseBox.top(

                var fontHeight = 14;

                svg.append("text")
                .classed('noise chart-label', true)
                .attr('text-anchor', 'end')
                .attr('x', this.noiseBox.left())
                .attr('y', this.noiseBox.bottom() + fontHeight)
                .attr('transform', this.transform('rotate', 90, this.noiseBox.left(), this.noiseBox.bottom()))
                .text("noise");

                svg.append("text")
                .classed('retweets chart-label', true)
                .attr('x', this.retweetsBox.left())
                .attr('y', this.retweetsBox.top() + fontHeight)
                .attr('transform', this.transform('rotate', 90, this.retweetsBox.left(), this.retweetsBox.top()))
                .text("retweets");

                var originalsCenter = this.originalsBox.center();
                svg.append("text")
                .classed('originals chart-label', true)
                .attr('text-anchor', 'middle')
                .attr('x', this.originalsBox.left())
                .attr('y', originalsCenter.y + fontHeight)
                .attr('transform', this.transform('rotate', 90, this.originalsBox.left(), originalsCenter.y))
                .text("original tweets");
            },

            render: function() {
                this.renderBackground();
            }
        });

        return TweetStream;
    });
