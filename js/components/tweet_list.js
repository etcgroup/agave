define([
    'jquery',
    'underscore',
    'util/events',
    'util/transform',
    'util/rectangle',
    'lib/bootstrap'],
    function ($, _, events, Transform, Rectangle, Bootstrap) {

        var TWEET_TEMPLATE = _.template("<li class='tweet' data-id='<%=id%>'>" +
            "<div class='hdr'>@<%=screen_name%></div>" +
            "<div class='body'>" +
            "<div class='tweet_text'><%=text%></div>" +
            "<div class='tweet_count'><%=retweet_count%></div>" +
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
                self._tweetMouseEntered($(this));
            });

            this.ui.tweetList.on('mouseleave', '.tweet', function() {
                self._tweetMouseLeft($(this));
            });

            this.ui.tweetList.on('click', '.tweet', function() {
                self._tweetClicked($(this));
            });
        };

        TweetList.prototype._tweetMouseEntered = function(tweetUI) {
            var tweet = tweetUI.data('tweet');

            this.api.trigger('brush', [{
                id: tweet.id,
                type: 'tweet'
            }]);
        };

        TweetList.prototype._tweetMouseLeft = function(tweetUI) {
            var tweet = tweetUI.data('tweet');

            this.api.trigger('unbrush', [{
                id: tweet.id,
                type: 'tweet'
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

            var tweets = result.data;

            //Remove all current tweets
            this.ui.tweetList.empty();

            var self = this;

            //Add each tweet
            tweets.forEach(function (tweet) {
                //Render the tweet using the template and append

                var tweetUI = $(TWEET_TEMPLATE(tweet));

                //Bind the tweet data to the tweet element
                tweetUI.data('tweet', tweet);

                self.ui.tweetList.append(tweetUI);
            });
        };

        /**
         * Initialize the tweet list.
         */
        TweetList.prototype._initUI = function () {
            this.ui = {};
            this.ui.tweetList = $('<ul>').appendTo(this.into);
        };

        //Mix in events
        events(TweetList);

        return TweetList;

    });