define(['jquery', 'underscore',
    'lib/bootstrap',
    'util/urls',
    'components/query_controls',
    'components/tweet_timeline',
    'components/tweet_list'],
    function ($, _, bootstrap, urls, QueryControls, TweetTimeline, TweetList) {

        /**
         * This class orchestrates the overall setup of the application.
         *
         * @param config
         */
        var App = function (config) {
            this.config = config;
        };

        /**
         * Start the application.
         */
        App.prototype.start = function() {
            this.initUI();
            this.initQueries();

            this.initContextTimeline();
            this.initFocusTimeline();

            this.initTweetList();
            this.initDetailsPanel();

            this.windowResize();
        };

        /**
         * Set up the query object, based on the url.
         */
        App.prototype.initQueries = function () {
            this.queries = [];
            this.interval = {};

            var params = urls.parse();

            this.interval.from = params.get('from', this.config.defaults.from) * 1000;
            this.interval.to = params.get('to', this.config.defaults.to) * 1000;

            this.ui.queryPanel = $('#queries');

            var self = this;
            this.ui.queryPanel.find('.query')
                .each(function (index) {
                    var data = {};

                    var view = params.get_at('view', index, null);
                    var search = params.get_at('search', index, null);
                    var author = params.get_at('author', index, null);
                    var rt = params.get_at('rt', index, null);
                    var min_rt = params.get_at('min_rt', index, null);
                    var sentiment = params.get_at('sentiment', index , null);

                    if (view !== null) {
                        data.view = view;
                    }
                    if (search !== null) {
                        data.search = search;
                    }
                    if (author !== null) {
                        data.author = author;
                    }
                    if (rt !== null) {
                        data.rt = rt;
                    }
                    if (min_rt !== null) {
                        data.min_rt = min_rt;
                    }
                    if (sentiment !== null) {
                        data.sentiment = sentiment;
                    }

                    var ui = $(this);
                    var query = new QueryControls(ui, data);

                    query.on('update', $.proxy(self.queryUpdated, self));
                    query.on('view-change', $.proxy(self.queryViewChanged, self));

                    self.queries.push(query);
                });

        };

        /**
         * Grab some regions for rendering UI components
         */
        App.prototype.initUI = function () {
            this.ui = {};

            this.ui.explorer = $('#explorer');
            this.ui.collaborator = $('#collaborator');

        };

        /**
         * Set up the small context timeline visualization.
         */
        App.prototype.initContextTimeline = function () {
            this.ui.overviewTimeline = $('#tweet-overview');
        };

        /**
         * Set up the larger focus timeline visualization.
         */
        App.prototype.initFocusTimeline = function () {
            this.ui.focusTimeline = $('#tweet-timeline');

            this.focusTimeline = new TweetTimeline();

            var self = this;

            this.focusTimeline.width(this.ui.focusTimeline.width())
                .height(this.ui.focusTimeline.height())
                .retweetHeight(70)
                .noiseHeight(70)
                .utcOffsetMillis(this.config.utc_offset_millis)
                .idealBinCount(200)
                .timeExtent([this.interval.from, this.interval.to])
                .onZoomChanged($.proxy(self.zoomChanged, self));

            //Set the container and render
            this.focusTimeline.container(this.ui.focusTimeline.selector)
                .render();
        };

        /**
         * Set up the tweet list component
         */
        App.prototype.initTweetList = function () {

            this.ui.tweetList = $('#tweet-list');

            this.tweetList = new TweetList(this.ui.tweetList);
            //Load the tweets for the current query
//            this.tweetList.update(this.query);
        };

        App.prototype.initDetailsPanel = function () {
            this.ui.detailsPanel = $('#details');
        };

        App.prototype.windowResize = function () {
            var self = this;
            $(window).on('resize', function () {
                self.focusTimeline
                    .width(self.ui.focusTimeline.width())
                    .height(self.ui.focusTimeline.height())
                    .update();
            });
        };

        /**
         * Update the url based on the current query.
         */
        App.prototype.updateUrl = function () {
            //Get the basic parameters
            var params = {
                from: Math.round(this.interval.from / 1000),
                to: Math.round(this.interval.to / 1000)
            };

            //Get the query data objects
            var query_data = this.queries.map(function(query) {
                return query.data;
            });

            urls.update_url(params, query_data);
        };

        App.prototype.queryUpdated = function (query) {
            this.updateUrl();
        };

        App.prototype.queryViewChanged = function (query) {
            this.updateUrl();
        };

        App.prototype.zoomChanged = function (extent) {
            //When the timeline zoom/pan changes, we need to update the query object
            this.interval.from = extent[0];
            this.interval.to = extent[1];

            //and update the url
            this.updateUrl();
        };

        return App;
    });
