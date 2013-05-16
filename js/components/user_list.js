define([
    'jquery',
    'underscore',
    'util/loader',
    'util/events'],
    function ($, _, loader, events) {

        var USER_TEMPLATE = _.template("<li class='item user' data-id='<%=id%>'>" +
            "<div class='name'>@<%=screen_name%></div>" +
            "<div class='count'><%=count%> <span class='muted'>tweets</span></div>" +
            "<div class='follower'><%=followers%> <span class='muted'>followers</span></div>" +
            "</li>");

        var USER_LIMIT = 50;
        var USER_SORT_ORDER = 'count';

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

        var UserList = function (options) {
            this.into = options.into || $('<div>');
            this.spinner = options.spinner || $('<i>').addClass('spinner-16').appendTo(this.into);

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
        UserList.prototype._attachEvents = function () {
            //When either the interval or query changes, request data directly
            this.interval.on('change', $.proxy(this._requestData, this));
            this.query.on('change', $.proxy(this._requestData, this));

            //Listen for new tweets on the API
            this.api.on('users', $.proxy(this._onData, this));

            this.api.on('brush', $.proxy(this._onBrush, this));

            this.api.on('unbrush', $.proxy(this._onUnBrush, this));

            var self = this;
            this.ui.userList.on('mouseenter', '.user', function() {
                self._userMouseEntered($(this));
            });

            this.ui.userList.on('mouseleave', '.user', function() {
                self._userMouseLeft($(this));
            });

            this.ui.userList.on('click', '.user', function() {
                self._userClicked($(this));
            });
        };

   
        /**
         * called anytime an update occurs
         */
        UserList.prototype._requestData = function () {

            this.loader.start();
            this.api.users({
                //need to know which query these tweets pertain to
                query_id: this.query.id(),
                from: this.interval.from(),
                to: this.interval.to(),
                search: this.query.search(),
                rt: this.query.rt(),
                min_rt: this.query.min_rt(),
                author: this.query.author(),
                sentiment: this.query.sentiment(),
                limit: USER_LIMIT,
                sort: USER_SORT_ORDER
            });
        };

        /**
         * Called when new tweet data is available
         * @private
         */
        UserList.prototype._onData = function (e, result) {

            //Make sure these are tweets for our query, first of all
            if (result.params.query_id !== this.query.id()) {
                return;
            }

            this.loader.stop();

            var users = result.data;

            //Remove all current tweets
            this.ui.userList.empty();

            var self = this;
            
            //Add each tweet
            users.forEach(function (user) {
                //Render the tweet using the template and append

                var userUI = $(USER_TEMPLATE(user));

                //Bind the tweet data to the tweet element
                userUI.data('user', user);

                self.ui.userList.append(userUI);
            });
        };

        /**
         * Initialize the tweet list.
         */
        UserList.prototype._initUI = function () {
            this.ui = {};
            this.ui.body = this.into.find('.tab-pane-body');
            this.ui.userList = $('<ul>')
                .addClass('item-list')
                .appendTo(this.ui.body);

            this.loader = loader({
                into: this.into
            });
        };

        UserList.prototype._userMouseEntered = function(userUI) {
            var user = userUI.data('user');

            this.api.trigger('brush', [{
                id: user.id,
                type: 'user'
            }]);
        };

        UserList.prototype._userMouseLeft = function(userUI) {
            var user = userUI.data('user');

            this.api.trigger('unbrush', [{
                id: user.id,
                type: 'user'
            }]);
        };

        UserList.prototype._userClicked = function(userUI) {
            var user = userUI.data('user');

            this.api.trigger('reference-selected', {
                type: 'user',
                data: user
            });
        };

        UserList.prototype._onBrush = function(e, brushed) {
            var users = this.ui.userList
                .find('.user');

            _.each(brushed, function(item) {
                if (item.type !==  'user') {
                    return;
                }

                var userUI = users.filter('[data-id=' + item.id + ']');

                if (userUI.length) {
                    userUI.addClass('highlight');
                }
            });
        };

        UserList.prototype._onUnBrush = function(e, brushed) {
            var users = this.ui.userList
                .find('.user');

            _.each(brushed, function(item) {
                if (item.type !==  'user') {
                    return;
                }

                var userUI = users.filter('[data-id=' + item.id + ']');

                if (userUI.length) {
                    userUI.removeClass('highlight');
                }
            });
        };
        
        //Mix in events
        events(UserList);

        return UserList;

    });