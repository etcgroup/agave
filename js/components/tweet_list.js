define([
    'jquery',
    'underscore',
    'util/events',
    'util/transform',
    'util/rectangle',
    'lib/bootstrap'],
    function ($, _, events, Transform, Rectangle, Bootstrap) {

        var TWEET_TEMPLATE = _.template("<li><div class='tweet'>" +
            "<div class='hdr'>@<%=screen_name%></div>" +
            "<div class='body'>" +
            "<div class='tweet_text'><%=text%></div>" +
            "<div class='tweet_count'><%=retweet_count%></div>" +
            "</div>" +
            "</div></li>");

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
                self.ui.tweetList.append(TWEET_TEMPLATE(tweet));
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