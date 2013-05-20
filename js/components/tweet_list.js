define([
    'jquery',
    'underscore',
    'components/item_list',
    'util/extend',
    'util/sentiment'],
    function ($, _, ItemList, extend, sentiment) {

        var TWEET_TEMPLATE = _.template("<li class='tweet' data-id='<%=id%>'>" +
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
            ItemList.call(this, options, 'tweet');
            this._initData('tweets');
            this._requestData();
        };

        extend(TweetList, ItemList);


        /**
         * Attach to model events.
         */
        TweetList.prototype._attachEvents = function () {
            ItemList.prototype._attachEvents.call(this);

            //When either the interval or query changes, request data directly
            this.interval.on('change', $.proxy(this._requestData, this));
            this.query.on('change', $.proxy(this._requestData, this));

            this._initBrushing();

            var self = this;
            this.ui.list.on('click', '.tweet', function() {
                self._tweetClicked($(this));
            });
        };


        TweetList.prototype._tweetClicked = function(tweetUI) {
            var tweet = tweetUI.data('item');

            this.api.trigger('reference-selected', {
                type: 'tweet',
                data: tweet
            });
        };

        /**
         * called anytime an update occurs
         */
        TweetList.prototype._requestData = function () {

            ItemList.prototype._requestData.call(this, {
                //need to know which query these tweets pertain to
                query_id: this.query.id(),
                from: this.interval.from(),
                to: this.interval.to(),
                search: this.query.search(),
                rt: this.query.rt(),
//                min_rt: this.query.min_rt(),
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

            ItemList.prototype._onData.call(this, result.data);

            //Tooltips!
            this.ui.list.find('.tooltip-me').tooltip({
                container: this.into,
                animation: false
            });

        };

        TweetList.prototype.renderItem = function(itemData) {
            itemData.sentiment_str = sentiment.from_number(Number(itemData.sentiment));
            return $(TWEET_TEMPLATE(itemData));
        };

        /**
         * Initialize the tweet list.
         */
        TweetList.prototype.createList = function () {
            var body = this.into.find('.tab-pane-body');
            return $('<ul>').appendTo(body);
        };

        return TweetList;

    });