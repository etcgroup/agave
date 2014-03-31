define([
    'jquery',
    'underscore',
    'util/extend',
    'components/item_list'],
    function ($, _, extend, ItemList) {

        var KEYWORD_TEMPLATE = _.template("<li class='keyword clearfix' data-id='<%=id%>'>" +
            "<div class='keyword_term'><%=term%></div>" +
            "<div class='keyword_before muted'>from <%=before_count%> uses</div>" +
            "<div class='keyword_delta'><i class='icon-white icon-arrow-up'></i> <%=count_delta%> </div>" +
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
            ItemList.call(this, options, 'keyword');

            this._initData('keywords');
            this._requestData();
        };


        extend(KeywordList, ItemList);


        KeywordList.prototype.createList = function() {
            var body = this.into.find('.tab-pane-body');
            return $('<ul>').appendTo(body);
        };

        /**
         * Attach to model events.
         */
        KeywordList.prototype._attachEvents = function () {
            ItemList.prototype._attachEvents.call(this);

            //When either the interval or query changes, request data directly
            this.interval.on('change', $.proxy(this._requestData, this));
            this.query.on('change', $.proxy(this._requestData, this));

            var self = this;
            this.ui.list.on('click', '.keyword', function () {
                self._keywordClicked($(this));
            });

            this._initBrushing();
        };

        KeywordList.prototype._keywordClicked = function (keywordUI) {
            var keyword = keywordUI.data('item');

            this.api.trigger('reference-selected', {
                type: 'keyword',
                data: keyword
            });
        };

        KeywordList.prototype.renderExplanation = function() {
            this.ui.explanation.html('Top 100 <i>bursting keywords</i>');
        };

        /**
         * called anytime an update occurs
         */
        KeywordList.prototype._requestData = function () {

            ItemList.prototype._requestData.call(this, {
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

            ItemList.prototype._onData.call(this, result.data);
        };

        KeywordList.prototype.renderItem = function(itemData) {
            return $(KEYWORD_TEMPLATE(itemData));
        };


        return KeywordList;

    });