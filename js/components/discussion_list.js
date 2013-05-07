define(['jquery', 'util/events'], function ($, events) {

    var DiscussionList = function (options) {
        this.api = options.api;
        this.into = options.into || $('<div>');

        this._initUI();

        this._attachEvents();
    };

    DiscussionList.prototype._initUI = function() {
        this.ui = {};

        this.ui.discussionControls = this.into.find('.discussion-controls');
        this.ui.newDisussionButton = this.ui.discussionControls.find('.new-button');
        this.ui.discussionList = this.ui.discussionControls.find('.discussion-list');

        this.ui.userBox = this.into.find('.user-box');
        this.ui.userInput = this.ui.userBox.find('input');
        this.ui.userSubmit = this.ui.userBox.find('.user-submit');
    };

    DiscussionList.prototype._attachEvents = function () {
        this.api.on('discussions', $.proxy(this._onData, this));
        this.api.on('user', $.proxy(this._userAvailable, this));

        var self = this;
        this.ui.userInput.on('keydown', function(e) {
            if (e.which === 13) {
                e.preventDefault();
                //pressed enter
                self._onUserSubmitted();
                return false;
            }
        });
        this.ui.userSubmit.on('click', $.proxy(this._onUserSubmitted, this));


        this.ui.newDisussionButton.on('click', $.proxy(this._newDiscussion, this));
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

    DiscussionList.prototype._onUserSubmitted = function() {
        var user = $.trim(this.ui.userInput.val());
        if (!user) {
            alert("Come on... type a user name :)");
            return;
        }

        this.api.trigger('user', user);
    };

    DiscussionList.prototype._userAvailable = function(e, user) {
        this.ui.userBox.collapse('hide');
        this.ui.discussionControls.collapse('show');
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
        this.into.removeClass('in');
    };

    DiscussionList.prototype.show = function() {
        this.into.addClass('in');

        this._requestData();
    };

    events(DiscussionList);

    return DiscussionList;
});