define([
    'jquery',
    'underscore'],
    function($, _) {

        //The max number of tweets to load.
        var TWEET_LIMIT = 50;

        //An Underscore.js template for rendering tweet objects
        var tweetTemplate = _.template("<li><%=text%></li>");

        /**
         * Class for managing the tweet list.
         * Must be initialized with its container for now...
         */
        var TweetList = function(container) {
            this.container = container;

            this.initUI();
        }

        _.extend(TweetList.prototype, {
            /**
             * Update the tweet list with new tweets given a query object.
             */
            update: function(query) {
                var self = this;

                //Add the limit to the query object and submit
                var q = {
                    from: query.from,
                    to: query.to,
                    limit: TWEET_LIMIT,
                    search: query.search
                }

                $.get('data/tweets.php', q)
                .done(function(data) {
                    self.render_tweets(data.payload);
                })
                .error(function(xhr) {
                    console.log(xhr);
                    alert('failed to load tweets');
                });
            },

            render_tweets: function(tweets) {
                var self = this;
                //Remove all current tweets
                self.list.empty();

                //Add each tweet
                $.each(tweets, function(i, tweet) {
                    //Render the tweet using the template and append
                    self.list.append(tweetTemplate(tweet));
                });
            },

            /**
             * Set up the static UI elements and any event handlers.
             */
            initUI: function() {
                this.list = $('<ul>').appendTo(this.container);
            //TODO: Attach delegated event handlers
            }
        });

        return TweetList;

    });