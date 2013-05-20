define(['jquery', 'util/events', 'util/loader'], function ($, events, loader) {

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
    };

    DiscussionList.prototype._requestData = function () {
        this.loader.start();

        this.api.discussions();
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