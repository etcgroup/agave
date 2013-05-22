define([
    'jquery',
    'underscore',
    'util/extend',
    'components/item_list'],
    function ($, _, extend, ItemList) {

        var USER_TEMPLATE = _.template("<li class='user clearfix' data-id='<%=id%>'>" +
            "<div class='name'>" +
            "<a class='user-link subtle-link tooltip-me' title='View <%=name%> on Twitter' target='tweet-link-tab' href='https://twitter.com/<%=screen_name%>'>" +
            "@<%=screen_name%>" +
            "</a>" +
            "</div>" +
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
            ItemList.call(this, options, 'user');

            this._initData('users');
            this._requestData();
        };

        extend(UserList, ItemList);

        /**
         * Attach to model events.
         */
        UserList.prototype._attachEvents = function () {
            ItemList.prototype._attachEvents.call(this);

            //When either the interval or query changes, request data directly
            this.interval.on('change', $.proxy(this._requestData, this));
            this.query.on('change', $.proxy(this._requestData, this));

            this._initBrushing();

            var self = this;
            this.ui.list.on('click', '.user', function() {
                self._userClicked($(this));
            });
        };

        UserList.prototype.renderExplanation = function() {
            this.ui.explanation.html('Top 50 most <i>prolific</i> Users');
        };

        /**
         * called anytime an update occurs
         */
        UserList.prototype._requestData = function () {

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

            ItemList.prototype._onData.call(this, result.data);
        };

        UserList.prototype.renderItem = function(itemData) {
            return $(USER_TEMPLATE(itemData));
        };

        /**
         * Initialize the tweet list.
         */
        UserList.prototype.createList = function () {
            var body = this.into.find('.tab-pane-body');
            return $('<ul>').appendTo(body);
        };

        UserList.prototype._userClicked = function(userUI) {
            var user = userUI.data('user');

            this.api.trigger('reference-selected', {
                type: 'user',
                data: user
            });
        };

        return UserList;

    });