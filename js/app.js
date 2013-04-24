define(['jquery', 'underscore',
    'lib/bootstrap',
    'vis/tweet_timeline',
    'vis/tweet_list'],
    function($, _, bootstrap, TweetTimeline, TweetList) {

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
        var App = function() {
            this.initQuery();
            this.initUI();
            this.initSearchBox();
            this.initTimeline();
            this.initTweetList();

            this.windowResize();
        }

        /**
             * Set up the query object, based on the url.
             */
        App.prototype.initQuery = function() {
            this.query = {};

            var params = document.location.search;

            this.query.from = getParameterByName(params, 'from', SB_START) * 1000;
            this.query.to = getParameterByName(params, 'to', SB_END) * 1000;
            this.query.search = getParameterByName(params, 'search', null);
        }
        /**
             * Grab some regions for rendering UI components
             */
        App.prototype.initUI = function() {
            this.ui = {};

            this.ui.searchInput = $('#search-query-input');
            this.ui.searchForm = $('#search-form');
            this.ui.timeline = $('#tweet-timeline');
            this.ui.tweetList = $('#tweet-list');
        }

        /**
             * Set up the main timeline visualization.
             */
        App.prototype.initTimeline = function() {
            this.timeline = new TweetTimeline();

            var self = this;

            this.timeline.width(this.ui.timeline.width())
            .height(this.ui.timeline.height())
            .retweetHeight(70)
            .noiseHeight(70)
            .noiseThreshold(min_important_rt)
            .searchQuery(this.query.search)
            .utcOffsetMillis(utcOffsetMillis)
            .idealBinCount(200)
            .timeExtent([this.query.from, this.query.to])
            .onZoomChanged(function(extent) {

                //When the timeline zoom/pan changes, we need to update the query object
                self.query.from = extent[0];
                self.query.to = extent[1];

                //and update the url
                self.updateUrl();
            });

            //Set the container and render
            this.timeline.container(this.ui.timeline.selector)
            .render();
        }

        /**
             * Set up the search box.
             */
        App.prototype.initSearchBox = function() {
            var self = this;

            //The initial value comes from the query object
            this.ui.searchInput.val(this.query.search);

            //When someone presses enter in the search box, update.
            this.ui.searchForm.on('submit', function(e) {

                self.updateUrl();
                //Major TODO: update all the other components given the new search term

                //Prevent form submission
                e.preventDefault();
                return false;
            });
        }

        /**
             * Set up the tweet list component
             */
        App.prototype.initTweetList = function() {
            this.tweetList = new TweetList(this.ui.tweetList);
            //Load the tweets for the current query
            this.tweetList.update(this.query);
        }

        App.prototype.windowResize = function() {
            var self = this;
            $(window).on('resize', function() {
                self.timeline
                .width(self.ui.timeline.width())
                .height(self.ui.timeline.height())
                .update();
            });
        }

        /**
             * Update the url based on the current query.
             */
        App.prototype.updateUrl = function() {
            var search = this.ui.searchInput.val();
            var from = this.query.from / 1000;
            var to = this.query.to / 1000;

            var state = {
                search: search,
                from: from,
                to: to
            }

            //Fancy HTML5 history management
            history.pushState(state, '', '?' + $.param(state));
        }

        /**
         * Utility for extracting url parameters. Obtained from SO probably.
         */
        function getParameterByName(queryString, name, defaultValue)
        {
            name = name.replace(/[\[]/, "\\\[").replace(/[\]]/, "\\\]");
            var regexS = "[\\?&]" + name + "=([^&#]*)";
            var regex = new RegExp(regexS);
            var results = regex.exec(queryString);
            if(results == null)
                return defaultValue;
            else
                return decodeURIComponent(results[1].replace(/\+/g, " "));
        }

        //Start the app
        window.app = new App();
    });
