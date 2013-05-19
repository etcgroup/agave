define([
    'jquery',
    'underscore',
    'util/events',
    'util/loader',
    'util/sentiment'],
    function ($, _, events, loader, sentiment) {

        var TWEET_TEMPLATE = _.template("<li class='item tweet' data-id='<%=id%>'>" +
            "<div class='username muted'>" +
            "<a class='user-link subtle-link tooltip-me' title='View <%=name%> on Twitter' target='tweet-link-tab' href='https://twitter.com/<%=screen_name%>'>" +
            "@<%=screen_name%>" +
            "</a></div>" +
            "<div class='tweet_count muted tooltip-me' title='Number of retweets'><%=retweet_count%> retweets</div>" +
            " <a class='twitter-link subtle-link tooltip-me' title='View this on Twitter' target='tweet-link-tab' href='https://twitter.com/<%=screen_name%>/status/<%=id%>'>" +
            "<span>see on</span> " +
            "<i class='twitter-icon-light'></i>" +
            "</a> " +
            "<div class='body'>" +
            "<div class='indicator sentiment-<%=sentiment_str%>'></div>" +
            "<div class='tweet_text'><%=text%></div>" +
            "</div>" +
            "</li>");

        //The max number of tweets to load.
        var TWEET_LIMIT = 50;

        var TWEET_SORT_ORDER = 'retweet_count';

        /**
         * A class for rendering the tweet list
         *
         * Options must include:
         * - into: a jquery selector of the containing element
         * - interval: the interval model
         * - query: query model
         * - interval: an Interval object
         *
         * @param options
         * @constructor
         */
        var TweetList = function (options) {
            this.into = options.into || $('<div>');

            this.interval = options.interval;
            this.query = options.query;
            this.api = options.api;

            this._initUI();
            this._attachEvents();
            this._requestData();
        };


        /**
         * Attach to model events.
         */
        TweetList.prototype._attachEvents = function () {
            //When either the interval or query changes, request data directly
            this.interval.on('change', $.proxy(this._requestData, this));
            this.query.on('change', $.proxy(this._requestData, this));

            //Listen for new tweets on the API
            this.api.on('tweets', $.proxy(this._onData, this));

            this.api.on('brush', $.proxy(this._onBrush, this));

            this.api.on('unbrush', $.proxy(this._onUnBrush, this));

            var self = this;
            this.ui.tweetList.on('mouseenter', '.tweet', function() {
                self._tweetMouseHover($(this), true);
            });

            this.ui.tweetList.on('mouseleave', '.tweet', function() {
                self._tweetMouseHover($(this), false);
            });

            this.ui.tweetList.on('click', '.tweet', function() {
                self._tweetClicked($(this));
            });
        };

        TweetList.prototype._tweetMouseHover = function(tweetUI, hovering) {
            var tweet = tweetUI.data('tweet');

            this.api.trigger(hovering ? 'brush' : 'unbrush', [{
                id: tweet.id,
                type: 'tweet',
                data: tweet
            }]);
        };

        TweetList.prototype._tweetClicked = function(tweetUI) {
            var tweet = tweetUI.data('tweet');

            this.api.trigger('reference-selected', {
                type: 'tweet',
                data: tweet
            });
        };

        TweetList.prototype._onBrush = function(e, brushed) {
            var tweets = this.ui.tweetList
                .find('.tweet');

            _.each(brushed, function(item) {
                if (item.type !==  'tweet') {
                    return;
                }

                var tweetUI = tweets.filter('[data-id=' + item.id + ']');

                if (tweetUI.length) {
                    tweetUI.addClass('highlight');
                }
            });
        };

        TweetList.prototype._onUnBrush = function(e, brushed) {
            var tweets = this.ui.tweetList
                .find('.tweet');

            _.each(brushed, function(item) {
                if (item.type !==  'tweet') {
                    return;
                }

                var tweetUI = tweets.filter('[data-id=' + item.id + ']');

                if (tweetUI.length) {
                    tweetUI.removeClass('highlight');
                }
            });
        };

        /**
         * called anytime an update occurs
         */
        TweetList.prototype._requestData = function () {

            this.loader.start();

            this.api.tweets({
                //need to know which query these tweets pertain to
                query_id: this.query.id(),
                from: this.interval.from(),
                to: this.interval.to(),
                search: this.query.search(),
                rt: this.query.rt(),
                min_rt: this.query.min_rt(),
                author: this.query.author(),
                sentiment: this.query.sentiment(),
                limit: TWEET_LIMIT,
                sort: TWEET_SORT_ORDER
            });
        };

        /**
         * Called when new tweet data is available
         * @private
         */
        TweetList.prototype._onData = function (e, result) {
            //Make sure these are tweets for our query, first of all
            if (result.params.query_id !== this.query.id()) {
                return;
            }

            this.loader.stop();

            var tweets = result.data;

            //Remove all current tweets
            this.ui.tweetList.empty();

            var self = this;

            //Add each tweet
            tweets.forEach(function (tweet) {
                //Render the tweet using the template and append

                tweet.sentiment_str = sentiment.from_number(Number(tweet.sentiment));

                var tweetUI = $(TWEET_TEMPLATE(tweet));

                //Bind the tweet data to the tweet element
                tweetUI.data('tweet', tweet);

                self.ui.tweetList.append(tweetUI);
            });

            //Tooltips!
            this.ui.tweetList.find('.tooltip-me').tooltip({
                container: this.into,
                animation: false
            });

        };

        /**
         * Initialize the tweet list.
         */
        TweetList.prototype._initUI = function () {
            this.ui = {};
            this.ui.body = this.into.find('.tab-pane-body');
            this.ui.tweetList = $('<ul>')
                .addClass('item-list')
                .appendTo(this.ui.body);

            this.loader = loader({
                into: this.into
            });
        };

        //Mix in events
        events(TweetList);

        return TweetList;

    });