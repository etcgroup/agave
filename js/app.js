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

            this.initQueryModels();
            this.initUI();

            this.initQueryPanel();

            this.initContextTimeline();
            this.initFocusTimeline();

            this.initTweetList();
            this.initDetailsPanel();

            this.windowResize();
        }

        /**
         * Set up the query object, based on the url.
         */
        App.prototype.initQueryModels = function () {
            this.query = {};

            var params = document.location.search;

            this.query.from = getParameterByName(params, 'from', SB_START) * 1000;
            this.query.to = getParameterByName(params, 'to', SB_END) * 1000;
            this.query.search = getParameterByName(params, 'search', null);
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
                .searchQuery(this.query.search)
                .utcOffsetMillis(utcOffsetMillis)
                .idealBinCount(200)
                .timeExtent([this.query.from, this.query.to])
                .onZoomChanged(function (extent) {

                    //When the timeline zoom/pan changes, we need to update the query object
                    self.query.from = extent[0];
                    self.query.to = extent[1];

                    //and update the url
                    self.updateUrl();
                });

            //Set the container and render
            this.focusTimeline.container(this.ui.focusTimeline.selector)
                .render();
        }

        /**
         * Set up the search box.
         */
        App.prototype.initQueryPanel = function () {
            this.ui.queryPanel = $('#queries');

            var queries = this.ui.queryPanel.find('.query');

            queries.each(function(index) {
                var ui = $(this);
                var query = new Query(ui);
            });

            var self = this;
        }

        /**
         * Set up the tweet list component
         */
        App.prototype.initTweetList = function () {

            this.ui.tweetList = $('#tweet-list');

            this.tweetList = new TweetList(this.ui.tweetList);
            //Load the tweets for the current query
            this.tweetList.update(this.query);
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
            //var search = this.ui.searchInput.val();
            //var from = this.query.from / 1000;
            //var to = this.query.to / 1000;

            //var state = {
            //    search: search,
            //    from: from,
            //    to: to
            //}

            //Fancy HTML5 history management
            //history.pushState(state, '', '?' + $.param(state));
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

        //Start the app
        window.app = new App();
    });
