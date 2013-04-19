define([
    'jquery',
    'underscore'],
    function($, _) {

        var TWEET_LIMIT = 50;
        var tweetTemplate = _.template("<li><%=text%></li>");

        var TweetList = function(container) {
            this.container = container;

            this.initUI();
        }

        _.extend(TweetList.prototype, {
            update: function(query) {
                var self = this;

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

                $.each(tweets, function(i, tweet) {
                    self.list.append(tweetTemplate(tweet));
                });
            },

            initUI: function() {
                this.list = $('<ul>').appendTo(this.container);
                //Attach delegated event handlers
                //...
            }
        });

        return TweetList;

    });