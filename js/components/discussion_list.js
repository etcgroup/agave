define(['jquery', 'util/events', 'util/loader'], function ($, events, loader) {

    //The number of ms after a key press to wait before updating the search results.
    //We aren't Google here after all.
    var SEARCH_KEY_TIMEOUT = 600;

    var DiscussionList = function (options) {
        this.api = options.api;
        this.into = options.into || $('<div>');
        this.interval = options.interval;

        this._initUI();

        this._attachEvents();
    };

    DiscussionList.prototype._initUI = function() {
        this.ui = {};

        this.ui.newDisussionButton = this.into.find('.new-button');
        this.ui.discussionList = this.into.find('.discussion-list');
        this.ui.discussionSearch = this.into.find('.discussion-search-input');

        this.loader = loader({
            into: this.into,
            delay: 500
        });
    };

    DiscussionList.prototype._attachEvents = function () {
        this.api.on('discussions', $.proxy(this._onData, this));

        this.ui.newDisussionButton.on('click', $.proxy(this._newDiscussion, this));

        var self = this;
        this.ui.discussionList.on('click', '.discussion', function(e) {
            self._discussionClicked($(this));
        });

        this.ui.discussionSearch.on('change', $.proxy(this._searchInputChanged, this));
        this.ui.discussionSearch.on('keyup', $.proxy(this._searchKeyPressed, this));
    };

    DiscussionList.prototype._searchKeyPressed = function(e) {
        if (e.which == 27) {
            //Clear the input box
            this.ui.discussionSearch.val('');
        }

        var newSearch = this.ui.discussionSearch.val();
        if (this._lastSearch != newSearch) {

            //Remove any old scheduled updates
            if (this._searchTimeout) {
                clearTimeout(this._searchTimeout);
            }

            //Schedule an update
            if (e.which == 13 || e.which == 27) { //enter/esc key
                //request right away
                this._requestData();
            } else {
                //wait a bit to request
                this._searchTimeout = setTimeout($.proxy(this._requestData, this), SEARCH_KEY_TIMEOUT);
            }
        }
    };

    DiscussionList.prototype._searchInputChanged = function() {
        var newSearch = this.ui.discussionSearch.val();
        if (this._lastSearch != newSearch) {
            //Clear any scheduled update
            if (this._searchTimeout) {
                clearTimeout(this._searchTimeout);
                this._searchTimeout = null;
            }

            //Do the update now
            this._requestData();
        }
    };

    DiscussionList.prototype._requestData = function () {
        this.loader.start();

        this._lastSearch = this.ui.discussionSearch.val();
        this.api.discussions({
            search: this._lastSearch
        });
    };

    DiscussionList.prototype._onData = function(e, result) {
        this.loader.stop();

        this.ui.discussionList.html(result.data);
        
       this.ui.discussionList.find('.tooltip-me').tooltip({
                container: this.into,
                animation: false
            }); 
    };

    DiscussionList.prototype._newDiscussion = function() {
        this.trigger('show-discussion', null);
    };

    DiscussionList.prototype._discussionClicked = function(element) {
        var id = element.data('id');
        console.log('Discussion ' + id + ' selected!');
        this.trigger('show-discussion', id);
    };

    DiscussionList.prototype.hide = function() {

    };

    DiscussionList.prototype.show = function() {
        this._requestData();
    };

    events(DiscussionList);

    return DiscussionList;
});