define(function (require) {

        //Using long-form syntax because there are soooo many dependencies
        var $ = require('jquery');
        var _ = require('underscore');
        var urls = require('util/urls');
        var Interval = require('model/interval');
        var Query = require('model/query');
        var QueryControls = require('components/query_controls');
        var TweetTimeline = require('components/tweet_timeline');
        var TweetList = require('components/tweet_list');
        var OverviewTimeline = require('components/overview_timeline');
        var API = require('util/api');

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
        App.prototype.start = function () {
            this.api = new API();

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

            //Parse the url
            var params = urls.parse();

            //Initialize the interval -- multiplying by 1000 to convert from url times (seconds) to ms
            this.interval = new Interval({
                from: params.get('from', this.config.defaults.from) * 1000,
                to: params.get('to', this.config.defaults.to) * 1000
            });

            //Find the queries box
            this.ui.queryPanel = $('#queries');

            //The query collection
            this.queries = [];

            //One query model per query control
            var self = this;
            this.ui.queryPanel.find('.query').each(function (index) {
                var id = index;

                //Build a new query model from the URL
                var query = new Query({
                    id: id,
                    view: params.get_at('view', id, null),
                    search: params.get_at('search', id, null),
                    author: params.get_at('author', id, null),
                    rt: params.get_at('rt', id, null),
                    min_rt: params.get_at('min_rt', id, null),
                    sentiment: params.get_at('sentiment', id, null)
                });

                //Save the query in our list
                self.queries.push(query);

                //Go ahead and set up the query view at the same time
                var ui = $(this);

                //Pass the model and target along to the view
                var view = new QueryControls({
                    model: query,
                    into: ui
                });

                //When the model changes, we need to know
                query.on('update', $.proxy(self.queryUpdated, self));
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

            this.overviewTimeline = new OverviewTimeline({
                into: this.ui.overviewTimeline,
                api: this.api,
                queries: this.queries,
                interval: this.interval,
                from: this.config.overview_from * 1000,
                to: this.config.overview_to * 1000,
                binSize: this.config.overview_bin_size * 1000,
                utcOffset: this.config.utc_offset_millis
            });

            this.overviewTimeline.render();
        };

        /**
         * Set up the larger focus timeline visualization.
         */
        App.prototype.initFocusTimeline = function () {
//            this.ui.focusTimeline = $('#tweet-timeline');
//
//            this.focusTimeline = new TweetTimeline();
//
//            var self = this;
//
//            this.focusTimeline.width(this.ui.focusTimeline.width())
//                .height(this.ui.focusTimeline.height())
//                .retweetHeight(70)
//                .noiseHeight(70)
//                .utcOffsetMillis(this.config.utc_offset_millis)
//                .idealBinCount(200)
//                .timeExtent([this.interval.from(), this.interval.to()])
//                .onZoomChanged($.proxy(self.zoomChanged, self));
//
//            //Set the container and render
//            this.focusTimeline.container(this.ui.focusTimeline.selector)
//                .render();
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
//                self.focusTimeline
//                    .width(self.ui.focusTimeline.width())
//                    .height(self.ui.focusTimeline.height())
//                    .update();
            });
        };

        /**
         * Update the url based on the current query.
         */
        App.prototype.updateUrl = function () {
            //Get the basic parameters
            var params = {
                from: Math.round(this.interval.from() / 1000),
                to: Math.round(this.interval.to() / 1000)
            };

            //Get the query data objects
            var query_data = this.queries.map(function (query) {
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
            this.interval.from(extent[0]);
            this.interval.to(extent[1]);

            //and update the url
            this.updateUrl();
        };

        return App;
    });
