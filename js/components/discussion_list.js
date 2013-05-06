define(['jquery'], function ($) {

    var DiscussionList = function (options) {
        this.api = options.api;
        this.into = options.into || $('<div>');

        this._initUI();

        this._attachEvents();

        this._requestData();
    };

    DiscussionList.prototype._initUI = function() {
        this.ui = {};

        this.ui.newDisussionButton = this.into.find('.new-button');
        this.ui.discussionList = this.into.find('.discussion-list');
    };

    DiscussionList.prototype._attachEvents = function () {
        this.api.on('discussions', $.proxy(this._onData, this));

        this.ui.newDisussionButton.on('click', $.proxy(this._newDiscussion, this));
        var self = this;
        this.ui.discussionList.on('click', '.discussion', function(e) {
            self._discussionClicked($(this));
        });
    };

    DiscussionList.prototype._requestData = function () {
        this.api.discussions();
    };

    DiscussionList.prototype._onData = function(e, result) {
        this.ui.discussionList.html(result.data);
    };

    DiscussionList.prototype._newDiscussion = function() {
        console.log('starting new discussion');
    };

    DiscussionList.prototype._discussionClicked = function(element) {
        var id = element.data('id');
        console.log('Discussion ' + id + ' selected!');
    };

    return DiscussionList;
});