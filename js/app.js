define(['jquery', 'underscore',
    'vis/tweet_timeline',
    'vis/tweet_list'],
    function($, _, TweetTimeline, TweetList) {
        //        //For the SAGAwards data
        //        var from = 1359327600*1000;
        //        var to = 1359334800*1000;
        //        var interval = 60*2*1000;
        //        var min_important_rt = 1;

        var SB_START = 1359932400;
        var SB_END = 1359952200;
        var min_important_rt = 1;
        var utcOffsetMillis = -5 * 60 * 60 * 1000;


        var App = function() {
            this.initQuery();
            this.initUI();
            this.initSearchBox();
            this.initTimeline();
            this.initTweetList();
        }

        _.extend(App.prototype, {
            initQuery: function() {
                this.query = {};

                var params = document.location.search;

                this.query.from = getParameterByName(params, 'from', SB_START) * 1000;
                this.query.to = getParameterByName(params, 'to', SB_END) * 1000;
                this.query.search = getParameterByName(params, 'search', null);
            },

            initUI: function() {
                this.ui = {};

                this.ui.searchInput = $('#search-query-input');
                this.ui.searchForm = $('#search-form');
                this.ui.timeline = $('#tweet-timeline');
                this.ui.tweetList = $('#tweet-list');
            },

            initTimeline: function() {
                this.timeline = new TweetTimeline();

                var self = this;

                this.timeline.width(this.ui.timeline.width())
                .height(500)
                .retweetHeight(70)
                .noiseHeight(70)
                .noiseThreshold(min_important_rt)
                .searchQuery(this.query.search)
                .utcOffsetMillis(utcOffsetMillis)
                .idealBinCount(200)
                .timeExtent([this.query.from, this.query.to])
                .onZoomChanged(function(extent) {
                    self.query.from = extent[0];
                    self.query.to = extent[1];

                    self.updateState();
                });

                this.timeline.container(this.ui.timeline.selector)
                .render();
            },

            initSearchBox: function() {
                var self = this;

                this.ui.searchInput.val(this.query.search);

                this.ui.searchForm.on('submit', function(e) {
                    e.preventDefault();
                    self.updateState();
                    return false;
                });
            },

            initTweetList: function() {
                this.tweetList = new TweetList(this.ui.tweetList);
                this.tweetList.update(this.query);
            },

            updateState: function() {
                var search = this.ui.searchInput.val();
                var from = this.query.from / 1000;
                var to = this.query.to / 1000;

                var state = {
                    search: search,
                    from: from,
                    to: to
                }

                history.pushState(state, '', '?' + $.param(state));
            }
        });


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


        window.app = new App();
    });
