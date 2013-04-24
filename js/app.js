define(['jquery', 'underscore',
    'lib/bootstrap',
    'util/query',
    'components/tweet_timeline',
    'components/tweet_list'],
    function ($, _, bootstrap, Query, TweetTimeline, TweetList) {

        //        //Old config for the SAGAwards data
        //        var from = 1359327600*1000;
        //        var to = 1359334800*1000;
        //        var interval = 60*2*1000;
        //        var min_important_rt = 1;

        //Default time interval (UTC seconds) for the superbowl data set
        var SB_START = 1359932400;
        var SB_END = 1359952200;
        //Minimum number of retweets to be considered important
        var min_important_rt = 1;
        //The UTC offset for Eastern Time (during the Super Bowl)
        var utcOffsetMillis = -5 * 60 * 60 * 1000;

        /**
         * This class orchestrates the overall setup of the application.
         */
        var App = function () {

            this.initUI();

            this.initQueries();

            this.initContextTimeline();
            this.initFocusTimeline();

            this.initTweetList();
            this.initDetailsPanel();

            this.windowResize();
        }

        /**
         * Set up the query object, based on the url.
         */
        App.prototype.initQueries = function () {
            this.queries = [];
            this.interval = {};

            var params = document.location.search;

            this.interval.from = getParameterByName(params, 'from', SB_START) * 1000;
            this.interval.to = getParameterByName(params, 'to', SB_END) * 1000;

            this.ui.queryPanel = $('#queries');

            var self = this;
            this.ui.queryPanel.find('.query')
                .each(function (index) {
                    var data = {};

                    var view = getParameterByName(params, parameterName('view', index), null);
                    var search = getParameterByName(params, parameterName('search', index), null);
                    var author = getParameterByName(params, parameterName('author', index), null);
                    var rt = getParameterByName(params, parameterName('rt', index), null);
                    var min_rt = getParameterByName(params, parameterName('min_rt', index), null);
                    var sentiment = getParameterByName(params, parameterName('sentiment', index), null);

                    if (view !== null) data.view = view;
                    if (search !== null) data.search = search;
                    if (author !== null) data.author = author;
                    if (rt !== null) data.rt = rt;
                    if (min_rt !== null) data.min_rt = min_rt;
                    if (sentiment !== null) data.sentiment = sentiment;

                    var ui = $(this);
                    var query = new Query(ui, data);

                    query.on('update', $.proxy(self.queryUpdated, self));
                    query.on('view-change', $.proxy(self.queryViewChanged, self));

                    self.queries.push(query);
                });

        }

        /**
         * Grab some regions for rendering UI components
         */
        App.prototype.initUI = function () {
            this.ui = {};

            this.ui.explorer = $('#explorer');
            this.ui.collaborator = $('#collaborator');

        }

        /**
         * Set up the small context timeline visualization.
         */
        App.prototype.initContextTimeline = function () {
            this.ui.overviewTimeline = $('#tweet-overview');
        }

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
                .noiseThreshold(min_important_rt)
//                .searchQuery(this.query.search)
                .utcOffsetMillis(utcOffsetMillis)
                .idealBinCount(200)
                .timeExtent([this.interval.from, this.interval.to])
                .onZoomChanged($.proxy(self.zoomChanged, self));

            //Set the container and render
            this.focusTimeline.container(this.ui.focusTimeline.selector)
                .render();
        }

        /**
         * Set up the tweet list component
         */
        App.prototype.initTweetList = function () {

            this.ui.tweetList = $('#tweet-list');

            this.tweetList = new TweetList(this.ui.tweetList);
            //Load the tweets for the current query
//            this.tweetList.update(this.query);
        }

        App.prototype.initDetailsPanel = function () {
            this.ui.detailsPanel = $('#details');
        }

        App.prototype.windowResize = function () {
            var self = this;
            $(window).on('resize', function () {
                self.focusTimeline
                    .width(self.ui.focusTimeline.width())
                    .height(self.ui.focusTimeline.height())
                    .update();
            });
        }

        /**
         * Update the url based on the current query.
         */
        App.prototype.updateUrl = function () {
            var params = {
                from: Math.round(this.interval.from / 1000),
                to: Math.round(this.interval.to / 1000)
            };

            this.queries.forEach(function (query, index) {
                for (var key in query.data) {
                    params[parameterName(key, index)] = query.data[key];
                }
            });

            //Fancy HTML5 history management
            history.pushState(params, '', '?' + $.param(params));
        }


        App.prototype.queryUpdated = function (query) {
            this.updateUrl();
        }

        App.prototype.queryViewChanged = function (query) {
            this.updateUrl();
        }

        App.prototype.zoomChanged = function (extent) {
            //When the timeline zoom/pan changes, we need to update the query object
            this.interval.from = extent[0];
            this.interval.to = extent[1];

            //and update the url
            this.updateUrl();
        }

        /**
         * Utility for extracting url parameters. Obtained from SO probably.
         */
        function getParameterByName(queryString, name, defaultValue) {
            name = name.replace(/[\[]/, "\\\[").replace(/[\]]/, "\\\]");
            var regexS = "[\\?&]" + name + "=([^&#]*)";
            var regex = new RegExp(regexS);
            var results = regex.exec(queryString);
            if (results == null)
                return defaultValue;
            else
                return decodeURIComponent(results[1].replace(/\+/g, " "));
        }

        var PARAMETER_NAME_MAP = {
            view: 'v',
            search: 'q',
            author: 'a',
            rt: 'r',
            min_rt: 'm',
            sentiment: 'f'
        };

        /**
         * Given a nice parameter name (i.e. 'view') and
         * the query index (1, 2), generate the short url name.
         *
         * @param name
         * @param queryIndex
         */
        function parameterName(name, queryIndex) {
            return PARAMETER_NAME_MAP[name] + queryIndex.toString();
        }

        //Start the app
        window.app = new App();
    });
