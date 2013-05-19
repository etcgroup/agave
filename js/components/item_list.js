define([
    'jquery',
    'underscore',
    'util/loader',
    'util/events'],
    function ($, _, loader, events) {

        /**
         * An abstract class for rendering lists of stuff.
         *
         * Options must include:
         * - item_type: the type of items in this list (string)
         * - into: a jquery selector of the containing element
         * - interval: the interval model
         * - query: query model
         * - interval: an Interval object
         *
         * @param options
         * @constructor
         */
        var ItemList = function (options, item_type) {
            this.item_type = item_type || 'item';

            this.into = options.into || $('<div>');

            this.interval = options.interval;
            this.query = options.query;
            this.api = options.api;

            this.itemsById = {};

            this._initUI();
            this._attachEvents();
        };

        /**
         * Initialize the item list.
         */
        ItemList.prototype._initUI = function () {
            this.ui = {};

            this.ui.list = this.createList()
                .addClass('item-list');

            this.loader = loader({
                into: this.into
            });
        };

        ItemList.prototype.createList = function () {
            return $('<ul>').appendTo(this.into);
        };

        /**
         * Attach to model events.
         */
        ItemList.prototype._attachEvents = function () {
            //this._initData(); -- do this in your subclass
            //this._initBrushing(); -- do this in your subclass
        };

        /**
         * Optional brushing events.
         * @private
         */
        ItemList.prototype._initBrushing = function () {
            var self = this;

            this.ui.list.on('mouseenter', '.item', function () {
                self._mouseHovered($(this), true);
            });

            this.ui.list.on('mouseleave', '.item', function () {
                self._mouseHovered($(this), false);
            });

            this.api.on('brush', function (e, brushed) {
                self._onBrush(brushed, true);
            });
            this.api.on('unbrush', function (e, brushed) {
                self._onBrush(brushed, false);
            });
        };

        /**
         * Listen to the api for data.
         *
         * @param [apiCall]
         * @private
         */
        ItemList.prototype._initData = function (apiCall) {
            apiCall = apiCall || this.item_type;

            this._api_call = apiCall;
            //Listen for new items from the API
            this.api.on(this._api_call, $.proxy(this._onData, this));
        };

        /**
         * called anytime an update occurs
         */
        ItemList.prototype._requestData = function (options) {

            this.loader.start();

            this.api[this._api_call](options);
        };

        /**
         * Called when new keyword data is available
         * @private
         */
        ItemList.prototype._onData = function (listOfItems) {

            this.loader.stop();

            this.clearList();

            var self = this;
            //Add each keyword
            this.ui.list.append(
                listOfItems.map(function (itemData) {

                    //Render the element using the template and append
                    var ui = self.renderItem(itemData);

                    //Bind the data to the element
                    ui.data('item', itemData);
                    ui.addClass('item');

                    self._itemsById[itemData.id] = ui;

                    return ui;
                })
            );
        };

        /**
         * Should return a rendered item.
         *
         * @param itemData
         * @returns {*}
         */
        ItemList.prototype.renderItem = function (itemData) {
            return JSON.stringify(itemData);
        };

        /**
         * Clears the item list.
         */
        ItemList.prototype.clearList = function () {
            //Remove all current keywords
            this.ui.list.empty();
            this._itemsById = {};
        };

        /**
         * Get the UI for an item given the item's id. Returns undefined
         * if it doesn't exist.
         * @param id
         * @returns {*}
         */
        ItemList.prototype.getItemUI = function (id) {
            return this.itemsById[id];
        };

        ItemList.prototype._mouseHovered = function (ui, hovered) {
            var itemData = ui.data('item');

            this.api.trigger(hovered ? 'brush' : 'unbrush', [
                {
                    id: itemData.id,
                    type: this.item_type,
                    data: itemData
                }
            ]);
        };

        ItemList.prototype._onBrush = function (brushedItems, brushOn) {
            var self = this;
            _.each(brushedItems, function (item) {
                if (item.type !== self.item_type) {
                    return;
                }

                var ui = self.getItemUI(item.id);

                if (ui) {
                    ui.toggleClass('highlight', brushOn);
                }
            });
        };

        //Mix in events
        events(ItemList);

        return ItemList;
    });