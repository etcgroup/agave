define([
    'lib/d3',
    'underscore',
    'lib/rectangle',
    'vis/components/counts_over_time',
    'vis/components/sentiment_over_time'],
    function(d3, _, Rectangle, CountsOverTimeGraph, SentimentOverTimeGraph) {

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
                negativeColor: '#DB0000',
                neutralColor: '#b3b3b3',
                positiveColor: '#0071DB',
                noiseColor: '#666',
                retweetsColor: '#666',
                defaultBarState: 'normalized',
                width: 700,
                height: 300,
                retweetHeight: 50,
                noiseHeight: 50,
                timeFrom: 0,
                timeTo: 1
            });

            this.target = d3.select(this.options.target);
            this.timeFrom = this.options.timeFrom;
            this.timeTo = this.options.timeTo;
        }

        _.extend(TweetStream.prototype, {
            initializeComponents: function() {
                this.noiseGraph = new CountsOverTimeGraph({
                    color: this.options.noiseColor,
                    box: this.noiseBox,
                    svg: this.svg(),
                    className: 'noise',
                    flip: true,
                    interactive: true
                });

                this.retweetsGraph = new CountsOverTimeGraph({
                    sentimentScale: this.sentimentScale(),
                    color: this.options.retweetsColor,
                    box: this.retweetsBox,
                    className: 'retweets',
                    svg: this.svg(),
                    interactive: true
                });

                this.originalsGraph = new SentimentOverTimeGraph({
                    sentimentScale: this.sentimentScale(),
                    box: this.originalsBox,
                    svg: this.svg(),
                    className: 'originals',
                    defaultBarState: this.options.defaultBarState,
                    interactive: true
                });

                this.originalsGraph.on('mouseover', this.originalFocusActivated, this);
                this.originalsGraph.on('mouseout', this.originalFocusDeactivated, this);
            },

            initializeBoxes: function() {
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
            },

            timeScale: function() {
                if (typeof this._timeScale === 'undefined') {
                    this._timeScale = d3.time.scale()
                    .range([0, this.innerBox.width()])
                    .domain([new Date(1000*this.timeFrom), new Date(1000*this.timeTo)]);
                }

                return this._timeScale;
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

            renderNoise: function(noise) {
                this.noiseGraph.render(noise);
            },

            renderRetweets: function(retweets) {
                this.retweetsGraph.render(retweets);
            },

            renderOriginals: function(originals) {
                this.originalsGraph.render(originals);
            },

            renderRetweetHistograms: function(retweetHistograms) {
                this.originalsGraph.updateRetweetHistograms(retweetHistograms);
            },

            originalFocusActivated: function(retweetHistogram) {
                this.retweetsGraph.renderSecondary(retweetHistogram);
            },

            originalFocusDeactivated: function() {
                this.retweetsGraph.removeSecondary();
            },

            sentimentScale: function() {
                if (typeof this._sentimentScale === 'undefined') {
                    this._sentimentScale = d3.scale.ordinal()
                    .range([this.options.negativeColor, this.options.neutralColor, this.options.positiveColor])
                    .domain([-1, 0, 1]);
                }

                return this._sentimentScale;
            },

            renderBackground: function() {
                var svg = this.svg();

                //Render a background
                svg.append('rect')
                .attr('width', this.outerBox.width())
                .attr('height', this.outerBox.height())
                .classed('main background', true);

                //Construct the x axis
                var timeScale = this.timeScale();
                var xAxis = d3.svg.axis()
                .scale(timeScale)
                .orient("bottom");

                //Render the x axis
                svg.append("g")
                .attr("class", "x axis chart-label")
                .attr("transform", this.transform('translate', this.innerBox.left(), this.innerBox.bottom()))
                .call(xAxis);
            },

            renderToggleButton: function() {
                var toggleButtonOffset = {
                    top: 14,
                    left: 15 + 3
                };

                this.chartAlignToggle = this.target.append('div')
                .classed('graph-align-toggle', true)
                .style('top', (this.originalsBox.top() + toggleButtonOffset.top) + "px")
                .style('left', (this.originalsBox.left() - toggleButtonOffset.left) + "px");

                this.chartAlignToggle.append('i')
                .classed('icon-white', true);

                var startsNormalized = this.originalsGraph.areBarsNormalized();
                this.chartAlignToggle.select('i')
                .classed('icon-align-left', !startsNormalized)
                .classed('icon-align-justify', startsNormalized);

                var self = this;
                this.chartAlignToggle.on('click', function() {
                    var toNormalize = !self.originalsGraph.areBarsNormalized();
                    self.originalsGraph.setBarsNormalized(toNormalize);

                    self.chartAlignToggle.select('i')
                    .classed('icon-align-left', !toNormalize)
                    .classed('icon-align-justify', toNormalize);
                });
            },

            renderSectionLabels: function() {
                var fontHeight = 14;

                var svg = this.svg();

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
                this.initializeBoxes();
                this.renderBackground();
                this.initializeComponents();
                this.renderSectionLabels();
                this.renderToggleButton();
            }
        });

        return TweetStream;
    });
