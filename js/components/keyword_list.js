define([
    'jquery',
    'underscore',
    'util/events',
    'util/transform',
    'util/rectangle',
    'lib/bootstrap'],
    function ($, _, events, Transform, Rectangle, Bootstrap) {

        var KEYWORD_TEMPLATE = _.template("<li class='keyword' data-id='<%=id%>'>" +
            "<div class='keyword_term'><%=term%></div>" +
            "<div class='keyword_before'><%=before_count%></div>" +
            "<div class='keyword_delta'>&nbsp;&Delta;<%=count_delta%></div>" +
            "<div class='keyword_pct_delta'>(<%=count_percent_delta%> %)</div>" +
            "</li>");

        //The max number of keywords to load.
        var KEYWORD_LIMIT = 50;


        /**
         * A class for rendering the keyword list
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

        var KeywordList = function (options) {
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
        KeywordList.prototype._attachEvents = function () {
            //When either the interval or query changes, request data directly
            this.interval.on('change', $.proxy(this._requestData, this));
            this.query.on('change', $.proxy(this._requestData, this));

            //Listen for new keywords on the API
            this.api.on('keywords', $.proxy(this._onData, this));

            this.api.on('brush', $.proxy(this._onBrush, this));

            this.api.on('unbrush', $.proxy(this._onUnBrush, this));

            var self = this;
            this.ui.KeywordList.on('mouseenter', '.keyword', function() {
                self._keywordMouseEntered($(this));
            });

            this.ui.KeywordList.on('mouseleave', '.keyword', function() {
                self._keywordMouseLeft($(this));
            });

            this.ui.KeywordList.on('click', '.keyword', function() {
                self._keywordClicked($(this));
            });
        };

        KeywordList.prototype._keywordMouseEntered = function(keywordUI) {
            var keyword = keywordUI.data('keyword');

            this.api.trigger('brush', [{
                id: keyword.id,
                type: 'keyword'
            }]);
        };

        KeywordList.prototype._keywordMouseLeft = function(keywordUI) {
            var keyword = keywordUI.data('keyword');

            this.api.trigger('unbrush', [{
                id: keyword.id,
                type: 'keyword'
            }]);
        };

        KeywordList.prototype._keywordClicked = function(keywordUI) {
            var keyword = keywordUI.data('keyword');

            this.api.trigger('reference-selected', {
                type: 'keyword',
                data: keyword
            });
        };

        KeywordList.prototype._onBrush = function(e, brushed) {
            var keywords = this.ui.KeywordList
                .find('.keyword');

            _.each(brushed, function(item) {
                if (item.type !==  'keyword') {
                    return;
                }

                var keywordUI = keywords.filter('[data-id=' + item.id + ']');

                if (keywordUI.length) {
                    keywordUI.addClass('highlight');
                }
            });
        };

        KeywordList.prototype._onUnBrush = function(e, brushed) {
            var keywords = this.ui.KeywordList
                .find('.keyword');

            _.each(brushed, function(item) {
                if (item.type !==  'keyword') {
                    return;
                }

                var keywordUI = keywords.filter('[data-id=' + item.id + ']');

                if (keywordUI.length) {
                    keywordUI.removeClass('highlight');
                }
            });
        };

        /**
         * called anytime an update occurs
         */
        KeywordList.prototype._requestData = function () {
            this.api.keywords({
                //need to know which query these keywords pertain to
                window_size: 300,
                query_id: this.query.id(),
                from: this.interval.from(),
                to: this.interval.to(),
                limit: KEYWORD_LIMIT
            });
        };

        /**
         * Called when new keyword data is available
         * @private
         */
        KeywordList.prototype._onData = function (e, result) {
            //Make sure these are keywords for our query, first of all
            if (result.params.query_id !== this.query.id()) {
                return;
            }

            var keywords = result.data;

            //Remove all current keywords
            this.ui.KeywordList.empty();

            var self = this;

            //Add each keyword
            keywords.forEach(function (keyword) {
                //Render the keyword using the template and append

                var keywordUI = $(KEYWORD_TEMPLATE(keyword));

                //Bind the keyword data to the keyword element
                keywordUI.data('keyword', keyword);

                self.ui.KeywordList.append(keywordUI);
            });
        };

        /**
         * Initialize the keyword list.
         */
        KeywordList.prototype._initUI = function () {
            this.ui = {};
            this.ui.KeywordList = $('<ul>').appendTo(this.into);
        };

        //Mix in events
        events(KeywordList);

        return KeywordList;

    });